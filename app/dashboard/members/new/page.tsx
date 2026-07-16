import Link from "next/link";
import { MemberForm } from "@/components/members/member-form";
import { getTags } from "@/lib/data/tags";
import { createMember } from "../actions";

export default async function NewMemberPage() {
  const tags = await getTags();

  return (
    <div className="space-y-4">
      <Link href="/dashboard/members" className="text-sm font-medium text-muted-foreground">
        ← Members
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Add member</h1>
      <MemberForm action={createMember} availableTags={tags} submitLabel="Save member" />
    </div>
  );
}
