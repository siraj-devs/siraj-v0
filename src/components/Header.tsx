import { SiteHeader } from "@/components/site-header";
import { checkFormCompletionStatus } from "@/lib/form-status";
import {
  canAccessDashboard,
  getMemberByFtConnectionId,
} from "@/lib/members";
import { getSession } from "@/lib/session";

export async function Header() {
  const formStatus = await checkFormCompletionStatus();
  const session = await getSession();

  const member = session
    ? await getMemberByFtConnectionId(session.user.id)
    : null;

  return (
    <SiteHeader
      isLoggedIn={formStatus.isLoggedIn}
      user={
        session
          ? {
              ...session.user,
              isAdmin: canAccessDashboard(member?.role),
            }
          : null
      }
    />
  );
}
