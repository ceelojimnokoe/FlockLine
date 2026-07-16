import { Badge } from "@/components/ui/badge";
import { GROUP_TYPE_LABELS, type GroupType } from "@/lib/validation/groups";

export function GroupTypeBadge({ type }: { type: GroupType | null }) {
  if (!type) return null;
  return <Badge className="bg-sky-100 text-sky-800">{GROUP_TYPE_LABELS[type]}</Badge>;
}
