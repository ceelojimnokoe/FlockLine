import { Card } from "@/components/ui/card";

export default function MembersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Members</h1>
      <Card>
        <p className="text-base text-muted-foreground">
          Your member directory will live here.
        </p>
      </Card>
    </div>
  );
}
