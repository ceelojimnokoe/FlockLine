export const GIVING_METHODS = ["paystack", "momo_manual", "cash"] as const;
export type GivingMethod = (typeof GIVING_METHODS)[number];

export const GIVING_METHOD_LABELS: Record<GivingMethod, string> = {
  paystack: "Paystack",
  momo_manual: "Mobile Money",
  cash: "Cash",
};

/** Methods an admin can record by hand — Paystack records only ever come from the webhook. */
export const MANUAL_GIVING_METHODS = ["momo_manual", "cash"] as const;
export type ManualGivingMethod = (typeof MANUAL_GIVING_METHODS)[number];

export const QUICK_GIVING_AMOUNTS = [50, 100, 200, 500] as const;

export const MIN_GIVING_AMOUNT = 1;
export const MAX_GIVING_AMOUNT = 100_000;

export function isValidGivingAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount >= MIN_GIVING_AMOUNT && amount <= MAX_GIVING_AMOUNT;
}
