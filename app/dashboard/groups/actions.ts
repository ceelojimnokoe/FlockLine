"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import { GROUP_TYPES, type GroupType } from "@/lib/validation/groups";

export type GroupFormState = {
  error?: string;
  fieldErrors?: { name?: string };
} | null;

function readGroupFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    groupType: (String(formData.get("groupType") ?? "") || null) as GroupType | null,
    leaderId: String(formData.get("leaderId") ?? "") || null,
    whatsappLink: String(formData.get("whatsappLink") ?? "").trim(),
    meetingLocation: String(formData.get("meetingLocation") ?? "").trim(),
  };
}

export async function createGroup(
  _prevState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const fields = readGroupFields(formData);
  if (!fields.name) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { name: "Group name is required." } };
  }
  if (fields.groupType && !GROUP_TYPES.includes(fields.groupType)) {
    return { error: "Choose a valid group type." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_teams")
    .insert({
      church_id: churchUser.church_id,
      name: fields.name,
      description: fields.description || null,
      group_type: fields.groupType,
      leader_id: fields.leaderId,
      whatsapp_link: fields.whatsappLink || null,
      meeting_location: fields.meetingLocation || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/groups");
  redirect(`/dashboard/groups/${data.id}`);
}

export async function updateGroup(
  _prevState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing group." };

  const fields = readGroupFields(formData);
  if (!fields.name) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { name: "Group name is required." } };
  }
  if (fields.groupType && !GROUP_TYPES.includes(fields.groupType)) {
    return { error: "Choose a valid group type." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_teams")
    .update({
      name: fields.name,
      description: fields.description || null,
      group_type: fields.groupType,
      leader_id: fields.leaderId,
      whatsapp_link: fields.whatsappLink || null,
      meeting_location: fields.meetingLocation || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/groups");
  revalidatePath(`/dashboard/groups/${id}`);
  redirect(`/dashboard/groups/${id}`);
}

export async function setGroupActive(id: string, isActive: boolean): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_teams").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/groups");
  revalidatePath(`/dashboard/groups/${id}`);
}

export async function addGroupMember(teamId: string, memberId: string): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({ team_id: teamId, member_id: memberId });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/groups/${teamId}`);
}

export async function removeGroupMember(teamId: string, memberId: string): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("member_id", memberId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/groups/${teamId}`);
}
