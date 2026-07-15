"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createChurch(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!name) {
    redirect(`/onboarding?error=${encodeURIComponent("Church name is required.")}`);
  }

  const supabase = await createClient();

  // onboard_church() is a SECURITY DEFINER Postgres function — it never
  // trusts p_name/p_phone/p_location for the caller's identity or role, it
  // just uses them as the new church's profile fields. See the migration
  // in supabase/migrations/20260715120100_functions.sql for why this can't
  // safely be a plain client-side insert into churches/church_users.
  const { error } = await supabase.rpc("onboard_church", {
    p_name: name,
    p_phone: phone,
    p_location: location,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
