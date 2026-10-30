import {
  getAvailableDcConnections,
  getAvailableFtConnections,
  getAvailableGoogleConnections,
  getClubMembers,
} from "@/app/actions/members";
import { MembersManager } from "@/components/members-manager";
import { roleVisibleTo } from "@/lib/member-role";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  const canManage = canManageMembers(current?.role);

  const members = (await getClubMembers()).map((member) => ({
    ...member,
    role: roleVisibleTo(current?.role, member.role),
  }));
  const [ftConnections, dcConnections, googleConnections] = canManage
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
        canManage={canManage}
        viewerRole={current?.role ?? null}
        currentMemberId={current?.id ?? null}
      />
    </div>
  );
}
