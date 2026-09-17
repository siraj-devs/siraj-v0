import { listNetworkProfiles } from "@/app/actions/network";
import { NetworkManager } from "@/components/network/network-manager";
import { canManageMembers, getMemberForSession } from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardNetworkPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  const canManage = canManageMembers(current?.role);

  if (!canManage) redirect("/dashboard/members");

  const profiles = await listNetworkProfiles();

  return (
    <div className="py-6 md:py-10">
      <NetworkManager profiles={profiles} canManage={canManage} />
    </div>
  );
}
