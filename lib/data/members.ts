import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { MEMBER_STATUSES, type MemberStatus } from "@/lib/validation/member";

export const MEMBERS_PAGE_SIZE = 50;

export type MemberListItem = Pick<
  Tables<"members">,
  "id" | "first_name" | "last_name" | "phone" | "status" | "photo_url" | "created_at"
>;

export type MembersFilters = {
  q?: string;
  status?: string;
  tagId?: string;
};

/**
 * PostgREST's .ilike()/.or() filter strings use `,`, `(`, `)` as syntax and
 * `%`/`_` as wildcards. Stripping the former (search terms never need them)
 * and escaping the latter keeps user input from doing anything but a
 * literal substring search — RLS is still the real security boundary, but
 * unescaped input here would just misbehave, not leak data.
 */
function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()]/g, "").replace(/[%_\\]/g, "\\$&").trim();
}

export async function getMembers(filters: MembersFilters, offset = 0, limit = MEMBERS_PAGE_SIZE) {
  const supabase = await createClient();

  const baseColumns = "id, first_name, last_name, phone, status, photo_url, created_at";
  const columns = filters.tagId ? `${baseColumns}, member_tags!inner(tag_id)` : baseColumns;

  let query = supabase
    .from("members")
    .select(columns, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const q = filters.q ? sanitizeSearchTerm(filters.q) : "";
  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  // Ignore anything that isn't a real status rather than erroring — this
  // filter value comes straight from the URL's ?status= query param.
  if (filters.status && MEMBER_STATUSES.includes(filters.status as MemberStatus)) {
    query = query.eq("status", filters.status as MemberStatus);
  }
  if (filters.tagId) {
    query = query.eq("member_tags.tag_id", filters.tagId);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    members: (data ?? []) as unknown as MemberListItem[],
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + (data?.length ?? 0),
  };
}

export async function getMemberCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export type MemberDetail = Tables<"members"> & {
  member_tags: { tag: Tables<"tags"> }[];
};

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*, member_tags(tag:tags(*))")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as MemberDetail | null;
}

export async function getMemberStatusEvents(memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_status_events")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMemberFollowUps(memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export type GivingRecordWithFund = Tables<"giving_records"> & {
  fund: Pick<Tables<"giving_funds">, "name"> | null;
};

export async function getMemberGivingRecords(memberId: string): Promise<GivingRecordWithFund[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("giving_records")
    .select("*, fund:giving_funds(name)")
    .eq("member_id", memberId)
    .order("given_at", { ascending: false });

  if (error) throw error;
  return data as unknown as GivingRecordWithFund[];
}

export async function getExistingPhones(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("members").select("phone").not("phone", "is", null);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.phone as string));
}

export type MemberPickerOption = Pick<
  Tables<"members">,
  "id" | "first_name" | "last_name" | "phone" | "photo_url"
>;

/**
 * Fetches every member for the searchable member picker (Create follow-up
 * form). Filtered client-side rather than server-searched — fine at this
 * app's scale (a church's whole roster is at most a few hundred rows).
 */
export async function getAllMembersForPicker(): Promise<MemberPickerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, phone, photo_url")
    .order("first_name", { ascending: true });

  if (error) throw error;
  return data;
}
