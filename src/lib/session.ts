import { cookies } from "next/headers";

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const ftSession = cookieStore.get("42-session");
    if (ftSession) {
      return { ...JSON.parse(ftSession.value), provider: "42" };
    }

    const dcSession = cookieStore.get("dc-session");
    if (dcSession) {
      return { ...JSON.parse(dcSession.value), provider: "discord" };
    }

    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("42-session");
  cookieStore.delete("dc-session");
}
