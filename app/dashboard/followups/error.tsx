"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-foreground">Couldn&apos;t load follow-ups</h2>
      <p className="text-base text-muted-foreground">Something went wrong. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
