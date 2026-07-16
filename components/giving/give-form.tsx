"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Script from "next/script";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AmountPicker } from "./amount-picker";
import { FundGrid } from "./fund-grid";
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
  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("+233");
  const [isAnonymous, setIsAnonymous] = useState(false);
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
        <h2 className="font-display text-xl font-semibold text-foreground">
          Thank you for giving! 🙏
        </h2>
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
          <Label>Choose a fund</Label>
          <FundGrid funds={funds} value={fundId} onChange={setFundId} name="fundId" />
        </div>

        <AmountPicker value={amount} onChange={setAmount} />

        <div>
          <Label htmlFor="giverName">Your name (optional)</Label>
          <Input
            id="giverName"
            name="giverName"
            type="text"
            autoComplete="name"
            disabled={isAnonymous}
          />
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

        <div>
          <Label htmlFor="giverEmail">Your email (optional)</Label>
          <Input id="giverEmail" name="giverEmail" type="email" autoComplete="email" />
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll only use this for Paystack&apos;s payment receipt.
          </p>
        </div>

        <label className="flex min-h-tap cursor-pointer items-center gap-2 text-base text-foreground">
          <input
            type="checkbox"
            name="isAnonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-5 w-5 rounded border-input"
          />
          Give anonymously — don&apos;t link this gift to my name in the church&apos;s records
        </label>

        <SubmitButton amount={amount} />
      </form>
    </>
  );
}

function SubmitButton({ amount }: { amount: string }) {
  const { pending } = useFormStatus();
  const label = amount ? `Give ₵${amount}` : "Give";

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Starting payment…" : label}
    </Button>
  );
}
