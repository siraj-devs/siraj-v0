"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect } from "react";

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = "حذف",
  cancelLabel = "إلغاء",
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!pending) onCancel();
        }}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        className="relative z-10 w-full max-w-md animate-[fade-up_0.25s_ease-out] rounded-t-3xl border border-border bg-background p-6 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2
              id="confirm-delete-title"
              className="font-kufam text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
            <p
              id="confirm-delete-desc"
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1"
          >
            {pending ? "جاري التنفيذ…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
