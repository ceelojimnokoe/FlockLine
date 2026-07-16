import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { Fab } from "@/components/ui/fab";
import { GroupsListClient } from "@/components/groups/groups-list-client";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getGroups } from "@/lib/data/groups";

export default async function GroupsPage() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const groups = await getGroups();

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Groups & sessions</h1>
          <p className="text-sm text-muted-foreground">Prayer groups, Bible studies, and fellowships</p>
        </div>
        <LinkButton href="/dashboard/groups/new" className="hidden px-3 md:inline-flex">
          New group
        </LinkButton>
      </div>

      <GroupsListClient groups={groups} />

      <div className="md:hidden">
        <Fab href="/dashboard/groups/new" label="New group" />
      </div>
    </div>
  );
}
