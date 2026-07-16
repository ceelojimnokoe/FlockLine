"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/members/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toWhatsAppUrl } from "@/lib/phone";
import { renderTemplate } from "@/lib/template";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  FOLLOW_UP_TYPE_LABELS,
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_STATUS_CLASSES,
  type FollowUpType,
  type FollowUpStatus,
} from "@/lib/validation/follow-up";
import { updateFollowUpStatus, reopenFollowUp } from "@/app/dashboard/followups/actions";
import type { FollowUpListItem } from "@/lib/data/follow-ups";
import type { MessageTemplate } from "@/lib/data/templates";
import type { Teammate } from "@/lib/data/teammates";

export function FollowUpCard({
  followUp,
  template,
  churchName,
  assignee,
}: {
  followUp: FollowUpListItem;
  template: MessageTemplate | null;
  churchName: string;
  assignee: Teammate | undefined;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const type = followUp.type as FollowUpType;
  const status = followUp.status as FollowUpStatus;
  const isOverdue =
    !!followUp.due_date && followUp.due_date < new Date().toISOString().slice(0, 10) && status !== "done";

  const waUrl = useMemo(() => {
    const base = toWhatsAppUrl(followUp.member.phone);
    if (!base) return null;
    if (!template) return base;
    const message = renderTemplate(template.body, {
      first_name: followUp.member.first_name,
      church_name: churchName,
    });
    return `${base}?text=${encodeURIComponent(message)}`;
  }, [followUp, template, churchName]);

  function handleStatusUpdate(nextStatus: "in_progress" | "done") {
    startTransition(async () => {
      try {
        await updateFollowUpStatus(followUp.id, nextStatus, note);
        toast.success(nextStatus === "done" ? "Marked as done." : "Marked as in progress.");
        setShowPrompt(false);
        setNote("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update this follow-up.");
      }
    });
  }

  function handleReopen() {
    startTransition(async () => {
      try {
        await reopenFollowUp(followUp.id);
        toast.success("Reopened.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't reopen this follow-up.");
      }
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/dashboard/members/${followUp.member.id}`}
          className="flex min-w-0 items-center gap-3"
        >
          <MemberAvatar
            id={followUp.member.id}
            firstName={followUp.member.first_name}
            lastName={followUp.member.last_name}
            photoUrl={followUp.member.photo_url}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-foreground">
              {followUp.member.first_name} {followUp.member.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {FOLLOW_UP_TYPE_LABELS[type] ?? type}
            </p>
          </div>
        </Link>
        <Badge className={FOLLOW_UP_STATUS_CLASSES[status]}>{FOLLOW_UP_STATUS_LABELS[status]}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{assignee ? assignee.email : "Unassigned"}</span>
        <span className={cn(isOverdue && "font-medium text-destructive")}>
          {followUp.due_date ? `Due ${formatDate(followUp.due_date)}` : "No due date"}
          {isOverdue && " · Overdue"}
        </span>
      </div>

      {followUp.notes && (
        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-100 p-2 text-sm text-muted-foreground">
          {followUp.notes}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowPrompt(true)}
            className="min-h-tap inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-medium text-white"
          >
            Send on WhatsApp
          </a>
        )}

        {status === "pending" && (
          <QuickButton disabled={isPending} onClick={() => handleStatusUpdate("in_progress")}>
            Start
          </QuickButton>
        )}
        {status !== "done" && (
          <QuickButton disabled={isPending} onClick={() => handleStatusUpdate("done")}>
            Mark done
          </QuickButton>
        )}
        {status === "done" && (
          <QuickButton disabled={isPending} onClick={handleReopen}>
            Reopen
          </QuickButton>
        )}
      </div>

      {showPrompt && (
        <div className="mt-3 space-y-2 rounded-xl border border-primary-200 bg-primary-50 p-3">
          <p className="text-sm font-medium text-foreground">How did it go?</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional outcome note"
            rows={2}
            className="min-h-0 bg-card"
          />
          <div className="flex gap-2">
            <QuickButton disabled={isPending} onClick={() => handleStatusUpdate("in_progress")}>
              Mark in progress
            </QuickButton>
            <QuickButton disabled={isPending} onClick={() => handleStatusUpdate("done")}>
              Mark done
            </QuickButton>
          </div>
          <button
            type="button"
            onClick={() => setShowPrompt(false)}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </li>
  );
}

function QuickButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-tap rounded-xl border border-border px-4 text-sm font-medium text-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}
