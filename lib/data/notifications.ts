import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type NotificationItem = Tables<"notifications">;

export type NotificationsFilters = {
  category?: NotificationItem["category"];
  unreadOnly?: boolean;
};

const NOTIFICATIONS_PAGE_SIZE = 20;

export async function getNotifications(
  filters: NotificationsFilters = {},
  offset = 0,
  limit = NOTIFICATIONS_PAGE_SIZE
): Promise<{ notifications: NotificationItem[]; hasMore: boolean }> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) throw error;

  return { notifications: data.slice(0, limit), hasMore: data.length > limit };
}

/** Small, fixed-size fetch for the header dropdown — never paginated. */
export async function getRecentNotifications(limit = 8): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Best-effort: a notification failing to send should never fail the
 * action that triggered it (assigning a follow-up still succeeds even if
 * this RPC call fails). Swallows errors after logging rather than
 * propagating them. Skips notifying someone about their own action — no
 * "you assigned this to yourself" notification.
 */
export async function notifyRecipient(
  supabase: SupabaseClient<Database>,
  recipientId: string | null,
  actorChurchUserId: string,
  params: {
    category: NotificationItem["category"];
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
  }
): Promise<void> {
  if (!recipientId || recipientId === actorChurchUserId) return;

  const { error } = await supabase.rpc("create_notification", {
    p_recipient_id: recipientId,
    p_category: params.category,
    p_type: params.type,
    p_title: params.title,
    p_body: params.body ?? null,
    p_link: params.link ?? null,
  });

  if (error) {
    console.error("notifyRecipient: create_notification failed", error);
  }
}
