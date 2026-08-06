"use client";

import {
  deleteCourseContent,
  deleteExamQuestion,
  upsertCourseContent,
  upsertExamQuestion,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { AudioViewer } from "@/components/courses/audio-viewer";
import { CONTENT_TYPE_ICON, StarRating } from "@/components/courses/course-ui";
import { ReadingViewer } from "@/components/courses/reading-viewer";
import { VideoViewer } from "@/components/courses/video-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CourseContent,
  CourseContentType,
  CourseEnrollmentWithMember,
  CourseWithMeta,
  ExamOption,
  ExamQuestion,
  ExamQuestionType,
  VideoTimestamp,
} from "@/lib/course-types";
import {
  CONTENT_TYPE_LABELS,
  ENROLLMENT_STATUS_LABELS,
} from "@/lib/course-types";
import {
  Book,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Eye,
  EyeOff,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
  Unlock,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك",
  admin: "مشرف",
  participant: "مشارك",
  veteran: "مخضرم",
  newcomer: "وافد",
};

export function CourseContentManager({
  course,
  contents,
  questionsByContent,
  enrollments = [],
  ratingsByMember = {},
}: {
  course: CourseWithMeta;
  contents: CourseContent[];
  questionsByContent: Record<number, ExamQuestion[]>;
  enrollments?: CourseEnrollmentWithMember[];
  ratingsByMember?: Record<number, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CourseContent | null>(null);
  const [deleting, setDeleting] = useState<CourseContent | null>(null);
  const [previewing, setPreviewing] = useState<CourseContent | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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

  const completedCount = useMemo(
    () =>
      enrollments.filter(
        (item) =>
          item.status === "completed" || item.progress_percentage >= 100,
      ).length,
    [enrollments],
  );

  const examTitle = useMemo(
    () => contents.find((item) => item.id === examContentId)?.title ?? null,
    [contents, examContentId],
  );

  function openQuestions(contentId: number) {
    setOpenMenuId(null);
    setExamContentId(contentId);
    setQuestionType("multiple_choice");
    setQuestionText("");
    setOptionsText("الخيار أ\nالخيار ب\nالخيار ج");
    setCorrectIndex("0");
  }

  useEffect(() => {
    if (!previewing && !examContentId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (previewing) setPreviewing(null);
      if (examContentId && !pending) setExamContentId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewing, examContentId, pending]);

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
        questionType === "true_false"
          ? "صح\nخطأ"
          : "الخيار أ\nالخيار ب\nالخيار ج",
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
        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted sm:w-64 md:w-80 lg:w-88">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                sizes="(min-width: 1024px) 352px, (min-width: 768px) 320px, (min-width: 640px) 256px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <BookOpen className="size-10 opacity-40" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <Link
              href="/dashboard/courses"
              className="text-sm text-primary transition hover:opacity-80"
            >
              ← العودة للدورات
            </Link>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {course.title}
            </h1>
            <p className="max-w-xl text-base leading-8 text-foreground/65">
              {course.description}
            </p>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-primary/25 bg-background/50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Book className="size-3.5" />
              الدروس
            </p>
            <p className="mt-1 font-kufam text-lg text-foreground">
              {contents.length}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-background/50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleHelp className="size-3.5" />
              اختبارات
            </p>
            <p className="mt-1 font-kufam text-lg text-foreground">
              {contents.filter((c) => c.type === "exam").length}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-background/50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="size-3.5" />
              التقييم
            </p>
            <div className="mt-1.5">
              <StarRating
                value={course.rating_avg}
                count={course.rating_count}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-background/50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              الملتحقون
            </p>
            <p className="mt-1 font-kufam text-lg text-foreground">
              {enrollments.length}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-background/50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5" />
              أكملوا الدورة
            </p>
            <p className="mt-1 font-kufam text-lg text-foreground">
              {completedCount}
            </p>
          </div>
          <div
            className={`rounded-2xl bg-background/50 px-4 py-3 border ${
              course.is_published
                ? "border-emerald-500/35"
                : "border-amber-500/35"
            }`}
          >
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {course.is_published ? (
                <Eye className="size-3.5" />
              ) : (
                <EyeOff className="size-3.5" />
              )}
              الظهور
            </p>
            <p className="mt-1 font-kufam text-lg text-foreground">
              {course.is_published ? "منشور" : "مخفي"}
            </p>
          </div>
          <div
            className={`rounded-2xl bg-background/50 px-4 py-3 border ${
              course.enrollment_status === "open"
                ? "border-sky-500/35"
                : "border-rose-500/35"
            }`}
          >
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {course.enrollment_status === "open" ? (
                <Unlock className="size-3.5" />
              ) : (
                <Lock className="size-3.5" />
              )}
              التسجيل
            </p>
            <p className="mt-1 font-kufam text-lg text-foreground">
              {ENROLLMENT_STATUS_LABELS[course.enrollment_status]}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-kufam text-2xl font-semibold text-foreground">
              دروس الدورة
            </h2>
            <span className="text-sm text-muted-foreground">
              {contents.length} عنصر
            </span>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            درس جديد
          </Button>
        </div>

        {contents.length > 0 ? (
          <ol className="rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
            {contents.map((content, index) => {
              const Icon = CONTENT_TYPE_ICON[content.type];
              const openUpward = index >= contents.length - 2;
              return (
                <li
                  key={content.id}
                  className={`border-b border-border/60 last:border-b-0 ${
                    openMenuId === content.id ? "relative z-50" : "relative z-0"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
                    <span className="w-6 shrink-0 text-center font-kufam text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-medium text-foreground">
                        {content.title}
                      </p>
                      {content.content_url && (
                        <Link
                          href={content.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block truncate text-sm transition hover:text-primary hover:underline"
                        >
                          {content.content_url}
                        </Link>
                      )}
                    </div>

                    <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="معاينة الدرس"
                        title="معاينة"
                        onClick={() => setPreviewing(content)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {content.type === "exam" && (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          aria-label="إدارة الأسئلة"
                          title="أسئلة"
                          onClick={() => openQuestions(content.id)}
                        >
                          <CircleHelp className="size-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="تعديل الدرس"
                        onClick={() => openEdit(content)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="حذف الدرس"
                        onClick={() => setDeleting(content)}
                        className="text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="relative shrink-0 xl:hidden">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="خيارات الدرس"
                        aria-expanded={openMenuId === content.id}
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === content.id ? null : content.id,
                          )
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                      {openMenuId === content.id && (
                        <>
                          <button
                            type="button"
                            aria-label="إغلاق القائمة"
                            className="fixed inset-0 z-10 cursor-default"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className={`absolute end-0 z-20 w-44 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg ${
                              openUpward ? "bottom-11" : "top-11"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setPreviewing(content);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm hover:bg-muted"
                            >
                              <Eye className="size-3.5" />
                              معاينة
                            </button>
                            {content.type === "exam" && (
                              <button
                                type="button"
                                onClick={() => openQuestions(content.id)}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm hover:bg-muted"
                              >
                                <CircleHelp className="size-3.5" />
                                الأسئلة
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                openEdit(content);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm hover:bg-muted"
                            >
                              <Pencil className="size-3.5" />
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleting(content);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" />
                              حذف
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {content.type === "exam" && (
                    <ul className="space-y-2 border-t border-border/60 px-4 py-3 sm:px-6">
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
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            حذف
                          </button>
                        </li>
                      ))}
                      {(questionsByContent[content.id] ?? []).length === 0 && (
                        <li className="text-xs text-muted-foreground">
                          لا أسئلة بعد
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
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
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-kufam text-2xl font-semibold text-foreground">
            الملتحقون بالدورة
          </h2>
          <span className="text-sm text-muted-foreground">
            {enrollments.length} عضو
          </span>
        </div>

        {enrollments.length > 0 ? (
          <ul className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
            {enrollments.map((enrollment) => {
              const done =
                enrollment.status === "completed" ||
                enrollment.progress_percentage >= 100;
              return (
                <li
                  key={enrollment.id}
                  className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-4 last:border-b-0 sm:gap-4 sm:px-6"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/8 font-kufam text-sm text-primary">
                    {enrollment.member.name.trim().charAt(0) || "؟"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-kufam text-lg text-foreground">
                      {enrollment.member.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ROLE_LABELS[enrollment.member.role] ??
                        enrollment.member.role}
                      {enrollment.member.email
                        ? ` · ${enrollment.member.email}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {ratingsByMember[enrollment.member_id] && (
                      <StarRating
                        value={ratingsByMember[enrollment.member_id]}
                      />
                    )}
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {Math.round(enrollment.progress_percentage)}%
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        done
                          ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30"
                          : "bg-sky-500/15 text-sky-800 ring-sky-500/30"
                      }`}
                    >
                      {done ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          مكتمل
                        </>
                      ) : (
                        "قيد التعلم"
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              لا يوجد ملتحقون بهذه الدورة بعد.
            </p>
          </div>
        )}
      </section>

      {examContentId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => !pending && setExamContentId(null)}
            aria-hidden
          />
          <form
            onSubmit={onAddQuestion}
            className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-background p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-kufam text-2xl text-foreground">
                  إضافة سؤال
                </h2>
                {examTitle && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {examTitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => !pending && setExamContentId(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                aria-label="إغلاق"
              >
                <X className="size-5" />
              </button>
            </div>

            {(questionsByContent[examContentId] ?? []).length > 0 && (
              <ul className="mb-5 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-border/70 p-3">
                {(questionsByContent[examContentId] ?? []).map((q, index) => (
                  <li
                    key={q.id}
                    className="flex items-start justify-between gap-2 text-sm text-foreground/80"
                  >
                    <span>
                      <span className="me-1.5 font-kufam text-xs text-muted-foreground">
                        {index + 1}.
                      </span>
                      {q.question_text}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDeleteQuestion(q.id)}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      حذف
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-4">
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
                      next === "true_false"
                        ? "صح\nخطأ"
                        : "الخيار أ\nالخيار ب\nالخيار ج",
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
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setExamContentId(null)}
              >
                إغلاق
              </Button>
              <Button type="submit" disabled={pending} className="flex-1">
                إضافة السؤال
              </Button>
            </div>
          </form>
        </div>
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

      {previewing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => setPreviewing(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-preview-title"
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center justify-center gap-1.5">
                <p className="mt-1 font-kufam text-muted-foreground">
                  {previewing.order_sequence}.
                </p>
                <h2 className="truncate text-xl text-foreground">
                  {previewing.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewing(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                aria-label="إغلاق"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {previewing.type === "watching" && previewing.content_url ? (
                <VideoViewer
                  title={previewing.title}
                  url={previewing.content_url}
                  timestamps={previewing.metadata.timestamps ?? []}
                />
              ) : previewing.type === "listening" && previewing.content_url ? (
                <AudioViewer
                  title={previewing.title}
                  url={previewing.content_url}
                />
              ) : previewing.type === "reading" && previewing.content_url ? (
                <ReadingViewer
                  title={previewing.title}
                  url={previewing.content_url}
                />
              ) : previewing.type === "exam" ? (
                <div className="space-y-4">
                  <p className="font-kufam text-lg text-foreground">
                    أسئلة الاختبار
                  </p>
                  {(questionsByContent[previewing.id] ?? []).length > 0 ? (
                    <ol className="space-y-3">
                      {(questionsByContent[previewing.id] ?? []).map(
                        (q, index) => (
                          <li
                            key={q.id}
                            className="rounded-2xl border border-border/70 bg-background/70 p-4"
                          >
                            <p className="font-medium text-foreground">
                              <span className="me-2 font-kufam text-sm text-muted-foreground">
                                {index + 1}.
                              </span>
                              {q.question_text}
                            </p>
                            <ul className="mt-3 space-y-1.5">
                              {q.options.map((option) => (
                                <li
                                  key={option.id}
                                  className={`rounded-xl border px-3 py-2 text-sm ${
                                    option.id === q.correct_option_id
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900"
                                      : "border-border/70 text-foreground/75"
                                  }`}
                                >
                                  {option.text}
                                  {option.id === q.correct_option_id && (
                                    <span className="ms-2 text-xs text-emerald-700">
                                      (الإجابة الصحيحة)
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ),
                      )}
                    </ol>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      لا أسئلة بعد لهذا الاختبار.
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  لا يوجد محتوى للمعاينة. أضف رابطاً أولاً.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 sm:items-center sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => !pending && setModal(false)}
          />
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
                  {(
                    Object.keys(CONTENT_TYPE_LABELS) as CourseContentType[]
                  ).map((key) => (
                    <option key={key} value={key}>
                      {CONTENT_TYPE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
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
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setModal(false)}
              >
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
