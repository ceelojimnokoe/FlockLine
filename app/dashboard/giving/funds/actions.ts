"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";

export type FundFormState = { error?: string; fieldErrors?: { name?: string } } | null;

async function requireAdmin() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");
  if (churchUser.role !== "admin") {
    throw new Error("Only admins can manage giving funds.");
  }
  return churchUser;
}

function readFundFields(formData: FormData) {
  const targetRaw = String(formData.get("targetAmount") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    targetAmount: targetRaw ? Number(targetRaw) : null,
    isPublic: formData.get("isPublic") === "on",
  };
}

export async function createFund(_prevState: FundFormState, formData: FormData): Promise<FundFormState> {
  const churchUser = await requireAdmin();
  const fields = readFundFields(formData);

  if (!fields.name) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { name: "Fund name is required." } };
  }
  if (fields.targetAmount !== null && (Number.isNaN(fields.targetAmount) || fields.targetAmount < 0)) {
    return { error: "Target amount must be a positive number." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("giving_funds").insert({
    church_id: churchUser.church_id,
    name: fields.name,
    target_amount: fields.targetAmount,
    is_public: fields.isPublic,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/giving/funds");
  revalidatePath("/dashboard/giving");
  redirect("/dashboard/giving/funds");
}

export async function updateFund(_prevState: FundFormState, formData: FormData): Promise<FundFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing fund." };

  const fields = readFundFields(formData);
  if (!fields.name) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { name: "Fund name is required." } };
  }
  if (fields.targetAmount !== null && (Number.isNaN(fields.targetAmount) || fields.targetAmount < 0)) {
    return { error: "Target amount must be a positive number." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("giving_funds")
    .update({ name: fields.name, target_amount: fields.targetAmount, is_public: fields.isPublic })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/giving/funds");
  revalidatePath("/dashboard/giving");
  redirect("/dashboard/giving/funds");
}

/**
 * "Archiving" a fund just flips is_active — giving_records.fund_id is
 * `on delete restrict`, so a fund with any recorded gifts against it can
 * never be hard-deleted anyway. This keeps every historical transaction's
 * fund reference intact while removing it from active use (record-giving
 * pickers, the public /give page).
 */
export async function setFundActive(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("giving_funds").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/giving/funds");
  revalidatePath("/dashboard/giving");
}
