"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ConfirmDialogHandle = {
  open: () => void;
  close: () => void;
};

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
};

/**
 * Backed by the native <dialog> element: free focus-trapping, ESC-to-close,
 * and a backdrop, with no modal-management library needed. Must be opened
 * imperatively via showModal() — that's why this exposes a ref handle
 * instead of an `open` prop.
 */
export const ConfirmDialog = forwardRef<ConfirmDialogHandle, ConfirmDialogProps>(
  function ConfirmDialog({ title, description, confirmLabel = "Confirm", onConfirm, destructive }, ref) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
      open: () => dialogRef.current?.showModal(),
      close: () => dialogRef.current?.close(),
    }));

    return (
      <dialog
        ref={dialogRef}
        className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-5 text-left backdrop:bg-ink-900/40"
      >
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-base text-muted-foreground">{description}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-tap flex-1 rounded-xl border border-input text-base font-medium text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              onConfirm();
            }}
            className={cn(
              "min-h-tap flex-1 rounded-xl text-base font-medium",
              destructive
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    );
  }
);
