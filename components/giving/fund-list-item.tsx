"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { setFundActive } from "@/app/dashboard/giving/funds/actions";
import type { GivingFund } from "@/lib/data/giving";

export function FundListItem({ fund }: { fund: GivingFund }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try {
        await setFundActive(fund.id, !fund.is_active);
        toast.success(fund.is_active ? "Fund archived." : "Fund restored.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update this fund.");
      }
    });
  }

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-foreground">{fund.name}</p>
          <p className="text-sm text-muted-foreground">
            {fund.is_public ? "Public" : "Not shown publicly"}
            {fund.target_amount ? ` · Target ${formatCurrency(Number(fund.target_amount), "GHS")}` : ""}
          </p>
        </div>
        {!fund.is_active && (
          <span className="shrink-0 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
            Archived
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/giving/funds/${fund.id}/edit`}
          className="min-h-tap inline-flex items-center gap-1.5 rounded-lg border border-input px-3 text-sm font-medium text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Link>
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className="min-h-tap rounded-lg border border-input px-3 text-sm font-medium text-foreground disabled:opacity-50"
        >
          {fund.is_active ? "Archive" : "Restore"}
        </button>
      </div>
    </li>
  );
}
