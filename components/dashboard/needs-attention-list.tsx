import Link from "next/link";
import { MemberAvatar } from "@/components/members/avatar";
import { StatusBadge } from "@/components/members/status-badge";
import { FOLLOW_UP_TYPE_LABELS, type FollowUpType } from "@/lib/validation/follow-up";
import type { MemberStatus } from "@/lib/validation/member";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NeedsAttentionFollowUp } from "@/lib/data/follow-ups";

export function NeedsAttentionList({ items }: { items: NeedsAttentionFollowUp[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Nothing needs your attention right now — nice work.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/dashboard/members/${item.member.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-neutral-100"
          >
            <MemberAvatar
              id={item.member.id}
              firstName={item.member.first_name}
              lastName={item.member.last_name}
              photoUrl={item.member.photo_url}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-foreground">
                {item.member.first_name} {item.member.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {FOLLOW_UP_TYPE_LABELS[item.type as FollowUpType] ?? item.type} · due{" "}
                {formatRelativeDate(item.due_date!)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={item.member.status as MemberStatus} />
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  item.urgency === "overdue"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-sky-100 text-sky-800"
                )}
              >
                {item.urgency === "overdue" ? "Overdue" : "Today"}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
