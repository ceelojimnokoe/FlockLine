import { Skeleton } from "@/components/ui/skeleton";

export function MemberRowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <Skeleton className="h-11 w-11 rounded-full" />
    </li>
  );
}

export function MemberListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <MemberRowSkeleton key={i} />
      ))}
    </ul>
  );
}
