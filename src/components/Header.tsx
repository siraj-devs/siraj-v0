import { SiteHeader } from "@/components/site-header";
import { checkFormCompletionStatus } from "@/lib/form-status";
import {
  canAccessDashboard,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { isPublicPathDisabled } from "@/lib/disabled-pages";

export async function Header() {
  const [formStatus, session, loginDisabled] = await Promise.all([
    checkFormCompletionStatus(),
    getSession(),
    isPublicPathDisabled("/login"),
  ]);

  const member = session ? await getMemberForSession(session) : null;

  return (
    <SiteHeader
      isLoggedIn={formStatus.isLoggedIn}
      showLogin={!loginDisabled}
      user={
        session
          ? {
              ...session.user,
              isAdmin: canAccessDashboard(member?.role),
              role: member?.role ?? null,
            }
          : null
      }
    />
  );
}
