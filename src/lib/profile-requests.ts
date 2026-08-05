import type { AppMember } from "@/lib/members";
import { getMemberForSession, isMemberProfileComplete } from "@/lib/members";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type ProfileRequestStatus = "pending" | "approved" | "rejected";

export type ProfileChangeRequest = {
  id: number;
  member_id: number;
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

export async function getPendingProfileRequestForMember(
  memberId: number,
): Promise<ProfileChangeRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_change_requests")
    .select(
      "id, member_id, requested_name, requested_email, requested_phone, status, reviewed_by, reviewed_at, rejection_note, created_at",
    )
    .eq("member_id", memberId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    console.error("Error fetching pending profile request:", error);
    return null;
  }

  return (data as ProfileChangeRequest | null) ?? null;
}

export async function getProfileRequestsForDashboard(): Promise<
  ProfileChangeRequest[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_change_requests")
    .select(
      "id, member_id, requested_name, requested_email, requested_phone, status, reviewed_by, reviewed_at, rejection_note, created_at, members!profile_change_requests_member_id_fkey(name)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profile requests:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const memberRel = row.members as { name?: string } | { name?: string }[] | null;
    const memberName = Array.isArray(memberRel)
      ? memberRel[0]?.name
      : memberRel?.name;

    return {
      id: row.id,
      member_id: row.member_id,
      requested_name: row.requested_name,
      requested_email: row.requested_email,
      requested_phone: row.requested_phone,
      status: row.status,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      rejection_note: row.rejection_note,
      created_at: row.created_at,
      member_name: memberName,
    } as ProfileChangeRequest;
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
    return { session: null, member: null, complete: false, pendingRequest: null };
  }

  const member = await getMemberForSession(session);
  if (!member) {
    return { session, member: null, complete: false, pendingRequest: null };
  }

  const pendingRequest = await getPendingProfileRequestForMember(member.id);
  return {
    session,
    member,
    complete: isMemberProfileComplete(member),
    pendingRequest,
  };
}
