"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { updateChurchProfile } from "@/app/dashboard/settings/church/actions";
import type { Tables } from "@/types/database";

type ChurchRow = Pick<
  Tables<"churches">,
  "name" | "phone" | "location" | "giving_message"
>;

export function ChurchProfileForm({ church }: { church: ChurchRow }) {
  const [state, formAction] = useActionState(updateChurchProfile, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <FormField label="Church name" htmlFor="name">
        <Input id="name" name="name" defaultValue={church.name} required />
      </FormField>

      <FormField label="Phone number" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={church.phone ?? ""} />
      </FormField>

      <FormField label="Location" htmlFor="location">
        <Input id="location" name="location" defaultValue={church.location ?? ""} />
      </FormField>

      <FormField
        label="Giving page message"
        htmlFor="givingMessage"
        hint="A short line shown to visitors on your public giving page."
      >
        <Textarea
          id="givingMessage"
          name="givingMessage"
          rows={3}
          maxLength={280}
          defaultValue={church.giving_message ?? ""}
          placeholder="Thank you for sowing into God's work with us."
        />
      </FormField>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}
