import Link from "next/link";
import { HandHeart } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";
import { PRAYER_STATUS_STYLES, type PrayerStatus } from "@/lib/validation/groups";
import type { RecentPrayerRequest } from "@/lib/data/prayer-requests";

export function PrayerRequestsCard({ requests }: { requests: RecentPrayerRequest[] }) {
  if (requests.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionLabel>Prayer requests</SectionLabel>
        <Link href="/dashboard/groups" className="text-sm font-medium text-primary-700">
          See all
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {requests.map((request) => {
          const status = request.status as PrayerStatus;
          const href = request.session
            ? `/dashboard/groups/${request.session.team_id}/sessions/${request.session.id}`
            : "/dashboard/groups";
          return (
            <li key={request.id}>
              <Link
                href={href}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 hover:bg-neutral-100"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                  <HandHeart className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-foreground">
                    {request.member.first_name} {request.member.last_name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{request.request}</p>
                </div>
                <Badge className={PRAYER_STATUS_STYLES[status].badgeClassName}>
                  {PRAYER_STATUS_STYLES[status].label}
                </Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
