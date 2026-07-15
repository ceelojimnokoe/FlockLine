import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { createChurch } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const { data: churchUser } = await supabase
    .from("church_users")
    .select("id")
    .maybeSingle();

  // Already onboarded (one church per user for MVP) — nothing to do here.
  if (churchUser) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Set up your church
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            One last step before your dashboard is ready.
          </p>
        </div>

        {params.error && <Alert variant="error">{params.error}</Alert>}

        <form action={createChurch} className="space-y-4">
          <div>
            <Label htmlFor="name">Church name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Bethel Assembly"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+233 24 000 0000"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Accra, Greater Accra"
            />
          </div>
          <Button type="submit" className="w-full">
            Continue to dashboard
          </Button>
        </form>
      </div>
    </main>
  );
}
