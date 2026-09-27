import { listCoursesForDashboard } from "@/app/actions/courses";
import { getClubMembers } from "@/app/actions/members";
import { CoursesManager } from "@/components/courses/courses-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function DashboardCoursesPage() {
  const { canEdit } = await gateDashboardPage("/dashboard/courses");

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
        canManage={canEdit}
      />
    </div>
  );
}
