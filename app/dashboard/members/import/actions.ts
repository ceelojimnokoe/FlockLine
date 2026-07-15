"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getExistingPhones } from "@/lib/data/members";

export type ImportRow = {
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: "male" | "female" | null;
  status: "first_timer" | "new_convert" | "member" | "inactive";
  dateOfBirth: string | null;
  address: string | null;
  notes: string | null;
};

export type ImportResult = {
  imported: number;
  skippedDuplicates: number;
  errors: { row: number; reason: string }[];
};

/**
 * Rows are already mapped + client-validated by the time they get here
 * (see components/members/import-flow.tsx) — this is still the
 * authoritative check for duplicates against what's actually in the
 * database, which the client can't know in advance.
 *
 * Inserted one row at a time (not bulk) so each row can fail
 * independently without losing the rest of the batch, and so the
 * per-member status-history event lands alongside its member. Fine at
 * this app's scale (a few hundred rows at most per import).
 */
export async function importMembers(rows: ImportRow[]): Promise<ImportResult> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) {
    return {
      imported: 0,
      skippedDuplicates: 0,
      errors: [{ row: 0, reason: "You're not signed in to a church." }],
    };
  }

  const supabase = await createClient();
  const existingPhones = await getExistingPhones();
  const seenInBatch = new Set<string>();

  let imported = 0;
  let skippedDuplicates = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +1 for the header row, +1 for 1-indexing

    if (row.phone && (existingPhones.has(row.phone) || seenInBatch.has(row.phone))) {
      skippedDuplicates++;
      continue;
    }

    const { data: member, error } = await supabase
      .from("members")
      .insert({
        church_id: churchUser.church_id,
        first_name: row.firstName,
        last_name: row.lastName,
        phone: row.phone,
        gender: row.gender,
        status: row.status,
        date_of_birth: row.dateOfBirth,
        address: row.address,
        notes: row.notes,
      })
      .select("id")
      .single();

    if (error || !member) {
      errors.push({ row: rowNumber, reason: error?.message ?? "Could not save this row." });
      continue;
    }

    await supabase.from("member_status_events").insert({
      church_id: churchUser.church_id,
      member_id: member.id,
      old_status: null,
      new_status: row.status,
      changed_by: churchUser.id,
    });

    if (row.phone) seenInBatch.add(row.phone);
    imported++;
  }

  revalidatePath("/dashboard/members");
  return { imported, skippedDuplicates, errors };
}
