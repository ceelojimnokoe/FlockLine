"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TagChip } from "./tag-chip";
import { createTag } from "@/app/dashboard/members/actions";
import { cn } from "@/lib/utils";

export type TagOption = { id: string; name: string; color: string | null };

export function TagPicker({
  availableTags,
  selectedTagIds,
  onChange,
}: {
  availableTags: TagOption[];
  selectedTagIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [tags, setTags] = useState(availableTags);
  const [newTagName, setNewTagName] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    onChange(
      selectedTagIds.includes(id)
        ? selectedTagIds.filter((t) => t !== id)
        : [...selectedTagIds, id]
    );
  }

  function handleCreate() {
    const name = newTagName.trim();
    if (!name) return;
    startTransition(async () => {
      try {
        const tag = await createTag(name);
        setTags((prev) => [...prev, tag]);
        onChange([...selectedTagIds, tag.id]);
        setNewTagName("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not create tag.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selectedTagIds.includes(tag.id);
            return (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggle(tag.id)}
                className={cn(
                  "rounded-full",
                  active && "ring-2 ring-offset-1 ring-primary-600"
                )}
              >
                <TagChip name={tag.name} color={tag.color} />
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name"
          aria-label="New tag name"
          className="min-h-tap flex-1 rounded-xl border border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !newTagName.trim()}
          className="min-h-tap shrink-0 rounded-xl border border-input px-4 text-sm font-medium text-primary disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Hidden inputs so this shows up in the surrounding <form>'s FormData on submit. */}
      {selectedTagIds.map((id) => (
        <input key={id} type="hidden" name="tagIds" value={id} />
      ))}
    </div>
  );
}
