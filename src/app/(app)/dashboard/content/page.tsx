import { getProposedProgramsForDashboard } from "@/app/actions/content";
import { getDisabledPagesForDashboard } from "@/app/actions/disabled-pages";
import { ContentDashboard } from "@/components/content-dashboard";
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

  const [programs, pages] = await Promise.all([
    getProposedProgramsForDashboard(),
    getDisabledPagesForDashboard(),
  ]);

  return (
    <ContentDashboard
      programs={programs}
      pages={pages}
      canManage={canManage}
    />
  );
}
