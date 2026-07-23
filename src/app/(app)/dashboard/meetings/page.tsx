import {
  getMeetingFtOptions,
  getMeetingMemberOptions,
  getMeetings,
} from "@/app/actions/meetings";
import { MeetingsManager } from "@/components/meetings-manager";

export default async function MeetingsPage() {
  const [meetings, members, ftConnections] = await Promise.all([
    getMeetings(),
    getMeetingMemberOptions(),
    getMeetingFtOptions(),
  ]);

  return (
    <div className="py-6 md:py-10">
      <MeetingsManager
        meetings={meetings}
        members={members}
        ftConnections={ftConnections}
      />
    </div>
  );
}
