"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

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
 *
 * Menu is portaled to `document.body` with fixed positioning so it always
 * floats above cards / grid siblings and is never clipped by overflow or
 * stacking contexts on parents.
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
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    function updatePosition() {
      const trigger = rootRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 160; // w-40
      const gap = 4;
      const padding = 8;

      let left = rect.left;
      left = Math.min(left, window.innerWidth - menuWidth - padding);
      left = Math.max(padding, left);

      const preferDown = placement === "down";
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const estimatedHeight = items.length * 42 + 8;
      const openDown =
        preferDown
          ? spaceBelow >= Math.min(estimatedHeight, 80) || spaceBelow >= spaceAbove
          : spaceAbove < Math.min(estimatedHeight, 80) && spaceBelow > spaceAbove;

      if (openDown) {
        setMenuStyle({
          position: "fixed",
          top: rect.bottom + gap,
          left,
          width: menuWidth,
          zIndex: 100,
        });
      } else {
        setMenuStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + gap,
          left,
          width: menuWidth,
          zIndex: 100,
        });
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, placement, items.length]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const menu =
    open && mounted && menuStyle ? (
      <div
        ref={menuRef}
        style={menuStyle}
        className="overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg"
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
    ) : null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={
          buttonClassName ??
          "rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        }
        aria-label={ariaLabel}
      >
        <MoreHorizontal className="size-5" />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
