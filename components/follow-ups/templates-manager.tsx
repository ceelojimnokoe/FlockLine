"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_TYPE_LABELS,
  type FollowUpType,
} from "@/lib/validation/follow-up";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from "@/app/dashboard/followups/templates/actions";
import type { MessageTemplate } from "@/lib/data/templates";

export function TemplatesManager({ templates }: { templates: MessageTemplate[] }) {
  return (
    <div className="space-y-6">
      {FOLLOW_UP_TYPES.map((type) => (
        <TypeSection
          key={type}
          type={type}
          templates={templates.filter((t) => t.follow_up_type === type)}
        />
      ))}
    </div>
  );
}

function TypeSection({ type, templates }: { type: FollowUpType; templates: MessageTemplate[] }) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{FOLLOW_UP_TYPE_LABELS[type]}</h2>

      {templates.length === 0 && !isAdding && (
        <p className="text-base text-muted-foreground">No templates yet for this type.</p>
      )}

      <div className="space-y-3">
        {templates.map((template) => (
          <TemplateItem key={template.id} template={template} />
        ))}
      </div>

      {isAdding ? (
        <NewTemplateForm type={type} onDone={() => setIsAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="min-h-tap text-sm font-medium text-primary underline underline-offset-4"
        >
          + Add a template
        </button>
      )}
    </section>
  );
}

function TemplateItem({ template }: { template: MessageTemplate }) {
  const [name, setName] = useState(template.name);
  const [body, setBody] = useState(template.body);
  const [isPending, startTransition] = useTransition();
  const dirty = name !== template.name || body !== template.body;

  function handleSave() {
    startTransition(async () => {
      try {
        await updateTemplate(template.id, name, body);
        toast.success("Template saved.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save this template.");
      }
    });
  }

  function handleSetDefault() {
    startTransition(async () => {
      try {
        await setDefaultTemplate(template.id, template.follow_up_type as FollowUpType);
        toast.success(`"${template.name}" is now the default.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't set as default.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTemplate(template.id);
        toast.success("Template deleted.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't delete this template.");
      }
    });
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-3",
        template.is_default ? "border-primary-300 bg-primary-50" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        {template.is_default && (
          <span className="shrink-0 text-xs font-medium text-primary-700">Default</span>
        )}
      </div>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
      <p className="text-xs text-muted-foreground">
        Placeholders: <code>{"{first_name}"}</code> and <code>{"{church_name}"}</code>
      </p>
      <div className="flex flex-wrap gap-2">
        {dirty && (
          <Button variant="secondary" className="min-h-9 px-3 text-sm" disabled={isPending} onClick={handleSave}>
            Save
          </Button>
        )}
        {!template.is_default && (
          <button
            type="button"
            onClick={handleSetDefault}
            disabled={isPending}
            className="min-h-9 rounded-xl border border-border px-3 text-sm font-medium text-foreground disabled:opacity-50"
          >
            Make default
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="min-h-9 rounded-xl border border-destructive/30 px-3 text-sm font-medium text-destructive disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function NewTemplateForm({ type, onDone }: { type: FollowUpType; onDone: () => void }) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim() || !body.trim()) {
      toast.error("Name and message are required.");
      return;
    }
    startTransition(async () => {
      try {
        await createTemplate(type, name, body);
        toast.success("Template added.");
        onDone();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't create this template.");
      }
    });
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name"
        autoFocus
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message — use {first_name} and {church_name}"
        rows={3}
      />
      <div className="flex gap-2">
        <Button className="min-h-9 px-3 text-sm" disabled={isPending} onClick={handleCreate}>
          {isPending ? "Adding…" : "Add template"}
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-9 rounded-xl border border-border px-3 text-sm font-medium text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
