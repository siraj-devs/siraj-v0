import { listEvents } from "@/app/actions/events";
import { EventsManager } from "@/components/events/events-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function DashboardEventsPage() {
  const { canEdit } = await gateDashboardPage("/dashboard/events");
  const events = await listEvents();

  return (
    <div className="py-6 md:py-10">
      <EventsManager events={events} canManage={canEdit} />
    </div>
  );
}
