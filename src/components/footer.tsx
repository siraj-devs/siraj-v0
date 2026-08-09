import { SocialIcon } from "@/components/social-icon";
import { isPublicPathDisabled } from "@/lib/disabled-pages";
import { getSession } from "@/lib/session";
import { getSocialDisplayName } from "@/lib/social-platforms";
import { getSocialLinks } from "@/lib/socials";
import Link from "next/link";
import { Logo } from "./logo";

export async function Footer() {
  const [session, joinDisabled, coursesDisabled, sessionsDisabled, socials] =
    await Promise.all([
      getSession(),
      isPublicPathDisabled("/join"),
      isPublicPathDisabled("/courses"),
      isPublicPathDisabled("/sessions"),
      getSocialLinks(),
    ]);

  return (
    <footer className="mt-auto border-t border-border bg-background py-12">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo className="size-12" />
          </Link>
        </div>

        <nav className="mb-8 flex flex-wrap justify-center gap-6 text-sm md:gap-8 md:text-base">
          <Link
            href="/"
            className="text-foreground transition-colors hover:text-primary"
          >
            الرئيسية
          </Link>
          {!coursesDisabled && (
            <Link
              href="/courses"
              className="text-foreground transition-colors hover:text-primary"
            >
              الدورات
            </Link>
          )}
          {!sessionsDisabled && (
            <Link
              href="/sessions"
              className="text-foreground transition-colors hover:text-primary"
            >
              الأمسيات
            </Link>
          )}
          {!joinDisabled && (
            <Link
              href="/join"
              className="text-foreground transition-colors hover:text-primary"
            >
              إنضم إلينا
            </Link>
          )}
          {!session && (
            <Link
              href="/login"
              className="text-foreground transition-colors hover:text-primary"
            >
              تسجيل الدخول
            </Link>
          )}
        </nav>

        {socials.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {socials.map((social) => {
              const title = getSocialDisplayName(social.label);
              return (
                <Link
                  key={social.label}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={title}
                >
                  <SocialIcon label={social.label} title={title} />
                </Link>
              );
            })}
          </div>
        )}

        <p className="flex items-center justify-between text-xs text-muted-foreground md:text-sm">
          <span>© 2026 سراج</span>
          <span>
            صمم من طرف{" "}
            <Link
              href="https://github.com/siraj-devs"
              target="_blank"
              rel="noopener noreferrer"
            >
              sirajdevs
            </Link>
          </span>
        </p>
      </div>
    </footer>
  );
}
