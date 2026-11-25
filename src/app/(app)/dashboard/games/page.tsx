import { listGameTemplates } from "@/app/actions/games";
import { GamesManager } from "@/components/games/games-manager";
import { gateGamesPage } from "@/lib/dashboard-gate";

export default async function DashboardGamesPage() {
  const { canManage } = await gateGamesPage("games.view");
  const templates = await listGameTemplates();

  return (
    <div className="py-6 md:py-10">
      <GamesManager templates={templates} canManage={canManage} />
    </div>
  );
}
