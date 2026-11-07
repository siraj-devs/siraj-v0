export type DurationUnit = "hours" | "days";

export type LessonDuration = {
  duration_unit: DurationUnit | null;
  duration_amount: number | null;
};

export type CourseClass = {
  id: number;
  course_id: number;
  registration_opens_on: string;
  registration_closes_on: string;
  learning_starts_at: string;
  created_at: string;
};

export function todayDateOnly(timeZone = "Africa/Casablanca") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Open from registration_opens_on through registration_closes_on (inclusive). */
export function isClassOpen(courseClass: CourseClass, today = todayDateOnly()) {
  return (
    courseClass.registration_opens_on <= today &&
    today <= courseClass.registration_closes_on
  );
}

/** The open class with the latest registration open date (or first if tied). */
export function pickOpenClass(
  classes: readonly CourseClass[],
  today = todayDateOnly(),
): CourseClass | null {
  const open = classes.filter((courseClass) => isClassOpen(courseClass, today));
  if (open.length === 0) return null;
  return open.sort((a, b) =>
    b.registration_opens_on.localeCompare(a.registration_opens_on),
  )[0];
}

/** The next class whose registration has not opened yet. */
export function pickUpcomingClass(
  classes: readonly CourseClass[],
  today = todayDateOnly(),
): CourseClass | null {
  return (
    classes
      .filter((courseClass) => courseClass.registration_opens_on > today)
      .sort((a, b) =>
        a.registration_opens_on.localeCompare(b.registration_opens_on),
      )[0] ?? null
  );
}

export function hasLearningStarted(
  learningStartsAt: string,
  today = todayDateOnly(),
) {
  return learningStartsAt.slice(0, 10) <= today;
}

/** Lessons without start_date are available immediately. */
export function hasLessonStarted(
  lesson: { start_date: string | null },
  today = todayDateOnly(),
) {
  if (!lesson.start_date) return true;
  return lesson.start_date.slice(0, 10) <= today;
}

export function isLessonLocked(
  contents: readonly { id: number; start_date: string | null }[],
  index: number,
  completedIds: ReadonlySet<number>,
  today = todayDateOnly(),
) {
  const item = contents[index];
  if (!item) return true;
  if (!hasLessonStarted(item, today)) return true;
  if (index > 0 && !completedIds.has(contents[index - 1]!.id)) return true;
  return false;
}

export function nextOpenLesson<
  T extends { id: number; start_date: string | null },
>(contents: readonly T[], completedIds: ReadonlySet<number>): T | null {
  const today = todayDateOnly();
  for (let index = 0; index < contents.length; index += 1) {
    const item = contents[index];
    if (completedIds.has(item.id)) continue;
    const previousDone = contents
      .slice(0, index)
      .every((earlier) => completedIds.has(earlier.id));
    if (!previousDone) return null;
    if (!hasLessonStarted(item, today)) return null;
    return item;
  }
  return null;
}

export function formatClassDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString("ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRegistrationWindow(courseClass: CourseClass) {
  if (courseClass.registration_opens_on === courseClass.registration_closes_on) {
    return formatClassDate(courseClass.registration_opens_on);
  }
  return `${formatClassDate(courseClass.registration_opens_on)} – ${formatClassDate(courseClass.registration_closes_on)}`;
}

export function formatLessonDuration(lesson: LessonDuration) {
  const amount = lesson.duration_amount;
  if (!lesson.duration_unit || !amount) return null;
  if (lesson.duration_unit === "days") {
    if (amount === 1) return "يوم";
    if (amount === 2) return "يومان";
    return `${amount} أيام`;
  }
  if (amount === 1) return "ساعة";
  if (amount === 2) return "ساعتان";
  return `${amount} ساعات`;
}

export function formatLessonDateRange(lesson: {
  start_date: string | null;
  end_date: string | null;
}) {
  if (!lesson.start_date && !lesson.end_date) return null;
  if (lesson.start_date && lesson.end_date) {
    if (lesson.start_date === lesson.end_date) {
      return formatClassDate(lesson.start_date);
    }
    return `${formatClassDate(lesson.start_date)} – ${formatClassDate(lesson.end_date)}`;
  }
  if (lesson.start_date) return `من ${formatClassDate(lesson.start_date)}`;
  return `حتى ${formatClassDate(lesson.end_date!)}`;
}

export function parseDateOnly(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}
