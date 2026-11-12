import { CourseDetail } from "@/components/courses/course-detail";
import {
  canAccessCourse,
  getCourseAcl,
  getCourseById,
  getCourseClasses,
  getCourseContents,
  getMemberCourseEnrollments,
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
  const [enrollments, acl, classes] = await Promise.all([
    member ? getMemberCourseEnrollments(member.id, id) : Promise.resolve([]),
    getCourseAcl(id),
    getCourseClasses(id),
  ]);

  if (enrollments.length === 0 && !canAccessCourse(course, member, acl)) {
    notFound();
  }

  const openClass = pickOpenClass(classes);
  const upcomingClass = pickUpcomingClass(classes);
  const openEnrollment = openClass
    ? (enrollments.find((item) => item.class_id === openClass.id) ?? null)
    : null;
  const learningEnrollment =
    enrollments.find((item) => {
      const courseClass = classes.find((entry) => entry.id === item.class_id);
      return (
        courseClass != null &&
        hasLearningStarted(courseClass.learning_starts_at)
      );
    }) ??
    openEnrollment ??
    enrollments[0] ??
    null;

  const enrolledClass = learningEnrollment
    ? (classes.find((item) => item.id === learningEnrollment.class_id) ?? null)
    : null;

  const canEnrollInOpenClass = Boolean(openClass && !openEnrollment);
  const previewClass = openEnrollment
    ? openClass
    : canEnrollInOpenClass
      ? openClass
      : (enrolledClass ?? upcomingClass);
  const previewKind = openEnrollment
    ? "enrolled"
    : openClass
      ? "open"
      : upcomingClass
        ? "upcoming"
        : enrolledClass
          ? "enrolled"
          : "none";

  const contents = await getCourseContents(id, previewClass?.id ?? null);
  const learningStarted = enrolledClass
    ? hasLearningStarted(enrolledClass.learning_starts_at)
    : false;

  // Unenroll targets the open-class enrollment if present and not started yet.
  const unenrollEnrollment =
    openEnrollment &&
    openClass &&
    !hasLearningStarted(openClass.learning_starts_at)
      ? openEnrollment
      : learningEnrollment && enrolledClass && !learningStarted
        ? learningEnrollment
        : null;

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseDetail
        course={course}
        contents={contents}
        enrollment={learningEnrollment}
        unenrollEnrollment={unenrollEnrollment}
        joinClass={openClass}
        previewClass={previewClass}
        previewKind={previewKind}
        learningStarted={learningStarted}
        canEnrollInOpenClass={canEnrollInOpenClass}
        isLoggedIn
        isMember={Boolean(member)}
        hasCompleteProfile={isMemberProfileComplete(member)}
        profileName={member?.name ?? ""}
        profilePhone={member?.phone ?? ""}
      />
    </div>
  );
}
