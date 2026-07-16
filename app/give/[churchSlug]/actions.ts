"use server";

import { randomUUID } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { initializePaystackTransaction } from "@/lib/paystack";
import { normalizeGhanaPhone, isValidE164 } from "@/lib/phone";
import { isValidGivingAmount } from "@/lib/validation/giving";

export type InitializeGivingState = {
  error?: string;
  accessCode?: string;
  reference?: string;
} | null;

/**
 * The public giving form has no session, so this uses the service-role
 * client — see the module's security notes for why that's safe here: every
 * value from the client (churchId, fundId, amount, phone) is re-validated
 * against the database before anything is sent to Paystack. Nothing here
 * writes a giving_record; that only ever happens in the webhook once
 * Paystack itself confirms the charge.
 */
export async function initializeGiving(
  _prevState: InitializeGivingState,
  formData: FormData
): Promise<InitializeGivingState> {
  const churchId = String(formData.get("churchId") ?? "");
  const fundId = String(formData.get("fundId") ?? "");
  const amount = Number(formData.get("amount"));
  const giverName = String(formData.get("giverName") ?? "").trim();
  const giverPhoneRaw = String(formData.get("giverPhone") ?? "").trim();

  if (!isValidGivingAmount(amount)) {
    return { error: "Enter an amount between GHS 1 and GHS 100,000." };
  }

  const giverPhone = giverPhoneRaw ? normalizeGhanaPhone(giverPhoneRaw) : "";
  if (giverPhone && !isValidE164(giverPhone)) {
    return { error: "Enter a valid phone number, or leave it blank." };
  }

  const supabase = createServiceRoleClient();

  // Never trust that fundId actually belongs to churchId and is active —
  // re-check against the database regardless of what the hidden form
  // field said.
  const { data: fund } = await supabase
    .from("giving_funds")
    .select("id, church_id, is_active")
    .eq("id", fundId)
    .maybeSingle();

  if (!fund || fund.church_id !== churchId || !fund.is_active) {
    return { error: "This giving fund is not available right now." };
  }

  let memberId: string | null = null;
  if (giverPhone) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", churchId)
      .eq("phone", giverPhone)
      .maybeSingle();
    memberId = member?.id ?? null;
  }

  // Paystack requires an email; the form deliberately doesn't collect one
  // (per spec: just optional name + phone), so synthesize an
  // obviously-fake, app-controlled placeholder purely to satisfy that API
  // requirement. It's never used to send anything.
  const email = `giving-${randomUUID().slice(0, 8)}@giving.flockline.app`;

  try {
    const { accessCode, reference } = await initializePaystackTransaction({
      email,
      amountGHS: amount,
      metadata: {
        church_id: churchId,
        fund_id: fundId,
        member_id: memberId,
        giver_name: giverName || null,
        giver_phone: giverPhone || null,
      },
    });

    return { accessCode, reference };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start payment. Please try again." };
  }
}
