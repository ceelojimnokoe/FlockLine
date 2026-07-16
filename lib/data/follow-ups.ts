import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { FOLLOW_UP_STATUSES, type FollowUpStatus } from "@/lib/validation/follow-up";

export type FollowUpListItem = Tables<"follow_ups"> & {
  member: Pick<
    Tables<"members">,
    "id" | "first_name" | "last_name" | "phone" | "photo_url" | "status"
  >;
};

export type FollowUpsFilters = {
  status?: FollowUpStatus | "overdue";
  scope: "mine" | "all";
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getFollowUps(
  filters: FollowUpsFilters,
  churchUserId: string
): Promise<FollowUpListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("follow_ups")
    .select("*, member:members(id, first_name, last_name, phone, photo_url, status)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.scope === "mine") {
    query = query.eq("assigned_to", churchUserId);
  }

  if (filters.status === "overdue") {
    query = query.neq("status", "done").lt("due_date", todayISO());
  } else if (filters.status && FOLLOW_UP_STATUSES.includes(filters.status)) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as FollowUpListItem[];
}

/** Powers the inline "Pending · 6" style counts on the pipeline's status tabs. */
export async function getStatusCounts(
  churchUserId: string,
  scope: "mine" | "all"
): Promise<Record<FollowUpStatus, number>> {
  const supabase = await createClient();

  const counts = await Promise.all(
    FOLLOW_UP_STATUSES.map(async (status) => {
      let query = supabase
        .from("follow_ups")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (scope === "mine") query = query.eq("assigned_to", churchUserId);
      const { count } = await query;
      return [status, count ?? 0] as const;
    })
  );

  return Object.fromEntries(counts) as Record<FollowUpStatus, number>;
}

export async function getOverdueCount(churchUserId: string, scope: "mine" | "all") {
  const supabase = await createClient();
  let query = supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .neq("status", "done")
    .lt("due_date", todayISO());

  if (scope === "mine") query = query.eq("assigned_to", churchUserId);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export type NeedsAttentionFollowUp = FollowUpListItem & { urgency: "overdue" | "today" };

/**
 * The dashboard's "needs attention" preview — overdue and due-today items
 * assigned to the caller, soonest first. Scoped to "mine" only (not
 * unassigned church-wide items) to match the dashboard's personal framing
 * ("here's what needs you this week").
 */
export async function getNeedsAttentionFollowUps(
  churchUserId: string,
  limit = 5
): Promise<NeedsAttentionFollowUp[]> {
  const supabase = await createClient();
  const today = todayISO();

  const { data, error } = await supabase
    .from("follow_ups")
    .select("*, member:members(id, first_name, last_name, phone, photo_url, status)")
    .eq("assigned_to", churchUserId)
    .neq("status", "done")
    .not("due_date", "is", null)
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data as unknown as FollowUpListItem[]).map((item) => ({
    ...item,
    urgency: item.due_date! < today ? "overdue" : "today",
  }));
}
