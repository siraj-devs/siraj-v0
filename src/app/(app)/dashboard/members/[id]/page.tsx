import { getClubMemberById } from "@/app/actions/members";
import { MemberDetail } from "@/components/member-detail";
import { canOpenDashboardPath } from "@/lib/dashboard-access";
import { getMemberPagePermissions } from "@/lib/member-permissions";
import { roleVisibleTo } from "@/lib/member-role";
import { getMemberForSession } from "@/lib/members";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/members");

  const current = await getMemberForSession(session);
  const permissions = current
    ? await getMemberPagePermissions(current.id)
    : [];

  if (!canOpenDashboardPath(current?.role, permissions, "/dashboard/members")) {
    redirect("/");
  }

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
