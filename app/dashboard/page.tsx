import { redirect } from "next/navigation";
import { WeekSummaryCards } from "@/components/dashboard/week-summary-cards";
import { NeedsAttentionList } from "@/components/dashboard/needs-attention-list";
import { getWeekSummary } from "@/lib/data/dashboard";
import { getCurrentChurchUser, canViewGiving, getCurrentUserDisplayName } from "@/lib/data/church";
import { getMonthTotal } from "@/lib/data/giving";
import { getMemberCount } from "@/lib/data/members";
import { getNeedsAttentionFollowUps } from "@/lib/data/follow-ups";
import { getTimeOfDayGreeting } from "@/lib/format";

export default async function DashboardPage() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const showGiving = canViewGiving(churchUser.role);

  const [summary, displayName, needsAttention, monthGivingTotal, totalMembers] = await Promise.all([
    getWeekSummary(),
    getCurrentUserDisplayName(),
    getNeedsAttentionFollowUps(churchUser.id),
    showGiving ? getMonthTotal() : Promise.resolve(null),
    getMemberCount(),
  ]);

  const greeting = getTimeOfDayGreeting();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}
          {displayName ? `, ${displayName}` : ""} 👋
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Here&apos;s what needs you this week.
        </p>
      </div>

      <WeekSummaryCards
        summary={summary}
        monthGivingTotal={monthGivingTotal}
        totalMembers={totalMembers}
      />

      <div>
        <h2 className="text-lg font-semibold text-foreground">Needs attention</h2>
        <div className="mt-3">
          <NeedsAttentionList items={needsAttention} />
        </div>
      </div>
    </div>
  );
}
