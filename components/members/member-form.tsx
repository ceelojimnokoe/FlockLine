"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagPicker, type TagOption } from "./tag-picker";
import {
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
} from "@/lib/validation/member";
import { normalizeGhanaPhone } from "@/lib/phone";
import type { MemberFormState } from "@/app/dashboard/members/actions";

type MemberFormDefaults = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  status?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  tagIds?: string[];
};

export function MemberForm({
  action,
  availableTags,
  defaultValues,
  submitLabel = "Save member",
}: {
  action: (prevState: MemberFormState, formData: FormData) => Promise<MemberFormState>;
  availableTags: TagOption[];
  defaultValues?: MemberFormDefaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const [phone, setPhone] = useState(defaultValues?.phone || "+233");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    defaultValues?.tagIds ?? []
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultValues?.firstName}
            autoComplete="given-name"
            required
          />
          {state?.fieldErrors?.firstName && <FieldError>{state.fieldErrors.firstName}</FieldError>}
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultValues?.lastName}
            autoComplete="family-name"
            required
          />
          {state?.fieldErrors?.lastName && <FieldError>{state.fieldErrors.lastName}</FieldError>}
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone (WhatsApp number)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setPhone((p) => normalizeGhanaPhone(p))}
        />
        {state?.fieldErrors?.phone && <FieldError>{state.fieldErrors.phone}</FieldError>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" name="gender" defaultValue={defaultValues?.gender ?? ""}>
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={defaultValues?.status ?? "first_timer"}>
            {MEMBER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {MEMBER_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <TagPicker
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
        />
      </div>

      <details className="rounded-xl border border-border">
        <summary className="min-h-tap cursor-pointer select-none px-4 py-3 text-base font-medium text-foreground">
          More details (optional)
        </summary>
        <div className="space-y-4 border-t border-border px-4 py-4">
          <div>
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={defaultValues?.dateOfBirth}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={defaultValues?.address} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes} rows={4} />
          </div>
        </div>
      </details>

      <SubmitButton label={submitLabel} />
    </form>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-destructive">{children}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : label}
    </Button>
  );
}
