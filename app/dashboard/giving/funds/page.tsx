import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FundListItem } from "@/components/giving/fund-list-item";
import { getCurrentChurchUser } from "@/lib/data/church";
import { getGivingFunds } from "@/lib/data/giving";

export default async function GivingFundsPage() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  if (churchUser.role !== "admin") {
    return (
      <div className="py-10 text-center">
        <p className="text-base text-muted-foreground">Only admins can manage giving funds.</p>
      </div>
    );
  }

  const funds = await getGivingFunds();

  return (
    <div className="space-y-4">
      <Link href="/dashboard/giving" className="text-sm font-medium text-muted-foreground">
        ← Giving
      </Link>
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Giving funds</h1>
        <LinkButton href="/dashboard/giving/funds/new" className="px-3">
          New fund
        </LinkButton>
      </div>

      {funds.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No funds yet"
          description="Create a fund (e.g. Tithes, Building Fund) so gifts can be recorded and given toward it."
          action={
            <LinkButton href="/dashboard/giving/funds/new" variant="secondary">
              Create a fund
            </LinkButton>
          }
        />
      ) : (
        <ul className="space-y-2">
          {funds.map((fund) => (
            <FundListItem key={fund.id} fund={fund} />
          ))}
        </ul>
      )}
    </div>
  );
}
