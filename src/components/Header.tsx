import { SiteHeader } from "@/components/site-header";
import { checkFormCompletionStatus } from "@/lib/form-status";
import { isPublicPathDisabled } from "@/lib/disabled-pages";
import {
  canOpenDashboard,
} from "@/lib/dashboard-access";
import { getMemberPagePermissions } from "@/lib/member-permissions";
import { getMemberForSession } from "@/lib/members";
import { getSession } from "@/lib/session";

export async function Header() {
  const [formStatus, session, joinDisabled, coursesDisabled, sessionsDisabled] =
    await Promise.all([
      checkFormCompletionStatus(),
      getSession(),
      isPublicPathDisabled("/join"),
      isPublicPathDisabled("/courses"),
      isPublicPathDisabled("/sessions"),
    ]);

  const member = session ? await getMemberForSession(session) : null;
  const pagePermissions = member
    ? await getMemberPagePermissions(member.id)
    : [];

  return (
    <SiteHeader
      isLoggedIn={formStatus.isLoggedIn}
      showLogin
      showJoin={!joinDisabled}
      showCourses={!coursesDisabled}
      showSessions={!sessionsDisabled}
      user={
        session
          ? {
              ...session.user,
              name: member?.name ?? session.user.name,
              isAdmin: canOpenDashboard(member?.role, pagePermissions),
              role: member?.role ?? null,
              pagePermissions,
            }
          : null
      }
    />
  );
}
