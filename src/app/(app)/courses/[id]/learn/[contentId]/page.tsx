import { AudioViewer } from "@/components/courses/audio-viewer";
import { CourseLearnShell } from "@/components/courses/course-learn-shell";
import { ExamViewer } from "@/components/courses/exam-viewer";
import { ReadingViewer } from "@/components/courses/reading-viewer";
import { VideoViewer } from "@/components/courses/video-viewer";
import {
  getCompletedContentIds,
  getCourseById,
  getCourseClass,
  getCourseContentById,
  getCourseContents,
  getEnrollment,
  getExamQuestionsForLearner,
  getMyCourseRating,
} from "@/lib/courses";
import { isLessonOpen, nextOpenLesson } from "@/lib/course-schedule";
import {
  getMemberForSession,
  isMemberProfileComplete,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function CourseContentPage({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>;
}) {
  const session = await getSession();
  const { id: rawCourse, contentId: rawContent } = await params;
  const courseId = Number(rawCourse);
  const contentId = Number(rawContent);

  if (!session) {
    redirect(`/login?next=/courses/${rawCourse}/learn/${rawContent}`);
  }
  if (!Number.isFinite(courseId) || !Number.isFinite(contentId)) notFound();

  const member = await getMemberForSession(session);
  if (!member || !isMemberProfileComplete(member)) {
    redirect(`/profile?next=/courses/${courseId}/learn/${contentId}`);
  }

  const course = await getCourseById(courseId);
  if (!course || !course.is_published) notFound();

  const enrollment = await getEnrollment(member.id, courseId);
  if (!enrollment) redirect(`/courses/${courseId}`);

  const content = await getCourseContentById(contentId);
  if (!content || content.course_id !== courseId) notFound();

  const [contents, completed, myRating, courseClass] = await Promise.all([
    getCourseContents(courseId),
    getCompletedContentIds(enrollment.id),
    getMyCourseRating(member.id, courseId),
    enrollment.class_id
      ? getCourseClass(enrollment.class_id)
      : Promise.resolve(null),
  ]);
  const learningStartsAt = courseClass?.learning_starts_at ?? null;

  const activeIndex = contents.findIndex((item) => item.id === contentId);
  const sequentialLocked = contents
    .slice(0, Math.max(0, activeIndex))
    .some((item) => !completed.has(item.id));
  const timeLocked = !isLessonOpen(learningStartsAt, content);
  if (sequentialLocked || timeLocked) {
    const resumeTarget = nextOpenLesson(contents, completed, learningStartsAt);
    redirect(
      resumeTarget && resumeTarget.id !== contentId
        ? `/courses/${courseId}/learn/${resumeTarget.id}`
        : `/courses/${courseId}/learn`,
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
        learningStartsAt={learningStartsAt}
      >
        {viewer}
      </CourseLearnShell>
    </div>
  );
}
