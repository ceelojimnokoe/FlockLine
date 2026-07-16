"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import type { FollowUpType } from "@/lib/validation/follow-up";

export async function createTemplate(followUpType: FollowUpType, name: string, body: string) {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) throw new Error("Not signed in to a church.");
  if (!name.trim() || !body.trim()) throw new Error("Name and message are required.");

  const supabase = await createClient();
  const { error } = await supabase.from("message_templates").insert({
    church_id: churchUser.church_id,
    follow_up_type: followUpType,
    name: name.trim(),
    body: body.trim(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/followups/templates");
  revalidatePath("/dashboard/followups");
}

export async function updateTemplate(id: string, name: string, body: string) {
  if (!name.trim() || !body.trim()) throw new Error("Name and message are required.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("message_templates")
    .update({ name: name.trim(), body: body.trim() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/followups/templates");
  revalidatePath("/dashboard/followups");
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/followups/templates");
  revalidatePath("/dashboard/followups");
}

/**
 * Only one template per (church, follow_up_type) can be the default (see
 * the partial unique index in the message_templates migration) — so this
 * clears the current default for the type before setting the new one.
 * Two statements, not one transaction, but both are scoped by RLS to this
 * church and the race window is negligible for an admin settings screen.
 */
export async function setDefaultTemplate(id: string, followUpType: FollowUpType) {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) throw new Error("Not signed in to a church.");

  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("message_templates")
    .update({ is_default: false })
    .eq("church_id", churchUser.church_id)
    .eq("follow_up_type", followUpType);

  if (clearError) throw new Error(clearError.message);

  const { error } = await supabase
    .from("message_templates")
    .update({ is_default: true })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/followups/templates");
  revalidatePath("/dashboard/followups");
}
