"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Script from "next/script";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AmountPicker } from "./amount-picker";
import { initializeGiving } from "@/app/give/[churchSlug]/actions";
import type { PublicGivingFund } from "@/lib/data/public-giving";

export function GiveForm({
  churchId,
  churchName,
  funds,
}: {
  churchId: string;
  churchName: string;
  funds: PublicGivingFund[];
}) {
  const [state, formAction] = useActionState(initializeGiving, null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("+233");
  const [scriptReady, setScriptReady] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "cancelled">("idle");

  useEffect(() => {
    if (!state?.accessCode || !scriptReady) return;
    if (typeof window.PaystackPop === "undefined") return;

    const popup = new window.PaystackPop();
    popup.resumeTransaction(state.accessCode, {
      onSuccess: () => setPaymentStatus("success"),
      onCancel: () => setPaymentStatus("cancelled"),
    });
  }, [state?.accessCode, scriptReady]);

  if (paymentStatus === "success") {
    return (
      <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Thank you for giving! 🙏</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Your gift to {churchName} is being processed. God bless you.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://js.paystack.co/v2/inline.js" onReady={() => setScriptReady(true)} />

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="churchId" value={churchId} />

        {state?.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        {paymentStatus === "cancelled" && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Payment was cancelled — no charge was made. Feel free to try again.
          </div>
        )}

        <div>
          <Label htmlFor="fundId">Give towards</Label>
          <Select id="fundId" name="fundId" defaultValue={funds[0]?.id ?? ""}>
            {funds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </Select>
        </div>

        <AmountPicker value={amount} onChange={setAmount} />

        <div>
          <Label htmlFor="giverName">Your name (optional)</Label>
          <Input id="giverName" name="giverName" type="text" autoComplete="name" />
        </div>

        <div>
          <Label htmlFor="giverPhone">Your phone (optional)</Label>
          <Input
            id="giverPhone"
            name="giverPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <SubmitButton amount={amount} />
      </form>
    </>
  );
}

function SubmitButton({ amount }: { amount: string }) {
  const { pending } = useFormStatus();
  const label = amount ? `Give GHS ${amount}` : "Give";

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Starting payment…" : label}
    </Button>
  );
}
