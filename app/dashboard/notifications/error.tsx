"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[notifications] Failed to load:", error);
  }, [error]);

  return <ErrorState title="Couldn't load notifications" onRetry={reset} />;
}
