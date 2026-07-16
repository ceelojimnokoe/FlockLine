"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MemberPicker } from "@/components/shared/member-picker";
import { GROUP_TYPES, GROUP_TYPE_LABELS } from "@/lib/validation/groups";
import { createGroup, updateGroup, type GroupFormState } from "@/app/dashboard/groups/actions";
import type { MemberPickerOption } from "@/lib/data/members";
import type { GroupDetail } from "@/lib/data/groups";

export function GroupForm({
  members,
  group,
}: {
  members: MemberPickerOption[];
  /** Present when editing an existing group; omitted when creating a new one. */
  group?: GroupDetail;
}) {
  const action = group ? updateGroup : createGroup;
  const [state, formAction] = useActionState<GroupFormState, FormData>(action, null);
  const [leaderId, setLeaderId] = useState(group?.leader_id ?? "");

  return (
    <form action={formAction} className="space-y-5">
      {group && <input type="hidden" name="id" value={group.id} />}

      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Group name</Label>
        <Input id="name" name="name" defaultValue={group?.name} placeholder="e.g. Tuesday Prayer Band" required />
        {state?.fieldErrors?.name && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="groupType">Group type</Label>
        <Select id="groupType" name="groupType" defaultValue={group?.group_type ?? ""}>
          <option value="">Not set</option>
          {GROUP_TYPES.map((type) => (
            <option key={type} value={type}>
              {GROUP_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={group?.description ?? ""}
          placeholder="What this group is about"
        />
      </div>

      <div>
        <Label>Leader</Label>
        <MemberPicker
          members={members}
          value={leaderId}
          onChange={setLeaderId}
          name="leaderId"
          emptyHint="Optional — leave unset if no leader is assigned yet."
        />
      </div>

      <div>
        <Label htmlFor="meetingLocation">Meeting location</Label>
        <Input
          id="meetingLocation"
          name="meetingLocation"
          defaultValue={group?.meeting_location ?? ""}
          placeholder="e.g. Fellowship hall, or a member's home"
        />
      </div>

      <div>
        <Label htmlFor="whatsappLink">WhatsApp group link</Label>
        <Input
          id="whatsappLink"
          name="whatsappLink"
          type="url"
          defaultValue={group?.whatsapp_link ?? ""}
          placeholder="https://chat.whatsapp.com/…"
        />
      </div>

      <SubmitButton isEditing={!!group} />
    </form>
  );
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : isEditing ? "Save changes" : "Create group"}
    </Button>
  );
}
