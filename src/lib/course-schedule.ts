export type DurationUnit = "hours" | "days";

export type LessonDuration = {
  duration_unit: DurationUnit | null;
  duration_amount: number | null;
};

export type CourseClass = {
  id: number;
  course_id: number;
  learning_starts_at: string;
  created_at: string;
};

export function pickJoinClass(
  classes: readonly CourseClass[],
): CourseClass | null {
  return (
    [...classes].sort((a, b) => {
      const byStart = b.learning_starts_at.localeCompare(a.learning_starts_at);
      if (byStart !== 0) return byStart;
      return b.created_at.localeCompare(a.created_at);
    })[0] ?? null
  );
}

export function nextOpenLesson<T extends { id: number }>(
  contents: readonly T[],
  completedIds: ReadonlySet<number>,
): T | null {
  for (let index = 0; index < contents.length; index += 1) {
    const item = contents[index];
    if (completedIds.has(item.id)) continue;
    const previousDone = contents
      .slice(0, index)
      .every((earlier) => completedIds.has(earlier.id));
    if (!previousDone) return null;
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
