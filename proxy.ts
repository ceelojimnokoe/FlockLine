import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (the
 * exported function is now named `proxy`, not `middleware`). Functionally
 * this is the same request-boundary hook: it runs before every matched
 * route, refreshes the Supabase session cookie, and redirects
 * unauthenticated users to /login.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every route except static assets, Next's internals, and API
     * routes. API routes (e.g. the Paystack webhook) are excluded
     * deliberately: they're called server-to-server with no session
     * cookie, so this session-refresh/redirect-to-login logic doesn't
     * apply — each API route is responsible for its own auth (signature
     * verification, a service-role check, etc.), not this proxy.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv)$).*)",
  ],
};
