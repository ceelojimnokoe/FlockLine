import { Suspense } from "react";
import { LinkButton } from "@/components/ui/link-button";
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
        <h1 className="text-2xl font-semibold text-foreground">Members</h1>
        <div className="flex gap-2">
          <LinkButton href="/dashboard/members/import" variant="secondary" className="px-3">
            Import
          </LinkButton>
          <LinkButton href="/dashboard/members/new" className="px-3">
            Add
          </LinkButton>
        </div>
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
    </div>
  );
}
