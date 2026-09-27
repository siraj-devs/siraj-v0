import { CourseContentManager } from "@/components/courses/course-content-manager";
import {
  getCourseById,
  getCourseContents,
  getCourseEnrollments,
  getCourseRatingsByMember,
  getExamQuestions,
} from "@/lib/courses";
import type { ExamQuestion } from "@/lib/course-types";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { notFound, redirect } from "next/navigation";

export default async function DashboardCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { canEdit } = await gateDashboardPage("/dashboard/courses");
  if (!canEdit) redirect("/dashboard/courses");

  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const course = await getCourseById(id);
  if (!course) notFound();

  const [contents, enrollments, ratingsByMember] = await Promise.all([
    getCourseContents(id),
    getCourseEnrollments(id),
    getCourseRatingsByMember(id),
  ]);

  const questionsByContent: Record<number, ExamQuestion[]> = {};
  await Promise.all(
    contents
      .filter((c) => c.type === "exam")
      .map(async (c) => {
        questionsByContent[c.id] = await getExamQuestions(c.id);
      }),
  );

  return (
    <div className="py-6 md:py-10">
      <CourseContentManager
        course={course}
        contents={contents}
        questionsByContent={questionsByContent}
        enrollments={enrollments}
        ratingsByMember={ratingsByMember}
      />
    </div>
  );
}
