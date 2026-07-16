"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MemberPicker } from "@/components/shared/member-picker";
import { FOLLOW_UP_TYPES, FOLLOW_UP_TYPE_LABELS } from "@/lib/validation/follow-up";
import { createFollowUp } from "@/app/dashboard/followups/actions";
import type { MemberPickerOption } from "@/lib/data/members";
import type { Teammate } from "@/lib/data/teammates";

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

export function FollowUpForm({
  members,
  teammates,
  defaultMemberId,
  defaultType,
}: {
  members: MemberPickerOption[];
  teammates: Teammate[];
  defaultMemberId?: string;
  defaultType?: string;
}) {
  const [state, formAction] = useActionState(createFollowUp, null);
  const [memberId, setMemberId] = useState(defaultMemberId ?? "");

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <Label>Member</Label>
        <MemberPicker members={members} value={memberId} onChange={setMemberId} name="memberId" />
        {state?.fieldErrors?.memberId && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.memberId}</p>
        )}
      </div>

      <div>
        <Label htmlFor="type">Follow-up type</Label>
        <Select id="type" name="type" defaultValue={defaultType ?? "visitor_welcome"}>
          {FOLLOW_UP_TYPES.map((type) => (
            <option key={type} value={type}>
              {FOLLOW_UP_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        {state?.fieldErrors?.type && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.type}</p>
        )}
      </div>

      <div>
        <Label htmlFor="assignedTo">Assign to</Label>
        <Select id="assignedTo" name="assignedTo" defaultValue="">
          <option value="">Unassigned</option>
          {teammates.map((teammate) => (
            <option key={teammate.id} value={teammate.id}>
              {teammate.email}
              {teammate.role === "admin" ? " (Admin)" : teammate.role === "pastor" ? " (Pastor)" : ""}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" name="dueDate" type="date" defaultValue={defaultDueDate()} />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Create follow-up"}
    </Button>
  );
}
