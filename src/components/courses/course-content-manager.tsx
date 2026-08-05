"use client";

import {
  deleteCourseContent,
  deleteExamQuestion,
  upsertCourseContent,
  upsertExamQuestion,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CourseContent,
  CourseContentType,
  CourseWithMeta,
  ExamOption,
  ExamQuestion,
  ExamQuestionType,
  VideoTimestamp,
} from "@/lib/course-types";
import { CONTENT_TYPE_LABELS } from "@/lib/course-types";
import { Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

export function CourseContentManager({
  course,
  contents,
  questionsByContent,
}: {
  course: CourseWithMeta;
  contents: CourseContent[];
  questionsByContent: Record<number, ExamQuestion[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CourseContent | null>(null);
  const [deleting, setDeleting] = useState<CourseContent | null>(null);
  const [type, setType] = useState<CourseContentType>("watching");
  const [title, setTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [order, setOrder] = useState("0");
  const [timestampsText, setTimestampsText] = useState("");

  const [examContentId, setExamContentId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] =
    useState<ExamQuestionType>("multiple_choice");
  const [optionsText, setOptionsText] = useState("صح\nخطأ");
  const [correctIndex, setCorrectIndex] = useState("0");

  function openCreate() {
    setEditing(null);
    setType("watching");
    setTitle("");
    setContentUrl("");
    setOrder(String(contents.length));
    setTimestampsText("");
    setModal(true);
  }

  function openEdit(content: CourseContent) {
    setEditing(content);
    setType(content.type);
    setTitle(content.title);
    setContentUrl(content.content_url ?? "");
    setOrder(String(content.order_sequence));
    setTimestampsText(
      (content.metadata.timestamps ?? [])
        .map((t) => `${t.seconds}|${t.label}`)
        .join("\n"),
    );
    setModal(true);
  }

  function parseTimestamps(text: string): VideoTimestamp[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        const [secondsRaw, ...rest] = line.split("|");
        const seconds = Number(secondsRaw);
        const label = rest.join("|").trim();
        if (!Number.isFinite(seconds) || !label) return [];
        return [{ seconds, label }];
      });
  }

  function onSubmitContent(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await upsertCourseContent({
        id: editing?.id,
        course_id: course.id,
        type,
        title,
        content_url: type === "exam" ? null : contentUrl,
        order_sequence: Number(order) || 0,
        timestamps: type === "watching" ? parseTimestamps(timestampsText) : [],
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "تم تحديث الدرس" : "تم إضافة الدرس");
      setModal(false);
      router.refresh();
    });
  }

  function onDeleteContent() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCourseContent(deleting.id, course.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف الدرس");
      setDeleting(null);
      router.refresh();
    });
  }

  function onAddQuestion(event: FormEvent) {
    event.preventDefault();
    if (!examContentId) return;

    const lines = optionsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      toast.error("أدخل خيارين على الأقل");
      return;
    }

    const options: ExamOption[] = lines.map((text, index) => ({
      id: `opt_${index + 1}`,
      text,
    }));
    const idx = Number(correctIndex);
    const correct = options[idx];
    if (!correct) {
      toast.error("اختر إجابة صحيحة صالحة");
      return;
    }

    startTransition(async () => {
      const result = await upsertExamQuestion({
        content_id: examContentId,
        course_id: course.id,
        question_text: questionText,
        question_type: questionType,
        options,
        correct_option_id: correct.id,
        order_sequence: (questionsByContent[examContentId] ?? []).length,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم إضافة السؤال");
      setQuestionText("");
      setOptionsText(
        questionType === "true_false" ? "صح\nخطأ" : "الخيار أ\nالخيار ب\nالخيار ج",
      );
      setCorrectIndex("0");
      router.refresh();
    });
  }

  function onDeleteQuestion(id: number) {
    startTransition(async () => {
      const result = await deleteExamQuestion(id, course.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف السؤال");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Link
              href="/dashboard/courses"
              className="text-sm text-primary transition hover:opacity-80"
            >
              ← العودة للدورات
            </Link>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {course.title}
            </h1>
            <p className="max-w-lg text-foreground/65">
              إدارة دروس الدورة والاختبارات وترتيبها.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="shrink-0 gap-2 self-start md:self-auto"
          >
            <Plus className="size-4" />
            درس جديد
          </Button>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary/40 bg-background px-4 py-3 shadow-sm">
            <p className="text-xs text-muted-foreground">الدروس</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {contents.length}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">اختبارات</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {contents.filter((c) => c.type === "exam").length}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">الحالة</p>
            <p className="mt-1 font-kufam text-lg text-foreground">
              {course.is_published ? "منشور" : "مخفي"}
            </p>
          </div>
        </div>
      </header>

      {contents.length > 0 ? (
      <ul className="space-y-3">
        {contents.map((content) => (
          <li
            key={content.id}
            className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:px-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-kufam text-lg text-foreground">
                  {content.order_sequence}. {content.title}
                </p>
                <p className="text-sm text-foreground/70">
                  {CONTENT_TYPE_LABELS[content.type]}
                </p>
                {content.content_url && (
                  <p
                    className="truncate font-mono text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    {content.content_url}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(content)}
                >
                  تعديل
                </Button>
                {content.type === "exam" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setExamContentId(content.id);
                      setQuestionType("multiple_choice");
                      setOptionsText("الخيار أ\nالخيار ب\nالخيار ج");
                    }}
                  >
                    أسئلة
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleting(content)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {content.type === "exam" && (
              <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {(questionsByContent[content.id] ?? []).map((q) => (
                  <li
                    key={q.id}
                    className="flex items-start justify-between gap-2 text-sm text-foreground/80"
                  >
                    <span>{q.question_text}</span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDeleteQuestion(q.id)}
                      className="text-destructive hover:underline"
                    >
                      حذف
                    </button>
                  </li>
                ))}
                {(questionsByContent[content.id] ?? []).length === 0 && (
                  <li className="text-xs text-muted-foreground">لا أسئلة بعد</li>
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-kufam text-lg text-foreground">لا دروس بعد</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            أضف دروس مشاهدة أو استماع أو قراءة أو اختباراً لهذه الدورة.
          </p>
          <Button onClick={openCreate} className="mt-6 gap-2">
            <Plus className="size-4" />
            درس جديد
          </Button>
        </div>
      )}

      {examContentId && (
        <form
          onSubmit={onAddQuestion}
          className="space-y-4 rounded-2xl border border-border p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-kufam text-lg">إضافة سؤال للاختبار</h2>
            <button type="button" onClick={() => setExamContentId(null)}>
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-2">
            <Label>نص السؤال</Label>
            <Input
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>النوع</Label>
            <select
              value={questionType}
              onChange={(e) => {
                const next = e.target.value as ExamQuestionType;
                setQuestionType(next);
                setOptionsText(
                  next === "true_false" ? "صح\nخطأ" : "الخيار أ\nالخيار ب\nالخيار ج",
                );
                setCorrectIndex("0");
              }}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="multiple_choice">اختيار من متعدد</option>
              <option value="true_false">صح / خطأ</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>الخيارات (سطر لكل خيار)</Label>
            <textarea
              rows={4}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>رقم الإجابة الصحيحة (يبدأ من 0)</Label>
            <Input
              type="number"
              min={0}
              value={correctIndex}
              onChange={(e) => setCorrectIndex(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            إضافة السؤال
          </Button>
        </form>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف الدرس"
        description={deleting ? `حذف «${deleting.title}»؟` : ""}
        confirmLabel="حذف"
        pending={pending}
        onCancel={() => !pending && setDeleting(null)}
        onConfirm={onDeleteContent}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={() => !pending && setModal(false)} />
          <form
            onSubmit={onSubmitContent}
            className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-background p-6 sm:rounded-3xl sm:p-8"
          >
            <h2 className="mb-4 font-kufam text-2xl">
              {editing ? "تعديل الدرس" : "درس جديد"}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CourseContentType)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {(Object.keys(CONTENT_TYPE_LABELS) as CourseContentType[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {CONTENT_TYPE_LABELS[key]}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              {type !== "exam" && (
                <div className="space-y-2">
                  <Label>
                    {type === "watching"
                      ? "رابط يوتيوب"
                      : type === "listening"
                        ? "رابط الصوت"
                        : "رابط PDF / Drive"}
                  </Label>
                  <Input
                    dir="ltr"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    required
                    placeholder="https://"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>
              {type === "watching" && (
                <div className="space-y-2">
                  <Label>طوابع زمنية (seconds|العنوان لكل سطر)</Label>
                  <textarea
                    rows={4}
                    value={timestampsText}
                    onChange={(e) => setTimestampsText(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm"
                    placeholder={"0|المقدمة\n120|الفكرة الأولى"}
                    dir="ltr"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={pending} className="flex-1">
                حفظ
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
