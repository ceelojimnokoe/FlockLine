import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold text-foreground">{APP_NAME}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          WhatsApp-first church management, built for congregations of 50 to
          400.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/signup">
            <Button className="w-full">Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
