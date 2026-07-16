"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function GivePageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10">
      <ErrorState
        title="Something went wrong"
        description="We couldn't load this giving page right now."
        onRetry={reset}
      />
    </main>
  );
}
