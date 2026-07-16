export const APP_NAME = "FlockLine";

/**
 * Routes that proxy.ts (see /proxy.ts) never redirects away from, even
 * without a session. "/" is matched exactly — everything else is a prefix
 * match, so keep "/" out of PUBLIC_ROUTE_PREFIXES or it would swallow every
 * route in the app (every path starts with "/").
 */
export const PUBLIC_ROUTE_PREFIXES = ["/login", "/signup", "/auth", "/give"];

export type DashboardNavItem = {
  label: string;
  href: string;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Members", href: "/dashboard/members" },
  { label: "Follow-ups", href: "/dashboard/followups" },
  { label: "Giving", href: "/dashboard/giving" },
  { label: "More", href: "/dashboard/more" },
];
