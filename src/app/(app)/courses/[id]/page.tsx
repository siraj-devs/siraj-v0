import { CourseDetail } from "@/components/courses/course-detail";
import {
  canAccessCourse,
  getCourseAcl,
  getCourseById,
  getCourseClasses,
  getCourseContents,
  getEnrollment,
} from "@/lib/courses";
import {
  hasLearningStarted,
  pickOpenClass,
  pickUpcomingClass,
} from "@/lib/course-schedule";
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
  const [enrollment, acl, classes] = await Promise.all([
    member ? getEnrollment(member.id, id) : Promise.resolve(null),
    getCourseAcl(id),
    getCourseClasses(id),
  ]);

  if (!enrollment && !canAccessCourse(course, member, acl)) {
    notFound();
  }

  const enrolledClass = enrollment
    ? (classes.find((item) => item.id === enrollment.class_id) ?? null)
    : null;
  const openClass = pickOpenClass(classes);
  const upcomingClass = pickUpcomingClass(classes);
  const previewClass = enrolledClass ?? openClass ?? upcomingClass;
  const previewKind = enrolledClass
    ? "enrolled"
    : openClass
      ? "open"
      : upcomingClass
        ? "upcoming"
        : "none";
  const contents = await getCourseContents(id, previewClass?.id ?? null);

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseDetail
        course={course}
        contents={contents}
        enrollment={enrollment}
        joinClass={openClass}
        previewClass={previewClass}
        previewKind={previewKind}
        learningStarted={
          enrolledClass
            ? hasLearningStarted(enrolledClass.learning_starts_at)
            : false
        }
        isLoggedIn
        isMember={Boolean(member)}
        hasCompleteProfile={isMemberProfileComplete(member)}
      />
    </div>
  );
}
