import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import { SESSION_TYPE_LABELS, type SessionType } from "@/lib/validation/groups";
import { formatDateTime } from "@/lib/format";
import type { UpcomingSession } from "@/lib/data/sessions";

export function UpcomingSessionsCard({ sessions }: { sessions: UpcomingSession[] }) {
  if (sessions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionLabel>Upcoming sessions</SectionLabel>
        <Link href="/dashboard/groups" className="text-sm font-medium text-primary-700">
          See all
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link
              href={`/dashboard/groups/${session.group.id}/sessions/${session.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-neutral-100"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-foreground">{session.title}</p>
                <p className="text-sm text-muted-foreground">
                  {session.group.name} · {SESSION_TYPE_LABELS[session.type as SessionType]}
                </p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatDateTime(session.scheduled_at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
