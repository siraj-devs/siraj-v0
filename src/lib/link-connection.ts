import {
  getMemberByDcConnectionId,
  getMemberByFtConnectionId,
  getMemberForSession,
} from "@/lib/members";
import { createClient } from "@/lib/supabase/server";

export type LinkConnectionResult =
  | { success: true }
  | {
      success: false;
      code:
        | "unauthenticated"
        | "not_member"
        | "already_linked"
        | "connection_taken"
        | "update_failed";
    };

/** Attach a newly authorized OAuth connection to the current session's member. */
export async function linkConnectionToSessionMember(
  session: SessionData | null | undefined,
  connection: { provider: "42"; id: number } | { provider: "discord"; id: string },
): Promise<LinkConnectionResult> {
  if (!session?.user?.id) {
    return { success: false, code: "unauthenticated" };
  }

  const member = await getMemberForSession(session);
  if (!member) {
    return { success: false, code: "not_member" };
  }

  if (connection.provider === "42") {
    if (member.ft_connection) {
      return { success: false, code: "already_linked" };
    }

    const taken = await getMemberByFtConnectionId(connection.id);
    if (taken && taken.id !== member.id) {
      return { success: false, code: "connection_taken" };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("members")
      .update({ ft_connection: connection.id })
      .eq("id", member.id);

    if (error) {
      console.error("Error linking ft_connection:", error);
      if (error.code === "23505") {
        return { success: false, code: "connection_taken" };
      }
      return { success: false, code: "update_failed" };
    }

    return { success: true };
  }

  if (member.dc_connection) {
    return { success: false, code: "already_linked" };
  }

  const taken = await getMemberByDcConnectionId(connection.id);
  if (taken && taken.id !== member.id) {
    return { success: false, code: "connection_taken" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ dc_connection: connection.id })
    .eq("id", member.id);

  if (error) {
    console.error("Error linking dc_connection:", error);
    if (error.code === "23505") {
      return { success: false, code: "connection_taken" };
    }
    return { success: false, code: "update_failed" };
  }

  return { success: true };
}

export type UnlinkConnectionResult =
  | { success: true }
  | {
      success: false;
      error: string;
    };

/** Remove the non-session connection from the current member. */
export async function unlinkMemberConnection(
  session: SessionData | null | undefined,
  provider: "42" | "discord",
): Promise<UnlinkConnectionResult> {
  if (!session?.user?.id) {
    return { success: false, error: "يجب تسجيل الدخول أولاً" };
  }

  const member = await getMemberForSession(session);
  if (!member) {
    return { success: false, error: "يجب أن تكون عضواً لإلغاء الربط" };
  }

  const sessionProvider = session.provider ?? "42";
  if (provider === sessionProvider) {
    return {
      success: false,
      error: "لا يمكن إلغاء ربط الحساب الذي سجّلت الدخول به",
    };
  }

  const supabase = await createClient();

  if (provider === "42") {
    if (!member.ft_connection) {
      return { success: false, error: "حساب 42 غير مربوط" };
    }
    const { error } = await supabase
      .from("members")
      .update({ ft_connection: null })
      .eq("id", member.id);
    if (error) {
      console.error("Error unlinking ft_connection:", error);
      return { success: false, error: "تعذر إلغاء ربط حساب 42" };
    }
    return { success: true };
  }

  if (!member.dc_connection) {
    return { success: false, error: "حساب ديسكورد غير مربوط" };
  }
  const { error } = await supabase
    .from("members")
    .update({ dc_connection: null })
    .eq("id", member.id);
  if (error) {
    console.error("Error unlinking dc_connection:", error);
    return { success: false, error: "تعذر إلغاء ربط حساب ديسكورد" };
  }
  return { success: true };
}
