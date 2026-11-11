import {
  getAvailableDcConnections,
  getAvailableFtConnections,
  getAvailableGoogleConnections,
  getClubMembers,
} from "@/app/actions/members";
import { MembersManager } from "@/components/members-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { roleVisibleTo } from "@/lib/member-role";

export default async function MembersPage() {
  const { canEdit, member: current } = await gateDashboardPage(
    "/dashboard/members",
  );

  const members = (await getClubMembers()).map((member) => ({
    ...member,
    role: roleVisibleTo(current?.role, member.role),
  }));
  const [ftConnections, dcConnections, googleConnections] = canEdit
    ? await Promise.all([
        getAvailableFtConnections(),
        getAvailableDcConnections(),
        getAvailableGoogleConnections(),
      ])
    : [[], [], []];

  return (
    <div className="py-6 md:py-10">
      <MembersManager
        members={members}
        ftConnections={ftConnections}
        dcConnections={dcConnections}
        googleConnections={googleConnections}
        canManage={canEdit}
        viewerRole={current?.role ?? null}
        currentMemberId={current?.id ?? null}
      />
    </div>
  );
}
