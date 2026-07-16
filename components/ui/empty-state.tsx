import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      {Icon && <Icon aria-hidden="true" className="mb-3 h-8 w-8 text-muted-foreground" />}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-base text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-col gap-3 sm:flex-row">{action}</div>}
    </div>
  );
}
