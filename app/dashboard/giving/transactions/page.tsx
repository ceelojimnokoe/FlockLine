import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TransactionsFilterBar } from "@/components/giving/transactions-filter-bar";
import { TransactionsListClient } from "@/components/giving/transactions-list-client";
import { getCurrentChurchUser, canViewGiving } from "@/lib/data/church";
import { getTransactions, getGivingFunds, type TransactionFilters } from "@/lib/data/giving";
import { GIVING_METHODS, type GivingMethod } from "@/lib/validation/giving";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; fundId?: string; method?: string; q?: string }>;
}) {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  if (!canViewGiving(churchUser.role)) {
    return (
      <div className="py-10 text-center">
        <p className="text-base text-muted-foreground">Only admins and pastors can view transactions.</p>
      </div>
    );
  }

  const params = await searchParams;
  const method = GIVING_METHODS.includes(params.method as GivingMethod)
    ? (params.method as GivingMethod)
    : undefined;
  const filters: TransactionFilters = {
    from: params.from,
    to: params.to,
    fundId: params.fundId,
    method,
    q: params.q,
  };

  const [{ records, hasMore }, funds] = await Promise.all([getTransactions(filters), getGivingFunds()]);

  return (
    <div className="space-y-4 pb-16">
      <Link href="/dashboard/giving" className="text-sm font-medium text-muted-foreground">
        ← Giving
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Transactions</h1>

      <Suspense>
        <TransactionsFilterBar funds={funds} />
      </Suspense>

      <TransactionsListClient initialRecords={records} initialHasMore={hasMore} filters={filters} />
    </div>
  );
}
