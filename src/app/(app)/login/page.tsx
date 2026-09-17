import LoginButton from "@/components/login-button";
import { checkFormCompletionStatus } from "@/lib/form-status";
import { redirect } from "next/navigation";

function loginHook(next: string) {
  if (next.startsWith("/sessions")) {
    return {
      title: "الأمسيات بانتظارك",
      description:
        "سجّل دخولك لمشاهدة تسجيلات الأمسيات كاملة والانضمام إلى المجالس.",
    };
  }
  if (next.startsWith("/dashboard")) {
    return {
      title: "لوحة التحكم",
      description:
        "سجّل دخولك للوصول إلى لوحة التحكم وإدارة الدورات والأمسيات والمحتوى.",
    };
  }
  if (next.startsWith("/courses")) {
    return {
      title: "تابع رحلتك التعليمية",
      description:
        "سجّل دخولك للالتحاق بالدورات ومتابعة الدروس والاختبارات من حيث توقفت.",
    };
  }
  if (next.startsWith("/profile") || next.startsWith("/join")) {
    return {
      title: "أكمل ملفك في سراج",
      description:
        "سجّل دخولك لإكمال ملفك والانضمام إلى الفريق.",
    };
  }
  return {
    title: "مرحباً بك في سراج",
    description:
      "ادخل لتشاهد الأمسيات، تتابع دوراتك، وتصل إلى لوحة التحكم.",
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const formStatus = await checkFormCompletionStatus();
  if (formStatus.isLoggedIn) redirect(safeNext);

  const hook = loginHook(safeNext);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h1 className="mb-6 font-kufam text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
          {hook.title}
        </h1>

        <p className="mb-2 text-base leading-relaxed text-muted-foreground lg:text-lg">
          {hook.description}
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <LoginButton provider="42" next={safeNext} />
        <LoginButton provider="discord" next={safeNext} />
      </div>
    </div>
  );
}
