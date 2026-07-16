import { redirect } from "next/navigation";
import Link from "next/link";
import { ManualEntryForm } from "@/components/giving/manual-entry-form";
import { getCurrentChurchUser, canViewGiving } from "@/lib/data/church";
import { getGivingFunds } from "@/lib/data/giving";
import { getAllMembersForPicker } from "@/lib/data/members";

export default async function NewGivingEntryPage() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  const [funds, members] = await Promise.all([getGivingFunds(), getAllMembersForPicker()]);
  const activeFunds = funds.filter((fund) => fund.is_active);

  return (
    <div className="space-y-4">
      <Link href="/dashboard/giving" className="text-sm font-medium text-muted-foreground">
        ← Giving
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Record giving</h1>

      {activeFunds.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {canViewGiving(churchUser.role)
            ? "There are no active giving funds yet — set one up from the Giving dashboard first."
            : "There are no active giving funds yet."}
        </p>
      ) : (
        <ManualEntryForm funds={activeFunds} members={members} />
      )}
    </div>
  );
}
