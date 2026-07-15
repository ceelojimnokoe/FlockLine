/**
 * Phone helpers shared by the client-side form (instant feedback), the
 * server actions (authoritative validation — never trust the client's
 * normalized value alone), and the CSV importer.
 */

const E164_RE = /^\+[1-9]\d{7,14}$/;

/**
 * Best-effort normalization to E.164, defaulting to Ghana (+233) since
 * that's this app's primary market. Users typing a local "0XX..." number
 * out of habit get auto-corrected; anything else is passed through
 * untouched for isValidE164 to accept or reject.
 */
export function normalizeGhanaPhone(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "") return trimmed;

  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }

  const digits = trimmed.replace(/\D/g, "");

  // Local Ghanaian format: 0XXXXXXXXX (10 digits, leading 0).
  if (digits.length === 10 && digits.startsWith("0")) {
    return "+233" + digits.slice(1);
  }

  // Already has the country code but no leading +.
  if (digits.startsWith("233") && digits.length === 12) {
    return "+" + digits;
  }

  return digits === "" ? "" : "+" + digits;
}

export function isValidE164(phone: string): boolean {
  return E164_RE.test(phone);
}

/**
 * wa.me links want digits only, no leading +. Returns null if the phone
 * isn't a valid, messageable number.
 */
export function toWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = normalizeGhanaPhone(phone);
  if (!isValidE164(normalized)) return null;
  return `https://wa.me/${normalized.slice(1)}`;
}
