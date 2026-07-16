"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MemberPicker } from "@/components/shared/member-picker";
import { recordGivingRows, type ManualGivingRow } from "@/app/dashboard/giving/actions";
import {
  MANUAL_GIVING_METHODS,
  GIVING_METHOD_LABELS,
  type ManualGivingMethod,
} from "@/lib/validation/giving";
import type { GivingFund } from "@/lib/data/giving";
import type { MemberPickerOption } from "@/lib/data/members";

type Row = { key: string; memberId: string; amount: string; method: ManualGivingMethod };

function newRow(): Row {
  return { key: crypto.randomUUID(), memberId: "", amount: "", method: "cash" };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ManualEntryForm({
  funds,
  members,
}: {
  funds: GivingFund[];
  members: MemberPickerOption[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [givenAt, setGivenAt] = useState(todayISO());
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [isPending, startTransition] = useTransition();

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  const validRows: ManualGivingRow[] = rows
    .filter((row) => row.amount.trim() !== "")
    .map((row) => ({
      memberId: row.memberId || null,
      amount: Number(row.amount),
      method: row.method,
    }));

  const total = validRows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0);

  function handleSubmit() {
    if (!fundId) {
      toast.error("Choose a fund.");
      return;
    }
    if (validRows.length === 0) {
      toast.error("Enter at least one amount.");
      return;
    }

    startTransition(async () => {
      const result = await recordGivingRows(fundId, givenAt, validRows);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Recorded ${result.recorded} gift${result.recorded === 1 ? "" : "s"} — GHS ${total.toFixed(2)} total.`
      );
      setRows([newRow()]);
      router.push("/dashboard/giving");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <ModeButton active={mode === "single"} onClick={() => setMode("single")}>
          Single entry
        </ModeButton>
        <ModeButton active={mode === "bulk"} onClick={() => setMode("bulk")}>
          Sunday entry (bulk)
        </ModeButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fundId">Fund</Label>
          <Select id="fundId" value={fundId} onChange={(e) => setFundId(e.target.value)}>
            {funds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="givenAt">Date</Label>
          <Input
            id="givenAt"
            type="date"
            value={givenAt}
            onChange={(e) => setGivenAt(e.target.value)}
            max={todayISO()}
          />
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.key} className="space-y-3 rounded-xl border border-border p-3">
            {mode === "bulk" && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Row {index + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="text-sm text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}

            <div>
              <Label>Member</Label>
              <MemberPicker
                members={members}
                value={row.memberId}
                onChange={(id) => updateRow(row.key, { memberId: id })}
                name={`memberId-${row.key}`}
                emptyHint="Leave blank to record this as an anonymous gift."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`amount-${row.key}`}>Amount (GHS)</Label>
                <Input
                  id={`amount-${row.key}`}
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`method-${row.key}`}>Method</Label>
                <Select
                  id={`method-${row.key}`}
                  value={row.method}
                  onChange={(e) => updateRow(row.key, { method: e.target.value as ManualGivingMethod })}
                >
                  {MANUAL_GIVING_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {GIVING_METHOD_LABELS[method]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mode === "bulk" && (
        <button
          type="button"
          onClick={addRow}
          className="min-h-tap w-full rounded-xl border border-dashed border-border text-sm font-medium text-primary"
        >
          + Add row
        </button>
      )}

      <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {validRows.length} {validRows.length === 1 ? "gift" : "gifts"}
        </span>
        <span className="text-lg font-semibold text-foreground">GHS {total.toFixed(2)}</span>
      </div>

      <Button onClick={handleSubmit} disabled={isPending} className="w-full">
        {isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-tap flex-1 rounded-xl border text-sm font-medium ${
        active
          ? "border-primary-600 bg-primary-600 text-primary-foreground"
          : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
