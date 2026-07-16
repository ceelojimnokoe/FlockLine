import Link from "next/link";
import { TemplatesManager } from "@/components/follow-ups/templates-manager";
import { getTemplates } from "@/lib/data/templates";

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="space-y-4">
      <Link href="/dashboard/followups" className="text-sm font-medium text-muted-foreground">
        ← Follow-ups
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">WhatsApp templates</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Edit the messages your team sends, or add your own. The one marked{" "}
          <span className="font-medium text-primary-700">Default</span> is what the one-tap
          &quot;Send on WhatsApp&quot; button uses for that follow-up type.
        </p>
      </div>
      <TemplatesManager templates={templates} />
    </div>
  );
}
