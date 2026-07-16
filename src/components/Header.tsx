import { SiteHeader } from "@/components/site-header";
import { checkFormCompletionStatus } from "@/lib/form-status";
import {
  canAccessDashboard,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";

export async function Header() {
  const formStatus = await checkFormCompletionStatus();
  const session = await getSession();

  const member = session ? await getMemberForSession(session) : null;

  return (
    <SiteHeader
      isLoggedIn={formStatus.isLoggedIn}
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
