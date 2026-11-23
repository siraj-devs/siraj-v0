import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Titled group inside a FormDialog body (icon tile + title + optional hint). */
export function FormSection({
  icon,
  title,
  hint,
  aside,
  className,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-4">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-kufam text-base leading-tight text-foreground">
              {title}
            </h3>
            {hint && (
              <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
