import Link from "next/link";
import type { WeekSummary } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/format";

const TONE_CLASSES = {
  accent: "bg-sky-50 border-sky-200",
  destructive: "bg-destructive/10 border-destructive/30",
  neutral: "bg-card border-border",
} as const;

const TONE_VALUE_CLASSES = {
  accent: "text-sky-800",
  destructive: "text-destructive",
  neutral: "text-foreground",
} as const;

type Tone = keyof typeof TONE_CLASSES;

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
    <div>
      <h2 className="text-lg font-semibold text-foreground">This week</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SummaryCard
          href="/dashboard/members?status=first_timer"
          value={summary.newFirstTimers}
          label="New first-timers"
          tone="accent"
        />
        <SummaryCard
          href="/dashboard/followups?status=overdue&scope=all"
          value={summary.overdueFollowUps}
          label="Overdue follow-ups"
          tone={summary.overdueFollowUps > 0 ? "destructive" : "neutral"}
        />
        <SummaryCard
          href="/dashboard/followups?status=done&scope=all"
          value={summary.completedFollowUps}
          label="Done this week"
          tone="neutral"
        />
        {monthGivingTotal !== null ? (
          <SummaryCard
            href="/dashboard/giving"
            value={formatCurrency(monthGivingTotal, "GHS")}
            label="Giving this month"
            tone="neutral"
          />
        ) : (
          <SummaryCard
            href="/dashboard/members"
            value={totalMembers}
            label="Total members"
            tone="neutral"
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  href,
  value,
  label,
  tone,
}: {
  href: string;
  value: number | string;
  label: string;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className={`min-h-tap rounded-xl border p-3 text-center hover:opacity-90 ${TONE_CLASSES[tone]}`}
    >
      <p className={`text-2xl font-semibold ${TONE_VALUE_CLASSES[tone]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}
