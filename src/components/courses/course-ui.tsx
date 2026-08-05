"use client";

import type { CourseContentType } from "@/lib/course-types";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Headphones,
  HelpCircle,
  PlayCircle,
  Star,
} from "lucide-react";
import { useState } from "react";

export const CONTENT_TYPE_ICON = {
  watching: PlayCircle,
  listening: Headphones,
  reading: BookOpen,
  exam: HelpCircle,
} as const satisfies Record<CourseContentType, React.ElementType>;

export const CONTENT_TYPE_HINT: Record<CourseContentType, string> = {
  watching: "درس مرئي",
  listening: "درس صوتي",
  reading: "مادة مقروءة",
  exam: "اختبار",
};

export function StarRating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "size-3.5",
              value >= star - 0.5
                ? "fill-primary text-primary"
                : "fill-transparent text-primary/25",
            )}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-foreground/80">
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  );
}

export function RatingInput({
  value,
  disabled,
  onRate,
}: {
  value: number | null;
  disabled?: boolean;
  onRate: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const locked = value !== null || disabled;
  const shown = hovered ?? value ?? 0;

  return (
    <div
      className="flex gap-1"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={locked}
          onClick={() => onRate(star)}
          onMouseEnter={() => !locked && setHovered(star)}
          onFocus={() => !locked && setHovered(star)}
          aria-label={`${star} من 5`}
          className={cn(
            "rounded-md p-1 transition-colors",
            locked ? "cursor-default" : "cursor-pointer hover:bg-primary/8",
          )}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              shown >= star
                ? "fill-primary text-primary"
                : "fill-transparent text-primary/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 56,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const stroke = size >= 64 ? 5 : 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-primary/12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * clamped) / 100}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground"
        dir="ltr"
      >
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export function MetaChip({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-foreground/70">
      {Icon && <Icon className="size-3.5 text-primary/70" />}
      {children}
    </span>
  );
}
