import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type SessionListItem = Tables<"sessions">;

export async function getSessionsForGroup(teamId: string): Promise<SessionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("team_id", teamId)
    .order("scheduled_at", { ascending: false });

  if (error) throw error;
  return data;
}

export type SessionGroup = Pick<
  Tables<"volunteer_teams">,
  "id" | "name" | "whatsapp_link" | "meeting_location"
>;

export type SessionDetail = Tables<"sessions"> & { group: SessionGroup };

export async function getSessionDetail(id: string): Promise<SessionDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, group:volunteer_teams(id, name, whatsapp_link, meeting_location)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as SessionDetail | null;
}

export type UpcomingSession = Tables<"sessions"> & {
  group: Pick<Tables<"volunteer_teams">, "id" | "name">;
};

/** Dashboard shortcut: the next few scheduled sessions across every group. */
export async function getUpcomingSessions(limit = 5): Promise<UpcomingSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, group:volunteer_teams(id, name)")
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as unknown as UpcomingSession[];
}

export type AttendanceRow = Tables<"session_attendance"> & {
  member: Pick<Tables<"members">, "id" | "first_name" | "last_name" | "phone" | "photo_url">;
};

export async function getAttendanceForSession(sessionId: string): Promise<AttendanceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_attendance")
    .select("*, member:members(id, first_name, last_name, phone, photo_url)")
    .eq("session_id", sessionId)
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  return data as unknown as AttendanceRow[];
}
