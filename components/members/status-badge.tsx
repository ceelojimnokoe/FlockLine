import { Badge } from "@/components/ui/badge";
import { MEMBER_STATUS_LABELS, type MemberStatus } from "@/lib/validation/member";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<MemberStatus, string> = {
  first_timer: "bg-sky-100 text-sky-800",
  new_convert: "bg-primary-100 text-primary-700",
  member: "bg-primary-600 text-primary-foreground",
  inactive: "bg-ink-100 text-ink-500",
};

export function StatusBadge({ status, className }: { status: MemberStatus; className?: string }) {
  return (
    <Badge className={cn(STATUS_CLASSES[status], className)}>
      {MEMBER_STATUS_LABELS[status]}
    </Badge>
  );
}
