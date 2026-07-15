import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <Card>
        <p className="text-base text-muted-foreground">
          You&apos;re signed in. This is where an overview of your church
          will live once members, follow-ups, and giving are built out.
        </p>
      </Card>
    </div>
  );
}
