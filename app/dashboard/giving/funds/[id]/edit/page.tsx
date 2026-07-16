import Link from "next/link";
import { notFound } from "next/navigation";
import { FundForm } from "@/components/giving/fund-form";
import { getFundById } from "@/lib/data/giving";

export default async function EditFundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fund = await getFundById(id);
  if (!fund) notFound();

  return (
    <div className="space-y-4">
      <Link href="/dashboard/giving/funds" className="text-sm font-medium text-muted-foreground">
        ← Giving funds
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Edit fund</h1>
      <FundForm fund={fund} />
    </div>
  );
}
