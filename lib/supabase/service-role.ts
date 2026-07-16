import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Bypasses Row Level Security entirely — the service_role Postgres role
 * has BYPASSRLS. Only use this where there genuinely is no user session
 * to key RLS off (the Paystack webhook, the public /give page's server
 * actions), and always re-derive/validate the church_id and any other
 * scoping yourself in code, since RLS won't do it for you here.
 *
 * Plain @supabase/supabase-js, not @supabase/ssr — there's no cookie or
 * session concept for a service-role client, so the cookie-forwarding
 * machinery in lib/supabase/server.ts doesn't apply.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
