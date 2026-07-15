import { MemberListSkeleton } from "@/components/members/member-row-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-20 rounded-xl" />
          <Skeleton className="h-11 w-20 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <MemberListSkeleton />
    </div>
  );
}
