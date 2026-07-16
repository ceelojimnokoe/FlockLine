import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function GivingLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-11 w-20 rounded-xl" />
      </div>
      <Card>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-9 w-32" />
      </Card>
      <Card>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-32 w-full" />
      </Card>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
