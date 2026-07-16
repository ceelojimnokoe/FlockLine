"use client";

import { useEffect } from "react";

export default function GivePageError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-xs text-base text-muted-foreground">
        We couldn&apos;t load this giving page right now. Please try again in a moment.
      </p>
    </main>
  );
}
