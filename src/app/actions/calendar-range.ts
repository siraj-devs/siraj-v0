"use server";

import { requirePageAccess } from "@/lib/auth-guards";
import {
  CALENDAR_RANGE_COOKIE,
  resolveRangeSpec,
  type CalendarRangeSpec,
} from "@/lib/calendar-range";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type Result = { success: true } | { success: false; error: string };

/** Remember the visible calendar range in this browser; `null` resets it. */
export async function saveCalendarRange(
  spec: CalendarRangeSpec | null,
): Promise<Result> {
  await requirePageAccess("/dashboard/calendar");
  const store = await cookies();

  if (!spec) {
    store.delete(CALENDAR_RANGE_COOKIE);
    revalidatePath("/dashboard/calendar");
    return { success: true };
  }

  const resolved = await resolveRangeSpec(spec).catch(() => null);
  if (!resolved) {
    return {
      success: false,
      error: "نطاق غير صالح: تأكد أن النهاية بعد البداية وأن المدة لا تتجاوز 24 شهراً",
    };
  }

  store.set(CALENDAR_RANGE_COOKIE, JSON.stringify(spec), {
    path: "/dashboard",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/dashboard/calendar");
  return { success: true };
}
