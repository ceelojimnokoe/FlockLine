"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QUICK_GIVING_AMOUNTS } from "@/lib/validation/giving";
import { cn } from "@/lib/utils";

export function AmountPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Amount (GHS)</Label>
      <div className="grid grid-cols-4 gap-2">
        {QUICK_GIVING_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onChange(String(amount))}
            className={cn(
              "min-h-tap rounded-xl border text-base font-medium",
              Number(value) === amount
                ? "border-primary-600 bg-primary-600 text-primary-foreground"
                : "border-border bg-card text-foreground"
            )}
          >
            {amount}
          </button>
        ))}
      </div>
      <Input
        name="amount"
        type="number"
        inputMode="decimal"
        min="1"
        step="0.01"
        placeholder="Or enter another amount"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Amount in Ghana cedis"
      />
    </div>
  );
}
