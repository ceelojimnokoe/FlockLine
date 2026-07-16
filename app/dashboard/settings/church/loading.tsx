import { Skeleton } from "@/components/ui/skeleton";

export default function ChurchSettingsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-40" />

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-56" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}
