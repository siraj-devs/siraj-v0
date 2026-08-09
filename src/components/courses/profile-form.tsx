"use client";

import {
  type MemberDcConnection,
  type MemberFtConnection,
  submitProfileChangeRequest,
  unlinkMyConnection,
} from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppMember } from "@/lib/members";
import { encodeOAuthState } from "@/lib/oauth-state";
import type { ProfileChangeRequest } from "@/lib/profile-requests";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

function FortyTwoIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.581 16.851H24v-4.439ZM24 3.574h-4.419v4.42l-4.419 4.418v4.44h4.419v-4.44L24 7.993Zm-4.419 0h-4.419v4.42zm-6.324 8.838H4.419l8.838-8.838H8.838L0 12.412v3.595h8.838v4.419h4.419z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}{" "}
      <span className="text-destructive" aria-hidden>
        *
      </span>
    </Label>
  );
}

const LINK_ERROR_MESSAGES: Record<string, string> = {
  unauthenticated: "يجب تسجيل الدخول أولاً لربط الحساب",
  not_member: "أكمل ملفك وانتظر الموافقة قبل ربط حساب إضافي",
  already_linked: "هذا النوع من الحساب مربوط مسبقاً",
  connection_taken: "هذا الحساب مرتبط بعضو آخر",
  update_failed: "تعذر ربط الحساب",
  oauth_error: "فشل التفويض من مزود الحساب",
  no_code: "لم يكتمل التفويض",
  user_info_error: "تعذر جلب بيانات الحساب",
  connection_failed: "تعذر حفظ الاتصال",
};

export function ProfileForm({
  member,
  pendingRequest,
  complete,
  ftConnection,
  dcConnection,
  sessionProvider,
  redirectTo,
  linkedProvider,
  linkError,
}: {
  member: AppMember | null;
  pendingRequest: ProfileChangeRequest | null;
  complete: boolean;
  ftConnection: MemberFtConnection | null;
  dcConnection: MemberDcConnection | null;
  sessionProvider: "42" | "discord";
  redirectTo?: string;
  linkedProvider?: "42" | "discord";
  linkError?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(
    pendingRequest?.requested_name ?? member?.name ?? "",
  );
  const [email, setEmail] = useState(
    pendingRequest?.requested_email ?? member?.email ?? "",
  );
  const [phone, setPhone] = useState(
    pendingRequest?.requested_phone ?? member?.phone ?? "",
  );

  useEffect(() => {
    if (linkedProvider) {
      toast.success(
        linkedProvider === "42"
          ? "تم ربط حساب 42 بنجاح"
          : "تم ربط حساب ديسكورد بنجاح",
      );
      router.replace("/profile");
      return;
    }
    if (linkError) {
      toast.error(LINK_ERROR_MESSAGES[linkError] ?? "تعذر ربط الحساب");
      router.replace("/profile");
    }
  }, [linkedProvider, linkError, router]);

  const canSubmit = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) return false;
    if (trimmedPhone.length < 8) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return false;

    if (member) {
      const sameAsCurrent =
        trimmedName === member.name.trim() &&
        trimmedEmail.toLowerCase() ===
          (member.email ?? "").trim().toLowerCase() &&
        trimmedPhone === (member.phone ?? "").trim();
      if (sameAsCurrent) return false;
    }

    return true;
  }, [name, email, phone, member]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pendingRequest || !canSubmit) return;

    startTransition(async () => {
      const result = await submitProfileChangeRequest({ name, email, phone });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم إرسال الطلب — بانتظار موافقة المالك");
      router.refresh();
      if (redirectTo) router.push(redirectTo);
    });
  }

  function startLink(provider: "42" | "discord") {
    const state = encodeOAuthState({ redirect: "/profile", link: true });
    const base =
      provider === "discord" ? "/api/auth/discord" : "/api/auth/42";
    router.push(`${base}?state=${state}`);
  }

  function onUnlink(provider: "42" | "discord") {
    startTransition(async () => {
      const result = await unlinkMyConnection(provider);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        provider === "42"
          ? "تم إلغاء ربط حساب 42"
          : "تم إلغاء ربط حساب ديسكورد",
      );
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative space-y-3">
          <p className="text-sm text-primary">حسابك</p>
          <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            الملف الشخصي
          </h1>
          <p className="max-w-lg text-foreground/65">
            {member
              ? "أي تعديل على الاسم أو البريد أو الهاتف يُرسل كطلب ويُطبَّق بعد موافقة المالك."
              : "أكمل بياناتك وأرسل طلباً للمراجعة. بعد الموافقة تُحفظ عضويتك في النادي."}
          </p>
        </div>
      </header>

      {complete && member && (
        <section className="space-y-4 rounded-3xl border border-border/80 bg-background/70 p-6 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] sm:p-8">
          <div>
            <h2 className="font-kufam text-xl text-foreground">
              الحسابات المرتبطة
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              يمكنك ربط حساب 42 وديسكورد بنفس العضوية دون تسجيل خروج. إلغاء
              الربط متاح للحساب الذي لم تسجّل الدخول به.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  {ftConnection?.avatar ? (
                    <Image
                      src={ftConnection.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 rounded-xl object-cover"
                    />
                  ) : (
                    <FortyTwoIcon className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">حساب 42</p>
                  <p className="truncate font-medium text-foreground" dir="ltr">
                    {ftConnection ? `@${ftConnection.login}` : "غير مربوط"}
                  </p>
                </div>
              </div>
              {!ftConnection ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  disabled={pending}
                  onClick={() => startLink("42")}
                >
                  <FortyTwoIcon className="size-3.5" />
                  ربط
                </Button>
              ) : sessionProvider !== "42" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={pending}
                  onClick={() => onUnlink("42")}
                >
                  إلغاء الربط
                </Button>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  {dcConnection?.avatar ? (
                    <Image
                      src={dcConnection.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 rounded-xl object-cover"
                    />
                  ) : (
                    <DiscordIcon className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">ديسكورد</p>
                  <p className="truncate font-medium text-foreground" dir="ltr">
                    {dcConnection ? `@${dcConnection.username}` : "غير مربوط"}
                  </p>
                </div>
              </div>
              {!dcConnection ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  disabled={pending}
                  onClick={() => startLink("discord")}
                >
                  <DiscordIcon className="size-3.5" />
                  ربط
                </Button>
              ) : sessionProvider !== "discord" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={pending}
                  onClick={() => onUnlink("discord")}
                >
                  إلغاء الربط
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-3xl border border-border/80 bg-background/70 p-6 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] sm:p-8"
      >
        {pendingRequest && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            لديك طلب قيد المراجعة منذ{" "}
            {new Date(pendingRequest.created_at).toLocaleDateString("ar")}. لا
            يمكن إرسال طلب جديد حتى تتم المراجعة.
          </div>
        )}

        <div className="space-y-2">
          <RequiredLabel htmlFor="profile-name">الاسم</RequiredLabel>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={Boolean(pendingRequest) || pending}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <RequiredLabel htmlFor="profile-email">
            البريد الإلكتروني
          </RequiredLabel>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={Boolean(pendingRequest) || pending}
          />
        </div>

        <div className="space-y-2">
          <RequiredLabel htmlFor="profile-phone">رقم الهاتف</RequiredLabel>
          <Input
            id="profile-phone"
            type="tel"
            dir="rtl"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={8}
            disabled={Boolean(pendingRequest) || pending}
          />
        </div>

        {!pendingRequest && (
          <Button
            type="submit"
            disabled={pending || !canSubmit}
            className="w-full sm:w-auto"
          >
            {pending ? "جاري الإرسال…" : "إرسال طلب التحديث"}
          </Button>
        )}
      </form>
    </div>
  );
}
