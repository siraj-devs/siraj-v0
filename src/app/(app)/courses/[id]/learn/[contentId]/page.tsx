import { AudioViewer } from "@/components/courses/audio-viewer";
import { CourseLearnShell } from "@/components/courses/course-learn-shell";
import { ExamViewer } from "@/components/courses/exam-viewer";
import { ReadingViewer } from "@/components/courses/reading-viewer";
import { VideoViewer } from "@/components/courses/video-viewer";
import {
  getCompletedContentIds,
  getCourseById,
  getCourseContentById,
  getCourseContents,
  getEnrollment,
  getExamQuestionsForLearner,
} from "@/lib/courses";
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
  if (!member) redirect(`/courses/${courseId}`);
  if (!isMemberProfileComplete(member)) {
    redirect(`/profile?next=/courses/${courseId}/learn/${contentId}`);
  }

  const course = await getCourseById(courseId);
  if (!course || !course.is_published) notFound();

  const enrollment = await getEnrollment(member.id, courseId);
  if (!enrollment) redirect(`/courses/${courseId}`);

  const content = await getCourseContentById(contentId);
  if (!content || content.course_id !== courseId) notFound();

  const [contents, completed] = await Promise.all([
    getCourseContents(courseId),
    getCompletedContentIds(enrollment.id),
  ]);

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
      >
        {viewer}
      </CourseLearnShell>
    </div>
  );
}
