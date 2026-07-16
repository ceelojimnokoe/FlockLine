"use client";

import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { GIVING_METHOD_LABELS, type GivingMethod } from "@/lib/validation/giving";
import { loadMoreTransactions } from "@/app/dashboard/giving/transactions/actions";
import type { GivingRecordListItem, TransactionFilters } from "@/lib/data/giving";

export function TransactionsListClient({
  initialRecords,
  initialHasMore,
  filters,
}: {
  initialRecords: GivingRecordListItem[];
  initialHasMore: boolean;
  filters: TransactionFilters;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const next = await loadMoreTransactions(filters, records.length);
      setRecords((prev) => [...prev, ...next.records]);
      setHasMore(next.hasMore);
    });
  }

  if (records.length === 0) {
    return <EmptyState icon={Wallet} title="No transactions match these filters" />;
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {records.map((record) => (
          <li key={record.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-foreground">
                  {record.member ? `${record.member.first_name} ${record.member.last_name}` : "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {record.fund?.name ?? "Giving"} ·{" "}
                  {GIVING_METHOD_LABELS[record.method as GivingMethod] ?? record.method}
                </p>
              </div>
              <p className="shrink-0 font-display font-semibold text-foreground">
                {formatCurrency(Number(record.amount), record.currency)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDate(record.given_at)}</span>
              {record.reference && <span>Ref: {record.reference}</span>}
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <Button
          type="button"
          variant="secondary"
          disabled={isLoadingMore}
          onClick={loadMore}
          className="w-full"
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
