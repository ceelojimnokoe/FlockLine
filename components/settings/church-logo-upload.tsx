"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateChurchLogoUrl, removeChurchLogo } from "@/app/dashboard/settings/church/actions";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ChurchLogoUpload({
  churchId,
  churchName,
  currentLogoUrl,
}: {
  churchId: string;
  churchName: string;
  currentLogoUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    setPreview(URL.createObjectURL(file));

    startUpload(async () => {
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "jpg";
        // Fixed filename per church (not timestamped) — upsert:true means
        // re-uploading always replaces the previous logo at the same path
        // rather than accumulating orphaned files in storage.
        const path = `${churchId}/logo.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("church-logos")
          .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("church-logos")
          .getPublicUrl(path);

        // Cache-bust so the new logo shows immediately even though the
        // path is unchanged (upsert overwrote the same file).
        await updateChurchLogoUrl(`${publicUrlData.publicUrl}?v=${Date.now()}`);

        toast.success("Church logo updated.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't upload this image.");
        setPreview(null);
      }
    });
  }

  function handleRemove() {
    startRemove(async () => {
      try {
        await removeChurchLogo();
        setPreview(null);
        toast.success("Logo removed.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't remove the logo.");
      }
    });
  }

  const displayUrl = preview ?? currentLogoUrl;
  const isBusy = isUploading || isRemoving;

  return (
    <div className="flex items-center gap-4">
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL, may be a fresh local object URL mid-upload
        <img src={displayUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sky-400 font-display text-2xl font-semibold text-primary-950"
        >
          {churchName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="min-h-tap rounded-xl border border-border px-4 text-sm font-medium text-foreground disabled:opacity-50"
          >
            {isUploading ? "Uploading…" : currentLogoUrl ? "Replace" : "Upload logo"}
          </button>
          {currentLogoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isBusy}
              className="min-h-tap rounded-xl border border-destructive/30 px-4 text-sm font-medium text-destructive disabled:opacity-50"
            >
              {isRemoving ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">JPEG, PNG, or WEBP. Max 2MB.</p>
      </div>
    </div>
  );
}
