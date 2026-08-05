"use client";

import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import type { MemberRole } from "@/lib/members";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const allLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/courses", label: "الدورات" },
  { href: "/join", label: "إنضم إلينا" },
] as const;

type SiteHeaderProps = {
  isLoggedIn: boolean;
  showLogin?: boolean;
  showJoin?: boolean;
  showCourses?: boolean;
  user: (SessionData["user"] & {
    isAdmin: boolean;
    role: MemberRole | null;
  }) | null;
};

export function SiteHeader({
  isLoggedIn,
  showLogin = true,
  showJoin = true,
  showCourses = true,
  user,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const links = allLinks.filter((link) => {
    if (link.href === "/join") return showJoin;
    if (link.href === "/courses") return showCourses;
    return true;
  });

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

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 lg:grid lg:grid-cols-3">
        <div className="flex items-center">
          <Link href="/" onClick={() => setOpen(false)}>
            <Logo className="size-10" />
          </Link>
        </div>

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

        <div className="flex items-center justify-end gap-2">
          {isLoggedIn ? (
            <UserMenu user={user} />
          ) : showLogin ? (
            <Button asChild variant="secondary" size="sm" className="hidden lg:inline-flex">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
          ) : null}

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
      </div>

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
              {!isLoggedIn && showLogin && (
                <div className="border-t border-border pt-4">
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      تسجيل الدخول
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
