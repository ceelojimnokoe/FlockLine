"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { MEMBER_STATUSES, MEMBER_STATUS_LABELS } from "@/lib/validation/member";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/data/tags";

export function MembersSearchFilterBar({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  // Debounce search-as-you-type so we're not re-querying on every keystroke.
  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    if (q === currentQ) return;
    const handle = setTimeout(() => updateParam("q", q || null), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeStatus = searchParams.get("status");
  const activeTag = searchParams.get("tag");

  return (
    <div className={cn("space-y-3 transition-opacity", isPending && "opacity-70")}>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        inputMode="search"
        placeholder="Search by name or phone"
        aria-label="Search members"
      />

      <ChipRow>
        <FilterChip active={!activeStatus} onClick={() => updateParam("status", null)}>
          All
        </FilterChip>
        {MEMBER_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={activeStatus === status}
            onClick={() => updateParam("status", activeStatus === status ? null : status)}
          >
            {MEMBER_STATUS_LABELS[status]}
          </FilterChip>
        ))}
      </ChipRow>

      {tags.length > 0 && (
        <ChipRow>
          {tags.map((tag) => (
            <FilterChip
              key={tag.id}
              active={activeTag === tag.id}
              onClick={() => updateParam("tag", activeTag === tag.id ? null : tag.id)}
            >
              {tag.name}
            </FilterChip>
          ))}
        </ChipRow>
      )}
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">{children}</div>;
}

function FilterChip({
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
        "min-h-tap shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium",
        active
          ? "border-primary-600 bg-primary-600 text-primary-foreground"
          : "border-border bg-card text-foreground"
      )}
    >
      {children}
    </button>
  );
}
