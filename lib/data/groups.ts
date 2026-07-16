import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type GroupLeader = Pick<Tables<"members">, "id" | "first_name" | "last_name" | "phone">;

export type GroupListItem = Tables<"volunteer_teams"> & {
  leader: GroupLeader | null;
  memberCount: number;
};

export type GroupDetail = Tables<"volunteer_teams"> & {
  leader: GroupLeader | null;
};

export type GroupMember = Pick<
  Tables<"members">,
  "id" | "first_name" | "last_name" | "phone" | "photo_url" | "status"
>;

/**
 * "Groups" are volunteer_teams rows — see the migration comment for why
 * this reuses the existing duty-roster table instead of a parallel one.
 * Member counts come from a second query rather than a PostgREST `(count)`
 * embed: this codebase has no existing precedent for that embed syntax, and
 * at church-roster scale (tens to low hundreds of rows) a plain second
 * query is simpler and just as fast.
 */
export async function getGroups(): Promise<GroupListItem[]> {
  const supabase = await createClient();
  const [{ data: groups, error: groupsError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from("volunteer_teams")
        .select("*, leader:members(id, first_name, last_name, phone)")
        .order("name", { ascending: true }),
      supabase.from("team_members").select("team_id"),
    ]);

  if (groupsError) throw groupsError;
  if (membershipsError) throw membershipsError;

  const counts = new Map<string, number>();
  for (const row of memberships ?? []) {
    counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }

  return (groups as unknown as GroupDetail[]).map((group) => ({
    ...group,
    memberCount: counts.get(group.id) ?? 0,
  }));
}

export async function getGroupDetail(id: string): Promise<GroupDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_teams")
    .select("*, leader:members(id, first_name, last_name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as GroupDetail | null;
}

export async function getGroupMembers(teamId: string): Promise<GroupMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("member:members(id, first_name, last_name, phone, photo_url, status)")
    .eq("team_id", teamId);

  if (error) throw error;
  return (data as unknown as { member: GroupMember }[]).map((row) => row.member);
}
