import type { AppMember } from "@/lib/members";
import { getMemberForSession, isMemberProfileComplete } from "@/lib/members";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type ProfileRequestStatus = "pending" | "approved" | "rejected";

export type ProfileChangeRequest = {
  id: number;
  member_id: number | null;
  ft_connection: number | null;
  dc_connection: string | null;
  requested_name: string;
  requested_email: string;
  requested_phone: string;
  status: ProfileRequestStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_note: string | null;
  created_at: string;
  member_name?: string;
};

const PROFILE_REQUEST_COLUMNS =
  "id, member_id, ft_connection, dc_connection, requested_name, requested_email, requested_phone, status, reviewed_by, reviewed_at, rejection_note, created_at";

function mapProfileRequest(row: Record<string, unknown>): ProfileChangeRequest {
  return {
    id: row.id as number,
    member_id: (row.member_id as number | null) ?? null,
    ft_connection: (row.ft_connection as number | null) ?? null,
    dc_connection: (row.dc_connection as string | null) ?? null,
    requested_name: row.requested_name as string,
    requested_email: row.requested_email as string,
    requested_phone: row.requested_phone as string,
    status: row.status as ProfileRequestStatus,
    reviewed_by: (row.reviewed_by as number | null) ?? null,
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    rejection_note: (row.rejection_note as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export async function getPendingProfileRequestForMember(
  memberId: number,
): Promise<ProfileChangeRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_change_requests")
    .select(PROFILE_REQUEST_COLUMNS)
    .eq("member_id", memberId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    console.error("Error fetching pending profile request:", error);
    return null;
  }

  return data ? mapProfileRequest(data) : null;
}

export async function getPendingProfileRequestForSession(
  session: SessionData,
): Promise<ProfileChangeRequest | null> {
  const member = await getMemberForSession(session);
  if (member) {
    return getPendingProfileRequestForMember(member.id);
  }

  const supabase = await createClient();
  const isDiscord = session.provider === "discord";
  let query = supabase
    .from("profile_change_requests")
    .select(PROFILE_REQUEST_COLUMNS)
    .eq("status", "pending")
    .is("member_id", null);

  if (isDiscord) {
    query = query.eq("dc_connection", session.user.id);
  } else {
    const ftId = Number(session.user.id);
    if (!Number.isFinite(ftId)) return null;
    query = query.eq("ft_connection", ftId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error fetching pending profile request for session:", error);
    return null;
  }

  return data ? mapProfileRequest(data) : null;
}

export async function getProfileRequestsForDashboard(): Promise<
  ProfileChangeRequest[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_change_requests")
    .select(
      `${PROFILE_REQUEST_COLUMNS}, members!profile_change_requests_member_id_fkey(name)`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profile requests:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const memberRel = row.members as
      | { name?: string }
      | { name?: string }[]
      | null;
    const memberName = Array.isArray(memberRel)
      ? memberRel[0]?.name
      : memberRel?.name;

    return {
      ...mapProfileRequest(row),
      member_name: memberName ?? row.requested_name,
    };
  });
}

export async function getSessionMemberContext(): Promise<{
  session: SessionData | null;
  member: AppMember | null;
  complete: boolean;
  pendingRequest: ProfileChangeRequest | null;
}> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      member: null,
      complete: false,
      pendingRequest: null,
    };
  }

  const member = await getMemberForSession(session);
  const pendingRequest = await getPendingProfileRequestForSession(session);
  return {
    session,
    member,
    complete: isMemberProfileComplete(member),
    pendingRequest,
  };
}
