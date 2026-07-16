"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";

export type ChurchProfileState = { error?: string } | null;

async function requireAdmin() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");
  if (churchUser.role !== "admin") {
    throw new Error("Only admins can edit the church profile.");
  }
  return churchUser;
}

export async function updateChurchProfile(
  _prevState: ChurchProfileState,
  formData: FormData
): Promise<ChurchProfileState> {
  const churchUser = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const givingMessage = String(formData.get("givingMessage") ?? "").trim();

  if (!name) {
    return { error: "Church name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("churches")
    .update({
      name,
      phone: phone || null,
      location: location || null,
      giving_message: givingMessage || null,
    })
    .eq("id", churchUser.church_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings/church");
  revalidatePath("/dashboard");
  return null;
}

/**
 * Called after the browser has already uploaded the file straight to
 * Supabase Storage (see components/settings/church-logo-upload.tsx) — this
 * just persists the resulting public URL onto the church row.
 */
export async function updateChurchLogoUrl(url: string): Promise<void> {
  const churchUser = await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("churches")
    .update({ logo_url: url })
    .eq("id", churchUser.church_id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings/church");
  revalidatePath("/dashboard");
}

export async function removeChurchLogo(): Promise<void> {
  const churchUser = await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("churches")
    .update({ logo_url: null })
    .eq("id", churchUser.church_id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings/church");
  revalidatePath("/dashboard");
}
