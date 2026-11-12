import { getClubMemberById } from "@/app/actions/members";
import { MemberDetail } from "@/components/member-detail";
import { getMemberLearning, type MemberLearningItem } from "@/lib/courses";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { roleVisibleTo } from "@/lib/member-role";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
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

  let learning: MemberLearningItem[] = [];
  try {
    learning = await getMemberLearning(id);
  } catch {
    learning = [];
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6 md:py-10">
      <Link
        href="/dashboard/members"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        الأعضاء
      </Link>
      <MemberDetail
        member={{
          ...member,
          role: roleVisibleTo(current?.role, member.role),
        }}
        learning={learning}
      />
    </div>
  );
}
