"use client";

import {
  createCourseClass,
  deleteCourseClass,
  updateCourseClass,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatClassDate,
  formatRegistrationWindow,
  isClassOpen,
  type CourseClass,
} from "@/lib/course-schedule";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

export function CourseClassesPanel({
  courseId,
  classes,
  selectedId,
  onSelect,
  summaries = {},
}: {
  courseId: number;
  classes: CourseClass[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  summaries?: Record<
    number,
    { lessons: number; exams: number; participants: number }
  >;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CourseClass | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<CourseClass | null>(null);
  const [registrationOpensOn, setRegistrationOpensOn] = useState("");
  const [registrationClosesOn, setRegistrationClosesOn] = useState("");
  const [learningStartsAt, setLearningStartsAt] = useState("");

  function openCreate() {
    setEditing(null);
    setRegistrationOpensOn("");
    setRegistrationClosesOn("");
    setLearningStartsAt("");
    setOpen(true);
  }

  function openEdit(courseClass: CourseClass) {
    setEditing(courseClass);
    setRegistrationOpensOn(courseClass.registration_opens_on.slice(0, 10));
    setRegistrationClosesOn(courseClass.registration_closes_on.slice(0, 10));
    setLearningStartsAt(courseClass.learning_starts_at.slice(0, 10));
    setOpen(true);
  }

  function closeForm() {
    if (pending) return;
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      if (editing) {
        const result = await updateCourseClass({
          id: editing.id,
          course_id: courseId,
          registration_opens_on: registrationOpensOn,
          registration_closes_on: registrationClosesOn,
          learning_starts_at: learningStartsAt,
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
      } else {
        const result = await createCourseClass({
          course_id: courseId,
          registration_opens_on: registrationOpensOn,
          registration_closes_on: registrationClosesOn,
          learning_starts_at: learningStartsAt,
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        onSelect(result.id);
      }
      toast.success(editing ? "تم تعديل الدفعة" : "تم فتح الدفعة");
      setOpen(false);
      setEditing(null);
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
            اختر دفعة لعرض دروسها وملتحقيها. التسجيل مفتوح بين تاريخ الفتح
            والإغلاق، وبداية التعلم منفصلة.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="size-4" />
          دفعة جديدة
        </Button>
      </div>

      {classes.length > 0 ? (
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {classes.map((courseClass, index) => {
            const selected = courseClass.id === selectedId;
            const openNow = isClassOpen(courseClass);
            return (
              <li key={courseClass.id}>
                <div
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                    selected
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-border/80 bg-background/70 hover:border-primary/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(courseClass.id)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <p className="flex flex-wrap items-center gap-2 font-kufam text-lg text-foreground">
                      الدفعة {index + 1}
                      {openNow && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
                          التسجيل مفتوح
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      التسجيل{" "}
                      <span className="text-foreground">
                        {formatRegistrationWindow(courseClass)}
                      </span>
                      {" · بداية التعلم "}
                      <span className="text-foreground">
                        {formatClassDate(courseClass.learning_starts_at)}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {summaries[courseClass.id]?.lessons ?? 0} دروس
                      {" · "}
                      {summaries[courseClass.id]?.exams ?? 0} اختبارات
                      {" · "}
                      {summaries[courseClass.id]?.participants ?? 0} ملتحقون
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="تعديل الدفعة"
                      onClick={() => openEdit(courseClass)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="حذف الدفعة"
                      onClick={() => setDeleting(courseClass)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
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
          title={editing ? "تعديل الدفعة" : "دفعة جديدة"}
          description="حدد فترة التسجيل وبداية التعلم."
          onClose={closeForm}
          onSubmit={onSubmit}
          pending={pending}
          submitLabel={editing ? "حفظ" : "فتح الدفعة"}
        >
          <div className="space-y-2">
            <Label htmlFor="class-registration-opens">فتح التسجيل</Label>
            <Input
              id="class-registration-opens"
              type="date"
              required
              value={registrationOpensOn}
              onChange={(event) => {
                const value = event.target.value;
                setRegistrationOpensOn(value);
                if (!registrationClosesOn || registrationClosesOn < value) {
                  setRegistrationClosesOn(value);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-registration-closes">إغلاق التسجيل</Label>
            <Input
              id="class-registration-closes"
              type="date"
              required
              value={registrationClosesOn}
              min={registrationOpensOn || undefined}
              onChange={(event) => setRegistrationClosesOn(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-start">بداية التعلم</Label>
            <Input
              id="class-start"
              type="date"
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
        description="سيُحذف ملتحقو هذه الدفعة ودروسها."
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onDelete}
      />
    </section>
  );
}
