"use client";

import { useMemo, useState } from "react";
import { Users2 } from "lucide-react";
import { GroupCard } from "./group-card";
import { FilterChip } from "@/components/ui/filter-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import type { GroupListItem } from "@/lib/data/groups";

export function GroupsListClient({ groups }: { groups: GroupListItem[] }) {
  const [showInactive, setShowInactive] = useState(false);

  const visible = useMemo(
    () => groups.filter((g) => showInactive || g.is_active),
    [groups, showInactive]
  );

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Users2}
        title="No groups yet"
        description="Create a prayer group, Bible study, or fellowship to start scheduling sessions."
        action={
          <LinkButton href="/dashboard/groups/new" variant="secondary">
            Create a group
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <FilterChip active={!showInactive} onClick={() => setShowInactive(false)}>
          Active
        </FilterChip>
        <FilterChip active={showInactive} onClick={() => setShowInactive(true)}>
          All groups
        </FilterChip>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-base text-muted-foreground">No active groups.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((group) => (
            <li key={group.id}>
              <GroupCard group={group} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
