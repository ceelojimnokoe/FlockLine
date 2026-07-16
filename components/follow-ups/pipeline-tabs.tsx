"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FilterChip } from "@/components/ui/filter-chip";
import { FOLLOW_UP_STATUSES, FOLLOW_UP_STATUS_LABELS } from "@/lib/validation/follow-up";

export function PipelineTabs({
  overdueCount,
  statusCounts,
}: {
  overdueCount: number;
  /** e.g. { pending: 6, in_progress: 2, done: 11 } — shown inline on each tab, per the reference design. */
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeStatus = searchParams.get("status") ?? "pending";
  const scope = searchParams.get("scope") ?? "mine";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className={cn("space-y-3 transition-opacity", isPending && "opacity-70")}>
      <div className="flex gap-2">
        <ScopeButton active={scope === "mine"} onClick={() => setParam("scope", "mine")}>
          Assigned to me
        </ScopeButton>
        <ScopeButton active={scope === "all"} onClick={() => setParam("scope", "all")}>
          All
        </ScopeButton>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FOLLOW_UP_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={activeStatus === status}
            onClick={() => setParam("status", status)}
          >
            {FOLLOW_UP_STATUS_LABELS[status]}
            {statusCounts[status] > 0 ? ` · ${statusCounts[status]}` : ""}
          </FilterChip>
        ))}
        <FilterChip
          active={activeStatus === "overdue"}
          destructive
          onClick={() => setParam("status", "overdue")}
        >
          Overdue{overdueCount > 0 ? ` (${overdueCount})` : ""}
        </FilterChip>
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-tap flex-1 rounded-xl border text-sm font-medium",
        active
          ? "border-primary-600 bg-primary-600 text-primary-foreground"
          : "border-border bg-card text-foreground"
      )}
    >
      {children}
    </button>
  );
}
