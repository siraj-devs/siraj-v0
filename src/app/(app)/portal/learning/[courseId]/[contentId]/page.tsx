import { AudioViewer } from "@/components/courses/audio-viewer";
import { CourseLearnShell } from "@/components/courses/course-learn-shell";
import { ExamViewer } from "@/components/courses/exam-viewer";
import { ReadingViewer } from "@/components/courses/reading-viewer";
import { VideoViewer } from "@/components/courses/video-viewer";
import {
  getCompletedContentIds,
  getCourseById,
  getCourseClasses,
  getCourseContentById,
  getCourseContents,
  getEnrollment,
  getExamQuestionsForLearner,
  getMyCourseRating,
} from "@/lib/courses";
import { hasLearningStarted, nextOpenLesson } from "@/lib/course-schedule";
import {
  getMemberForSession,
  isMemberProfileComplete,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function PortalLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; contentId: string }>;
}) {
  const session = await getSession();
  const { courseId: rawCourse, contentId: rawContent } = await params;
  const courseId = Number(rawCourse);
  const contentId = Number(rawContent);

  if (!session) {
    redirect(`/login?next=/portal/learning/${rawCourse}/${rawContent}`);
  }
  if (!Number.isFinite(courseId) || !Number.isFinite(contentId)) notFound();

  const member = await getMemberForSession(session);
  if (!member || !isMemberProfileComplete(member)) {
    redirect(`/profile?next=/portal/learning/${courseId}/${contentId}`);
  }

  const course = await getCourseById(courseId);
  if (!course || !course.is_published) notFound();

  const enrollment = await getEnrollment(member.id, courseId);
  if (!enrollment) redirect(`/courses/${courseId}`);

  const classes = await getCourseClasses(courseId);
  const courseClass =
    classes.find((item) => item.id === enrollment.class_id) ?? null;
  if (courseClass && !hasLearningStarted(courseClass.learning_starts_at)) {
    redirect(`/courses/${courseId}`);
  }

  const content = await getCourseContentById(contentId);
  if (
    !content ||
    content.course_id !== courseId ||
    content.class_id !== enrollment.class_id
  ) {
    notFound();
  }

  const [contents, completed, myRating] = await Promise.all([
    getCourseContents(courseId, enrollment.class_id),
    getCompletedContentIds(enrollment.id),
    getMyCourseRating(member.id, courseId),
  ]);

  const activeIndex = contents.findIndex((item) => item.id === contentId);
  const sequentialLocked = contents
    .slice(0, Math.max(0, activeIndex))
    .some((item) => !completed.has(item.id));
  if (sequentialLocked) {
    const resumeTarget = nextOpenLesson(contents, completed);
    redirect(
      resumeTarget && resumeTarget.id !== contentId
        ? `/portal/learning/${courseId}/${resumeTarget.id}`
        : `/portal/learning/${courseId}`,
    );
  }

  let viewer: React.ReactNode = null;
  if (content.type === "watching" && content.content_url) {
    viewer = (
      <VideoViewer
        title={content.title}
        url={content.content_url}
        timestamps={content.metadata.timestamps ?? []}
      />
    );
  } else if (content.type === "listening" && content.content_url) {
    viewer = <AudioViewer title={content.title} url={content.content_url} />;
  } else if (content.type === "reading" && content.content_url) {
    viewer = <ReadingViewer title={content.title} url={content.content_url} />;
  } else if (content.type === "exam") {
    const questions = await getExamQuestionsForLearner(contentId);
    viewer = (
      <ExamViewer
        title={content.title}
        courseId={courseId}
        contentId={contentId}
        questions={questions}
      />
    );
  }

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseLearnShell
        course={course}
        enrollment={enrollment}
        contents={contents}
        completedIds={[...completed]}
        activeContentId={contentId}
        myRating={myRating}
      >
        {viewer}
      </CourseLearnShell>
    </div>
  );
}
