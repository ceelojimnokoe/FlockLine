"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getMembers, type MembersFilters } from "@/lib/data/members";
import { validateMemberInput, type MemberFieldErrors } from "@/lib/validation/member";

export type MemberFormState = {
  error?: string;
  fieldErrors?: MemberFieldErrors;
} | null;

function readMemberFormData(formData: FormData) {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    status: String(formData.get("status") ?? "first_timer"),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    tagIds: formData.getAll("tagIds").map(String),
  };
}

export async function createMember(
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const input = readMemberFormData(formData);
  const { fieldErrors, normalizedPhone } = validateMemberInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("members")
    .insert({
      church_id: churchUser.church_id,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: normalizedPhone || null,
      gender: (input.gender || null) as "male" | "female" | null,
      status: input.status as "first_timer" | "new_convert" | "member" | "inactive",
      date_of_birth: input.dateOfBirth || null,
      address: input.address.trim() || null,
      notes: input.notes.trim() || null,
    })
    .select("id")
    .single();

  if (error || !member) {
    return { error: error?.message ?? "Could not save this member. Try again." };
  }

  await supabase.from("member_status_events").insert({
    church_id: churchUser.church_id,
    member_id: member.id,
    old_status: null,
    new_status: input.status as "first_timer" | "new_convert" | "member" | "inactive",
    changed_by: churchUser.id,
  });

  if (input.tagIds.length > 0) {
    await supabase
      .from("member_tags")
      .insert(input.tagIds.map((tagId) => ({ member_id: member.id, tag_id: tagId })));
  }

  revalidatePath("/dashboard/members");
  redirect(`/dashboard/members/${member.id}`);
}

export async function updateMember(
  id: string,
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const input = readMemberFormData(formData);
  const { fieldErrors, normalizedPhone } = validateMemberInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("members")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return { error: "This member could not be found." };
  }

  const { error } = await supabase
    .from("members")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: normalizedPhone || null,
      gender: (input.gender || null) as "male" | "female" | null,
      status: input.status as "first_timer" | "new_convert" | "member" | "inactive",
      date_of_birth: input.dateOfBirth || null,
      address: input.address.trim() || null,
      notes: input.notes.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (existing.status !== input.status) {
    await supabase.from("member_status_events").insert({
      church_id: churchUser.church_id,
      member_id: id,
      old_status: existing.status,
      new_status: input.status as "first_timer" | "new_convert" | "member" | "inactive",
      changed_by: churchUser.id,
    });
  }

  const { data: currentTags } = await supabase
    .from("member_tags")
    .select("tag_id")
    .eq("member_id", id);

  const currentTagIds = new Set((currentTags ?? []).map((t) => t.tag_id));
  const nextTagIds = new Set(input.tagIds);

  const toRemove = [...currentTagIds].filter((tagId) => !nextTagIds.has(tagId));
  const toAdd = [...nextTagIds].filter((tagId) => !currentTagIds.has(tagId));

  if (toRemove.length > 0) {
    await supabase.from("member_tags").delete().eq("member_id", id).in("tag_id", toRemove);
  }
  if (toAdd.length > 0) {
    await supabase
      .from("member_tags")
      .insert(toAdd.map((tagId) => ({ member_id: id, tag_id: tagId })));
  }

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${id}`);
  redirect(`/dashboard/members/${id}`);
}

export async function archiveMember(id: string): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("members")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.status === "inactive") return;

  const { error } = await supabase
    .from("members")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.from("member_status_events").insert({
    church_id: churchUser.church_id,
    member_id: id,
    old_status: existing.status,
    new_status: "inactive",
    changed_by: churchUser.id,
  });

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${id}`);
}

export async function createTag(name: string): Promise<{ id: string; name: string; color: string | null }> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ church_id: churchUser.church_id, name: trimmed, color: "#1f4f97" })
    .select("id, name, color")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`A tag named "${trimmed}" already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/members");
  return data;
}

export async function loadMoreMembers(filters: MembersFilters, offset: number) {
  return getMembers(filters, offset);
}
