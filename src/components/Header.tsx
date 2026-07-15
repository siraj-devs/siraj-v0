import { SiteHeader } from "@/components/site-header";
import { checkFormCompletionStatus } from "@/lib/form-status";
import { getSession } from "@/lib/session";

export async function Header() {
  const formStatus = await checkFormCompletionStatus();
  const session = await getSession();

  return (
    <SiteHeader
      isLoggedIn={formStatus.isLoggedIn}
      user={
        session
          ? {
              ...session.user,
              isAdmin: session.user.id === process.env.ADMIN_ID,
            }
          : null
      }
    />
  );
}
