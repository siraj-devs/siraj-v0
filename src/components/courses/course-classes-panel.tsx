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
import { formatClassDate, type CourseClass } from "@/lib/course-schedule";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

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
  const [learningStartsAt, setLearningStartsAt] = useState("");

  function openCreate() {
    setLearningStartsAt("");
    setOpen(true);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createCourseClass({
        course_id: courseId,
        learning_starts_at: learningStartsAt,
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
            افتح دفعة ليتمكن المشاركون من الالتحاق، وحدّد تاريخ بداية التعلم.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="size-4" />
          دفعة جديدة
        </Button>
      </div>

      {classes.length > 0 ? (
        <ol className="space-y-3">
          {classes.map((courseClass, index) => (
            <li
              key={courseClass.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 p-4"
            >
              <div className="min-w-0">
                <p className="font-kufam text-lg text-foreground">
                  الدفعة {index + 1}
                </p>
                <p className="text-sm text-muted-foreground">
                  بداية التعلم{" "}
                  <span className="text-foreground">
                    {formatClassDate(courseClass.learning_starts_at)}
                  </span>
                </p>
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
          ))}
        </ol>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          لا توجد دفعة بعد. لن يتمكن أحد من الالتحاق قبل فتح دفعة.
        </p>
      )}

      {open && (
        <FormDialog
          title="دفعة جديدة"
          description="حدّد تاريخ بداية التعلم."
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
          pending={pending}
          submitLabel="فتح الدفعة"
        >
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
        description="سيبقى الملتحقون في الدورة."
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onDelete}
      />
    </section>
  );
}
