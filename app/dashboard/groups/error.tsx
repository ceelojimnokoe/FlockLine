"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function GroupsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[groups] Failed to load:", error);
  }, [error]);

  return <ErrorState title="Couldn't load groups & sessions" onRetry={reset} />;
}
