import Link from "next/link";
import { GroupForm } from "@/components/groups/group-form";
import { getAllMembersForPicker } from "@/lib/data/members";

export default async function NewGroupPage() {
  const members = await getAllMembersForPicker();

  return (
    <div className="space-y-4">
      <Link href="/dashboard/groups" className="text-sm font-medium text-muted-foreground">
        ← Groups
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Create group</h1>
      <GroupForm members={members} />
    </div>
  );
}
