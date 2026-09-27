import { getSubmissionsForDashboard } from "@/app/actions/submit-form";
import { SubmissionsManager } from "@/components/submissions-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function SubmissionsPage() {
  await gateDashboardPage("/dashboard/submissions");
  const submissions = await getSubmissionsForDashboard();

  return (
    <div className="py-6 md:py-10">
      <SubmissionsManager submissions={submissions} />
    </div>
  );
}
