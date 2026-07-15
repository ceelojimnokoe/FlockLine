import { MEMBER_STATUS_LABELS, type MemberStatus } from "@/lib/validation/member";
import { formatDate, formatRelativeDate } from "@/lib/format";
import type { Tables } from "@/types/database";

export function StatusTimeline({ events }: { events: Tables<"member_status_events">[] }) {
  if (events.length === 0) {
    return <p className="text-base text-muted-foreground">No status history yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
          <div>
            <p className="text-base text-foreground">
              {event.old_status ? (
                <>
                  {MEMBER_STATUS_LABELS[event.old_status as MemberStatus]} →{" "}
                  <span className="font-medium">
                    {MEMBER_STATUS_LABELS[event.new_status as MemberStatus]}
                  </span>
                </>
              ) : (
                <>
                  Added as{" "}
                  <span className="font-medium">
                    {MEMBER_STATUS_LABELS[event.new_status as MemberStatus]}
                  </span>
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground" title={formatDate(event.created_at)}>
              {formatRelativeDate(event.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
