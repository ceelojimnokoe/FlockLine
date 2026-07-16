"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function FollowUpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState title="Couldn't load follow-ups" onRetry={reset} />;
}
