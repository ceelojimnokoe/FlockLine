import Link from "next/link";
import { MemberAvatar } from "./avatar";
import { StatusBadge } from "./status-badge";
import { WhatsAppButton } from "./whatsapp-button";
import type { MemberListItem } from "@/lib/data/members";
import type { MemberStatus } from "@/lib/validation/member";

export function MemberRow({ member }: { member: MemberListItem }) {
  return (
    <li className="flex items-center rounded-xl hover:bg-neutral-200">
      {/*
        The row used to be one big <Link> with the WhatsApp <a> nested
        inside it — invalid HTML (anchors can't contain anchors), which the
        browser silently "fixes" by closing the outer tag early, producing
        a DOM that doesn't match what React rendered and triggering a
        hydration error. Splitting into a Link (info) + sibling button
        (WhatsApp) keeps both tappable with no nesting.
      */}
      <Link
        href={`/dashboard/members/${member.id}`}
        className="flex min-h-tap min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 active:bg-neutral-300"
      >
        <MemberAvatar
          id={member.id}
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
      </Link>
      <WhatsAppButton phone={member.phone} variant="icon" className="mr-1" />
    </li>
  );
}
