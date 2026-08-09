import { getMemberForSession, type AppMember } from "@/lib/members";
import { getSession } from "@/lib/session";

/** Sync check used by proxy and server helpers. */
export function check42ConnectionAccess(
  session: SessionData | null | undefined,
  member: AppMember | null | undefined,
): boolean {
  if (!session?.user?.id) return false;
  if (session.provider === "42") return true;
  return member?.ft_connection != null;
}

/** True if the current user has a 42 login cookie or a member ft_connection. */
export async function has42ConnectionAccess(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.provider === "42") return true;
  const member = await getMemberForSession(session);
  return check42ConnectionAccess(session, member);
}
