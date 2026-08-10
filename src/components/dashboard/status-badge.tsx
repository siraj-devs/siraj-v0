import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

const TONE_CLASSES = {
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  rose: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

export type BadgeTone = keyof typeof TONE_CLASSES;

/** Generic pill badge (icon + label) used for course/session status chips. */
export function StatusBadge({
  tone,
  icon,
  label,
  size = "md",
}: {
  tone: BadgeTone;
  icon: ReactNode;
  label: string;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-0.5" : "px-3 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs font-medium ring-1 ring-inset ${pad} ${TONE_CLASSES[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

/** Published/hidden badge shared by the sessions and courses managers. */
export function PublishBadge({
  published,
  size = "md",
}: {
  published: boolean;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <StatusBadge
      tone={published ? "emerald" : "amber"}
      icon={
        published ? (
          <Eye className={iconSize} />
        ) : (
          <EyeOff className={iconSize} />
        )
      }
      label={published ? "منشور" : "مخفي"}
      size={size}
    />
  );
}
