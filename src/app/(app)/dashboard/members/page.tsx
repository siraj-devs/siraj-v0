import {
  getAvailableDcConnections,
  getAvailableFtConnections,
  getClubMembers,
} from "@/app/actions/members";
import { MembersManager } from "@/components/members-manager";
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

  const members = await getClubMembers();
  const [ftConnections, dcConnections] = canManage
    ? await Promise.all([
        getAvailableFtConnections(),
        getAvailableDcConnections(),
      ])
    : [[], []];

  return (
    <div className="py-6 md:py-10">
      <MembersManager
        members={members}
        ftConnections={ftConnections}
        dcConnections={dcConnections}
        canManage={canManage}
        currentMemberId={current?.id ?? null}
      />
    </div>
  );
}
