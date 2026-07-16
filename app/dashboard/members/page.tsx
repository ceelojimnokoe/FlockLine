import { Suspense } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { Fab } from "@/components/ui/fab";
import { MembersSearchFilterBar } from "@/components/members/search-filter-bar";
import { MembersListClient } from "@/components/members/members-list-client";
import {
  getMembers,
  getMemberCount,
  MEMBERS_PAGE_SIZE,
  type MembersFilters,
} from "@/lib/data/members";
import { getTags } from "@/lib/data/tags";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const filters: MembersFilters = {
    q: params.q,
    status: params.status,
    tagId: params.tag,
  };

  const [{ members, hasMore }, tags, totalCount] = await Promise.all([
    getMembers(filters, 0, MEMBERS_PAGE_SIZE),
    getTags(),
    getMemberCount(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "person" : "people"}
          </p>
        </div>
        <LinkButton href="/dashboard/members/import" variant="secondary" className="px-3">
          Import
        </LinkButton>
      </div>

      <Suspense>
        <MembersSearchFilterBar tags={tags} />
      </Suspense>

      <MembersListClient
        key={JSON.stringify(filters)}
        initialMembers={members}
        initialHasMore={hasMore}
        filters={filters}
        hasAnyMembersAtAll={totalCount > 0}
      />

      <Fab href="/dashboard/members/new" label="Add member" />
    </div>
  );
}
