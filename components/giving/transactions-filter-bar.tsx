"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GIVING_METHODS, GIVING_METHOD_LABELS } from "@/lib/validation/giving";
import type { GivingFund } from "@/lib/data/giving";

export function TransactionsFilterBar({ funds }: { funds: GivingFund[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    if (q === currentQ) return;
    const handle = setTimeout(() => setParam("q", q), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const exportUrl = `/api/giving/export?${searchParams.toString()}`;

  return (
    <div className={cn("space-y-2", isPending && "opacity-70")}>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        inputMode="search"
        placeholder="Search by giver name"
        aria-label="Search by giver name"
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          aria-label="From date"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => setParam("from", e.target.value)}
        />
        <Input
          type="date"
          aria-label="To date"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => setParam("to", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          aria-label="Fund"
          defaultValue={searchParams.get("fundId") ?? ""}
          onChange={(e) => setParam("fundId", e.target.value)}
        >
          <option value="">All funds</option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Method"
          defaultValue={searchParams.get("method") ?? ""}
          onChange={(e) => setParam("method", e.target.value)}
        >
          <option value="">All methods</option>
          {GIVING_METHODS.map((method) => (
            <option key={method} value={method}>
              {GIVING_METHOD_LABELS[method]}
            </option>
          ))}
        </Select>
      </div>

      <a
        href={exportUrl}
        className="inline-flex min-h-tap items-center gap-2 text-sm font-medium text-primary-700"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Export CSV
      </a>
    </div>
  );
}
