"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { SESSION_STATUSES, SESSION_STATUS_STYLES, type SessionStatus } from "@/lib/validation/groups";
import { updateSessionStatus } from "@/app/dashboard/groups/session-actions";

export function SessionStatusControl({
  sessionId,
  teamId,
  status,
}: {
  sessionId: string;
  teamId: string;
  status: SessionStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSet(next: SessionStatus) {
    startTransition(async () => {
      try {
        await updateSessionStatus(sessionId, teamId, next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update this session.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SESSION_STATUSES.filter((s) => s !== status).map((s) => (
        <button
          key={s}
          type="button"
          disabled={isPending}
          onClick={() => handleSet(s)}
          className="min-h-tap rounded-xl border border-input px-4 text-sm font-medium text-foreground disabled:opacity-50"
        >
          Mark {SESSION_STATUS_STYLES[s].label.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
