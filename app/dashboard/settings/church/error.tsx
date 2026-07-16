"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function ChurchSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[church-settings] Failed to load church profile:", error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load your church profile"
      description="Something went wrong fetching your church's details. Please try again."
      onRetry={reset}
    />
  );
}
