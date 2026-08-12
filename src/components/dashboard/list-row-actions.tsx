"use client";

import { Button } from "@/components/ui/button";
import {
  KebabMenu,
  type KebabMenuItem,
} from "@/components/dashboard/kebab-menu";
import Link from "next/link";

/**
 * List-row actions used by dashboard managers:
 * - `lg+`: inline outline icon buttons (same pattern as course lessons)
 * - below `lg`: the shared 3-dots kebab menu
 *
 * Grid cards keep using `KebabMenu` directly at all breakpoints.
 */
export function ListRowActions({
  items,
  open,
  onToggle,
  onClose,
  menuPlacement = "up",
  ariaLabel = "خيارات",
}: {
  items: KebabMenuItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  menuPlacement?: "up" | "down";
  ariaLabel?: string;
}) {
  return (
    <>
      <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
        {items.map((item) => {
          const destructiveClass =
            item.variant === "destructive"
              ? "text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              : undefined;

          if (item.href) {
            return (
              <Button
                key={item.key}
                type="button"
                size="icon"
                variant="outline"
                asChild
                aria-label={item.label}
                title={item.label}
                className="[&_svg]:size-4"
              >
                <Link href={item.href}>{item.icon}</Link>
              </Button>
            );
          }

          return (
            <Button
              key={item.key}
              type="button"
              size="icon"
              variant="outline"
              disabled={item.disabled}
              aria-label={item.label}
              title={item.label}
              onClick={item.onClick}
              className={`[&_svg]:size-4 ${destructiveClass ?? ""}`}
            >
              {item.icon}
            </Button>
          );
        })}
      </div>

      <div className="relative shrink-0 lg:hidden">
        <KebabMenu
          items={items}
          open={open}
          onToggle={onToggle}
          onClose={onClose}
          placement={menuPlacement}
          ariaLabel={ariaLabel}
        />
      </div>
    </>
  );
}
