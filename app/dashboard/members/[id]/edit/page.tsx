import { notFound } from "next/navigation";
import Link from "next/link";
import { MemberForm } from "@/components/members/member-form";
import { getMemberDetail } from "@/lib/data/members";
import { getTags } from "@/lib/data/tags";
import { updateMember } from "../../actions";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [member, tags] = await Promise.all([getMemberDetail(id), getTags()]);

  if (!member) notFound();

  const boundUpdateMember = updateMember.bind(null, id);

  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/members/${id}`}
        className="text-sm font-medium text-muted-foreground"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold text-foreground">Edit member</h1>
      <MemberForm
        action={boundUpdateMember}
        availableTags={tags}
        defaultValues={{
          firstName: member.first_name,
          lastName: member.last_name,
          phone: member.phone ?? "+233",
          gender: member.gender ?? "",
          status: member.status,
          dateOfBirth: member.date_of_birth ?? "",
          address: member.address ?? "",
          notes: member.notes ?? "",
          tagIds: member.member_tags.map((mt) => mt.tag.id),
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
