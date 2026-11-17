"use client";

import { saveCalendarRange } from "@/app/actions/calendar-range";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalendarRangeSpec, HijriPart } from "@/lib/calendar-range";
import {
  dayKeyOf,
  describeDayKey,
  HIJRI_MONTHS_AR,
  MAX_RANGE_MONTHS,
} from "@/lib/hijri-calendar";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  Moon,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Mode = "hijri" | "gregorian";

type HijriDraft = { start: Record<keyof HijriPart, string>; end: Record<keyof HijriPart, string> };

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

function toStrings(part: HijriPart | null): Record<keyof HijriPart, string> {
  return part
    ? { y: String(part.y), m: String(part.m), d: String(part.d) }
    : { y: "", m: "1", d: "1" };
}

export function CalendarRangeEditor({
  days,
  startKey,
  endKey,
  spec,
}: {
  /** Days currently displayed (used to convert between Hijri/Gregorian). */
  days: HijriDay[];
  startKey: string;
  endKey: string;
  /** Saved custom range, or `null` when showing the default. */
  spec: CalendarRangeSpec | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(spec?.mode ?? "hijri");
  const isCustom = spec !== null;

  const activeHijri = useMemo(() => {
    const part = (key: string): HijriPart | null => {
      const day = days.find((d) => dayKeyOf(d) === key);
      return day
        ? {
            y: Number(day.hijri.year),
            m: day.hijri.month.number,
            d: Number(day.hijri.day),
          }
        : null;
    };
    return { start: part(startKey), end: part(endKey) };
  }, [days, startKey, endKey]);

  const [gStart, setGStart] = useState(startKey);
  const [gEnd, setGEnd] = useState(endKey);
  const [hijri, setHijri] = useState<HijriDraft>({
    start: toStrings(activeHijri.start),
    end: toStrings(activeHijri.end),
  });

  // Re-sync drafts whenever the applied range changes (after save / reset).
  useEffect(() => {
    setGStart(startKey);
    setGEnd(endKey);
    setHijri({
      start: toStrings(activeHijri.start),
      end: toStrings(activeHijri.end),
    });
  }, [startKey, endKey, activeHijri]);

  function changeMode(next: Mode) {
    if (next === mode) return;
    setGStart(startKey);
    setGEnd(endKey);
    setHijri({
      start: toStrings(activeHijri.start),
      end: toStrings(activeHijri.end),
    });
    setMode(next);
  }

  const draftSpec = useMemo((): CalendarRangeSpec | null => {
    if (mode === "gregorian") {
      return gStart && gEnd
        ? { mode: "gregorian", start: gStart, end: gEnd }
        : null;
    }
    const read = (p: Record<keyof HijriPart, string>): HijriPart | null => {
      const y = Number(p.y);
      const m = Number(p.m);
      const d = Number(p.d);
      return Number.isInteger(y) && y >= 1 && y <= 9999 && m >= 1 && d >= 1
        ? { y, m, d }
        : null;
    };
    const start = read(hijri.start);
    const end = read(hijri.end);
    return start && end ? { mode: "hijri", start, end } : null;
  }, [mode, gStart, gEnd, hijri]);

  const draftError = useMemo((): string | null => {
    if (!draftSpec) {
      return mode === "hijri"
        ? "أدخل سنة هجرية صحيحة للبداية والنهاية."
        : "حدد تاريخ البداية والنهاية.";
    }
    if (draftSpec.mode === "gregorian") {
      if (draftSpec.end < draftSpec.start) {
        return "تاريخ النهاية يجب أن يكون بعد البداية.";
      }
      const span =
        (new Date(draftSpec.end).getTime() -
          new Date(draftSpec.start).getTime()) /
        86_400_000;
      if (span > MAX_RANGE_MONTHS * 30) {
        return `الحد الأقصى ${MAX_RANGE_MONTHS} شهراً.`;
      }
      return null;
    }
    const { start, end } = draftSpec;
    const a = start.y * 10000 + start.m * 100 + start.d;
    const b = end.y * 10000 + end.m * 100 + end.d;
    if (b < a) return "تاريخ النهاية يجب أن يكون بعد البداية.";
    const months = (end.y - start.y) * 12 + (end.m - start.m) + 1;
    if (months > MAX_RANGE_MONTHS) return `الحد الأقصى ${MAX_RANGE_MONTHS} شهراً.`;
    return null;
  }, [draftSpec, mode]);

  function save(next: CalendarRangeSpec | null) {
    startTransition(async () => {
      const result = await saveCalendarRange(next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(next ? "تم حفظ النطاق" : "تمت العودة للنطاق الافتراضي");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <section
      aria-label="نطاق العرض"
      className="rounded-3xl border border-border/70 bg-background/70 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CalendarRange className="size-4 text-primary" />
            نطاق العرض
            {isCustom && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-normal text-primary">
                مخصّص
              </span>
            )}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            من {describeDayKey(startKey, days)}
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> — </span>
            إلى {describeDayKey(endKey, days)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => save(null)}
              disabled={pending}
            >
              <RotateCcw className="size-3.5" />
              الافتراضي
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <SlidersHorizontal className="size-3.5" />
            تعديل النطاق
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
          <div
            role="tablist"
            aria-label="نوع التاريخ"
            className="inline-flex rounded-xl border border-border bg-muted/40 p-1 text-sm"
          >
            {(
              [
                { value: "hijri", label: "هجري", icon: Moon },
                { value: "gregorian", label: "ميلادي", icon: CalendarDays },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={mode === opt.value}
                onClick={() => changeMode(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition",
                  mode === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <opt.icon className="size-3.5" />
                {opt.label}
              </button>
            ))}
          </div>

          {mode === "gregorian" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cal-start-g">من</Label>
                <Input
                  id="cal-start-g"
                  type="date"
                  dir="ltr"
                  className="text-left"
                  value={gStart}
                  onChange={(e) => setGStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-end-g">إلى</Label>
                <Input
                  id="cal-end-g"
                  type="date"
                  dir="ltr"
                  className="text-left"
                  value={gEnd}
                  min={gStart || undefined}
                  onChange={(e) => setGEnd(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["start", "end"] as const).map((side) => {
                const label = side === "start" ? "من" : "إلى";
                const value = hijri[side];
                const set = (patch: Partial<Record<keyof HijriPart, string>>) =>
                  setHijri((p) => ({ ...p, [side]: { ...p[side], ...patch } }));
                return (
                  <fieldset key={side} className="space-y-2">
                    <legend className="text-sm font-medium leading-none">
                      {label}
                    </legend>
                    <div className="grid grid-cols-[1fr_1.6fr_1fr] gap-2">
                      <Input
                        aria-label={`${label} - السنة الهجرية`}
                        type="number"
                        inputMode="numeric"
                        dir="ltr"
                        className="text-left"
                        value={value.y}
                        onChange={(e) => set({ y: e.target.value })}
                      />
                      <select
                        aria-label={`${label} - الشهر`}
                        className={SELECT_CLASS}
                        value={value.m}
                        onChange={(e) => set({ m: e.target.value })}
                      >
                        {HIJRI_MONTHS_AR.map((name, i) => (
                          <option key={name} value={i + 1}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={`${label} - اليوم`}
                        className={SELECT_CLASS}
                        value={value.d}
                        onChange={(e) => set({ d: e.target.value })}
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </fieldset>
                );
              })}
            </div>
          )}

          {draftError && (
            <p role="alert" className="text-sm text-destructive">
              {draftError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={pending || !!draftError || !draftSpec}
              onClick={() => draftSpec && save(draftSpec)}
            >
              {pending ? "جاري الحفظ…" : "تطبيق وحفظ"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              إلغاء
            </Button>
            <p className="text-xs text-muted-foreground">
              يُحفظ في هذا المتصفح فقط، ولا يتغيّر عند تحديث الصفحة.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
