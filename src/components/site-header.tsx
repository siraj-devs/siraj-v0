"use client";

import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import type { MemberRole } from "@/lib/member-role";
import type { PageGrant } from "@/lib/page-permissions";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const allLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/courses", label: "الدورات" },
  { href: "/sessions", label: "الأمسيات" },
  { href: "/join", label: "إنضم إلينا" },
] as const;

type SiteHeaderProps = {
  isLoggedIn: boolean;
  showLogin?: boolean;
  showJoin?: boolean;
  showCourses?: boolean;
  showSessions?: boolean;
  user: (SessionData["user"] & {
    isAdmin: boolean;
    role: MemberRole | null;
    pagePermissions: PageGrant[];
  }) | null;
};

export function SiteHeader({
  isLoggedIn,
  showLogin = true,
  showJoin = true,
  showCourses = true,
  showSessions = true,
  user,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const links = allLinks.filter((link) => {
    if (link.href === "/join") return showJoin;
    if (link.href === "/courses") return showCourses;
    if (link.href === "/sessions") return showSessions;
    return true;
  });

  function setMobileMenu(next: boolean) {
    if (next) setUserMenuOpen(false);
    setMobileOpen(next);
  }

  function setUserMenu(next: boolean) {
    if (next) setMobileOpen(false);
    setUserMenuOpen(next);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 lg:grid lg:grid-cols-3">
        <div className="flex items-center">
          <Link href="/" onClick={() => setMobileMenu(false)}>
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
            <UserMenu
              user={user}
              open={userMenuOpen}
              onOpenChange={setUserMenu}
            />
          ) : showLogin ? (
            <Button asChild variant="secondary" size="sm" className="hidden lg:inline-flex">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
          ) : null}

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setMobileMenu(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-[73px] z-40 bg-foreground/20 backdrop-blur-[2px] lg:hidden"
            aria-hidden
            onClick={() => setMobileMenu(false)}
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
                    onClick={() => setMobileMenu(false)}
                    className="rounded-md px-3 py-3 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              {!isLoggedIn && showLogin && (
                <div className="border-t border-border pt-4">
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/login" onClick={() => setMobileMenu(false)}>
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
