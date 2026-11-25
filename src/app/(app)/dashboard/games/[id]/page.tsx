import { getGameTemplate } from "@/app/actions/games";
import { GameTemplateEditor } from "@/components/games/game-template-editor";
import { gateGamesPage } from "@/lib/dashboard-gate";
import { notFound } from "next/navigation";

export default async function GameTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { canManage } = await gateGamesPage("games.view");
  const { id } = await params;
  const template = await getGameTemplate(id);
  if (!template) notFound();

  return (
    <div className="py-6 md:py-10">
      <GameTemplateEditor key={template.id} template={template} canManage={canManage} />
    </div>
  );
}
