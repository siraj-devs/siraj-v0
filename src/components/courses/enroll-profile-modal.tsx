"use client";

import { enrollInCourse } from "@/app/actions/courses";
import { saveMyProfile } from "@/app/actions/profiles";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isArabicName, isValidPhone } from "@/lib/profile-fields";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

export function EnrollProfileModal({
  open,
  courseId,
  initialName = "",
  initialPhone = "",
  learningStarted,
  onClose,
}: {
  open: boolean;
  courseId: number;
  initialName?: string;
  initialPhone?: string;
  learningStarted: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);

  if (!open) return null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!isArabicName(name)) {
      toast.error("الاسم يجب أن يكون بالعربية");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("رقم الهاتف غير صالح");
      return;
    }

    startTransition(async () => {
      const saved = await saveMyProfile({ name, phone });
      if (!saved.success) {
        toast.error(saved.error);
        return;
      }

      const enrolled = await enrollInCourse(courseId);
      if (!enrolled.success) {
        toast.error(enrolled.error);
        if (enrolled.code === "unauthenticated") {
          router.push(`/login?next=/courses/${courseId}`);
        }
        return;
      }

      toast.success("تم حفظ الملف والالتحاق بالدورة");
      onClose();
      if (learningStarted) {
        router.push(`/portal/learning/${courseId}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <FormDialog
      title="أكمل ملفك ثم التحق"
      description="أدخل اسمك بالعربية ورقم هاتفك للالتحاق بالدورة مباشرة."
      onClose={onClose}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="حفظ والالتحاق"
      pendingLabel="جاري الحفظ…"
    >
      <div className="space-y-2">
        <Label htmlFor="enroll-profile-name">
          الاسم بالعربية{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="enroll-profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={pending}
          autoFocus
          placeholder="مثال: أحمد محمد"
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="enroll-profile-phone">
          رقم الهاتف{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="enroll-profile-phone"
          type="tel"
          dir="rtl"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          minLength={8}
          disabled={pending}
        />
      </div>
    </FormDialog>
  );
}
