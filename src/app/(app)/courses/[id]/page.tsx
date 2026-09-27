import { CourseDetail } from "@/components/courses/course-detail";
import {
  canAccessCourse,
  getCourseAcl,
  getCourseById,
  getCourseClasses,
  getCourseContents,
  getEnrollment,
} from "@/lib/courses";
import { pickJoinClass } from "@/lib/course-schedule";
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
  const [contents, enrollment, acl, classes] = await Promise.all([
    getCourseContents(id),
    member ? getEnrollment(member.id, id) : Promise.resolve(null),
    getCourseAcl(id),
    getCourseClasses(id),
  ]);

  if (!enrollment && !canAccessCourse(course, member, acl)) {
    notFound();
  }

  if (enrollment) redirect(`/courses/${id}/learn`);

  const joinClass = pickJoinClass(classes);

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseDetail
        course={course}
        contents={contents}
        enrollment={enrollment}
        joinClass={joinClass}
        isLoggedIn
        isMember={Boolean(member)}
        hasCompleteProfile={isMemberProfileComplete(member)}
      />
    </div>
  );
}
