"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { ChurchIdentity } from "./church-identity";

export function DesktopSidebar({
  churchName,
  logoUrl,
}: {
  churchName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex print:hidden">
      <div className="flex h-16 items-center px-4">
        <ChurchIdentity name={churchName} logoUrl={logoUrl} size="sm" />
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-tap items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={isActive ? 2.25 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
