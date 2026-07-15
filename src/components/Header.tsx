import { SiteHeader } from "@/components/site-header";
import { checkFormCompletionStatus } from "@/lib/form-status";
import { getSession } from "@/lib/session";
import { canAccessDashboard, getUserByFtConnectionId } from "@/lib/users";

export async function Header() {
  const formStatus = await checkFormCompletionStatus();
  const session = await getSession();

  const appUser = session
    ? await getUserByFtConnectionId(session.user.id)
    : null;

  return (
    <SiteHeader
      isLoggedIn={formStatus.isLoggedIn}
      user={
        session
          ? {
              ...session.user,
              isAdmin: canAccessDashboard(appUser?.role),
            }
          : null
      }
    />
  );
}
