"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/format";
import { NOTIFICATION_CATEGORY_STYLES, type NotificationCategory } from "@/lib/validation/notifications";
import { markNotificationRead, markAllNotificationsRead } from "@/app/dashboard/notifications/actions";
import type { NotificationItem } from "@/lib/data/notifications";

export function NotificationButton({
  initialNotifications,
  initialUnreadCount,
  loadFailed = false,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
  /** True when the server-side fetch failed — rendered as an honest "unavailable" state, never as a false "you're all caught up." */
  loadFailed?: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  // Re-sync local (optimistically-mutated) state when the server gives us a
  // fresh fetch — e.g. after revalidatePath from a new notification landing
  // elsewhere. Adjusting state during render (rather than in a useEffect)
  // avoids an extra commit; see https://react.dev/learn/you-might-not-need-an-effect.
  const [prevInitialNotifications, setPrevInitialNotifications] = useState(initialNotifications);
  if (initialNotifications !== prevInitialNotifications) {
    setPrevInitialNotifications(initialNotifications);
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleOpenNotification(notification: NotificationItem) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      startTransition(() => {
        markNotificationRead(notification.id);
      });
    }
    setIsOpen(false);
    if (notification.link) router.push(notification.link);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={
          loadFailed
            ? "Notifications unavailable"
            : unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
        }
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-current hover:bg-white/25"
      >
        <Bell className={cn("h-5 w-5", loadFailed && "opacity-50")} aria-hidden="true" />
        {loadFailed ? (
          <span
            className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-white/60"
            aria-hidden="true"
          />
        ) : (
          unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 z-40 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card text-foreground shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-base font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-700"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {loadFailed ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Couldn&apos;t load notifications right now. Try again in a moment.
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing here yet — you&apos;ll see follow-up assignments, prayer requests, first-timers,
              and gifts as they happen.
            </p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className={cn(
                      "flex w-full items-start gap-2 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-neutral-100",
                      !notification.is_read && "bg-primary-50"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        NOTIFICATION_CATEGORY_STYLES[notification.category as NotificationCategory]
                          .badgeClassName
                      )}
                    >
                      {notification.category}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {notification.title}
                      </span>
                      {notification.body && (
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {notification.body}
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs text-muted-foreground">
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
          )}

          <Link
            href="/dashboard/notifications"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium text-primary-700 hover:bg-neutral-100"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
