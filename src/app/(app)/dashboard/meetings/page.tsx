import {
  getMeetingFtOptions,
  getMeetingMemberOptions,
  getMeetings,
} from "@/app/actions/meetings";
import { MeetingsManager } from "@/components/meetings-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function MeetingsPage() {
  const { canEdit } = await gateDashboardPage("/dashboard/meetings");

  const meetings = await getMeetings();
  const [members, ftConnections] = canEdit
    ? await Promise.all([getMeetingMemberOptions(), getMeetingFtOptions()])
    : [[], []];

  return (
    <div className="py-6 md:py-10">
      <MeetingsManager
        meetings={meetings}
        members={members}
        ftConnections={ftConnections}
        canManage={canEdit}
      />
    </div>
  );
}
