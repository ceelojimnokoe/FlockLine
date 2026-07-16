import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle, MapPin, Pencil } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/ui/empty-state";
import { GroupTypeBadge } from "@/components/groups/group-type-badge";
import { GroupActiveToggle } from "@/components/groups/group-active-toggle";
import { GroupMembershipManager } from "@/components/groups/group-membership-manager";
import { SessionCard } from "@/components/groups/session-card";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getGroupDetail, getGroupMembers } from "@/lib/data/groups";
import { getSessionsForGroup } from "@/lib/data/sessions";
import { getAllMembersForPicker } from "@/lib/data/members";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const group = await getGroupDetail(id);
  if (!group) notFound();

  const [members, sessions, allMembers] = await Promise.all([
    getGroupMembers(id),
    getSessionsForGroup(id),
    getAllMembersForPicker(),
  ]);

  const upcoming = sessions.filter((s) => s.status === "scheduled");
  const past = sessions.filter((s) => s.status !== "scheduled");

  return (
    <div className="space-y-6 pb-16">
      <Link href="/dashboard/groups" className="text-sm font-medium text-muted-foreground">
        ← Groups
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-foreground">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-base text-muted-foreground">{group.description}</p>
            )}
          </div>
          <GroupTypeBadge type={group.group_type} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {group.leader && (
            <span>
              Led by {group.leader.first_name} {group.leader.last_name}
            </span>
          )}
          {group.meeting_location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {group.meeting_location}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {group.whatsapp_link && (
            <a
              href={group.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-tap inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-medium text-white hover:bg-[#1fb959]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Open WhatsApp group
            </a>
          )}
          <LinkButton href={`/dashboard/groups/${id}/edit`} variant="secondary" className="px-4">
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit
          </LinkButton>
          <GroupActiveToggle groupId={id} isActive={group.is_active} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SectionLabel>Sessions</SectionLabel>
        <LinkButton href={`/dashboard/groups/${id}/sessions/new`} variant="ghost" className="px-3">
          New session
        </LinkButton>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Schedule a meeting for this group — prayer meeting, Bible study, or fellowship."
          action={
            <LinkButton href={`/dashboard/groups/${id}/sessions/new`} variant="secondary">
              Schedule a session
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Upcoming</p>
              <ul className="space-y-2">
                {upcoming.map((session) => (
                  <li key={session.id}>
                    <SessionCard session={session} teamId={id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Past</p>
              <ul className="space-y-2">
                {past.map((session) => (
                  <li key={session.id}>
                    <SessionCard session={session} teamId={id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <SectionLabel>Members</SectionLabel>
        <GroupMembershipManager teamId={id} members={members} allMembers={allMembers} />
      </div>
    </div>
  );
}
