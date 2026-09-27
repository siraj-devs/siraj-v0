import { getProposedProgramsForDashboard } from "@/app/actions/content";
import { getDisabledPagesForDashboard } from "@/app/actions/disabled-pages";
import { getSocialsForDashboard } from "@/app/actions/socials";
import { ContentDashboard } from "@/components/content-dashboard";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function ContentPage() {
  const { isOwner } = await gateDashboardPage("/dashboard/content");

  const [programs, pages, socials] = await Promise.all([
    getProposedProgramsForDashboard(),
    isOwner ? getDisabledPagesForDashboard() : Promise.resolve([]),
    getSocialsForDashboard(),
  ]);

  return (
    <ContentDashboard
      programs={programs}
      pages={pages}
      socials={socials}
      canManage={isOwner}
      showDisabledPages={isOwner}
    />
  );
}
