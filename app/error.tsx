"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Root-level safety net. error.tsx boundaries only catch errors thrown by
 * their OWN segment's page and nested segments — never by their own
 * segment's layout.tsx. app/dashboard/layout.tsx fetches the signed-in
 * user's church on every request; if that throws (a real query failure,
 * not just "not onboarded yet"), app/dashboard/error.tsx can't catch it —
 * only a boundary above it, here, can.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <ErrorState
          title="Something went wrong"
          description="FlockLine ran into a problem loading this page. Please try again."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
