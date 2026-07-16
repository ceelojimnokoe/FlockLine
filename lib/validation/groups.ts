export const GROUP_TYPES = [
  "prayer",
  "bible_study",
  "youth",
  "choir",
  "ushering",
  "men",
  "women",
  "children",
  "other",
] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  prayer: "Prayer group",
  bible_study: "Bible study",
  youth: "Youth",
  choir: "Choir",
  ushering: "Ushering",
  men: "Men's fellowship",
  women: "Women's fellowship",
  children: "Children",
  other: "Other",
};

export const SESSION_TYPES = [
  "prayer_meeting",
  "bible_study",
  "youth_meeting",
  "fellowship",
  "other",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  prayer_meeting: "Prayer meeting",
  bible_study: "Bible study",
  youth_meeting: "Youth meeting",
  fellowship: "Fellowship",
  other: "Other",
};

export const SESSION_RECURRENCES = ["none", "weekly", "biweekly", "monthly"] as const;
export type SessionRecurrence = (typeof SESSION_RECURRENCES)[number];

export const SESSION_RECURRENCE_LABELS: Record<SessionRecurrence, string> = {
  none: "One-off",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export const SESSION_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_STYLES: Record<SessionStatus, { label: string; badgeClassName: string }> = {
  scheduled: { label: "Scheduled", badgeClassName: "bg-sky-100 text-sky-800" },
  completed: { label: "Completed", badgeClassName: "bg-primary-100 text-primary-700" },
  cancelled: { label: "Cancelled", badgeClassName: "bg-ink-100 text-ink-600" },
};

export const ATTENDANCE_STATUSES = ["invited", "attended", "absent", "excused", "late"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_STATUS_STYLES: Record<
  AttendanceStatus,
  { label: string; badgeClassName: string }
> = {
  invited: { label: "Invited", badgeClassName: "bg-ink-100 text-ink-600" },
  attended: { label: "Attended", badgeClassName: "bg-primary-100 text-primary-700" },
  absent: { label: "Absent", badgeClassName: "bg-destructive/10 text-destructive" },
  excused: { label: "Excused", badgeClassName: "bg-amber-100 text-amber-800" },
  late: { label: "Late", badgeClassName: "bg-violet-100 text-violet-800" },
};

export const PRAYER_PRIVACY_LEVELS = ["all_volunteers", "assigned_leader", "leadership_only"] as const;
export type PrayerPrivacyLevel = (typeof PRAYER_PRIVACY_LEVELS)[number];

export const PRAYER_PRIVACY_LABELS: Record<PrayerPrivacyLevel, string> = {
  all_volunteers: "Visible to all volunteers",
  assigned_leader: "Visible to one assigned leader",
  leadership_only: "Church leadership only (admin/pastor)",
};

export const PRAYER_STATUSES = ["open", "praying", "answered", "closed"] as const;
export type PrayerStatus = (typeof PRAYER_STATUSES)[number];

export const PRAYER_STATUS_STYLES: Record<PrayerStatus, { label: string; badgeClassName: string }> = {
  open: { label: "Open", badgeClassName: "bg-sky-100 text-sky-800" },
  praying: { label: "Praying", badgeClassName: "bg-violet-100 text-violet-800" },
  answered: { label: "Answered", badgeClassName: "bg-primary-100 text-primary-700" },
  closed: { label: "Closed", badgeClassName: "bg-ink-100 text-ink-600" },
};
