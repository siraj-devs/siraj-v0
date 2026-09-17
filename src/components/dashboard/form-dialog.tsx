"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, type FormEvent, type ReactNode } from "react";

/**
 * Shared shell for every "add/edit" dashboard modal: bottom-sheet on mobile,
 * centered card on desktop, sticky header + scrollable body + sticky footer
 * with a cancel/submit pair. Used by sessions, courses, members, meetings,
 * socials, content, and finance-tracker so every create/edit dialog in the
 * dashboard looks and behaves the same way.
 */
export function FormDialog({
  title,
  description,
  onClose,
  onSubmit,
  pending = false,
  submitLabel,
  pendingLabel = "جاري الحفظ…",
  cancelLabel = "إلغاء",
  maxWidthClassName = "max-w-md",
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  pending?: boolean;
  submitLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  maxWidthClassName?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={() => !pending && onClose()}
        aria-hidden
      />
      <form
        onSubmit={onSubmit}
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidthClassName} animate-[fade-up_0.25s_ease-out] flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-6 sm:p-8 sm:pb-5">
          <div>
            <h2 className="font-kufam text-2xl font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 sm:p-8 sm:py-5">
          {children}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border p-6 sm:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
