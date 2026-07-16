import { Suspense } from "react";
import Link from "next/link";
import { Wallet, Wallet2, ListFilter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { StatCard } from "@/components/ui/stat-card";
import { SectionLabel } from "@/components/ui/section-label";
import { EmptyState } from "@/components/ui/empty-state";
import { GivingTrendChart } from "@/components/giving/giving-trend-chart";
import { GivingSearchBar } from "@/components/giving/giving-search-bar";
import { getCurrentChurchUser, canViewGiving } from "@/lib/data/church";
import {
  getGivingSummary,
  getMonthTotalsByFund,
  getGivingTrend,
  getRecentGivingRecords,
} from "@/lib/data/giving";
import { formatCurrency, formatDate } from "@/lib/format";
import { GIVING_METHOD_LABELS, type GivingMethod } from "@/lib/validation/giving";

export default async function GivingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const churchUser = await getCurrentChurchUser();

  if (!churchUser || !canViewGiving(churchUser.role)) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-foreground">Giving</h1>
        <Card>
          <p className="text-base text-muted-foreground">
            Only admins and pastors can view the giving dashboard.{" "}
            <Link href="/dashboard/giving/new" className="font-medium text-primary underline">
              Record a gift
            </Link>{" "}
            is still available to you.
          </p>
        </Card>
      </div>
    );
  }

  const [summary, byFund, trend, recentRecords] = await Promise.all([
    getGivingSummary(),
    getMonthTotalsByFund(),
    getGivingTrend(),
    getRecentGivingRecords(params.q),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Giving</h1>
        <LinkButton href="/dashboard/giving/new" className="px-3">
          Record
        </LinkButton>
      </div>

      <Card>
        <p className="text-sm text-muted-foreground">This month</p>
        <p className="mt-1 font-display text-3xl font-semibold text-foreground">
          {formatCurrency(summary.month, "GHS")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatCurrency(summary.onlineMonth, "GHS")} online ·{" "}
          {formatCurrency(summary.offlineMonth, "GHS")} offline
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard value={formatCurrency(summary.today, "GHS")} label="Today" />
        <StatCard value={formatCurrency(summary.week, "GHS")} label="This week" />
        <StatCard value={formatCurrency(summary.year, "GHS")} label="This year" />
      </div>

      <div className="flex flex-wrap gap-2">
        <LinkButton href="/dashboard/giving/transactions" variant="secondary" className="px-3">
          <ListFilter className="mr-2 h-4 w-4" aria-hidden="true" />
          All transactions
        </LinkButton>
        <LinkButton href="/dashboard/giving/funds" variant="secondary" className="px-3">
          <Wallet2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Manage funds
        </LinkButton>
      </div>

      {byFund.length > 0 && (
        <div>
          <SectionLabel>This month by fund</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {byFund.map((fund) => (
              <StatCard
                key={fund.fundId}
                value={formatCurrency(fund.total, "GHS")}
                label={fund.fundName}
              />
            ))}
          </div>
        </div>
      )}

      <Card>
        <GivingTrendChart trend={trend} />
      </Card>

      <div className="space-y-3">
        <SectionLabel>Recent gifts</SectionLabel>
        <Suspense>
          <GivingSearchBar />
        </Suspense>

        {recentRecords.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={params.q ? "No gifts match that search" : "No gifts recorded yet"}
          />
        ) : (
          <ul className="space-y-2">
            {recentRecords.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-foreground">
                    {record.member
                      ? `${record.member.first_name} ${record.member.last_name}`
                      : "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.fund?.name ?? "Giving"} ·{" "}
                    {GIVING_METHOD_LABELS[record.method as GivingMethod] ?? record.method} ·{" "}
                    {formatDate(record.given_at)}
                  </p>
                </div>
                <p className="shrink-0 font-display font-semibold text-foreground">
                  {formatCurrency(Number(record.amount), record.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
