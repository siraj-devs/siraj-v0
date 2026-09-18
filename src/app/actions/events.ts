"use server";

import { requireDashboardMember, requireOwner } from "@/lib/auth-guards";
import {
  isEventColor,
  resolveEventColor,
  type EventColor,
} from "@/lib/event-colors";
import {
  expandEventOccurrences,
  normalizeRepeatInput,
  normalizeWeekdays,
  resolveRepeatMode,
  validateRepeatInput,
  type EventRepeatMode,
  type RepeatableEvent,
  type Weekday,
} from "@/lib/event-repeat";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ClubEvent = {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  color: EventColor;
  repeat_mode: EventRepeatMode;
  repeat_weekdays: Weekday[];
  created_at?: string;
  updated_at?: string;
};

const SELECT_COLS =
  "id, name, start_at, end_at, color, repeat_mode, repeat_weekdays, created_at, updated_at";

function revalidateEvents() {
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/calendar");
}

function mapRow(row: {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  color: string;
  repeat_mode?: string | null;
  repeat_weekdays?: number[] | null;
  created_at?: string;
  updated_at?: string;
}): ClubEvent {
  const repeat_mode = resolveRepeatMode(row.repeat_mode);
  const repeat_weekdays =
    repeat_mode === "weekly" ? normalizeWeekdays(row.repeat_weekdays) : [];
  return {
    id: row.id,
    name: row.name,
    start_at: row.start_at,
    end_at: row.end_at,
    color: resolveEventColor(row.color),
    repeat_mode,
    repeat_weekdays,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseIso(value: string): Date | null {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toRepeatable(event: ClubEvent): RepeatableEvent {
  return event;
}

export async function listEvents(): Promise<ClubEvent[]> {
  await requireDashboardMember();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(SELECT_COLS)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error listing events:", error);
    throw new Error("تعذر جلب الأحداث");
  }

  return (data ?? []).map(mapRow);
}

/** Events overlapping [rangeStart, rangeEnd) — used by the calendar page. */
export async function listEventsForRange(
  rangeStart: string | Date,
  rangeEnd: string | Date,
): Promise<ClubEvent[]> {
  await requireDashboardMember();

  const start =
    typeof rangeStart === "string" ? parseIso(rangeStart) : rangeStart;
  const end = typeof rangeEnd === "string" ? parseIso(rangeEnd) : rangeEnd;
  if (!start || !end || end <= start) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(SELECT_COLS)
    .lt("start_at", end.toISOString())
    .gt("end_at", start.toISOString())
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error listing events for range:", error);
    throw new Error("تعذر جلب أحداث التقويم");
  }

  const templates = (data ?? []).map(mapRow);
  return templates.flatMap((event) =>
    expandEventOccurrences(toRepeatable(event), start, end),
  );
}

type EventWriteInput = {
  name: string;
  start_at: string;
  end_at: string;
  color: string;
  repeat_mode?: string;
  repeat_weekdays?: number[];
};

function parseWriteFields(input: EventWriteInput):
  | {
      success: true;
      name: string;
      start: Date;
      end: Date;
      color: string;
      repeat_mode: EventRepeatMode;
      repeat_weekdays: Weekday[] | null;
    }
  | { success: false; error: string } {
  const name = input.name.trim();
  if (!name) return { success: false, error: "اسم الحدث مطلوب" };

  const start = parseIso(input.start_at);
  const end = parseIso(input.end_at);
  if (!start || !end) return { success: false, error: "تاريخ غير صالح" };
  if (end <= start)
    return { success: false, error: "يجب أن يكون وقت النهاية بعد البداية" };

  if (!isEventColor(input.color))
    return { success: false, error: "لون غير صالح" };

  const mode = resolveRepeatMode(input.repeat_mode ?? "daily");
  const weekdays = normalizeWeekdays(input.repeat_weekdays ?? []);
  const repeatError = validateRepeatInput(mode, weekdays);
  if (repeatError) return { success: false, error: repeatError };

  const normalized = normalizeRepeatInput(mode, weekdays);
  return {
    success: true,
    name,
    start,
    end,
    color: input.color,
    repeat_mode: normalized.repeat_mode,
    repeat_weekdays: normalized.repeat_weekdays,
  };
}

export async function createEvent(
  input: EventWriteInput,
): Promise<
  { success: true; event: ClubEvent } | { success: false; error: string }
> {
  try {
    await requireOwner();
    const parsed = parseWriteFields(input);
    if (!parsed.success) return parsed;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        name: parsed.name,
        start_at: parsed.start.toISOString(),
        end_at: parsed.end.toISOString(),
        color: parsed.color,
        repeat_mode: parsed.repeat_mode,
        repeat_weekdays: parsed.repeat_weekdays,
        updated_at: new Date().toISOString(),
      })
      .select(SELECT_COLS)
      .single();

    if (error || !data) {
      console.error("Error creating event:", error);
      return { success: false, error: "تعذر إنشاء الحدث" };
    }

    revalidateEvents();
    return { success: true, event: mapRow(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function updateEvent(
  input: EventWriteInput & { id: string },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();
    if (!input.id) return { success: false, error: "معرّف غير صالح" };

    const parsed = parseWriteFields(input);
    if (!parsed.success) return parsed;

    const supabase = await createClient();
    const { error } = await supabase
      .from("events")
      .update({
        name: parsed.name,
        start_at: parsed.start.toISOString(),
        end_at: parsed.end.toISOString(),
        color: parsed.color,
        repeat_mode: parsed.repeat_mode,
        repeat_weekdays: parsed.repeat_weekdays,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) {
      console.error("Error updating event:", error);
      return { success: false, error: "تعذر تحديث الحدث" };
    }

    revalidateEvents();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function deleteEvent(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();
    if (!id) return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      console.error("Error deleting event:", error);
      return { success: false, error: "تعذر حذف الحدث" };
    }

    revalidateEvents();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}
