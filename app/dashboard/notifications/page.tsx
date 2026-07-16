import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NotificationsFilterBar } from "@/components/notifications/notifications-filter-bar";
import { NotificationsListClient } from "@/components/notifications/notifications-list-client";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getNotifications, type NotificationsFilters } from "@/lib/data/notifications";
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from "@/lib/validation/notifications";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; unread?: string }>;
}) {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const params = await searchParams;
  const category = NOTIFICATION_CATEGORIES.includes(params.category as NotificationCategory)
    ? (params.category as NotificationCategory)
    : undefined;
  const filters: NotificationsFilters = { category, unreadOnly: params.unread === "1" };

  const { notifications, hasMore } = await getNotifications(filters);

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Notifications</h1>
        <MarkAllReadButton />
      </div>

      <Suspense>
        <NotificationsFilterBar />
      </Suspense>

      <NotificationsListClient
        initialNotifications={notifications}
        initialHasMore={hasMore}
        filters={filters}
      />
    </div>
  );
}
