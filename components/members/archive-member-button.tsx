"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog, type ConfirmDialogHandle } from "@/components/ui/confirm-dialog";
import { archiveMember } from "@/app/dashboard/members/actions";

export function ArchiveMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const dialogRef = useRef<ConfirmDialogHandle>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveMember(memberId);
        toast.success(`${memberName} was archived.`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not archive this member.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.open()}
        disabled={isPending}
        className="min-h-tap rounded-xl border border-destructive/30 px-4 text-base font-medium text-destructive disabled:opacity-50"
      >
        Archive
      </button>
      <ConfirmDialog
        ref={dialogRef}
        title="Archive this member?"
        description={`${memberName} will be marked inactive. You can change their status back at any time.`}
        confirmLabel="Archive"
        destructive
        onConfirm={handleArchive}
      />
    </>
  );
}
