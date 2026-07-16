import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupForm } from "@/components/groups/group-form";
import { getGroupDetail } from "@/lib/data/groups";
import { getAllMembersForPicker } from "@/lib/data/members";

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [group, members] = await Promise.all([getGroupDetail(id), getAllMembersForPicker()]);
  if (!group) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/groups/${id}`} className="text-sm font-medium text-muted-foreground">
        ← {group.name}
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Edit group</h1>
      <GroupForm members={members} group={group} />
    </div>
  );
}
