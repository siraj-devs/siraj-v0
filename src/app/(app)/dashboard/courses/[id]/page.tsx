import { CourseContentManager } from "@/components/courses/course-content-manager";
import {
  getCourseById,
  getCourseContents,
  getExamQuestions,
} from "@/lib/courses";
import type { ExamQuestion } from "@/lib/course-types";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function DashboardCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const member = await getMemberForSession(session);
  if (!canManageMembers(member?.role)) redirect("/dashboard/members");

  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const course = await getCourseById(id);
  if (!course) notFound();

  const contents = await getCourseContents(id);
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
      />
    </div>
  );
}
