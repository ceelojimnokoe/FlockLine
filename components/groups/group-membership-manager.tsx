"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { MemberAvatar } from "@/components/members/avatar";
import { StatusBadge } from "@/components/members/status-badge";
import { MemberPicker } from "@/components/shared/member-picker";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, type ConfirmDialogHandle } from "@/components/ui/confirm-dialog";
import { addGroupMember, removeGroupMember } from "@/app/dashboard/groups/actions";
import type { MemberStatus } from "@/lib/validation/member";
import type { MemberPickerOption } from "@/lib/data/members";
import type { GroupMember } from "@/lib/data/groups";

export function GroupMembershipManager({
  teamId,
  members,
  allMembers,
}: {
  teamId: string;
  members: GroupMember[];
  allMembers: MemberPickerOption[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [removeTarget, setRemoveTarget] = useState<GroupMember | null>(null);
  const confirmRef = useRef<ConfirmDialogHandle>(null);

  const memberIds = new Set(members.map((m) => m.id));
  const pickable = allMembers.filter((m) => !memberIds.has(m.id));

  function handleAdd(memberId: string) {
    startTransition(async () => {
      try {
        await addGroupMember(teamId, memberId);
        toast.success("Member added.");
        setPickerValue("");
        setIsAdding(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add this member.");
      }
    });
  }

  function confirmRemove(member: GroupMember) {
    setRemoveTarget(member);
    confirmRef.current?.open();
  }

  function handleRemove() {
    const member = removeTarget;
    if (!member) return;
    startTransition(async () => {
      try {
        await removeGroupMember(teamId, member.id);
        toast.success("Member removed.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't remove this member.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <p className="text-base text-muted-foreground">No members yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <MemberAvatar
                id={member.id}
                firstName={member.first_name}
                lastName={member.last_name}
                photoUrl={member.photo_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-foreground">
                  {member.first_name} {member.last_name}
                </p>
              </div>
              <StatusBadge status={member.status as MemberStatus} />
              <button
                type="button"
                disabled={isPending}
                onClick={() => confirmRemove(member)}
                aria-label={`Remove ${member.first_name} ${member.last_name} from group`}
                className="min-h-tap min-w-tap flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isAdding ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <MemberPicker
            members={pickable}
            value={pickerValue}
            onChange={(id) => {
              setPickerValue(id);
              if (id) handleAdd(id);
            }}
            name="newMemberId"
            emptyHint="Search the roster to add someone to this group."
          />
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="text-sm font-medium text-muted-foreground underline underline-offset-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <Button type="button" variant="secondary" className="w-full" onClick={() => setIsAdding(true)}>
          <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add member
        </Button>
      )}

      <ConfirmDialog
        ref={confirmRef}
        title="Remove member?"
        description={
          removeTarget
            ? `${removeTarget.first_name} ${removeTarget.last_name} will no longer be part of this group. This does not delete their profile.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
      />
    </div>
  );
}
