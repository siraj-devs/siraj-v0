import { listEvents } from "@/app/actions/events";
import { EventsManager } from "@/components/events/events-manager";
import { canManageMembers, getMemberForSession } from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardEventsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  const canManage = canManageMembers(current?.role);

  if (!canManage) redirect("/dashboard/calendar");

  const events = await listEvents();

  return (
    <div className="py-6 md:py-10">
      <EventsManager events={events} canManage={canManage} />
    </div>
  );
}
