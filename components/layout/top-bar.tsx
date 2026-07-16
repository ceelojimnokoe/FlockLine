import { ChurchIdentity } from "./church-identity";
import { NotificationButton } from "./notification-button";
import { getRecentNotifications, getUnreadNotificationCount } from "@/lib/data/notifications";

export async function TopBar({
  churchName,
  logoUrl,
}: {
  churchName: string;
  logoUrl?: string | null;
}) {
  const dateLabel = new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // TopBar renders on every /dashboard/* page as part of the layout, so a
  // notifications fetch failure here must never take down the whole app —
  // there's no error.tsx boundary above a layout in the same segment (see
  // app/error.tsx). Failures are logged with context (not swallowed
  // silently) and the bell falls back to an honest "unavailable" state
  // rather than pretending there are zero notifications.
  const [notificationsResult, unreadCountResult] = await Promise.allSettled([
    getRecentNotifications(),
    getUnreadNotificationCount(),
  ]);

  if (notificationsResult.status === "rejected") {
    console.error("[TopBar] Failed to load recent notifications:", notificationsResult.reason);
  }
  if (unreadCountResult.status === "rejected") {
    console.error("[TopBar] Failed to load unread notification count:", unreadCountResult.reason);
  }

  const notificationsFailed =
    notificationsResult.status === "rejected" || unreadCountResult.status === "rejected";
  const notifications = notificationsResult.status === "fulfilled" ? notificationsResult.value : [];
  const unreadCount = unreadCountResult.status === "fulfilled" ? unreadCountResult.value : 0;

  return (
    <header className="sticky top-0 z-20 bg-primary-600 text-white print:hidden">
      <div className="mx-auto flex min-h-tap max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <ChurchIdentity name={churchName} logoUrl={logoUrl} subtitle={dateLabel} />
        <NotificationButton
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
          loadFailed={notificationsFailed}
        />
      </div>
    </header>
  );
}
