"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createFund, updateFund, type FundFormState } from "@/app/dashboard/giving/funds/actions";
import type { GivingFund } from "@/lib/data/giving";

export function FundForm({ fund }: { fund?: GivingFund }) {
  const action = fund ? updateFund : createFund;
  const [state, formAction] = useActionState<FundFormState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-5">
      {fund && <input type="hidden" name="id" value={fund.id} />}

      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Fund name</Label>
        <Input id="name" name="name" defaultValue={fund?.name} placeholder="e.g. Building Fund" required />
        {state?.fieldErrors?.name && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="targetAmount">Target amount (optional)</Label>
        <Input
          id="targetAmount"
          name="targetAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={fund?.target_amount ?? ""}
          placeholder="e.g. 50000"
        />
      </div>

      <label className="flex min-h-tap cursor-pointer items-center gap-2 text-base text-foreground">
        <input
          type="checkbox"
          name="isPublic"
          defaultChecked={fund?.is_public ?? true}
          className="h-5 w-5 rounded border-input"
        />
        Show on the public giving page
      </label>

      <SubmitButton isEditing={!!fund} />
    </form>
  );
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : isEditing ? "Save changes" : "Create fund"}
    </Button>
  );
}
