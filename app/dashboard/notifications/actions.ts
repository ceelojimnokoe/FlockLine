"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getNotifications, type NotificationsFilters } from "@/lib/data/notifications";

export async function loadMoreNotifications(filters: NotificationsFilters, offset: number) {
  return getNotifications(filters, offset);
}

export async function markNotificationRead(id: string): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", churchUser.id)
    .eq("is_read", false);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/notifications");
}
