import { Card } from "@/components/ui/card";

export default function GivingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Giving</h1>
      <Card>
        <p className="text-base text-muted-foreground">
          Tithe and offering records, plus Paystack-powered giving, will
          live here.
        </p>
      </Card>
    </div>
  );
}
