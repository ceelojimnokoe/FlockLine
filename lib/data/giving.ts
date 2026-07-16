import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { GivingRecordWithFund } from "@/lib/data/members";

export type GivingFund = Tables<"giving_funds">;

export async function getGivingFunds(): Promise<GivingFund[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("giving_funds")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getMonthTotal(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("giving_records")
    .select("amount")
    .gte("given_at", startOfMonthISO());

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export type FundTotal = { fundId: string; fundName: string; total: number };

/** Scoped to the current month, same window as getMonthTotal() — a natural pairing on the dashboard. */
export async function getMonthTotalsByFund(): Promise<FundTotal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("giving_records")
    .select("amount, fund:giving_funds(id, name)")
    .gte("given_at", startOfMonthISO());

  if (error) throw error;

  const totals = new Map<string, FundTotal>();
  for (const row of data ?? []) {
    const fund = row.fund as unknown as { id: string; name: string } | null;
    if (!fund) continue;
    const existing = totals.get(fund.id);
    if (existing) {
      existing.total += Number(row.amount);
    } else {
      totals.set(fund.id, { fundId: fund.id, fundName: fund.name, total: Number(row.amount) });
    }
  }

  return [...totals.values()].sort((a, b) => b.total - a.total);
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun .. 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type WeeklyTotal = { weekStart: string; total: number };

export async function getGivingTrend(weeks = 8): Promise<WeeklyTotal[]> {
  const supabase = await createClient();
  const thisWeekMonday = mondayOf(new Date());
  const rangeStart = new Date(thisWeekMonday);
  rangeStart.setDate(rangeStart.getDate() - (weeks - 1) * 7);

  const { data, error } = await supabase
    .from("giving_records")
    .select("amount, given_at")
    .gte("given_at", rangeStart.toISOString());

  if (error) throw error;

  const buckets: WeeklyTotal[] = Array.from({ length: weeks }, (_, i) => {
    const bucketStart = new Date(rangeStart);
    bucketStart.setDate(bucketStart.getDate() + i * 7);
    return { weekStart: bucketStart.toISOString().slice(0, 10), total: 0 };
  });

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  for (const row of data ?? []) {
    const weekIndex = Math.floor(
      (mondayOf(new Date(row.given_at)).getTime() - rangeStart.getTime()) / msPerWeek
    );
    if (weekIndex >= 0 && weekIndex < weeks) {
      buckets[weekIndex].total += Number(row.amount);
    }
  }

  return buckets;
}

export type GivingRecordListItem = Tables<"giving_records"> & {
  member: Pick<Tables<"members">, "id" | "first_name" | "last_name"> | null;
  fund: Pick<Tables<"giving_funds">, "name"> | null;
};

function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()]/g, "").replace(/[%_\\]/g, "\\$&").trim();
}

export async function getRecentGivingRecords(searchQuery?: string): Promise<GivingRecordListItem[]> {
  const supabase = await createClient();
  const term = searchQuery ? sanitizeSearchTerm(searchQuery) : "";

  // Searching requires an inner join on members (so the filter can apply
  // at the database level) — but that would silently exclude anonymous
  // records (member_id null) from the *unfiltered* recent list, so only
  // switch to the inner-join select when actually searching.
  const memberEmbed = term
    ? "member:members!inner(id, first_name, last_name)"
    : "member:members(id, first_name, last_name)";

  let query = supabase
    .from("giving_records")
    .select(`*, ${memberEmbed}, fund:giving_funds(name)`)
    .order("given_at", { ascending: false })
    .limit(50);

  if (term) {
    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`, {
      foreignTable: "members",
    });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as GivingRecordListItem[];
}

export async function getMemberGivingInRange(
  memberId: string,
  from?: string,
  to?: string
): Promise<GivingRecordWithFund[]> {
  const supabase = await createClient();
  let query = supabase
    .from("giving_records")
    .select("*, fund:giving_funds(name)")
    .eq("member_id", memberId)
    .order("given_at", { ascending: true });

  if (from) query = query.gte("given_at", from);
  if (to) query = query.lte("given_at", to);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as GivingRecordWithFund[];
}
