"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import { isValidGivingAmount, type ManualGivingMethod } from "@/lib/validation/giving";

export type ManualGivingRow = {
  memberId: string | null;
  amount: number;
  method: ManualGivingMethod;
};

export type RecordGivingResult = {
  error?: string;
  recorded?: number;
};

/**
 * Backs both "single entry" and "Sunday bulk entry" — bulk mode is just
 * this same call with more rows and one shared fundId/givenAt. Called
 * directly from the client (not a <form> action) since a variable-length
 * row list doesn't map cleanly onto FormData.
 */
export async function recordGivingRows(
  fundId: string,
  givenAt: string,
  rows: ManualGivingRow[]
): Promise<RecordGivingResult> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  if (rows.length === 0) {
    return { error: "Add at least one row." };
  }

  for (const row of rows) {
    if (!isValidGivingAmount(row.amount)) {
      return { error: `"${row.amount}" isn't a valid amount.` };
    }
  }

  const supabase = await createClient();

  const { data: fund } = await supabase
    .from("giving_funds")
    .select("id")
    .eq("id", fundId)
    .eq("church_id", churchUser.church_id)
    .maybeSingle();

  if (!fund) {
    return { error: "That fund could not be found." };
  }

  const { error } = await supabase.from("giving_records").insert(
    rows.map((row) => ({
      church_id: churchUser.church_id,
      member_id: row.memberId,
      fund_id: fundId,
      amount: row.amount,
      method: row.method,
      recorded_by: churchUser.id,
      given_at: givenAt,
    }))
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/giving");
  return { recorded: rows.length };
}
