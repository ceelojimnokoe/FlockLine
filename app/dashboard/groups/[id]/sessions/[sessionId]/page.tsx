import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { WhatsAppInvitePreview } from "@/components/groups/whatsapp-invite-preview";
import { AttendanceList } from "@/components/groups/attendance-list";
import { SessionResources } from "@/components/groups/session-resources";
import { SessionStatusControl } from "@/components/groups/session-status-control";
import { PrayerRequestSection } from "@/components/groups/prayer-request-section";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getSessionDetail, getAttendanceForSession } from "@/lib/data/sessions";
import { getPrayerRequestsForSession } from "@/lib/data/prayer-requests";
import { getAllMembersForPicker } from "@/lib/data/members";
import { getTeammates } from "@/lib/data/teammates";
import { formatDateTime } from "@/lib/format";
import {
  SESSION_TYPE_LABELS,
  SESSION_STATUS_STYLES,
  SESSION_RECURRENCE_LABELS,
  type SessionType,
  type SessionStatus,
  type SessionRecurrence,
} from "@/lib/validation/groups";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const session = await getSessionDetail(sessionId);
  if (!session || session.team_id !== id) notFound();

  const [attendance, prayerRequests, members, teammates] = await Promise.all([
    getAttendanceForSession(sessionId),
    getPrayerRequestsForSession(sessionId),
    getAllMembersForPicker(),
    getTeammates(),
  ]);

  const status = session.status as SessionStatus;

  return (
    <div className="space-y-6 pb-16">
      <Link href={`/dashboard/groups/${id}`} className="text-sm font-medium text-muted-foreground">
        ← {session.group.name}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-foreground">{session.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {SESSION_TYPE_LABELS[session.type as SessionType]} ·{" "}
              {SESSION_RECURRENCE_LABELS[session.recurrence as SessionRecurrence]}
            </p>
          </div>
          <Badge className={SESSION_STATUS_STYLES[status].badgeClassName}>
            {SESSION_STATUS_STYLES[status].label}
          </Badge>
        </div>

        <p className="mt-3 text-base text-foreground">{formatDateTime(session.scheduled_at)}</p>
        {session.group.meeting_location && (
          <p className="text-sm text-muted-foreground">{session.group.meeting_location}</p>
        )}

        <div className="mt-4">
          <SessionStatusControl sessionId={session.id} teamId={id} status={status} />
        </div>
      </div>

      {(session.discussion_questions || session.prayer_points) && (
        <div className="space-y-4">
          {session.discussion_questions && (
            <div>
              <SectionLabel>Discussion questions</SectionLabel>
              <p className="mt-1 whitespace-pre-wrap text-base text-foreground">
                {session.discussion_questions}
              </p>
            </div>
          )}
          {session.prayer_points && (
            <div>
              <SectionLabel>Prayer points</SectionLabel>
              <p className="mt-1 whitespace-pre-wrap text-base text-foreground">{session.prayer_points}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <SectionLabel className="mb-2 block">Resources</SectionLabel>
        <SessionResources sessionId={session.id} teamId={id} resources={session.resources} />
      </div>

      <div>
        <SectionLabel className="mb-2 block">Invite members</SectionLabel>
        <WhatsAppInvitePreview session={session} attendance={attendance} />
      </div>

      <div>
        <SectionLabel className="mb-2 block">Attendance</SectionLabel>
        <AttendanceList sessionId={session.id} attendance={attendance} />
      </div>

      <div>
        <SectionLabel className="mb-2 block">Prayer requests</SectionLabel>
        <PrayerRequestSection
          teamId={id}
          sessionId={session.id}
          requests={prayerRequests}
          members={members}
          teammates={teammates}
        />
      </div>
    </div>
  );
}
