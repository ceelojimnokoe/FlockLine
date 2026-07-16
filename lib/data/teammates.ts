import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Teammate = { id: string; email: string; role: string };

/** Wraps the get_church_teammates() RPC — see its migration for why this can't just be a table select. */
export async function getTeammates(): Promise<Teammate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_church_teammates");
  if (error) throw error;
  return data;
}
