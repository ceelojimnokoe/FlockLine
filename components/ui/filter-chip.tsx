"use client";

import { cn } from "@/lib/utils";

export function FilterChip({
  active,
  onClick,
  destructive,
  children,
}: {
  active: boolean;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-tap shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? destructive
            ? "border-destructive bg-destructive text-destructive-foreground"
            : "border-primary-600 bg-primary-600 text-primary-foreground"
          : destructive
            ? "border-destructive/40 bg-card text-destructive"
            : "border-border bg-card text-foreground"
      )}
    >
      {children}
    </button>
  );
}
