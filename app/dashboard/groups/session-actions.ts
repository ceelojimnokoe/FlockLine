"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentChurchUser } from "@/lib/data/church";
import { notifyRecipient } from "@/lib/data/notifications";
import {
  SESSION_TYPES,
  SESSION_RECURRENCES,
  ATTENDANCE_STATUSES,
  PRAYER_PRIVACY_LEVELS,
  type SessionType,
  type SessionRecurrence,
  type AttendanceStatus,
  type PrayerPrivacyLevel,
} from "@/lib/validation/groups";

export type SessionFormState = {
  error?: string;
  fieldErrors?: { title?: string; scheduledAt?: string };
} | null;

export async function createSession(
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const teamId = String(formData.get("teamId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "") as SessionType;
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const recurrence = String(formData.get("recurrence") ?? "none") as SessionRecurrence;
  const whatsappLink = String(formData.get("whatsappLink") ?? "").trim();
  const discussionQuestions = String(formData.get("discussionQuestions") ?? "").trim();
  const prayerPoints = String(formData.get("prayerPoints") ?? "").trim();

  const fieldErrors: { title?: string; scheduledAt?: string } = {};
  if (!title) fieldErrors.title = "Give this session a topic or title.";
  const scheduledDate = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
    fieldErrors.scheduledAt = "Pick a valid date and time.";
  }
  if (!SESSION_TYPES.includes(type)) {
    return { error: "Choose a valid session type." };
  }
  if (!SESSION_RECURRENCES.includes(recurrence)) {
    return { error: "Choose a valid recurrence." };
  }
  if (!teamId) {
    return { error: "Missing group." };
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      church_id: churchUser.church_id,
      team_id: teamId,
      title,
      type,
      scheduled_at: scheduledDate!.toISOString(),
      recurrence,
      whatsapp_link: whatsappLink || null,
      discussion_questions: discussionQuestions || null,
      prayer_points: prayerPoints || null,
      created_by: churchUser.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Invite every current group member by default — attendance starts as
  // "invited" for the whole group, and the leader narrows it down after the
  // meeting rather than starting from an empty list. Best-effort: the
  // session itself is already created and committed above, so a failure
  // here shouldn't fail the whole action — but it's logged so a silently
  // empty attendance list is diagnosable instead of a mystery.
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("member_id")
    .eq("team_id", teamId);

  if (membersError) {
    console.error("[createSession] Failed to load group members for auto-invite:", membersError);
  } else if (members.length > 0) {
    const { error: attendanceError } = await supabase.from("session_attendance").insert(
      members.map((m) => ({ session_id: session.id, member_id: m.member_id, status: "invited" as const }))
    );
    if (attendanceError) {
      console.error("[createSession] Failed to create attendance invites:", attendanceError);
    }
  }

  revalidatePath(`/dashboard/groups/${teamId}`);
  redirect(`/dashboard/groups/${teamId}/sessions/${session.id}`);
}

export async function updateSessionStatus(
  id: string,
  teamId: string,
  status: "scheduled" | "completed" | "cancelled"
): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/groups/${teamId}/sessions/${id}`);
  revalidatePath(`/dashboard/groups/${teamId}`);
}

/**
 * Resources are "lightweight" per spec — just a title + link, appended to
 * the session's own resources jsonb array rather than a separate table.
 */
export async function addSessionResource(
  sessionId: string,
  teamId: string,
  title: string,
  url: string
): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const trimmedTitle = title.trim();
  const trimmedUrl = url.trim();
  if (!trimmedTitle || !trimmedUrl) throw new Error("A resource needs both a title and a link.");

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("sessions")
    .select("resources")
    .eq("id", sessionId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const nextResources = [...(existing.resources ?? []), { title: trimmedTitle, url: trimmedUrl }];

  const { error } = await supabase.from("sessions").update({ resources: nextResources }).eq("id", sessionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/groups/${teamId}/sessions/${sessionId}`);
}

export async function recordAttendance(
  sessionId: string,
  memberId: string,
  status: AttendanceStatus
): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");
  if (!ATTENDANCE_STATUSES.includes(status)) throw new Error("Invalid attendance status.");

  const supabase = await createClient();
  const { error } = await supabase.from("session_attendance").upsert(
    {
      session_id: sessionId,
      member_id: memberId,
      status,
      recorded_by: churchUser.id,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "session_id,member_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/groups`);
}

export type PrayerRequestFormState = {
  error?: string;
  fieldErrors?: { memberId?: string; request?: string };
} | null;

export async function createPrayerRequest(
  _prevState: PrayerRequestFormState,
  formData: FormData
): Promise<PrayerRequestFormState> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const memberId = String(formData.get("memberId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "") || null;
  const teamId = String(formData.get("teamId") ?? "");
  const request = String(formData.get("request") ?? "").trim();
  const privacyLevel = String(formData.get("privacyLevel") ?? "leadership_only") as PrayerPrivacyLevel;
  const assignedLeaderId = String(formData.get("assignedLeaderId") ?? "") || null;

  const fieldErrors: { memberId?: string; request?: string } = {};
  if (!memberId) fieldErrors.memberId = "Pick who this prayer request is for.";
  if (!request) fieldErrors.request = "Describe the prayer request.";
  if (!PRAYER_PRIVACY_LEVELS.includes(privacyLevel)) {
    return { error: "Choose a valid privacy level." };
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("prayer_requests").insert({
    church_id: churchUser.church_id,
    member_id: memberId,
    session_id: sessionId,
    request,
    privacy_level: privacyLevel,
    assigned_leader_id: privacyLevel === "assigned_leader" ? assignedLeaderId : null,
    created_by: churchUser.id,
  });

  if (error) {
    return { error: error.message };
  }

  if (privacyLevel === "assigned_leader" && assignedLeaderId) {
    await notifyRecipient(supabase, assignedLeaderId, churchUser.id, {
      category: "care",
      type: "prayer_request_assigned",
      title: "A prayer request was routed to you",
      link: sessionId ? `/dashboard/groups/${teamId}/sessions/${sessionId}` : null,
    });
  }

  if (sessionId && teamId) {
    revalidatePath(`/dashboard/groups/${teamId}/sessions/${sessionId}`);
  }
  return null;
}

export async function updatePrayerRequestStatus(
  id: string,
  teamId: string,
  sessionId: string,
  status: "open" | "praying" | "answered" | "closed"
): Promise<void> {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase.from("prayer_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/groups/${teamId}/sessions/${sessionId}`);
}
