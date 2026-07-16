import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { verifyPaystackTransaction } from "@/lib/paystack";

/**
 * Paystack calls this server-to-server — there's no browser, no session
 * cookie, and (per proxy.ts's matcher) this route doesn't go through our
 * usual auth gate at all. Trust here comes entirely from the HMAC
 * signature below, not from any user/session concept.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("Paystack webhook: PAYSTACK_SECRET_KEY is not configured.");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // Paystack signs the exact raw request body with HMAC-SHA512 using your
  // secret key. Must hash request.text() as received — re-serializing
  // parsed JSON could reorder keys/whitespace and produce a different
  // signature than the one Paystack computed.
  const expectedSignature = createHmac("sha512", secret).update(rawBody).digest("hex");
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  const signatureValid =
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    // Acknowledge everything else (Paystack sends many event types) so it
    // isn't retried as a failure.
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference as string | undefined;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  // Re-verify with Paystack's own Verify Transaction API rather than
  // trusting the webhook payload's amount/status directly — this is
  // Paystack's own recommended pattern, and means even a well-formed but
  // forged webhook body can't record a fake or inflated gift.
  let verified;
  try {
    verified = await verifyPaystackTransaction(reference);
  } catch (err) {
    console.error("Paystack webhook: verify call failed", err);
    return NextResponse.json({ error: "Could not verify transaction" }, { status: 502 });
  }

  if (verified.status !== "success") {
    return NextResponse.json({ received: true });
  }

  const churchId = verified.metadata.church_id as string | undefined;
  const fundId = verified.metadata.fund_id as string | undefined;
  const giverPhone = verified.metadata.giver_phone as string | undefined;
  const giverEmail = verified.metadata.giver_email as string | undefined;
  const isAnonymous = verified.metadata.is_anonymous === true;
  const metadataMemberId = verified.metadata.member_id as string | undefined;

  if (!churchId || !fundId) {
    console.error("Paystack webhook: verified transaction missing required metadata", {
      reference,
      metadata: verified.metadata,
    });
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  // Service-role bypasses RLS entirely — there's no authenticated
  // church_user here for get_user_church_id() to resolve, so RLS's normal
  // enforcement has nothing to key off. This is safe because every value
  // below is independently re-derived and scoped by church_id in code,
  // replicating what the RLS policies would have checked for a logged-in
  // request instead of trusting anything from the webhook body directly.
  const supabase = createServiceRoleClient();

  // Idempotency, step 1: check before inserting. Also backstopped by the
  // database's own partial unique index on giving_records.reference (see
  // the schema migration), which catches the race between two concurrent
  // webhook deliveries for the same charge.
  const { data: existingRecord } = await supabase
    .from("giving_records")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();

  if (existingRecord) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Re-derive the member match from phone rather than trusting
  // metadata.member_id blindly — metadata was set at initialize time and
  // is echoed back by Paystack, so falling back to it only after
  // confirming it still belongs to this church. Skipped entirely when the
  // giver chose "give anonymously," even if a phone is present.
  let memberId: string | null = null;
  if (!isAnonymous) {
    if (giverPhone) {
      const { data: matchedByPhone } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", churchId)
        .eq("phone", giverPhone)
        .maybeSingle();
      memberId = matchedByPhone?.id ?? null;
    }
    if (!memberId && metadataMemberId) {
      const { data: matchedById } = await supabase
        .from("members")
        .select("id")
        .eq("id", metadataMemberId)
        .eq("church_id", churchId)
        .maybeSingle();
      memberId = matchedById?.id ?? null;
    }
  }

  const { error: insertError } = await supabase.from("giving_records").insert({
    church_id: churchId,
    member_id: memberId,
    fund_id: fundId,
    amount: verified.amountGHS,
    currency: verified.currency,
    method: "paystack",
    reference,
    donor_email: giverEmail || null,
    recorded_by: null,
    given_at: verified.paidAt ?? new Date().toISOString(),
  });

  if (insertError) {
    // Unique violation = a concurrent delivery already inserted this
    // reference — that's success, not an error.
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Paystack webhook: failed to insert giving_record", insertError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Notify finance-authorized teammates (admin/pastor — same set that
  // canViewGiving() allows to see individual records) that a gift came in.
  // Direct insert, not create_notification(): there's no auth.uid() here
  // for that function's own-church check to key off, and the service-role
  // client already bypasses RLS, so church_id is set explicitly instead.
  const { data: financeUsers } = await supabase
    .from("church_users")
    .select("id")
    .eq("church_id", churchId)
    .in("role", ["admin", "pastor"]);

  if (financeUsers && financeUsers.length > 0) {
    await supabase.from("notifications").insert(
      financeUsers.map((u) => ({
        church_id: churchId,
        recipient_id: u.id,
        category: "giving" as const,
        type: "giving_received",
        title: `New gift received — ${verified.currency} ${verified.amountGHS.toFixed(2)}`,
        link: "/dashboard/giving",
      }))
    );
  }

  return NextResponse.json({ received: true });
}
