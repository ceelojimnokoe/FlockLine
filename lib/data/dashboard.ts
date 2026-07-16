import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Monday 00:00 of the current week (ISO week, not the church's service-day week). */
function startOfWeekISO(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun .. 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export type WeekSummary = {
  newFirstTimers: number;
  overdueFollowUps: number;
  completedFollowUps: number;
};

export async function getWeekSummary(): Promise<WeekSummary> {
  const supabase = await createClient();
  const weekStart = startOfWeekISO();
  const today = new Date().toISOString().slice(0, 10);

  const [newFirstTimers, overdue, completed] = await Promise.all([
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("status", "first_timer")
      .gte("created_at", weekStart),
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .neq("status", "done")
      .lt("due_date", today),
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("status", "done")
      .gte("completed_at", weekStart),
  ]);

  return {
    newFirstTimers: newFirstTimers.count ?? 0,
    overdueFollowUps: overdue.count ?? 0,
    completedFollowUps: completed.count ?? 0,
  };
}
