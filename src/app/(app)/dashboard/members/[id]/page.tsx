import { getClubMemberById } from "@/app/actions/members";
import { MemberDetail } from "@/components/member-detail";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { roleVisibleTo } from "@/lib/member-role";
import { notFound } from "next/navigation";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { member: current } = await gateDashboardPage("/dashboard/members");

  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const member = await getClubMemberById(id);
  if (!member) notFound();

  return (
    <div className="py-6 md:py-10">
      <MemberDetail
        member={{
          ...member,
          role: roleVisibleTo(current?.role, member.role),
        }}
      />
    </div>
  );
}
