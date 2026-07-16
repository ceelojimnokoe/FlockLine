"use client";

import { useState, useMemo } from "react";
import { MemberAvatar } from "@/components/members/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MemberPickerOption } from "@/lib/data/members";

export function MemberPicker({
  members,
  value,
  onChange,
  name = "memberId",
  searchPlaceholder = "Search by name or phone",
  emptyHint,
}: {
  members: MemberPickerOption[];
  value: string;
  onChange: (id: string) => void;
  name?: string;
  searchPlaceholder?: string;
  /** Shown under the search box while nothing is selected, e.g. "Leave blank for an anonymous gift." */
  emptyHint?: string;
}) {
  const [query, setQuery] = useState("");
  const selected = members.find((m) => m.id === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return members.slice(0, 30);
    const q = query.toLowerCase();
    return members
      .filter(
        (m) =>
          `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
          (m.phone ?? "").includes(q)
      )
      .slice(0, 30);
  }, [members, query]);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />

      {selected && !query ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2">
          <MemberAvatar
            id={selected.id}
            firstName={selected.first_name}
            lastName={selected.last_name}
            photoUrl={selected.photo_url}
            size="sm"
          />
          <span className="text-base font-medium text-foreground">
            {selected.first_name} {selected.last_name}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="ml-auto min-h-tap px-2 text-sm font-medium text-muted-foreground"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search members"
          />
          {emptyHint && <p className="text-sm text-muted-foreground">{emptyHint}</p>}
          <ul className="max-h-56 overflow-y-auto rounded-xl border border-border">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-base text-muted-foreground">No members found.</li>
            )}
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(m.id);
                    setQuery("");
                  }}
                  className={cn(
                    "flex min-h-tap w-full items-center gap-3 px-3 text-left hover:bg-neutral-200",
                    value === m.id && "bg-primary-50"
                  )}
                >
                  <MemberAvatar
                    id={m.id}
                    firstName={m.first_name}
                    lastName={m.last_name}
                    photoUrl={m.photo_url}
                    size="sm"
                  />
                  <span className="text-base text-foreground">
                    {m.first_name} {m.last_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
