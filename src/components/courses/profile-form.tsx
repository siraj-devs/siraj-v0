"use client";

import { submitProfileChangeRequest } from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppMember } from "@/lib/members";
import type { ProfileChangeRequest } from "@/lib/profile-requests";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

export function ProfileForm({
  member,
  pendingRequest,
  complete,
  redirectTo,
}: {
  member: AppMember | null;
  pendingRequest: ProfileChangeRequest | null;
  complete: boolean;
  redirectTo?: string;
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

  if (!member) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16">
        <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 text-center md:px-10 md:py-10">
          <p className="text-sm text-primary">حسابك</p>
          <h1 className="mt-2 font-kufam text-3xl font-semibold tracking-tight md:text-4xl">
            الملف الشخصي
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-foreground/65">
            يجب أن تكون عضواً مسجّلاً في النادي لتحديث بياناتك والالتحاق بالدورات.
          </p>
          <Button asChild className="mt-6">
            <Link href="/join">إنضم إلينا</Link>
          </Button>
        </header>
      </div>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pendingRequest) return;

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative space-y-3">
          <p className="text-sm text-primary">حسابك</p>
          <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            الملف الشخصي
          </h1>
          <p className="max-w-lg text-foreground/65">
            أي تعديل على الاسم أو البريد أو الهاتف يُرسل كطلب ويُطبَّق بعد موافقة
            المالك.
          </p>
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className={`rounded-2xl border px-4 py-3 ${
              complete
                ? "border-primary/40 bg-background shadow-sm"
                : "border-transparent bg-background/50"
            }`}
          >
            <p className="text-xs text-muted-foreground">حالة الملف</p>
            <p className="mt-1 font-kufam text-xl text-foreground">
              {complete ? "مكتمل" : "غير مكتمل"}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">طلب قيد المراجعة</p>
            <p className="mt-1 font-kufam text-xl text-foreground">
              {pendingRequest ? "نعم" : "لا"}
            </p>
          </div>
        </div>
      </header>

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
          <Label htmlFor="profile-name">الاسم</Label>
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
          <Label htmlFor="profile-email">البريد الإلكتروني</Label>
          <Input
            id="profile-email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={Boolean(pendingRequest) || pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-phone">رقم الهاتف</Label>
          <Input
            id="profile-phone"
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={8}
            disabled={Boolean(pendingRequest) || pending}
          />
        </div>

        {!pendingRequest && (
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "جاري الإرسال…" : "إرسال طلب التحديث"}
          </Button>
        )}
      </form>
    </div>
  );
}
