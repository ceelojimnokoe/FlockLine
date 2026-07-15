import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-base text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-col gap-3 sm:flex-row">{action}</div>}
    </div>
  );
}
