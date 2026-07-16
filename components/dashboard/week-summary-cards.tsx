import { StatCard } from "@/components/ui/stat-card";
import type { WeekSummary } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/format";

export function WeekSummaryCards({
  summary,
  monthGivingTotal,
  totalMembers,
}: {
  summary: WeekSummary;
  /** null when the signed-in role can't view giving (see canViewGiving) — falls back to a member-count tile instead. */
  monthGivingTotal: number | null;
  totalMembers: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        href="/dashboard/members?status=first_timer"
        value={summary.newFirstTimers}
        label="New first-timers"
        tone="accent"
      />
      <StatCard
        href="/dashboard/followups?status=overdue&scope=all"
        value={summary.overdueFollowUps}
        label="Overdue follow-ups"
        tone={summary.overdueFollowUps > 0 ? "destructive" : "neutral"}
      />
      <StatCard
        href="/dashboard/followups?status=done&scope=all"
        value={summary.completedFollowUps}
        label="Done this week"
        tone="neutral"
      />
      {monthGivingTotal !== null ? (
        <StatCard
          href="/dashboard/giving"
          value={formatCurrency(monthGivingTotal, "GHS")}
          label="Giving this month"
          tone="neutral"
        />
      ) : (
        <StatCard href="/dashboard/members" value={totalMembers} label="Total members" tone="neutral" />
      )}
    </div>
  );
}
