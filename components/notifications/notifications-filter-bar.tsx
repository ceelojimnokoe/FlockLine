"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { FilterChip } from "@/components/ui/filter-chip";
import { NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_LABELS } from "@/lib/validation/notifications";

export function NotificationsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCategory = searchParams.get("category") ?? "all";
  const unreadOnly = searchParams.get("unread") === "1";

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className={cn("space-y-2 transition-opacity", isPending && "opacity-70")}>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip active={activeCategory === "all"} onClick={() => setParam("category", null)}>
          All
        </FilterChip>
        {NOTIFICATION_CATEGORIES.map((category) => (
          <FilterChip
            key={category}
            active={activeCategory === category}
            onClick={() => setParam("category", category)}
          >
            {NOTIFICATION_CATEGORY_LABELS[category]}
          </FilterChip>
        ))}
      </div>
      <FilterChip active={unreadOnly} onClick={() => setParam("unread", unreadOnly ? null : "1")}>
        Unread only
      </FilterChip>
    </div>
  );
}
