import "server-only";

/**
 * Thin wrappers around Paystack's REST API. Built against Paystack's
 * documented Transaction Initialize/Verify endpoints — worth double
 * checking against Paystack's current docs during testing, since this
 * couldn't be exercised against a live account while building it.
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

export type InitializeTransactionParams = {
  email: string;
  amountGHS: number;
  metadata: Record<string, unknown>;
};

export type InitializeTransactionResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

/**
 * Initializes a transaction server-to-server, using the secret key —
 * this is what makes "no amounts trusted from the client" true: the
 * amount is fixed on Paystack's servers before the browser ever sees a
 * checkout popup, so there's nothing left for client-side JS to tamper
 * with. The client only ever resumes this already-fixed transaction via
 * its access_code.
 */
export async function initializePaystackTransaction({
  email,
  amountGHS,
  metadata,
}: InitializeTransactionParams): Promise<InitializeTransactionResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amountGHS * 100), // Paystack expects the smallest currency unit (pesewas)
      currency: "GHS",
      channels: ["card", "mobile_money"],
      metadata,
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack could not initialize this transaction.");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export type VerifiedTransaction = {
  status: string;
  amountGHS: number;
  currency: string;
  reference: string;
  paidAt: string | null;
  metadata: Record<string, unknown>;
};

/**
 * Re-fetches the transaction from Paystack's own servers rather than
 * trusting the webhook payload's amount/status directly — defense in
 * depth against a forged or replayed webhook body, and Paystack's own
 * recommended pattern.
 */
export async function verifyPaystackTransaction(reference: string): Promise<VerifiedTransaction> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } }
  );

  const json = await res.json();

  if (!res.ok || !json.status) {
    throw new Error(json.message || "Could not verify this transaction with Paystack.");
  }

  const data = json.data;
  return {
    status: data.status,
    amountGHS: data.amount / 100,
    currency: data.currency ?? "GHS",
    reference: data.reference,
    paidAt: data.paid_at ?? null,
    metadata: data.metadata ?? {},
  };
}
