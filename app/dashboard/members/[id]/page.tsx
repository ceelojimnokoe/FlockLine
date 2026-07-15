import { notFound } from "next/navigation";
import Link from "next/link";
import { MemberAvatar } from "@/components/members/avatar";
import { StatusBadge } from "@/components/members/status-badge";
import { TagChip } from "@/components/members/tag-chip";
import { WhatsAppButton } from "@/components/members/whatsapp-button";
import { StatusTimeline } from "@/components/members/status-timeline";
import { FollowUpHistory } from "@/components/members/follow-up-history";
import { GivingHistory } from "@/components/members/giving-history";
import { ArchiveMemberButton } from "@/components/members/archive-member-button";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import {
  getMemberDetail,
  getMemberStatusEvents,
  getMemberFollowUps,
  getMemberGivingRecords,
  type GivingRecordWithFund,
} from "@/lib/data/members";
import { getCurrentChurchUser, canViewGiving } from "@/lib/data/church";
import { formatDate } from "@/lib/format";
import type { MemberStatus } from "@/lib/validation/member";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [member, churchUser] = await Promise.all([getMemberDetail(id), getCurrentChurchUser()]);

  if (!member) notFound();

  const showGiving = churchUser ? canViewGiving(churchUser.role) : false;

  const [statusEvents, followUps, givingRecords] = await Promise.all([
    getMemberStatusEvents(id),
    getMemberFollowUps(id),
    showGiving ? getMemberGivingRecords(id) : Promise.resolve([] as GivingRecordWithFund[]),
  ]);

  const fullName = `${member.first_name} ${member.last_name}`;

  return (
    <div className="space-y-5">
      <Link href="/dashboard/members" className="text-sm font-medium text-muted-foreground">
        ← Members
      </Link>

      <div className="flex items-start gap-4">
        <MemberAvatar
          firstName={member.first_name}
          lastName={member.last_name}
          photoUrl={member.photo_url}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold text-foreground">{fullName}</h1>
          <StatusBadge status={member.status as MemberStatus} className="mt-1" />
        </div>
      </div>

      <WhatsAppButton phone={member.phone} variant="button" className="w-full" />

      <div className="flex gap-2">
        <LinkButton href={`/dashboard/members/${id}/edit`} variant="secondary" className="flex-1">
          Edit
        </LinkButton>
        <ArchiveMemberButton memberId={id} memberName={fullName} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Contact info</h2>
        <dl className="mt-3 space-y-2 text-base">
          <Row label="Phone" value={member.phone ?? "—"} />
          <Row label="Gender" value={member.gender ? capitalize(member.gender) : "—"} />
          <Row
            label="Date of birth"
            value={member.date_of_birth ? formatDate(member.date_of_birth) : "—"}
          />
          <Row label="Address" value={member.address ?? "—"} />
          <Row label="Joined" value={formatDate(member.joined_at)} />
        </dl>
      </Card>

      {member.member_tags.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Tags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {member.member_tags.map(({ tag }) => (
              <TagChip key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        </Card>
      )}

      {member.notes && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">
            {member.notes}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Status timeline</h2>
        <div className="mt-3">
          <StatusTimeline events={statusEvents} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Follow-up history</h2>
        <div className="mt-3">
          <FollowUpHistory followUps={followUps} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Giving history</h2>
        <div className="mt-3">
          <GivingHistory records={givingRecords} canView={showGiving} />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
