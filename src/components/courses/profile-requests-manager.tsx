"use client";

import { reviewProfileChangeRequest } from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";
import type { ProfileChangeRequest } from "@/lib/profile-requests";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

const STATUS_LABEL: Record<ProfileChangeRequest["status"], string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

const STATUS_STYLE: Record<ProfileChangeRequest["status"], string> = {
  pending: "bg-amber-500/10 text-amber-900",
  approved: "bg-emerald-500/10 text-emerald-800",
  rejected: "bg-rose-500/10 text-rose-800",
};

export function ProfileRequestsManager({
  requests,
}: {
  requests: ProfileChangeRequest[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  function onReview(id: number, decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewProfileChangeRequest({ id, decision });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(decision === "approved" ? "تم قبول الطلب" : "تم رفض الطلب");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative space-y-3">
          <p className="text-sm text-primary">إدارة الفريق</p>
          <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            طلبات الملف الشخصي
          </h1>
          <p className="max-w-lg text-foreground/65">
            راجع طلبات تحديث الاسم والبريد والهاتف قبل تطبيقها على حساب العضو.
          </p>
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/40 bg-background px-4 py-3 shadow-sm">
            <p className="text-xs text-muted-foreground">قيد المراجعة</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {requests.length}
            </p>
          </div>
        </div>
      </header>

      {requests.length > 0 ? (
        <ul className="space-y-3">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:px-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-kufam text-lg text-foreground">
                      {request.member_name ??
                        (request.member_id
                          ? `عضو #${request.member_id}`
                          : "طلب انضمام جديد")}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[request.status]}`}
                    >
                      {STATUS_LABEL[request.status]}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70">
                    الاسم:{" "}
                    <span className="font-medium text-foreground">
                      {request.requested_name}
                    </span>
                  </p>
                  <p
                    className="font-mono text-sm text-muted-foreground"
                    dir="ltr"
                  >
                    {request.requested_email} · {request.requested_phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleString("ar")}
                  </p>
                </div>

                {request.status === "pending" && (
                  <div className="flex shrink-0 gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => onReview(request.id, "approved")}
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/40"
                    >
                      <Check className="size-4" />
                      قبول
                    </Button>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => onReview(request.id, "rejected")}
                      className="gap-1.5 border border-rose-600 bg-rose-600-transparent text-rose-600 hover:bg-rose-50 focus-visible:ring-rose-600/40"
                    >
                      <X className="size-4" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-kufam text-lg text-foreground">لا طلبات حالياً</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            ستظهر هنا طلبات الأعضاء عند تحديث بياناتهم الشخصية.
          </p>
        </div>
      )}
    </div>
  );
}
