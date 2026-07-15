import { Card } from "@/components/ui/card";

export default function FollowUpsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Follow-ups</h1>
      <Card>
        <p className="text-base text-muted-foreground">
          Visitor and pastoral follow-up tracking will live here.
        </p>
      </Card>
    </div>
  );
}
