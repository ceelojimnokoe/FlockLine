export const FOLLOW_UP_TYPES = [
  "visitor_welcome",
  "new_convert",
  "absentee",
  "pastoral_care",
] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  visitor_welcome: "Visitor welcome",
  new_convert: "New convert",
  absentee: "Absentee check-in",
  pastoral_care: "Pastoral care",
};

export const FOLLOW_UP_STATUSES = ["pending", "in_progress", "done"] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
};

export const FOLLOW_UP_STATUS_CLASSES: Record<FollowUpStatus, string> = {
  pending: "bg-sky-100 text-sky-800",
  in_progress: "bg-primary-100 text-primary-700",
  done: "bg-ink-100 text-ink-500",
};
