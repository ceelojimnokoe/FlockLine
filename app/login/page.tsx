import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { APP_NAME } from "@/lib/constants";
import { signInWithPassword, signInWithMagicLink } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; magicLinkSent?: string }>;
}) {
  const params = await searchParams;

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
          <h1 className="font-display text-2xl font-semibold text-foreground">{APP_NAME}</h1>
          <p className="mt-1 text-base text-muted-foreground">Sign in to manage your church.</p>
        </div>

        {params.error && <Alert variant="error">{params.error}</Alert>}
        {params.magicLinkSent && (
          <Alert variant="success">Check your email for a magic sign-in link.</Alert>
        )}

        <form action={signInWithPassword} className="space-y-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </FormField>
          <FormField label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </FormField>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithMagicLink} className="space-y-4">
          <FormField label="Email for magic link" htmlFor="magic-email">
            <Input id="magic-email" name="email" type="email" autoComplete="email" required />
          </FormField>
          <Button type="submit" variant="secondary" className="w-full">
            Email me a magic link
          </Button>
        </form>

        <p className="mt-8 text-center text-base text-muted-foreground">
          New to {APP_NAME}?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
