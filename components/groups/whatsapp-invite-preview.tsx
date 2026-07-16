"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle } from "lucide-react";
import { WhatsAppIcon } from "@/components/members/whatsapp-button";
import { toWhatsAppUrl } from "@/lib/phone";
import { formatDateTime } from "@/lib/format";
import { SESSION_TYPE_LABELS, type SessionType } from "@/lib/validation/groups";
import type { SessionDetail, AttendanceRow } from "@/lib/data/sessions";

function buildInviteMessage(session: SessionDetail, groupName: string) {
  const typeLabel = SESSION_TYPE_LABELS[session.type as SessionType];
  const location = session.group.meeting_location;
  const lines = [
    `Hello! You're invited to ${groupName}'s ${typeLabel.toLowerCase()}: "${session.title}".`,
    `📅 ${formatDateTime(session.scheduled_at)}`,
    `📍 ${location || "Location to be confirmed"}`,
  ];
  if (session.discussion_questions) {
    lines.push("", `We'll be looking at:\n${session.discussion_questions}`);
  }
  lines.push("", "We'd love to have you join us! 🙏");
  return lines.join("\n");
}

/**
 * There is no WhatsApp Business API integration here — this only ever
 * copies text and opens wa.me / an existing group-chat link. A WhatsApp
 * group has no URL scheme that accepts prefilled text (unlike a 1:1 wa.me
 * chat), so for a group link the leader copies the message and pastes it
 * in themselves; for individual members it can prefill per-person like the
 * Follow-ups WhatsApp button does. Nothing here is ever sent automatically.
 */
export function WhatsAppInvitePreview({
  session,
  attendance,
}: {
  session: SessionDetail;
  attendance: AttendanceRow[];
}) {
  const [copied, setCopied] = useState(false);
  const message = useMemo(() => buildInviteMessage(session, session.group.name), [session]);
  const groupLink = session.whatsapp_link || session.group.whatsapp_link;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copied — paste it into the WhatsApp group.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy the text manually.");
    }
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
          <WhatsAppIcon className="h-3.5 w-3.5" />
        </span>
        <p className="text-sm font-semibold text-foreground">Invitation message</p>
      </div>
      <div className="whitespace-pre-wrap rounded-lg rounded-tl-sm bg-white p-3 text-sm leading-relaxed text-foreground shadow-sm">
        {message}
      </div>

      {groupLink ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary-300 bg-white px-3 text-sm font-medium text-primary-700 hover:bg-primary-100"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? "Copied!" : "Copy message"}
          </button>
          <a
            href={groupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-semibold text-white hover:bg-[#1fb959]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Open WhatsApp group
          </a>
        </div>
      ) : (
        <PerMemberInvite message={message} attendance={attendance} />
      )}
    </div>
  );
}

function PerMemberInvite({ message, attendance }: { message: string; attendance: AttendanceRow[] }) {
  const [sent, setSent] = useState<Set<string>>(new Set());

  const invitable = attendance
    .map((row) => ({ row, waUrl: toWhatsAppUrl(row.member.phone) }))
    .filter((entry): entry is { row: AttendanceRow; waUrl: string } => !!entry.waUrl);

  if (invitable.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        No group WhatsApp link is set, and no invited member has a valid phone number yet.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-muted-foreground">
        No group WhatsApp link is set — send this to members individually instead:
      </p>
      <ul className="space-y-1.5">
        {invitable.map(({ row, waUrl }) => (
          <li key={row.member.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground">
              {row.member.first_name} {row.member.last_name}
            </span>
            <a
              href={`${waUrl}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSent((prev) => new Set(prev).add(row.member.id))}
              className="min-h-tap inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-medium text-white hover:bg-[#1fb959]"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              {sent.has(row.member.id) ? "Sent" : "Send"}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
