import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentChurchUser = {
  id: string;
  church_id: string;
  role: "admin" | "pastor" | "volunteer";
};

/**
 * The signed-in user's own church_users row. Wrapped in React's cache() so
 * multiple Server Components in the same request (layout + page) share one
 * query instead of each re-fetching it. Returns null if the user hasn't
 * completed onboarding yet — callers under /dashboard shouldn't normally
 * hit that case since the dashboard layout already redirects to
 * /onboarding first, but Server Actions run as separate requests and
 * should still check.
 */
export const getCurrentChurchUser = cache(
  async (): Promise<CurrentChurchUser | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("church_users")
      .select("id, church_id, role")
      .maybeSingle();
    return data;
  }
);

export function canViewGiving(role: CurrentChurchUser["role"]): boolean {
  return role === "admin" || role === "pastor";
}
