"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import { FOLLOW_UP_TYPES, type FollowUpType } from "@/lib/validation/follow-up";

export type FollowUpFormState = {
  error?: string;
  fieldErrors?: { memberId?: string; type?: string };
} | null;

export async function createFollowUp(
  _prevState: FollowUpFormState,
  formData: FormData
): Promise<FollowUpFormState> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const memberId = String(formData.get("memberId") ?? "");
  const type = String(formData.get("type") ?? "");
  const assignedTo = String(formData.get("assignedTo") ?? "") || null;
  const dueDate = String(formData.get("dueDate") ?? "") || null;

  const fieldErrors: { memberId?: string; type?: string } = {};
  if (!memberId) fieldErrors.memberId = "Pick a member.";
  if (!FOLLOW_UP_TYPES.includes(type as FollowUpType)) fieldErrors.type = "Choose a follow-up type.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("follow_ups").insert({
    church_id: churchUser.church_id,
    member_id: memberId,
    type: type as FollowUpType,
    assigned_to: assignedTo,
    due_date: dueDate,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/followups");
  revalidatePath("/dashboard");
  redirect("/dashboard/followups");
}

/**
 * Called directly from the follow-up card (not a <form> action) — either
 * right after "Send on WhatsApp" (with an optional outcome note) or from
 * the always-visible quick status buttons.
 */
export async function updateFollowUpStatus(
  id: string,
  status: "in_progress" | "done",
  note: string
): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("follow_ups")
    .select("notes")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "This follow-up could not be found.");
  }

  const trimmedNote = note.trim();
  const patch: {
    status: "in_progress" | "done";
    completed_at?: string | null;
    notes?: string;
  } = { status };

  if (status === "done") {
    patch.completed_at = new Date().toISOString();
  } else {
    patch.completed_at = null;
  }

  if (trimmedNote) {
    const stamp = new Date().toLocaleDateString("en-GH", { day: "numeric", month: "short" });
    patch.notes = existing.notes ? `${existing.notes}\n\n${stamp}: ${trimmedNote}` : trimmedNote;
  }

  const { error } = await supabase.from("follow_ups").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/followups");
  revalidatePath("/dashboard");
}

/** Reopen a Done follow-up — mistakes happen, and there's no undo otherwise. */
export async function reopenFollowUp(id: string): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase
    .from("follow_ups")
    .update({ status: "pending", completed_at: null })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/followups");
  revalidatePath("/dashboard");
}
