export type ReleaseUnit = "hours" | "days";

export type LessonRelease = {
  release_unit: ReleaseUnit | null;
  release_amount: number | null;
};

export type CourseClass = {
  id: number;
  course_id: number;
  registration_opens_at: string;
  registration_closes_at: string;
  learning_starts_at: string;
  created_at: string;
};

export type RegistrationPhase = "open" | "upcoming" | "closed";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function lessonAvailableAt(
  learningStartsAt: string,
  lesson: LessonRelease,
): Date {
  const start = new Date(learningStartsAt);
  if (!lesson.release_unit || !lesson.release_amount) return start;
  const step = lesson.release_unit === "days" ? DAY_MS : HOUR_MS;
  return new Date(start.getTime() + lesson.release_amount * step);
}

export function isLessonOpen(
  learningStartsAt: string | null | undefined,
  lesson: LessonRelease,
  now = new Date(),
): boolean {
  if (!learningStartsAt) return true;
  return lessonAvailableAt(learningStartsAt, lesson).getTime() <= now.getTime();
}

export function nextOpenLesson<T extends LessonRelease & { id: number }>(
  contents: readonly T[],
  completedIds: ReadonlySet<number>,
  learningStartsAt: string | null,
): T | null {
  for (let index = 0; index < contents.length; index += 1) {
    const item = contents[index];
    if (completedIds.has(item.id)) continue;
    const previousDone = contents
      .slice(0, index)
      .every((earlier) => completedIds.has(earlier.id));
    if (!previousDone || !isLessonOpen(learningStartsAt, item)) return null;
    return item;
  }
  return null;
}

export function isRegistrationOpen(courseClass: CourseClass, now = new Date()) {
  const time = now.getTime();
  return (
    time >= new Date(courseClass.registration_opens_at).getTime() &&
    time < new Date(courseClass.registration_closes_at).getTime()
  );
}

export function pickOpenClass(
  classes: readonly CourseClass[],
  now = new Date(),
): CourseClass | null {
  return (
    classes
      .filter((item) => isRegistrationOpen(item, now))
      .sort(
        (a, b) =>
          new Date(a.learning_starts_at).getTime() -
          new Date(b.learning_starts_at).getTime(),
      )[0] ?? null
  );
}

export function registrationTarget(
  classes: readonly CourseClass[],
  now = new Date(),
): { phase: RegistrationPhase; courseClass: CourseClass | null } {
  const open = pickOpenClass(classes, now);
  if (open) return { phase: "open", courseClass: open };

  const upcoming =
    classes
      .filter(
        (item) => new Date(item.registration_opens_at).getTime() > now.getTime(),
      )
      .sort(
        (a, b) =>
          new Date(a.registration_opens_at).getTime() -
          new Date(b.registration_opens_at).getTime(),
      )[0] ?? null;

  if (upcoming) return { phase: "upcoming", courseClass: upcoming };
  return { phase: "closed", courseClass: null };
}

export function formatClassDate(iso: string) {
  return new Date(iso).toLocaleString("ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLessonRelease(lesson: LessonRelease) {
  const amount = lesson.release_amount;
  if (!lesson.release_unit || !amount) return "مع بداية التعلم";
  if (lesson.release_unit === "days") {
    if (amount === 1) return "بعد يوم";
    if (amount === 2) return "بعد يومين";
    return `بعد ${amount} أيام`;
  }
  if (amount === 1) return "بعد ساعة";
  if (amount === 2) return "بعد ساعتين";
  return `بعد ${amount} ساعات`;
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(local: string): string {
  return new Date(local).toISOString();
}
