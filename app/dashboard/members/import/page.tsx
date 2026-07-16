import Link from "next/link";
import { ImportFlow } from "@/components/members/import-flow";

export default function ImportMembersPage() {
  return (
    <div className="space-y-4">
      <Link href="/dashboard/members" className="text-sm font-medium text-muted-foreground">
        ← Members
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Import members</h1>
      <ImportFlow />
    </div>
  );
}
