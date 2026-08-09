import { SiteHeader } from "@/components/site-header";
import { checkFormCompletionStatus } from "@/lib/form-status";
import { isPublicPathDisabled } from "@/lib/disabled-pages";
import {
  canAccessDashboard,
  getMemberForSession,
} from "@/lib/members";
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
              isAdmin: canAccessDashboard(member?.role),
              role: member?.role ?? null,
            }
          : null
      }
    />
  );
}
