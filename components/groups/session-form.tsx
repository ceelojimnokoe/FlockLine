"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  SESSION_RECURRENCES,
  SESSION_RECURRENCE_LABELS,
} from "@/lib/validation/groups";
import { createSession, type SessionFormState } from "@/app/dashboard/groups/session-actions";

function defaultScheduledAt() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(18, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SessionForm({
  teamId,
  defaultType,
  groupWhatsappLink,
}: {
  teamId: string;
  defaultType?: string;
  groupWhatsappLink?: string | null;
}) {
  const [state, formAction] = useActionState<SessionFormState, FormData>(createSession, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="teamId" value={teamId} />

      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="title">Topic / title</Label>
        <Input id="title" name="title" placeholder="e.g. Praying for the harvest season" required />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor="type">Session type</Label>
        <Select id="type" name="type" defaultValue={defaultType ?? "prayer_meeting"}>
          {SESSION_TYPES.map((type) => (
            <option key={type} value={type}>
              {SESSION_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="scheduledAt">Date & time</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={defaultScheduledAt()}
          required
        />
        {state?.fieldErrors?.scheduledAt && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.scheduledAt}</p>
        )}
      </div>

      <div>
        <Label htmlFor="recurrence">Recurrence</Label>
        <Select id="recurrence" name="recurrence" defaultValue="none">
          {SESSION_RECURRENCES.map((r) => (
            <option key={r} value={r}>
              {SESSION_RECURRENCE_LABELS[r]}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-sm text-muted-foreground">
          This just labels the session — a new session is still created each time, nothing is scheduled automatically.
        </p>
      </div>

      <div>
        <Label htmlFor="whatsappLink">WhatsApp link (optional override)</Label>
        <Input
          id="whatsappLink"
          name="whatsappLink"
          type="url"
          placeholder={groupWhatsappLink || "https://chat.whatsapp.com/…"}
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Leave blank to use the group&apos;s own WhatsApp link.
        </p>
      </div>

      <div>
        <Label htmlFor="discussionQuestions">Discussion questions</Label>
        <Textarea id="discussionQuestions" name="discussionQuestions" rows={3} placeholder="One per line" />
      </div>

      <div>
        <Label htmlFor="prayerPoints">Prayer points</Label>
        <Textarea id="prayerPoints" name="prayerPoints" rows={3} placeholder="One per line" />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Schedule session"}
    </Button>
  );
}
