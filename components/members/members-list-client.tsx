"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { Users, SearchX } from "lucide-react";
import { MemberRow } from "./member-row";
import { MemberListSkeleton } from "./member-row-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { loadMoreMembers } from "@/app/dashboard/members/actions";
import type { MemberListItem, MembersFilters } from "@/lib/data/members";

export function MembersListClient({
  initialMembers,
  initialHasMore,
  filters,
  hasAnyMembersAtAll,
}: {
  initialMembers: MemberListItem[];
  initialHasMore: boolean;
  filters: MembersFilters;
  hasAnyMembersAtAll: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    startTransition(async () => {
      const next = await loadMoreMembers(filters, members.length);
      setMembers((prev) => [...prev, ...next.members]);
      setHasMore(next.hasMore);
    });
  }, [filters, members.length]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // Re-observe whenever `loadMore` changes (i.e. after every successful
    // page load, since it closes over the current `members.length`).
    // A previous version depended on [hasMore] only to avoid this churn,
    // but that left the observer's callback permanently bound to the
    // *first* loadMore closure — every scroll trigger after the first
    // reused the original, now-stale `members.length`, re-fetching the
    // same page and appending duplicate rows (duplicate React keys, no
    // forward progress). Disconnecting/reconnecting one observer per load
    // is cheap; a silently-stuck pager is not.
  }, [hasMore, loadMore]);

  if (members.length === 0) {
    if (!hasAnyMembersAtAll) {
      return (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add your first member or import a CSV to get started."
          action={
            <>
              <LinkButton href="/dashboard/members/new">Add member</LinkButton>
              <LinkButton href="/dashboard/members/import" variant="secondary">
                Import CSV
              </LinkButton>
            </>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={SearchX}
        title="No members match your search"
        description="Try a different name, phone number, or filter."
      />
    );
  }

  return (
    <>
      <ul className="space-y-1">
        {members.map((member) => (
          <MemberRow key={member.id} member={member} />
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className="py-2">
          {isLoadingMore && <MemberListSkeleton count={3} />}
        </div>
      )}
    </>
  );
}
