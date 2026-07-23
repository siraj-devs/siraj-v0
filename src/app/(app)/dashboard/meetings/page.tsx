import {
  getMeetingFtOptions,
  getMeetingMemberOptions,
  getMeetings,
} from "@/app/actions/meetings";
import { MeetingsManager } from "@/components/meetings-manager";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MeetingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  const canManage = canManageMembers(current?.role);

  const meetings = await getMeetings();
  const [members, ftConnections] = canManage
    ? await Promise.all([getMeetingMemberOptions(), getMeetingFtOptions()])
    : [[], []];

  return (
    <div className="py-6 md:py-10">
      <MeetingsManager
        meetings={meetings}
        members={members}
        ftConnections={ftConnections}
        canManage={canManage}
      />
    </div>
  );
}
