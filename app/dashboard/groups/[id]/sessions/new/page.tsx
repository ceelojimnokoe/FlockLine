import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionForm } from "@/components/groups/session-form";
import { getGroupDetail } from "@/lib/data/groups";

export default async function NewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getGroupDetail(id);
  if (!group) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/groups/${id}`} className="text-sm font-medium text-muted-foreground">
        ← {group.name}
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">Schedule a session</h1>
      <SessionForm teamId={id} groupWhatsappLink={group.whatsapp_link} />
    </div>
  );
}
