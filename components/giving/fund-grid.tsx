"use client";

import { cn } from "@/lib/utils";
import type { PublicGivingFund } from "@/lib/data/public-giving";

export function FundGrid({
  funds,
  value,
  onChange,
  name = "fundId",
}: {
  funds: PublicGivingFund[];
  value: string;
  onChange: (id: string) => void;
  name?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input type="hidden" name={name} value={value} />
      {funds.map((fund) => {
        const active = fund.id === value;
        return (
          <button
            key={fund.id}
            type="button"
            onClick={() => onChange(fund.id)}
            className={cn(
              "min-h-tap rounded-xl border-2 px-3 text-sm font-semibold transition-colors",
              active
                ? "border-primary-600 bg-primary-50 text-primary-700"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            {fund.name}
          </button>
        );
      })}
    </div>
  );
}
