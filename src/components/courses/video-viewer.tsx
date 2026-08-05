"use client";

import type { VideoTimestamp } from "@/lib/course-types";
import { youtubeEmbedUrl } from "@/lib/course-types";
import { ChevronDown } from "lucide-react";
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
  const [startAt, setStartAt] = useState(0);

  const src = embed
    ? `${embed}${embed.includes("?") ? "&" : "?"}start=${startAt}`
    : null;

  return (
    <div className="space-y-4">
      <h2 className="font-kufam text-xl text-foreground">{title}</h2>
      {src ? (
        <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black">
          <iframe
            key={startAt}
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
        <div className="overflow-hidden rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between bg-muted/40 px-4 py-3 text-sm font-medium"
          >
            الطوابع الزمنية
            <ChevronDown
              className={`size-4 transition ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && (
            <ul className="divide-y divide-border">
              {timestamps.map((stamp, index) => (
                <li key={`${stamp.seconds}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setStartAt(Math.max(0, Math.floor(stamp.seconds)))}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-muted/50"
                  >
                    <span>{stamp.label}</span>
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {formatTime(stamp.seconds)}
                    </span>
                  </button>
                </li>
              ))}
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
  return `${m}:${String(rem).padStart(2, "0")}`;
}
