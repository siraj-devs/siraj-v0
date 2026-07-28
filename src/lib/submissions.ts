import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import type { SubmissionRow } from "@/lib/submission-labels";

export type { SubmissionRow } from "@/lib/submission-labels";
export {
  getSubmissionAvailabilityLabel,
  getSubmissionTeamLabel,
} from "@/lib/submission-labels";

export async function getSubmissions(): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, connection_id, name, email, tel, team, skills, about, availability, notes, email_sent, email_sent_at, submitted_at",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }

  const rows = data ?? [];
  const connectionIds = [...new Set(rows.map((row) => row.connection_id))];
  const numericIds = connectionIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  const [{ data: ftConnections }, { data: dcConnections }] = await Promise.all([
    numericIds.length
      ? supabase
          .from("ft_connections")
          .select("id, login, name, avatar")
          .in("id", numericIds)
      : Promise.resolve({
          data: [] as {
            id: number;
            login: string;
            name: string | null;
            avatar: string | null;
          }[],
        }),
    connectionIds.length
      ? supabase
          .from("dc_connections")
          .select("id, username, avatar")
          .in("id", connectionIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            username: string;
            avatar: string | null;
          }[],
        }),
  ]);

  const ftMap = new Map(
    (ftConnections ?? []).map((c) => [String(c.id), c]),
  );
  const dcMap = new Map((dcConnections ?? []).map((c) => [c.id, c]));

  return rows.map((row) => {
    const ft = ftMap.get(row.connection_id);
    if (ft) {
      return {
        ...row,
        provider: "42" as const,
        connection_login: ft.login,
        connection_username: null,
        connection_avatar: ft.avatar,
        connection_name: ft.name,
      };
    }

    const dc = dcMap.get(row.connection_id);
    if (dc) {
      return {
        ...row,
        provider: "discord" as const,
        connection_login: null,
        connection_username: dc.username,
        connection_avatar: dc.avatar,
        connection_name: null,
      };
    }

    return {
      ...row,
      provider: null,
      connection_login: null,
      connection_username: null,
      connection_avatar: null,
      connection_name: null,
    };
  });
}

export async function hasSubmissionForSession() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { isLoggedIn: false, hasSubmittedForm: false as const };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("submitted_at")
    .eq("connection_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Error checking submission:", error);
    return { isLoggedIn: true, hasSubmittedForm: false as const, error: true };
  }

  return {
    isLoggedIn: true,
    hasSubmittedForm: Boolean(data),
    submissionDate: data?.submitted_at as string | undefined,
  };
}
