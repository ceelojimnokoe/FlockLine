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
 *
 * Throws on a genuine query failure rather than swallowing it into the
 * same null — this function's null is load-bearing everywhere (it's what
 * triggers a redirect to /onboarding), so a swallowed transient error would
 * misroute an already-onboarded user there too.
 */
export const getCurrentChurchUser = cache(
  async (): Promise<CurrentChurchUser | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("church_users")
      .select("id, church_id, role")
      .maybeSingle();
    if (error) throw error;
    return data;
  }
);

export function canViewGiving(role: CurrentChurchUser["role"]): boolean {
  return role === "admin" || role === "pastor";
}

/**
 * The signed-in user's own church profile — cached per-request like
 * getCurrentChurchUser(). Throws on a genuine query failure (bad column,
 * RLS, network) instead of swallowing it — a caller silently treating a
 * failed fetch the same as "not onboarded yet" would misroute an
 * already-onboarded admin back to /onboarding on a transient error.
 */
export const getCurrentChurch = cache(async () => {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("churches")
    .select("id, name, logo_url")
    .eq("id", churchUser.church_id)
    .maybeSingle();

  if (error) throw error;
  return data;
});

export type ChurchProfile = {
  id: string;
  name: string;
  phone: string | null;
  location: string | null;
  logo_url: string | null;
  giving_message: string | null;
};

/**
 * Full profile fields for the Church Profile settings page. Separate from
 * getCurrentChurch() (which only loads the 2 fields the header/sidebar
 * need on every request) so that page's heavier/rarer query doesn't run on
 * every navigation. Always throws on error — never returns null to mean
 * "something went wrong," only to mean "no such row."
 */
export async function getChurchProfile(churchId: string): Promise<ChurchProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("churches")
    .select("id, name, phone, location, logo_url, giving_message")
    .eq("id", churchId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

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
