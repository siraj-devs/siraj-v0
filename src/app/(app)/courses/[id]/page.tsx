import { CourseDetail } from "@/components/courses/course-detail";
import {
  getCourseById,
  getCourseContents,
  getEnrollment,
} from "@/lib/courses";
import {
  getMemberForSession,
  isMemberProfileComplete,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    const { id } = await params;
    redirect(`/login?next=/courses/${id}`);
  }

  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const course = await getCourseById(id);
  if (!course || !course.is_published) notFound();

  const member = await getMemberForSession(session);
  const [contents, enrollment] = await Promise.all([
    getCourseContents(id),
    member ? getEnrollment(member.id, id) : Promise.resolve(null),
  ]);

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseDetail
        course={course}
        contents={contents}
        enrollment={enrollment}
        isLoggedIn
        isMember={Boolean(member)}
        hasCompleteProfile={isMemberProfileComplete(member)}
      />
    </div>
  );
}
