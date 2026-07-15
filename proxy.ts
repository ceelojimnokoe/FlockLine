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
     * Run on every route except static assets and Next's internals, so
     * auth logic never blocks CSS/JS/image loading.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
