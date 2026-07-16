import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/members/empty-state";
import { PipelineTabs } from "@/components/follow-ups/pipeline-tabs";
import { FollowUpCard } from "@/components/follow-ups/follow-up-card";
import { getCurrentChurchUser, getCurrentChurch } from "@/lib/data/church";
import { getFollowUps, getOverdueCount, type FollowUpsFilters } from "@/lib/data/follow-ups";
import { getTemplates, getDefaultTemplateForType } from "@/lib/data/templates";
import { getTeammates } from "@/lib/data/teammates";
import type { FollowUpStatus } from "@/lib/validation/follow-up";
import type { FollowUpType } from "@/lib/validation/follow-up";

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const scope = params.scope === "all" ? "all" : "mine";
  const status = (params.status ?? "pending") as FollowUpStatus | "overdue";

  const filters: FollowUpsFilters = { status, scope };

  const [followUps, overdueCount, templates, teammates, church] = await Promise.all([
    getFollowUps(filters, churchUser.id),
    getOverdueCount(churchUser.id, scope),
    getTemplates(),
    getTeammates(),
    getCurrentChurch(),
  ]);

  const teammatesById = new Map(teammates.map((t) => [t.id, t]));
  const churchName = church?.name ?? "Your Church";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Follow-ups</h1>
        <LinkButton href="/dashboard/followups/new" className="px-3">
          New
        </LinkButton>
      </div>

      <Suspense>
        <PipelineTabs overdueCount={overdueCount} />
      </Suspense>

      {followUps.length === 0 ? (
        <EmptyState
          title={scope === "mine" ? "Nothing here for you right now" : "Nothing here right now"}
          description="Create a follow-up, or switch tabs to see other stages."
          action={
            <LinkButton href="/dashboard/followups/new" variant="secondary">
              Create a follow-up
            </LinkButton>
          }
        />
      ) : (
        <ul className="space-y-3">
          {followUps.map((followUp) => (
            <FollowUpCard
              key={followUp.id}
              followUp={followUp}
              template={getDefaultTemplateForType(templates, followUp.type as FollowUpType)}
              churchName={churchName}
              assignee={followUp.assigned_to ? teammatesById.get(followUp.assigned_to) : undefined}
            />
          ))}
        </ul>
      )}

      <LinkButton href="/dashboard/followups/templates" variant="ghost" className="w-full">
        Manage WhatsApp templates
      </LinkButton>
    </div>
  );
}
