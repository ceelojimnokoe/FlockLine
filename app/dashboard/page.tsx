import { redirect } from "next/navigation";
import { WeekSummaryCards } from "@/components/dashboard/week-summary-cards";
import { NeedsAttentionList } from "@/components/dashboard/needs-attention-list";
import { UpcomingSessionsCard } from "@/components/dashboard/upcoming-sessions-card";
import { PrayerRequestsCard } from "@/components/dashboard/prayer-requests-card";
import { SectionLabel } from "@/components/ui/section-label";
import { getWeekSummary } from "@/lib/data/dashboard";
import { getCurrentChurchUser, canViewGiving, getCurrentUserDisplayName } from "@/lib/data/church";
import { getMonthTotal } from "@/lib/data/giving";
import { getMemberCount } from "@/lib/data/members";
import { getNeedsAttentionFollowUps } from "@/lib/data/follow-ups";
import { getUpcomingSessions } from "@/lib/data/sessions";
import { getRecentPrayerRequests } from "@/lib/data/prayer-requests";
import { getTimeOfDayGreeting } from "@/lib/format";

export default async function DashboardPage() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const showGiving = canViewGiving(churchUser.role);

  // Core dashboard content — if any of this fails, the page genuinely has
  // nothing useful to show, so it's fine (correct, even) for this to throw
  // and hit app/dashboard/error.tsx.
  const [summary, displayName, needsAttention, monthGivingTotal, totalMembers] = await Promise.all([
    getWeekSummary(),
    getCurrentUserDisplayName(),
    getNeedsAttentionFollowUps(churchUser.id),
    showGiving ? getMonthTotal() : Promise.resolve(null),
    getMemberCount(),
  ]);

  // Supplementary shortcut cards — settled independently so a failure here
  // (e.g. a Groups/Sessions migration not yet applied) never takes down
  // the core dashboard above. Failures are logged with context, not
  // swallowed, and the cards themselves already render nothing when their
  // list is empty, which is an honest degrade here (not a fake success).
  const [upcomingSessionsResult, prayerRequestsResult] = await Promise.allSettled([
    getUpcomingSessions(3),
    getRecentPrayerRequests(3),
  ]);

  if (upcomingSessionsResult.status === "rejected") {
    console.error("[dashboard] Failed to load upcoming sessions:", upcomingSessionsResult.reason);
  }
  if (prayerRequestsResult.status === "rejected") {
    console.error("[dashboard] Failed to load recent prayer requests:", prayerRequestsResult.reason);
  }

  const upcomingSessions = upcomingSessionsResult.status === "fulfilled" ? upcomingSessionsResult.value : [];
  const prayerRequests = prayerRequestsResult.status === "fulfilled" ? prayerRequestsResult.value : [];

  const greeting = getTimeOfDayGreeting();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
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
        <SectionLabel>Needs attention</SectionLabel>
        <div className="mt-3">
          <NeedsAttentionList items={needsAttention} />
        </div>
      </div>

      <UpcomingSessionsCard sessions={upcomingSessions} />
      <PrayerRequestsCard requests={prayerRequests} />
    </div>
  );
}
