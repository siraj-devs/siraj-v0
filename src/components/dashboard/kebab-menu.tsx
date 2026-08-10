"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

export type KebabMenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

/**
 * Generic dropdown "..." action menu shared by dashboard list/grid cards
 * (courses, sessions, meetings, …). Items can either navigate (`href`) or
 * run an action (`onClick`).
 */
export function KebabMenu({
  items,
  open,
  onToggle,
  onClose,
  placement = "down",
  buttonClassName,
  ariaLabel = "خيارات",
}: {
  items: KebabMenuItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  placement?: "up" | "down";
  buttonClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={
          buttonClassName ??
          "rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        }
        aria-label={ariaLabel}
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <div
            className={`absolute left-0 z-50 w-40 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg ${
              placement === "up" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
          >
            {items.map((item) =>
              item.href ? (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    onClose();
                    item.onClick?.();
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm disabled:opacity-40 ${
                    item.variant === "destructive"
                      ? "text-destructive hover:bg-destructive/10"
                      : "hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
