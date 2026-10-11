import { listClubLists } from "@/app/actions/lists";
import { ListsManager } from "@/components/lists/lists-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function DashboardListsPage() {
  const { canEdit } = await gateDashboardPage("/dashboard/lists");
  const lists = await listClubLists();

  return (
    <div className="py-6 md:py-10">
      <ListsManager lists={lists} canManage={canEdit} />
    </div>
  );
}
