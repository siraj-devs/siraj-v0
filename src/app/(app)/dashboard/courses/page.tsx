import { listCoursesForDashboard } from "@/app/actions/courses";
import { getClubMembers } from "@/app/actions/members";
import { CoursesManager } from "@/components/courses/courses-manager";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardCoursesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const member = await getMemberForSession(session);
  if (!canManageMembers(member?.role)) redirect("/dashboard/members");

  const [courses, clubMembers] = await Promise.all([
    listCoursesForDashboard(),
    getClubMembers(),
  ]);

  return (
    <div className="py-6 md:py-10">
      <CoursesManager
        courses={courses}
        members={clubMembers.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
        }))}
      />
    </div>
  );
}
