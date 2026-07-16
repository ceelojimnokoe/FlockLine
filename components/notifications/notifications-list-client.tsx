"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeDate } from "@/lib/format";
import { NOTIFICATION_CATEGORY_STYLES, type NotificationCategory } from "@/lib/validation/notifications";
import { markNotificationRead, loadMoreNotifications } from "@/app/dashboard/notifications/actions";
import type { NotificationItem, NotificationsFilters } from "@/lib/data/notifications";

export function NotificationsListClient({
  initialNotifications,
  initialHasMore,
  filters,
}: {
  initialNotifications: NotificationItem[];
  initialHasMore: boolean;
  filters: NotificationsFilters;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, startLoadTransition] = useTransition();
  const [, startMarkTransition] = useTransition();

  function loadMore() {
    startLoadTransition(async () => {
      const next = await loadMoreNotifications(filters, notifications.length);
      setNotifications((prev) => [...prev, ...next.notifications]);
      setHasMore(next.hasMore);
    });
  }

  function handleOpen(notification: NotificationItem) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      startMarkTransition(() => {
        markNotificationRead(notification.id);
      });
    }
    if (notification.link) router.push(notification.link);
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Nothing matches this filter right now."
      />
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => handleOpen(notification)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left hover:bg-neutral-100",
                !notification.is_read && "border-primary-200 bg-primary-50"
              )}
            >
              <Badge
                className={cn(
                  "shrink-0",
                  NOTIFICATION_CATEGORY_STYLES[notification.category as NotificationCategory]
                    .badgeClassName
                )}
              >
                {notification.category}
              </Badge>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-foreground">{notification.title}</span>
                {notification.body && (
                  <span className="mt-0.5 block text-sm text-muted-foreground">{notification.body}</span>
                )}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatRelativeDate(notification.created_at)}
                </span>
              </span>
              {!notification.is_read && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <Button
          type="button"
          variant="secondary"
          disabled={isLoadingMore}
          onClick={loadMore}
          className="w-full"
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
