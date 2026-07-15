"use client";

import LoginButton from "@/components/login-button";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "الرئيسية" },
] as const;

type SiteHeaderProps = {
  isLoggedIn: boolean;
  user: (SessionData["user"] & { isAdmin: boolean }) | null;
};

export function SiteHeader({ isLoggedIn, user }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const auth = !isLoggedIn ? (
    <LoginButton varient="secondary" size="sm" />
  ) : (
    <UserMenu user={user} />
  );

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 lg:grid lg:grid-cols-3">
        <div className="flex items-center">
          <Link href="/" onClick={() => setOpen(false)}>
            <Logo className="size-10" />
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden justify-center gap-8 text-base lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden justify-end lg:flex">{auth}</div>

        {/* Mobile / tablet toggle */}
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile / tablet menu */}
      {open && (
        <>
          <div
            className="fixed inset-0 top-[73px] z-40 bg-foreground/20 backdrop-blur-[2px] lg:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full z-50 border-b border-border bg-background px-4 py-6 shadow-lg lg:hidden"
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border pt-4">{auth}</div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
