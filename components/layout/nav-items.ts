import { Home, Users, ListChecks, HandCoins, MoreHorizontal, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Shared by BottomNav (mobile) and DesktopSidebar so the two never drift apart. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Members", href: "/dashboard/members", icon: Users },
  { label: "Follow-ups", href: "/dashboard/followups", icon: ListChecks },
  { label: "Giving", href: "/dashboard/giving", icon: HandCoins },
  { label: "More", href: "/dashboard/more", icon: MoreHorizontal },
];
