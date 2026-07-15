import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { APP_NAME } from "@/lib/constants";
import { signUpWithPassword, signUpWithMagicLink } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    magicLinkSent?: string;
    checkEmail?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Set up {APP_NAME}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Create an account to start managing your congregation.
          </p>
        </div>

        {params.error && <Alert variant="error">{params.error}</Alert>}
        {params.checkEmail && (
          <Alert variant="success">
            Almost there — check your email to confirm your account.
          </Alert>
        )}
        {params.magicLinkSent && (
          <Alert variant="success">
            Check your email for a magic sign-in link.
          </Alert>
        )}

        <form action={signUpWithPassword} className="space-y-4">
          <div>
            <Label htmlFor="churchName">Church name</Label>
            <Input
              id="churchName"
              name="churchName"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Bethel Assembly"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={signUpWithMagicLink} className="space-y-4">
          <div>
            <Label htmlFor="magic-churchName">Church name</Label>
            <Input
              id="magic-churchName"
              name="churchName"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Bethel Assembly"
              required
            />
          </div>
          <div>
            <Label htmlFor="magic-email">Email for magic link</Label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            Sign up with a magic link
          </Button>
        </form>

        <p className="mt-8 text-center text-base text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
