import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeDate } from "@/lib/format";
import {
  FOLLOW_UP_TYPE_LABELS,
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_STATUS_CLASSES,
  type FollowUpType,
  type FollowUpStatus,
} from "@/lib/validation/follow-up";
import type { Tables } from "@/types/database";

export function FollowUpHistory({ followUps }: { followUps: Tables<"follow_ups">[] }) {
  if (followUps.length === 0) {
    return (
      <p className="text-base text-muted-foreground">No follow-ups yet for this member.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {followUps.map((followUp) => (
        <li key={followUp.id} className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground">
              {FOLLOW_UP_TYPE_LABELS[followUp.type as FollowUpType] ?? followUp.type}
            </p>
            <Badge className={FOLLOW_UP_STATUS_CLASSES[followUp.status as FollowUpStatus]}>
              {FOLLOW_UP_STATUS_LABELS[followUp.status as FollowUpStatus] ?? followUp.status}
            </Badge>
          </div>
          {followUp.notes && (
            <p className="mt-1 whitespace-pre-wrap text-base text-muted-foreground">
              {followUp.notes}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {followUp.due_date
              ? `Due ${formatDate(followUp.due_date)}`
              : formatRelativeDate(followUp.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
