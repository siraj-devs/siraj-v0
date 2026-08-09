/** Format due_date as "01 ربيع الثاني | 24 سبتمبر" (Hijri | Gregorian, Latin digits). */
export function formatSessionDueDate(dueDate: string | Date): string {
  const date =
    typeof dueDate === "string"
      ? new Date(dueDate.includes("T") ? dueDate : `${dueDate}T12:00:00`)
      : dueDate;

  if (Number.isNaN(date.getTime())) return "";

  const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-nu-latn", {
    day: "2-digit",
    month: "long",
  }).format(date);

  const gregorian = new Intl.DateTimeFormat("ar-u-nu-latn", {
    day: "numeric",
    month: "long",
  }).format(date);

  return `${hijri} | ${gregorian}`;
}
