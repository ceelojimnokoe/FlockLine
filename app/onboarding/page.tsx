import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { createChurch } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const { data: churchUser, error } = await supabase
    .from("church_users")
    .select("id")
    .maybeSingle();

  if (error) throw error;

  // Already onboarded (one church per user for MVP) — nothing to do here.
  if (churchUser) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 font-display text-3xl font-semibold text-white shadow-lg shadow-primary-900/20"
          >
            F
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Set up your church
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            One last step before your dashboard is ready.
          </p>
        </div>

        {params.error && <Alert variant="error">{params.error}</Alert>}

        <form action={createChurch} className="space-y-4">
          <FormField label="Church name" htmlFor="name">
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Bethel Assembly"
              required
            />
          </FormField>
          <FormField label="Phone number" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+233 24 000 0000"
            />
          </FormField>
          <FormField label="Location" htmlFor="location">
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Accra, Greater Accra"
            />
          </FormField>
          <Button type="submit" className="w-full">
            Continue to dashboard
          </Button>
        </form>
      </div>
    </main>
  );
}
