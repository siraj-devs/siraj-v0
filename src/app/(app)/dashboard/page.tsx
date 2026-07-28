import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const member = await getMemberForSession(session);
  if (canManageMembers(member?.role)) redirect("/dashboard/submissions");
  redirect("/dashboard/members");
}
