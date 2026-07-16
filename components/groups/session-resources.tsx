"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Link as LinkIcon, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addSessionResource } from "@/app/dashboard/groups/session-actions";

export function SessionResources({
  sessionId,
  teamId,
  resources,
}: {
  sessionId: string;
  teamId: string;
  resources: { title: string; url: string }[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      try {
        await addSessionResource(sessionId, teamId, title, url);
        setTitle("");
        setUrl("");
        setIsAdding(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add this resource.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {resources.length > 0 && (
        <ul className="space-y-1.5">
          {resources.map((resource, i) => (
            <li key={i}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 underline underline-offset-2"
              >
                <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {resource.title}
              </a>
            </li>
          ))}
        </ul>
      )}

      {isAdding ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource title"
            aria-label="Resource title"
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://…"
            aria-label="Resource link"
          />
          <div className="flex gap-2">
            <Button type="button" disabled={isPending} onClick={handleAdd} className="flex-1">
              {isPending ? "Adding…" : "Add"}
            </Button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="min-h-tap rounded-xl border border-input px-4 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add resource link
        </button>
      )}
    </div>
  );
}
