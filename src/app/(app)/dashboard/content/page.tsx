import { getProposedProgramsForDashboard } from "@/app/actions/content";
import { ContentManager } from "@/components/content-manager";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ContentPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  const canManage = canManageMembers(current?.role);

  if (!canManage) redirect("/dashboard/members");

  const programs = await getProposedProgramsForDashboard();

  return (
    <div className="py-6 md:py-10">
      <ContentManager programs={programs} canManage={canManage} />
    </div>
  );
}
