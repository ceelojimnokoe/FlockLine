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

/** The signed-in user's own church profile — cached per-request like getCurrentChurchUser(). */
export const getCurrentChurch = cache(async () => {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("churches")
    .select("id, name")
    .eq("id", churchUser.church_id)
    .single();

  return data;
});

/**
 * Best-effort first-name-ish greeting derived from the signed-in user's
 * own email (church_users has no display-name column — see
 * get_church_teammates() for the same gap on other users). Returns null
 * rather than something awkward when the email doesn't split into
 * anything name-shaped, so callers can fall back to a name-less greeting.
 */
export const getCurrentUserDisplayName = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!email) return null;

  const localPart = email.split("@")[0];
  const firstSegment = localPart.split(/[.\-_0-9]+/).filter(Boolean)[0];
  if (!firstSegment) return null;

  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
});
