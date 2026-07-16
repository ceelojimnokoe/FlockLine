import Link from "next/link";
import { Users, MapPin } from "lucide-react";
import { GroupTypeBadge } from "./group-type-badge";
import type { GroupListItem } from "@/lib/data/groups";

export function GroupCard({ group }: { group: GroupListItem }) {
  return (
    <Link
      href={`/dashboard/groups/${group.id}`}
      className="block rounded-2xl border border-border bg-card p-4 hover:bg-neutral-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-foreground">{group.name}</p>
          {group.leader && (
            <p className="truncate text-sm text-muted-foreground">
              Led by {group.leader.first_name} {group.leader.last_name}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <GroupTypeBadge type={group.group_type} />
          {!group.is_active && (
            <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
              Inactive
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="h-4 w-4" aria-hidden="true" />
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </span>
        {group.meeting_location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {group.meeting_location}
          </span>
        )}
      </div>
    </Link>
  );
}
