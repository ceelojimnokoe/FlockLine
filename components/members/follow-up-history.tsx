import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeDate } from "@/lib/format";
import type { Tables } from "@/types/database";

const TYPE_LABELS: Record<string, string> = {
  visitor_welcome: "Visitor welcome",
  new_convert: "New convert",
  absentee: "Absentee",
  pastoral_care: "Pastoral care",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-gold-100 text-gold-800",
  in_progress: "bg-primary-100 text-primary-700",
  done: "bg-ink-100 text-ink-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
};

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
              {TYPE_LABELS[followUp.type] ?? followUp.type}
            </p>
            <Badge className={STATUS_CLASSES[followUp.status]}>
              {STATUS_LABELS[followUp.status] ?? followUp.status}
            </Badge>
          </div>
          {followUp.notes && (
            <p className="mt-1 text-base text-muted-foreground">{followUp.notes}</p>
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
