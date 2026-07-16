"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type SVGProps } from "react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS } from "@/lib/constants";

function Icon({
  path,
  ...props
}: SVGProps<SVGSVGElement> & { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={path} />
    </svg>
  );
}

const NAV_ICON_PATHS: Record<string, string> = {
  "/dashboard": "M3 11.5 12 4l9 7.5M5 10v9.5h14V10",
  "/dashboard/members":
    "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.5a3 3 0 0 0-2.2-2.9M14.5 4.6a3 3 0 0 1 0 5.8",
  "/dashboard/followups": "M4 12.5 9.5 18 20 6",
  "/dashboard/giving":
    "M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10.5c0 5.4-7.5 10-7.5 10Z",
  "/dashboard/more": "M5 12h.01M12 12h.01M19 12h.01",
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] print:hidden"
    >
      <ul className="mx-auto flex max-w-2xl">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-tap flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon path={NAV_ICON_PATHS[item.href]} className="h-6 w-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
