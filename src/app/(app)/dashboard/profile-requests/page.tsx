import { listProfileChangeRequests } from "@/app/actions/profiles";
import { ProfileRequestsManager } from "@/components/courses/profile-requests-manager";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfileRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const member = await getMemberForSession(session);
  if (!canManageMembers(member?.role)) redirect("/dashboard/members");

  const requests = await listProfileChangeRequests();

  return (
    <div className="py-6 md:py-10">
      <ProfileRequestsManager requests={requests} />
    </div>
  );
}
