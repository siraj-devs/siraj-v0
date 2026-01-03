import { checkFormCompletionStatus } from "@/lib/form-status";
import { getSession } from "@/lib/session";
import Image from "next/image";
import Link from "next/link";
import LoginButton from "./login-button";
import { Logo } from "./logo";

export async function Header() {
  const formStatus = await checkFormCompletionStatus();
  const session = await getSession();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 grid grid-cols-3 items-center py-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Logo className="size-10" />
          </Link>
        </div>

        <nav className="flex- flex justify-center gap-6 text-sm md:gap-8 md:text-base">
          <Link
            href="/"
            className="text-foreground transition-colors hover:text-primary"
          >
            الرئيسية
          </Link>
          {/* <Link
            href="#"
            className="text-foreground transition-colors hover:text-primary"
          >
            الأمسيات
          </Link>
          <Link
            href="#"
            className="text-foreground transition-colors hover:text-primary"
          >
            التبرعات
          </Link>
          <Link
            href="/join"
            className="text-foreground transition-colors hover:text-primary"
          >
            انضم إلينا
          </Link> */}
        </nav>

        <div className="flex justify-end">
          {!formStatus.isLoggedIn ? (
            <LoginButton varient="secondary" size="sm" />
          ) : (
            <Link
              href={`https://profile.intra.42.fr/users/${session?.user.login}`}
              target="_blank"
            >
              <Image
                src={session?.user.image ?? ""}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full border-2 border-[#0E0E0E]"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
