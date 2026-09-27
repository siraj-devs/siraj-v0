"use client";

import {
  createCourseClass,
  deleteCourseClass,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatClassDate,
  fromDatetimeLocalValue,
  isRegistrationOpen,
  type CourseClass,
} from "@/lib/course-schedule";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

function classStatus(courseClass: CourseClass, now = new Date()) {
  if (now.getTime() < new Date(courseClass.registration_opens_at).getTime()) {
    return { label: "لم يُفتح التسجيل", tone: "bg-amber-500/10 text-amber-900" };
  }
  if (isRegistrationOpen(courseClass, now)) {
    return { label: "التسجيل مفتوح", tone: "bg-emerald-500/10 text-emerald-800" };
  }
  return { label: "انتهى التسجيل", tone: "bg-muted text-muted-foreground" };
}

export function CourseClassesPanel({
  courseId,
  classes,
}: {
  courseId: number;
  classes: CourseClass[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<CourseClass | null>(null);
  const [registrationOpensAt, setRegistrationOpensAt] = useState("");
  const [registrationClosesAt, setRegistrationClosesAt] = useState("");
  const [learningStartsAt, setLearningStartsAt] = useState("");

  function openCreate() {
    setRegistrationOpensAt("");
    setRegistrationClosesAt("");
    setLearningStartsAt("");
    setOpen(true);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createCourseClass({
        course_id: courseId,
        registration_opens_at: fromDatetimeLocalValue(registrationOpensAt),
        registration_closes_at: fromDatetimeLocalValue(registrationClosesAt),
        learning_starts_at: fromDatetimeLocalValue(learningStartsAt),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم فتح الدفعة");
      setOpen(false);
      router.refresh();
    });
  }

  function onDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCourseClass(deleting.id, courseId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف الدفعة");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-kufam text-2xl font-semibold text-foreground">
            الدفعات
          </h2>
          <p className="max-w-xl text-sm text-foreground/65">
            افتح دفعة ليتمكن المشاركون من الالتحاق. كل دفعة لها فترة تسجيل
            وتاريخ بداية التعلم.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="size-4" />
          دفعة جديدة
        </Button>
      </div>

      {classes.length > 0 ? (
        <ol className="space-y-3">
          {classes.map((courseClass, index) => {
            const status = classStatus(courseClass);
            return (
              <li
                key={courseClass.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-kufam text-lg text-foreground">
                      الدفعة {index + 1}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
                    <div>
                      <dt>فتح التسجيل</dt>
                      <dd className="text-foreground">
                        {formatClassDate(courseClass.registration_opens_at)}
                      </dd>
                    </div>
                    <div>
                      <dt>إغلاق التسجيل</dt>
                      <dd className="text-foreground">
                        {formatClassDate(courseClass.registration_closes_at)}
                      </dd>
                    </div>
                    <div>
                      <dt>بداية التعلم</dt>
                      <dd className="text-foreground">
                        {formatClassDate(courseClass.learning_starts_at)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="حذف الدفعة"
                  onClick={() => setDeleting(courseClass)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          لا توجد دفعة بعد. لن يتمكن أحد من الالتحاق قبل فتح دفعة.
        </p>
      )}

      {open && (
        <FormDialog
          title="دفعة جديدة"
          description="حدّد متى يُفتح التسجيل ومتى يُغلق، ومتى يبدأ التعلم."
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
          pending={pending}
          submitLabel="فتح الدفعة"
        >
          <div className="space-y-2">
            <Label htmlFor="class-open">فتح التسجيل</Label>
            <Input
              id="class-open"
              type="datetime-local"
              required
              value={registrationOpensAt}
              onChange={(event) => setRegistrationOpensAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-close">إغلاق التسجيل</Label>
            <Input
              id="class-close"
              type="datetime-local"
              required
              value={registrationClosesAt}
              onChange={(event) => setRegistrationClosesAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-start">بداية التعلم</Label>
            <Input
              id="class-start"
              type="datetime-local"
              required
              value={learningStartsAt}
              onChange={(event) => setLearningStartsAt(event.target.value)}
            />
          </div>
        </FormDialog>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف الدفعة"
        description="سيبقى الملتحقون في الدورة، لكن دروسهم لن تُقيَّد بموعد هذه الدفعة."
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onDelete}
      />
    </section>
  );
}
