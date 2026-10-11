"use client";

import type { ListProfileCard } from "@/app/actions/lists";
import { Button } from "@/components/ui/button";
import { campusLabelAr } from "@/lib/network-labels";
import { Calendar, MapPin, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function ProfileResultModal({
  open,
  status,
  profile,
  pending = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  status: "added" | "already" | "confirm";
  profile: ListProfileCard | null;
  pending?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile?.login, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, pending]);

  if (!open || !profile) return null;

  const added = status === "added";
  const confirming = status === "confirm";
  const year =
    profile.pool_year != null ? String(profile.pool_year) : "غير معروف";
  const campus = campusLabelAr(profile.campus) ?? "غير معروف";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-result-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-md animate-[fade-up_0.25s_ease-out] flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-6 sm:p-8 sm:pb-5">
          <div>
            <h2
              id="list-result-title"
              className="font-kufam text-2xl font-semibold text-foreground"
            >
              {confirming
                ? "إضافة إلى اللائحة"
                : added
                  ? "تمت الإضافة"
                  : "موجود في اللائحة"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {confirming
                ? "هذا الحساب موجود في 42 وغير موجود في اللائحة."
                : added
                  ? "أُضيف هذا الحساب إلى اللائحة."
                  : "هذا الحساب مضاف مسبقاً إلى هذه اللائحة."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8 sm:py-5">
          <div
            className={`flex flex-col items-center rounded-3xl px-5 py-6 text-center ${
              confirming ? "bg-muted/40" : added ? "bg-emerald-50" : "bg-amber-50"
            }`}
          >
            {profile.avatar && !avatarFailed ? (
              <Image
                src={profile.avatar}
                alt={profile.name}
                width={144}
                height={144}
                className="size-36 rounded-full object-cover ring-4 ring-background shadow-lg"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="flex size-36 items-center justify-center rounded-full bg-foreground font-kufam text-4xl text-background ring-4 ring-background shadow-lg">
                {profile.name.slice(0, 1)}
              </div>
            )}

            <p className="mt-5 font-kufam text-xl text-foreground">
              {profile.name}
            </p>
            <p className="mt-1 font-mono text-xs text-foreground/55">
              {profile.login}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-foreground ring-1 ring-foreground/10">
                <Calendar className="size-3.5 text-foreground/60" />
                {year}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-foreground ring-1 ring-foreground/10">
                <MapPin className="size-3.5 text-foreground/60" />
                {campus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border p-6 sm:px-8">
          {confirming ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={pending}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className="flex-1"
              >
                {pending ? "جاري الإضافة…" : "إضافة"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onClose} className="flex-1">
              حسناً
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
