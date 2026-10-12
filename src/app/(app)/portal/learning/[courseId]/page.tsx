import { CourseLearnShell } from "@/components/courses/course-learn-shell";
import {
  getCompletedContentIds,
  getCourseById,
  getCourseClasses,
  getCourseContents,
  getEnrollment,
  getMyCourseRating,
} from "@/lib/courses";
import {
  formatClassDate,
  hasLearningStarted,
  nextOpenLesson,
} from "@/lib/course-schedule";
import {
  getMemberForSession,
  isMemberProfileComplete,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function PortalCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getSession();
  const { courseId: raw } = await params;
  if (!session) redirect(`/login?next=/portal/learning/${raw}`);

  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const member = await getMemberForSession(session);
  if (!member || !isMemberProfileComplete(member)) {
    redirect(`/profile?next=/portal/learning/${id}`);
  }

  const course = await getCourseById(id);
  if (!course || !course.is_published) notFound();

  const enrollment = await getEnrollment(member.id, id);
  if (!enrollment) redirect(`/courses/${id}`);

  const [contents, completed, myRating, classes] = await Promise.all([
    getCourseContents(id, enrollment.class_id),
    getCompletedContentIds(enrollment.id),
    getMyCourseRating(member.id, id),
    getCourseClasses(id),
  ]);
  const courseClass =
    classes.find((item) => item.id === enrollment.class_id) ?? null;
  if (courseClass && !hasLearningStarted(courseClass.learning_starts_at)) {
    redirect(`/courses/${id}`);
  }
  const resumeTarget = nextOpenLesson(contents, completed);

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseLearnShell
        course={course}
        enrollment={enrollment}
        contents={contents}
        completedIds={[...completed]}
        activeContentId={null}
        myRating={myRating}
      >
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-kufam text-xl text-foreground">اختر درساً للبدء</p>
          {courseClass && (
            <p className="mt-2 text-sm text-muted-foreground">
              التسجيل {formatClassDate(courseClass.registration_opens_on)}
              {" · بداية التعلم "}
              {formatClassDate(courseClass.learning_starts_at)}
            </p>
          )}
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            هذه دروس الفترة التي التحقت بها.
          </p>
          {resumeTarget && (
            <Link
              href={`/portal/learning/${id}/${resumeTarget.id}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              متابعة التعلم
            </Link>
          )}
        </div>
      </CourseLearnShell>
    </div>
  );
}
