import LoginButton from "@/components/login-button";
import { checkFormCompletionStatus } from "@/lib/form-status";
import { redirect } from "next/navigation";

export default async function Page() {
  const formStatus = await checkFormCompletionStatus();
  if (formStatus.isLoggedIn) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h1 className="mb-6 font-kufam text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
          مرحباً بك في نادي سراج
        </h1>

        <p className="mb-2 text-base leading-relaxed text-muted-foreground lg:text-lg">
          سجل دخولك باستخدام حساب 42 أو ديسكورد للانضمام إلى النادي.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <LoginButton provider="42" />
        <LoginButton provider="discord" varient="secondary" />
      </div>
    </div>
  );
}
