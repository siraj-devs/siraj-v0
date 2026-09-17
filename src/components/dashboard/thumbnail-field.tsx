"use client";

import { Rosette } from "@/components/islamic-motif";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useRef, type ChangeEvent } from "react";

/**
 * Thumbnail picker with preview, replace, and clear — used by session/course
 * create-edit dialogs instead of a raw file input.
 *
 * The file input is intentionally not linked via <Label htmlFor> and is kept
 * off-screen with tabIndex={-1}: browsers otherwise scroll the modal (or the
 * page behind it) to bring the input into view when the picker opens/closes.
 */
export function ThumbnailField({
  label = "الصورة المصغّرة",
  imageUrl,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
  hint = "JPEG، PNG، WebP — يُفضّل نسبة 16:9",
}: {
  label?: string;
  imageUrl: string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    // Blur immediately so the browser does not scroll to the off-screen input.
    e.target.blur();
    onChange(file);
  }

  return (
    <div ref={rootRef} className="space-y-2 [overflow-anchor:none]">
      <p className="text-sm font-medium leading-none">{label}</p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 size-px opacity-0"
        onChange={handleFileChange}
      />

      {imageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
          <div className="relative aspect-video w-full">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border bg-background/80 px-3 py-2">
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
            <div className="flex shrink-0 gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openPicker}
                className="gap-1.5"
              >
                <ImagePlus className="size-3.5" />
                تغيير
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clear}
                className="gap-1.5 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                إزالة
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary/45 ring-1 ring-border transition group-hover:text-primary/70">
            <Rosette className="size-6" />
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              اختر صورة مصغّرة
            </span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground/80">
            <ImagePlus className="size-3.5" />
            رفع صورة
          </span>
        </button>
      )}
    </div>
  );
}
