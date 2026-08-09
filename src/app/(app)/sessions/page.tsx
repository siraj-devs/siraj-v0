import { getPublishedSessions } from "@/app/actions/sessions";
import DecorativeLines from "@/components/DecorativeLines";
import { SessionsCatalog } from "@/components/sessions-catalog";

export default async function SessionsPage() {
  const sessions = await getPublishedSessions();

  return (
    <div className="flex flex-col gap-10 py-10 pb-16 md:gap-14 md:py-14">
      <DecorativeLines
        eyebrow="الأمسيات"
        title="انضم إلى مجالس سراج التربوية"
        description="استمع إلى تسجيلات الأمسيات السابقة، من سلاسل المجالس التي تنير الطريق وتعزّز الوعي."
      />
      <SessionsCatalog sessions={sessions} />
    </div>
  );
}
