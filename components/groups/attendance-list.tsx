"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/members/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_STYLES,
  type AttendanceStatus,
} from "@/lib/validation/groups";
import { recordAttendance } from "@/app/dashboard/groups/session-actions";
import type { AttendanceRow } from "@/lib/data/sessions";

export function AttendanceList({ sessionId, attendance }: { sessionId: string; attendance: AttendanceRow[] }) {
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      invited: 0,
      attended: 0,
      absent: 0,
      excused: 0,
      late: 0,
    };
    for (const row of attendance) counts[row.status as AttendanceStatus]++;
    return counts;
  }, [attendance]);

  function handleSetStatus(memberId: string, status: AttendanceStatus) {
    startTransition(async () => {
      try {
        await recordAttendance(sessionId, memberId, status);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update attendance.");
      }
    });
  }

  if (attendance.length === 0) {
    return (
      <p className="text-base text-muted-foreground">
        No one is invited to this session yet — add members to the group first.
      </p>
    );
  }

  const total = attendance.length;
  const attendedPct = total > 0 ? Math.round((stats.attended / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{attendedPct}% attended</span>
        <span>· {stats.attended} attended</span>
        <span>· {stats.absent} absent</span>
        <span>· {stats.excused} excused</span>
        <span>· {stats.late} late</span>
        <span>· {stats.invited} not yet marked</span>
      </div>

      <ul className="space-y-2">
        {attendance.map((row) => {
          const status = row.status as AttendanceStatus;
          return (
            <li key={row.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <MemberAvatar
                  id={row.member.id}
                  firstName={row.member.first_name}
                  lastName={row.member.last_name}
                  photoUrl={row.member.photo_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-foreground">
                    {row.member.first_name} {row.member.last_name}
                  </p>
                </div>
                <Badge className={ATTENDANCE_STATUS_STYLES[status].badgeClassName}>
                  {ATTENDANCE_STATUS_STYLES[status].label}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {ATTENDANCE_STATUSES.filter((s) => s !== "invited").map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSetStatus(row.member.id, s)}
                    className={cn(
                      "min-h-tap rounded-lg border px-3 text-xs font-medium disabled:opacity-50",
                      status === s
                        ? "border-primary-600 bg-primary-600 text-primary-foreground"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {ATTENDANCE_STATUS_STYLES[s].label}
                  </button>
                ))}
                {status === "absent" && (
                  <Link
                    href={`/dashboard/followups/new?memberId=${row.member.id}&type=absentee`}
                    className="text-xs font-medium text-primary-700 underline underline-offset-2"
                  >
                    Create follow-up
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
