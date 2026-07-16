import { Badge } from "@/components/ui/badge";
import { MEMBER_STATUS_STYLES, type MemberStatus } from "@/lib/validation/member";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: MemberStatus; className?: string }) {
  const style = MEMBER_STATUS_STYLES[status];
  return (
    <Badge className={cn(style.badgeClassName, className)}>{style.label}</Badge>
  );
}
