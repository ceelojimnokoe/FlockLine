"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markAllNotificationsRead } from "@/app/dashboard/notifications/actions";

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        toast.success("All notifications marked as read.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't mark all as read.");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="text-sm font-medium text-primary-700 disabled:opacity-50"
    >
      Mark all read
    </button>
  );
}
