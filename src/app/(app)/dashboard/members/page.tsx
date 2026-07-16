import {
  getAvailableFtConnections,
  getClubMembers,
} from "@/app/actions/members";
import { MembersManager } from "@/components/members-manager";
import {
  canManageMembers,
  getMemberByFtConnectionId,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberByFtConnectionId(session.user.id);
  const canManage = canManageMembers(current?.role);

  const members = await getClubMembers();
  const connections = canManage ? await getAvailableFtConnections() : [];

  return (
    <div className="py-6 md:py-10">
      <MembersManager
        members={members}
        connections={connections}
        canManage={canManage}
        currentMemberId={current?.id ?? null}
      />
    </div>
  );
}
