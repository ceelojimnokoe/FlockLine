import { Suspense } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { GivingTrendChart } from "@/components/giving/giving-trend-chart";
import { GivingSearchBar } from "@/components/giving/giving-search-bar";
import { getCurrentChurchUser, canViewGiving } from "@/lib/data/church";
import {
  getMonthTotal,
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
        <h1 className="text-2xl font-semibold text-foreground">Giving</h1>
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

  const [monthTotal, byFund, trend, recentRecords] = await Promise.all([
    getMonthTotal(),
    getMonthTotalsByFund(),
    getGivingTrend(),
    getRecentGivingRecords(params.q),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Giving</h1>
        <LinkButton href="/dashboard/giving/new" className="px-3">
          Record
        </LinkButton>
      </div>

      <Card>
        <p className="text-sm text-muted-foreground">This month</p>
        <p className="mt-1 text-3xl font-semibold text-foreground">
          {formatCurrency(monthTotal, "GHS")}
        </p>
      </Card>

      {byFund.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">This month by fund</h2>
          <ul className="mt-3 space-y-2">
            {byFund.map((fund) => (
              <li key={fund.fundId} className="flex items-center justify-between gap-2">
                <span className="text-base text-muted-foreground">{fund.fundName}</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(fund.total, "GHS")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <GivingTrendChart trend={trend} />
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Recent gifts</h2>
        <Suspense>
          <GivingSearchBar />
        </Suspense>

        {recentRecords.length === 0 ? (
          <p className="text-base text-muted-foreground">
            {params.q ? "No gifts match that search." : "No gifts recorded yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {recentRecords.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-foreground">
                    {record.member ? `${record.member.first_name} ${record.member.last_name}` : "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.fund?.name ?? "Giving"} ·{" "}
                    {GIVING_METHOD_LABELS[record.method as GivingMethod] ?? record.method} ·{" "}
                    {formatDate(record.given_at)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-foreground">
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
