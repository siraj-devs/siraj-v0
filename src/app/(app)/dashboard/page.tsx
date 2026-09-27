import { dashboardEntryPath } from "@/lib/dashboard-access";
import { getMemberPagePermissions } from "@/lib/member-permissions";
import { getMemberForSession } from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const member = await getMemberForSession(session);
  const permissions = member
    ? await getMemberPagePermissions(member.id)
    : [];
  redirect(dashboardEntryPath(member?.role, permissions));
}
