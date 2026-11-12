import { ExamGradebook } from "@/components/courses/exam-gradebook";
import {
  getCourseById,
  getCourseContentById,
  getCourseEnrollments,
  getExamQuestions,
  getExamSubmissions,
} from "@/lib/courses";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ExamAnswersPage({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>;
}) {
  const { canEdit } = await gateDashboardPage("/dashboard/courses");
  if (!canEdit) redirect("/dashboard/courses");

  const { id: rawId, contentId: rawContent } = await params;
  const courseId = Number(rawId);
  const contentId = Number(rawContent);
  if (!Number.isFinite(courseId) || !Number.isFinite(contentId)) notFound();

  const [course, content] = await Promise.all([
    getCourseById(courseId),
    getCourseContentById(contentId),
  ]);
  if (
    !course ||
    !content ||
    content.course_id !== courseId ||
    content.type !== "exam"
  ) {
    notFound();
  }

  const [questions, submissions, enrollments] = await Promise.all([
    getExamQuestions(contentId),
    getExamSubmissions(contentId),
    getCourseEnrollments(courseId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-6 pb-16 md:py-10">
      <div className="space-y-4">
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          {course.title}
        </Link>
        <header className="rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-7 md:px-8">
          <p className="text-xs font-medium text-primary">تصحيح التقويم</p>
          <h1 className="mt-1 font-kufam text-3xl font-semibold text-foreground">
            {content.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            صحّح الإجابات اليدوية ثم انشر النتيجة ليظهر الملخص والنسبة للمتعلّم.
          </p>
        </header>
      </div>

      <ExamGradebook
        courseId={courseId}
        contentId={contentId}
        questions={questions}
        submissions={submissions}
        enrollments={enrollments}
      />
    </div>
  );
}
