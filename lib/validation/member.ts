import { isValidE164, normalizeGhanaPhone } from "@/lib/phone";

export const MEMBER_STATUSES = [
  "first_timer",
  "new_convert",
  "member",
  "inactive",
] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  first_timer: "First-timer",
  new_convert: "New convert",
  member: "Member",
  inactive: "Inactive",
};

/**
 * Single source of truth for how each member status is colored — badges,
 * filter-chip dots, avatars-adjacent indicators, anywhere a status needs
 * to be recognizable at a glance. Each pair is a light background + a
 * text color meeting contrast against it; color is never the only signal
 * since every consumer of this also renders `label` as real text.
 */
export const MEMBER_STATUS_STYLES: Record<
  MemberStatus,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  first_timer: {
    label: "First-timer",
    badgeClassName: "bg-amber-100 text-amber-800",
    dotClassName: "bg-amber-700",
  },
  new_convert: {
    label: "New convert",
    badgeClassName: "bg-violet-100 text-violet-800",
    dotClassName: "bg-violet-700",
  },
  member: {
    label: "Member",
    badgeClassName: "bg-primary-100 text-primary-800",
    dotClassName: "bg-primary-700",
  },
  inactive: {
    label: "Inactive",
    badgeClassName: "bg-ink-100 text-ink-600",
    dotClassName: "bg-ink-400",
  },
};

export const MEMBER_GENDERS = ["male", "female"] as const;
export type MemberGender = (typeof MEMBER_GENDERS)[number];

export type MemberFormInput = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  status: string;
  dateOfBirth: string;
  address: string;
  notes: string;
};

export type MemberFieldErrors = Partial<Record<keyof MemberFormInput, string>>;

/**
 * Shared by the client form (instant feedback) and the server action
 * (authoritative — the server re-validates from scratch, never trusting
 * whatever the client already checked).
 */
export function validateMemberInput(input: MemberFormInput): {
  fieldErrors: MemberFieldErrors;
  normalizedPhone: string;
} {
  const fieldErrors: MemberFieldErrors = {};

  if (!input.firstName.trim()) {
    fieldErrors.firstName = "First name is required.";
  }
  if (!input.lastName.trim()) {
    fieldErrors.lastName = "Last name is required.";
  }

  const normalizedPhone = normalizeGhanaPhone(input.phone);
  if (normalizedPhone !== "" && !isValidE164(normalizedPhone)) {
    fieldErrors.phone = "Enter a valid phone number, e.g. +233241234567.";
  }

  if (input.gender && !MEMBER_GENDERS.includes(input.gender as MemberGender)) {
    fieldErrors.gender = "Invalid gender.";
  }

  if (!MEMBER_STATUSES.includes(input.status as MemberStatus)) {
    fieldErrors.status = "Invalid status.";
  }

  if (input.dateOfBirth) {
    const dob = new Date(input.dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      fieldErrors.dateOfBirth = "Enter a valid date of birth.";
    }
  }

  return { fieldErrors, normalizedPhone };
}
