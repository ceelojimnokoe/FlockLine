import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SESSION_TYPE_LABELS, SESSION_STATUS_STYLES, type SessionType, type SessionStatus } from "@/lib/validation/groups";
import { formatDateTime } from "@/lib/format";
import type { SessionListItem } from "@/lib/data/sessions";

export function SessionCard({ session, teamId }: { session: SessionListItem; teamId: string }) {
  const status = session.status as SessionStatus;
  return (
    <Link
      href={`/dashboard/groups/${teamId}/sessions/${session.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 hover:bg-neutral-100"
    >
      <div className="min-w-0">
        <p className="truncate text-base font-medium text-foreground">{session.title}</p>
        <p className="text-sm text-muted-foreground">
          {SESSION_TYPE_LABELS[session.type as SessionType]} · {formatDateTime(session.scheduled_at)}
        </p>
      </div>
      <Badge className={SESSION_STATUS_STYLES[status].badgeClassName}>
        {SESSION_STATUS_STYLES[status].label}
      </Badge>
    </Link>
  );
}
