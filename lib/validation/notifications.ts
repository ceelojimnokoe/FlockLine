export const NOTIFICATION_CATEGORIES = ["care", "sessions", "giving", "members", "system"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  care: "Care",
  sessions: "Sessions",
  giving: "Giving",
  members: "Members",
  system: "System",
};

/**
 * Only 4 event types are actually wired up (see the notifications
 * migration comment) — 'sessions' and 'system' are reserved categories
 * with no producer yet. Kept here so the filter UI can still show all 5
 * category labels without implying more than what fires today.
 */
export const NOTIFICATION_CATEGORY_STYLES: Record<
  NotificationCategory,
  { badgeClassName: string }
> = {
  care: { badgeClassName: "bg-violet-100 text-violet-800" },
  sessions: { badgeClassName: "bg-sky-100 text-sky-800" },
  giving: { badgeClassName: "bg-primary-100 text-primary-700" },
  members: { badgeClassName: "bg-amber-100 text-amber-800" },
  system: { badgeClassName: "bg-ink-100 text-ink-600" },
};
