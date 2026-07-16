import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { FollowUpType } from "@/lib/validation/follow-up";

export type MessageTemplate = Tables<"message_templates">;

export async function getTemplates(): Promise<MessageTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .order("follow_up_type", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/** The template a follow-up card's quick "Send on WhatsApp" button uses. */
export function getDefaultTemplateForType(
  templates: MessageTemplate[],
  type: FollowUpType
): MessageTemplate | null {
  const forType = templates.filter((t) => t.follow_up_type === type);
  return forType.find((t) => t.is_default) ?? forType[0] ?? null;
}
