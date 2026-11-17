import { ClassLeaderboard } from "@/components/courses/class-leaderboard";
import { CourseLearnShell } from "@/components/courses/course-learn-shell";
import {
  getClassLeaderboard,
  getCompletedContentIds,
  getCourseById,
  getCourseClasses,
  getCourseContents,
  getEnrollment,
  getMyCourseRating,
} from "@/lib/courses";
import { hasLearningStarted } from "@/lib/course-schedule";
import {
  getMemberForSession,
  isMemberProfileComplete,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function PortalCourseLeaderboardPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getSession();
  const { courseId: raw } = await params;
  if (!session) {
    redirect(`/login?next=/portal/learning/${raw}/leaderboard`);
  }

  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const member = await getMemberForSession(session);
  if (!member || !isMemberProfileComplete(member)) {
    redirect(`/profile?next=/portal/learning/${id}/leaderboard`);
  }

  const course = await getCourseById(id);
  if (!course || !course.is_published) notFound();

  const enrollment = await getEnrollment(member.id, id);
  if (!enrollment) redirect(`/courses/${id}`);

  const [contents, completed, myRating, classes, leaderboard] =
    await Promise.all([
      getCourseContents(id, enrollment.class_id),
      getCompletedContentIds(enrollment.id),
      getMyCourseRating(member.id, id),
      getCourseClasses(id),
      getClassLeaderboard(id, enrollment.class_id),
    ]);

  const courseClass =
    classes.find((item) => item.id === enrollment.class_id) ?? null;
  if (courseClass && !hasLearningStarted(courseClass.learning_starts_at)) {
    redirect(`/courses/${id}`);
  }

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseLearnShell
        course={course}
        enrollment={enrollment}
        contents={contents}
        completedIds={[...completed]}
        activeContentId={null}
        myRating={myRating}
        leaderboard={leaderboard}
        currentMemberId={member.id}
        showMiniLeaderboard={false}
        showNavArrows={false}
        headerVariant="compact"
      >
        <div className="space-y-6">
          <ClassLeaderboard
            entries={leaderboard}
            currentMemberId={member.id}
            courseId={id}
          />
        </div>
      </CourseLearnShell>
    </div>
  );
}
