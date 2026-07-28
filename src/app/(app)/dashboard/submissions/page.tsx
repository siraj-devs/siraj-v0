import { getSubmissionsForDashboard } from "@/app/actions/submit-form";
import { SubmissionsManager } from "@/components/submissions-manager";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SubmissionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  if (!canManageMembers(current?.role)) redirect("/dashboard/members");

  const submissions = await getSubmissionsForDashboard();

  return (
    <div className="py-6 md:py-10">
      <SubmissionsManager submissions={submissions} />
    </div>
  );
}
