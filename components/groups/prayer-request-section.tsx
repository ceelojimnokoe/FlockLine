"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { HandHeart } from "lucide-react";
import { MemberAvatar } from "@/components/members/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MemberPicker } from "@/components/shared/member-picker";
import {
  PRAYER_PRIVACY_LEVELS,
  PRAYER_PRIVACY_LABELS,
  PRAYER_STATUSES,
  PRAYER_STATUS_STYLES,
  type PrayerPrivacyLevel,
  type PrayerStatus,
} from "@/lib/validation/groups";
import {
  createPrayerRequest,
  updatePrayerRequestStatus,
  type PrayerRequestFormState,
} from "@/app/dashboard/groups/session-actions";
import type { MemberPickerOption } from "@/lib/data/members";
import type { Teammate } from "@/lib/data/teammates";
import type { PrayerRequestItem } from "@/lib/data/prayer-requests";

export function PrayerRequestSection({
  teamId,
  sessionId,
  requests,
  members,
  teammates,
}: {
  teamId: string;
  sessionId: string;
  requests: PrayerRequestItem[];
  members: MemberPickerOption[];
  teammates: Teammate[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <p className="text-base text-muted-foreground">No prayer requests logged for this session yet.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((request) => (
            <PrayerRequestCard key={request.id} request={request} teamId={teamId} sessionId={sessionId} />
          ))}
        </ul>
      )}

      {showForm ? (
        <PrayerRequestForm
          teamId={teamId}
          sessionId={sessionId}
          members={members}
          teammates={teammates}
          onDone={() => setShowForm(false)}
        />
      ) : (
        <Button type="button" variant="secondary" className="w-full" onClick={() => setShowForm(true)}>
          <HandHeart className="mr-2 h-4 w-4" aria-hidden="true" />
          Log a prayer request
        </Button>
      )}
    </div>
  );
}

function PrayerRequestCard({
  request,
  teamId,
  sessionId,
}: {
  request: PrayerRequestItem;
  teamId: string;
  sessionId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const status = request.status as PrayerStatus;

  function setStatus(next: PrayerStatus) {
    startTransition(async () => {
      try {
        await updatePrayerRequestStatus(request.id, teamId, sessionId, next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update this prayer request.");
      }
    });
  }

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <MemberAvatar
          id={request.member.id}
          firstName={request.member.first_name}
          lastName={request.member.last_name}
          photoUrl={request.member.photo_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-foreground">
            {request.member.first_name} {request.member.last_name}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{request.request}</p>
        </div>
        <Badge className={PRAYER_STATUS_STYLES[status].badgeClassName}>
          {PRAYER_STATUS_STYLES[status].label}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {PRAYER_STATUSES.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            type="button"
            disabled={isPending}
            onClick={() => setStatus(s)}
            className="min-h-tap rounded-lg border border-border px-3 text-xs font-medium text-foreground disabled:opacity-50"
          >
            Mark {PRAYER_STATUS_STYLES[s].label.toLowerCase()}
          </button>
        ))}
        <Link
          href={`/dashboard/followups/new?memberId=${request.member.id}&type=pastoral_care`}
          className="text-xs font-medium text-primary-700 underline underline-offset-2"
        >
          Create follow-up
        </Link>
      </div>
    </li>
  );
}

function PrayerRequestForm({
  teamId,
  sessionId,
  members,
  teammates,
  onDone,
}: {
  teamId: string;
  sessionId: string;
  members: MemberPickerOption[];
  teammates: Teammate[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<PrayerRequestFormState, FormData>(createPrayerRequest, null);
  const [memberId, setMemberId] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState<PrayerPrivacyLevel>("leadership_only");

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-card p-3">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="sessionId" value={sessionId} />

      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <Label>Who is this for?</Label>
        <MemberPicker members={members} value={memberId} onChange={setMemberId} name="memberId" />
        {state?.fieldErrors?.memberId && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.memberId}</p>
        )}
      </div>

      <div>
        <Label htmlFor="request">Prayer request</Label>
        <Textarea id="request" name="request" rows={3} />
        {state?.fieldErrors?.request && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.request}</p>
        )}
      </div>

      <div>
        <Label htmlFor="privacyLevel">Who can see this?</Label>
        <Select
          id="privacyLevel"
          name="privacyLevel"
          value={privacyLevel}
          onChange={(e) => setPrivacyLevel(e.target.value as PrayerPrivacyLevel)}
        >
          {PRAYER_PRIVACY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {PRAYER_PRIVACY_LABELS[level]}
            </option>
          ))}
        </Select>
      </div>

      {privacyLevel === "assigned_leader" && (
        <div>
          <Label htmlFor="assignedLeaderId">Assign to</Label>
          <Select id="assignedLeaderId" name="assignedLeaderId" defaultValue="">
            <option value="">Choose a teammate</option>
            {teammates.map((teammate) => (
              <option key={teammate.id} value={teammate.id}>
                {teammate.email}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={onDone}
          className="min-h-tap rounded-xl border border-input px-4 text-sm font-medium text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Saving…" : "Save prayer request"}
    </Button>
  );
}
