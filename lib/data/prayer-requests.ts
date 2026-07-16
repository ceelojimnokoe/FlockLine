import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PrayerRequestItem = Tables<"prayer_requests"> & {
  member: Pick<Tables<"members">, "id" | "first_name" | "last_name" | "photo_url">;
};

/**
 * RLS (see prayer_requests_select_scoped) already limits which rows come
 * back based on privacy_level and the caller's role/assignment — no extra
 * filtering is needed here, only what a member of this church is allowed
 * to see is ever returned.
 */
export async function getPrayerRequestsForSession(sessionId: string): Promise<PrayerRequestItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prayer_requests")
    .select("*, member:members(id, first_name, last_name, photo_url)")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as PrayerRequestItem[];
}

export type RecentPrayerRequest = PrayerRequestItem & {
  session: { id: string; team_id: string } | null;
};

/** Dashboard shortcut — RLS already limits this to what the caller may see, same as getPrayerRequestsForSession. */
export async function getRecentPrayerRequests(limit = 5): Promise<RecentPrayerRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prayer_requests")
    .select("*, member:members(id, first_name, last_name, photo_url), session:sessions(id, team_id)")
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as RecentPrayerRequest[];
}
