import { Card } from "@/components/ui/card";

export default function MorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">More</h1>
      <Card>
        <p className="text-base text-muted-foreground">
          Church settings, admin roles, and additional tools will live here.
        </p>
      </Card>
    </div>
  );
}
