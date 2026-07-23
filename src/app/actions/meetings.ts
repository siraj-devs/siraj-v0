"use server";

import {
  canAccessDashboard,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MeetingAttendee = {
  id: number;
  kind: "member" | "guest";
  name: string;
  member_id: number | null;
  guest_id: number | null;
  login: string | null;
  avatar: string | null;
};

export type ClubMeeting = {
  id: number;
  name: string;
  date: string;
  description: string | null;
  start_time: string;
  end_time: string;
  attendees: MeetingAttendee[];
};

export type MeetingMemberOption = {
  id: number;
  name: string;
  login: string | null;
};

export type MeetingFtOption = {
  id: number;
  login: string;
  name: string | null;
};

async function requireDashboardMember() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");

  const member = await getMemberForSession(session);
  if (!canAccessDashboard(member?.role)) throw new Error("غير مصرح");

  return { session, member };
}

function revalidateMeetings() {
  revalidatePath("/dashboard/meetings");
  revalidatePath("/dashboard/back-end/meetings");
}

function normalizeTime(value: string) {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return trimmed;
}

function toTimeInput(value: string) {
  return value.slice(0, 5);
}

function mapAttendee(row: {
  id: number;
  member_id: number | null;
  guest_id: number | null;
  members:
    | {
        id: number;
        name: string;
        ft_connections: { login: string; avatar: string | null } | null;
      }
    | {
        id: number;
        name: string;
        ft_connections: { login: string; avatar: string | null } | null;
      }[]
    | null;
  guests:
    | {
        id: number;
        name: string;
        ft_connections: { login: string; avatar: string | null } | null;
      }
    | {
        id: number;
        name: string;
        ft_connections: { login: string; avatar: string | null } | null;
      }[]
    | null;
}): MeetingAttendee {
  const member = Array.isArray(row.members) ? row.members[0] : row.members;
  const guest = Array.isArray(row.guests) ? row.guests[0] : row.guests;

  if (row.member_id && member) {
    const ft = Array.isArray(member.ft_connections)
      ? member.ft_connections[0]
      : member.ft_connections;
    return {
      id: row.id,
      kind: "member",
      name: member.name,
      member_id: row.member_id,
      guest_id: null,
      login: ft?.login ?? null,
      avatar: ft?.avatar ?? null,
    };
  }

  if (row.guest_id && guest) {
    const ft = Array.isArray(guest.ft_connections)
      ? guest.ft_connections[0]
      : guest.ft_connections;
    return {
      id: row.id,
      kind: "guest",
      name: guest.name,
      member_id: null,
      guest_id: row.guest_id,
      login: ft?.login ?? null,
      avatar: ft?.avatar ?? null,
    };
  }

  return {
    id: row.id,
    kind: row.member_id ? "member" : "guest",
    name: "مجهول",
    member_id: row.member_id,
    guest_id: row.guest_id,
    login: null,
    avatar: null,
  };
}

export async function getMeetings(): Promise<ClubMeeting[]> {
  await requireDashboardMember();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id, name, date, description, start_time, end_time,
      meeting_attendees (
        id, member_id, guest_id,
        members ( id, name, ft_connections ( login, avatar ) ),
        guests ( id, name, ft_connections ( login, avatar ) )
      )
    `,
    )
    .order("date", { ascending: false })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching meetings:", error);
    throw new Error("تعذر جلب اللقاءات");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    date: row.date,
    description: row.description,
    start_time: toTimeInput(row.start_time),
    end_time: toTimeInput(row.end_time),
    attendees: (row.meeting_attendees ?? []).map(mapAttendee),
  }));
}

export async function getMeetingMemberOptions(): Promise<MeetingMemberOption[]> {
  await requireDashboardMember();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("id, name, ft_connections(login)")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching members for meetings:", error);
    throw new Error("تعذر جلب الأعضاء");
  }

  return (data ?? []).map((row) => {
    const ft = Array.isArray(row.ft_connections)
      ? row.ft_connections[0]
      : row.ft_connections;
    return {
      id: row.id,
      name: row.name,
      login: ft?.login ?? null,
    };
  });
}

export async function getMeetingFtOptions(): Promise<MeetingFtOption[]> {
  await requireDashboardMember();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ft_connections")
    .select("id, login, name")
    .order("login", { ascending: true });

  if (error) {
    console.error("Error fetching ft connections for meetings:", error);
    throw new Error("تعذر جلب حسابات 42");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    login: row.login,
    name: row.name,
  }));
}

export async function createMeeting(input: {
  name: string;
  date: string;
  description?: string | null;
  start_time: string;
  end_time: string;
}): Promise<{ success: true; id: number } | { success: false; error: string }> {
  try {
    await requireDashboardMember();

    const name = input.name?.trim();
    const date = input.date?.trim();
    const description = input.description?.trim() || null;
    const start_time = normalizeTime(input.start_time ?? "");
    const end_time = normalizeTime(input.end_time ?? "");

    if (!name) return { success: false, error: "اسم اللقاء مطلوب" };
    if (!date) return { success: false, error: "تاريخ اللقاء مطلوب" };
    if (!start_time || !end_time)
      return { success: false, error: "وقت البداية والنهاية مطلوبان" };
    if (end_time <= start_time)
      return { success: false, error: "وقت النهاية يجب أن يكون بعد البداية" };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("meetings")
      .insert({ name, date, description, start_time, end_time })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error creating meeting:", error);
      return { success: false, error: "تعذر إنشاء اللقاء" };
    }

    revalidateMeetings();
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function updateMeeting(input: {
  id: number;
  name: string;
  date: string;
  description?: string | null;
  start_time: string;
  end_time: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireDashboardMember();

    const id = Number(input.id);
    const name = input.name?.trim();
    const date = input.date?.trim();
    const description = input.description?.trim() || null;
    const start_time = normalizeTime(input.start_time ?? "");
    const end_time = normalizeTime(input.end_time ?? "");

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };
    if (!name) return { success: false, error: "اسم اللقاء مطلوب" };
    if (!date) return { success: false, error: "تاريخ اللقاء مطلوب" };
    if (!start_time || !end_time)
      return { success: false, error: "وقت البداية والنهاية مطلوبان" };
    if (end_time <= start_time)
      return { success: false, error: "وقت النهاية يجب أن يكون بعد البداية" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("meetings")
      .update({ name, date, description, start_time, end_time })
      .eq("id", id);

    if (error) {
      console.error("Error updating meeting:", error);
      return { success: false, error: "تعذر تحديث اللقاء" };
    }

    revalidateMeetings();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteMeeting(
  id: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireDashboardMember();

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase.from("meetings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting meeting:", error);
      return { success: false, error: "تعذر حذف اللقاء" };
    }

    revalidateMeetings();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function addMeetingMember(input: {
  meeting_id: number;
  member_id: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireDashboardMember();

    const meeting_id = Number(input.meeting_id);
    const member_id = Number(input.member_id);

    if (!meeting_id || !member_id)
      return { success: false, error: "بيانات غير صالحة" };

    const supabase = await createClient();
    const { error } = await supabase.from("meeting_attendees").insert({
      meeting_id,
      member_id,
      guest_id: null,
    });

    if (error) {
      console.error("Error adding member attendee:", error);
      if (error.code === "23505")
        return { success: false, error: "هذا العضو مضاف مسبقاً" };
      return { success: false, error: "تعذر إضافة العضو" };
    }

    revalidateMeetings();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function addMeetingGuest(input: {
  meeting_id: number;
  name: string;
  ft_connection?: number | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireDashboardMember();

    const meeting_id = Number(input.meeting_id);
    const name = input.name?.trim();
    const ft_connection = input.ft_connection ?? null;

    if (!meeting_id) return { success: false, error: "معرّف اللقاء غير صالح" };
    if (!name) return { success: false, error: "اسم الضيف مطلوب" };

    const supabase = await createClient();

    let guestId: number | null = null;

    if (ft_connection) {
      const { data: existing } = await supabase
        .from("guests")
        .select("id")
        .eq("ft_connection", ft_connection)
        .maybeSingle();

      if (existing) {
        guestId = existing.id;
        await supabase.from("guests").update({ name }).eq("id", guestId);
      }
    }

    if (!guestId) {
      const { data: created, error: guestError } = await supabase
        .from("guests")
        .insert({ name, ft_connection })
        .select("id")
        .single();

      if (guestError || !created) {
        console.error("Error creating guest:", guestError);
        if (guestError?.code === "23505")
          return { success: false, error: "حساب 42 مرتبط بضيف آخر" };
        return { success: false, error: "تعذر إنشاء الضيف" };
      }
      guestId = created.id;
    }

    const { error } = await supabase.from("meeting_attendees").insert({
      meeting_id,
      member_id: null,
      guest_id: guestId,
    });

    if (error) {
      console.error("Error adding guest attendee:", error);
      if (error.code === "23505")
        return { success: false, error: "هذا الضيف مضاف مسبقاً" };
      return { success: false, error: "تعذر إضافة الضيف" };
    }

    revalidateMeetings();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function removeMeetingAttendee(
  attendeeId: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireDashboardMember();

    if (!attendeeId || !Number.isFinite(attendeeId))
      return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("meeting_attendees")
      .delete()
      .eq("id", attendeeId);

    if (error) {
      console.error("Error removing attendee:", error);
      return { success: false, error: "تعذر إزالة الحضور" };
    }

    revalidateMeetings();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
