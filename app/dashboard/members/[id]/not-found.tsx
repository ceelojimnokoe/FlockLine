import { LinkButton } from "@/components/ui/link-button";

export default function MemberNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-foreground">Member not found</h2>
      <p className="text-base text-muted-foreground">
        This member may have been removed, or the link is incorrect.
      </p>
      <LinkButton href="/dashboard/members">Back to members</LinkButton>
    </div>
  );
}
