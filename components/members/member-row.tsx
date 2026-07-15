import Link from "next/link";
import { MemberAvatar } from "./avatar";
import { StatusBadge } from "./status-badge";
import { WhatsAppButton } from "./whatsapp-button";
import type { MemberListItem } from "@/lib/data/members";
import type { MemberStatus } from "@/lib/validation/member";

export function MemberRow({ member }: { member: MemberListItem }) {
  return (
    <li>
      <Link
        href={`/dashboard/members/${member.id}`}
        className="flex min-h-tap items-center gap-3 rounded-xl px-2 py-2 hover:bg-cream-200 active:bg-cream-300"
      >
        <MemberAvatar
          firstName={member.first_name}
          lastName={member.last_name}
          photoUrl={member.photo_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-foreground">
            {member.first_name} {member.last_name}
          </p>
          <StatusBadge status={member.status as MemberStatus} className="mt-0.5" />
        </div>
        <WhatsAppButton phone={member.phone} variant="icon" />
      </Link>
    </li>
  );
}
