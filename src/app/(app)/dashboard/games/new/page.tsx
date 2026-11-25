import { GameTemplateEditor } from "@/components/games/game-template-editor";
import { gateGamesPage } from "@/lib/dashboard-gate";

export default async function NewGameTemplatePage() {
  await gateGamesPage("games.manage");

  return (
    <div className="py-6 md:py-10">
      <GameTemplateEditor template={null} canManage />
    </div>
  );
}
