import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Completes the PKCE flow for magic-link sign-in/sign-up. Supabase redirects
 * here with a `code` query param after the user clicks the emailed link.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "That sign-in link is invalid or has expired."
    )}`
  );
}
