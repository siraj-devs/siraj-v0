import { listNetworkProfiles } from "@/app/actions/network";
import { NetworkManager } from "@/components/network/network-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function DashboardNetworkPage() {
  const { canEdit } = await gateDashboardPage("/dashboard/network");
  const profiles = await listNetworkProfiles();

  return (
    <div className="py-6 md:py-10">
      <NetworkManager profiles={profiles} canManage={canEdit} />
    </div>
  );
}
