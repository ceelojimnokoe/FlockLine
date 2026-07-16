"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setGroupActive } from "@/app/dashboard/groups/actions";

export function GroupActiveToggle({ groupId, isActive }: { groupId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try {
        await setGroupActive(groupId, !isActive);
        toast.success(isActive ? "Group marked inactive." : "Group marked active.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update this group.");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleToggle}
      className="min-h-tap rounded-xl border border-input px-4 text-sm font-medium text-foreground disabled:opacity-50"
    >
      {isActive ? "Mark inactive" : "Mark active"}
    </button>
  );
}
