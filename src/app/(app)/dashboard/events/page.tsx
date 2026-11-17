import { redirect } from "next/navigation";

/** Events now live on the calendar page. */
export default function DashboardEventsPage() {
  redirect("/dashboard/calendar");
}
