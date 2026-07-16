import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PublicChurch = { id: string; name: string; logo_url: string | null };
export type PublicGivingFund = { id: string; name: string };

/**
 * These call the get_public_* RPCs (see the public_giving migration) —
 * the visitor here has no session, so this can safely use the ordinary
 * cookie-based client (it'll just carry no auth, i.e. the `anon` role,
 * which is exactly who these RPCs are granted to).
 */
export async function getPublicChurchBySlug(slug: string): Promise<PublicChurch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_church_by_slug", { p_slug: slug });
  if (error) throw error;
  return data[0] ?? null;
}

export async function getPublicGivingFunds(churchId: string): Promise<PublicGivingFund[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_giving_funds", { p_church_id: churchId });
  if (error) throw error;
  return data;
}
