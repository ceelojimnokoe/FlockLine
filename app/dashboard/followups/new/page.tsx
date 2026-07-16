import Link from "next/link";
import { FollowUpForm } from "@/components/follow-ups/follow-up-form";
import { getAllMembersForPicker } from "@/lib/data/members";
import { getTeammates } from "@/lib/data/teammates";

export default async function NewFollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string; type?: string }>;
}) {
  const params = await searchParams;
  const [members, teammates] = await Promise.all([getAllMembersForPicker(), getTeammates()]);

  return (
    <div className="space-y-4">
      <Link href="/dashboard/followups" className="text-sm font-medium text-muted-foreground">
        ← Follow-ups
      </Link>
      <h1 className="text-2xl font-semibold text-foreground">Create follow-up</h1>
      <FollowUpForm
        members={members}
        teammates={teammates}
        defaultMemberId={params.memberId}
        defaultType={params.type}
      />
    </div>
  );
}
