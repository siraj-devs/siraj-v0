"use client";

import type { VideoTimestamp } from "@/lib/course-types";
import { youtubeEmbedUrl } from "@/lib/course-types";
import { ChevronDown, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";

export function VideoViewer({
  title,
  url,
  timestamps = [],
}: {
  title: string;
  url: string;
  timestamps?: VideoTimestamp[];
}) {
  const embed = useMemo(() => youtubeEmbedUrl(url), [url]);
  const [open, setOpen] = useState(true);
  const [startAt, setStartAt] = useState<number | null>(null);

  const src = embed
    ? `${embed}${embed.includes("?") ? "&" : "?"}start=${startAt ?? 0}`
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <PlayCircle className="size-5 shrink-0 text-primary" />
        <h2 className="font-kufam text-xl text-foreground">{title}</h2>
      </div>

      {src ? (
        <div className="aspect-video overflow-hidden rounded-2xl border border-border/70 bg-black shadow-[0_18px_50px_-30px_color-mix(in_oklch,var(--foreground)_60%,transparent)]">
          <iframe
            key={startAt ?? "initial"}
            src={src}
            title={title}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          رابط يوتيوب غير صالح.
        </p>
      )}

      {timestamps.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between bg-primary/5 px-4 py-3 text-start transition-colors hover:bg-primary/8"
            aria-expanded={open}
          >
            <span className="flex items-center gap-2">
              <span className="font-kufam text-sm text-foreground">الفصول</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {timestamps.length}
              </span>
            </span>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && (
            <ul className="max-h-72 overflow-y-auto">
              {timestamps.map((stamp, index) => {
                const seconds = Math.max(0, Math.floor(stamp.seconds));
                const active = startAt === seconds;
                return (
                  <li
                    key={`${stamp.seconds}-${index}`}
                    className="border-t border-border/50"
                  >
                    <button
                      type="button"
                      onClick={() => setStartAt(seconds)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start text-sm transition-colors ${
                        active
                          ? "bg-primary/8 text-foreground"
                          : "text-foreground/75 hover:bg-primary/4"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {stamp.label}
                      </span>
                      <span
                        className="shrink-0 font-mono text-xs text-muted-foreground"
                        dir="ltr"
                      >
                        {formatTime(stamp.seconds)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}
