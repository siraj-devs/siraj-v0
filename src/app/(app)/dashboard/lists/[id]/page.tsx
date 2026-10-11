import { getClubList } from "@/app/actions/lists";
import { ListDetail } from "@/components/lists/list-detail";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { notFound } from "next/navigation";

export default async function DashboardListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { canEdit } = await gateDashboardPage("/dashboard/lists");
  const { id } = await params;
  const data = await getClubList(id);
  if (!data) notFound();

  return (
    <div className="py-6 md:py-10">
      <ListDetail
        list={data.list}
        entries={data.entries}
        canManage={canEdit}
      />
    </div>
  );
}
