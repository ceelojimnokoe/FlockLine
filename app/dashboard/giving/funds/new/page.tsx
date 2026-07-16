import Link from "next/link";
import { FundForm } from "@/components/giving/fund-form";

export default function NewFundPage() {
  return (
    <div className="space-y-4">
      <Link href="/dashboard/giving/funds" className="text-sm font-medium text-muted-foreground">
        ← Giving funds
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Create fund</h1>
      <FundForm />
    </div>
  );
}
