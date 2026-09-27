import { listProfileChangeRequests } from "@/app/actions/profiles";
import { ProfileRequestsManager } from "@/components/courses/profile-requests-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function ProfileRequestsPage() {
  const { isOwner } = await gateDashboardPage("/dashboard/profile-requests");
  const requests = await listProfileChangeRequests();

  return (
    <div className="py-6 md:py-10">
      <ProfileRequestsManager requests={requests} canManage={isOwner} />
    </div>
  );
}
