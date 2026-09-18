"use client";

import { FormDialog } from "@/components/dashboard/form-dialog";
import { SegmentedChoiceField } from "@/components/dashboard/segmented-choice-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_EVENT_COLOR,
  EVENT_COLOR_PALETTE,
  type EventColor,
} from "@/lib/event-colors";
import {
  ALL_WEEKDAYS,
  WEEKDAYS_SAT_FIRST,
  type EventRepeatMode,
  type Weekday,
} from "@/lib/event-repeat";
import { CalendarDays, CalendarRange, Check, Repeat } from "lucide-react";
import type { FormEvent } from "react";

export type EventFormState = {
  name: string;
  start_at: string;
  end_at: string;
  color: EventColor;
  repeat_mode: EventRepeatMode;
  repeat_weekdays: Weekday[];
};

export function emptyEventForm(): EventFormState {
  return {
    name: "",
    start_at: "",
    end_at: "",
    color: DEFAULT_EVENT_COLOR,
    repeat_mode: "daily",
    repeat_weekdays: [...ALL_WEEKDAYS],
  };
}

function toggleWeekday(days: Weekday[], day: Weekday): Weekday[] {
  if (days.includes(day)) return days.filter((d) => d !== day);
  return [...days, day].sort((a, b) => a - b);
}

export function EventFormDialog({
  mode,
  form,
  onFormChange,
  pending,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: EventFormState;
  onFormChange: (updater: (prev: EventFormState) => EventFormState) => void;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <FormDialog
      title={mode === "create" ? "حدث جديد" : "تعديل الحدث"}
      description="الاسم، المدة، التكرار، ولون الظهور في التقويم."
      onClose={onClose}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel={mode === "create" ? "إنشاء" : "حفظ"}
      maxWidthClassName="max-w-md"
    >
      <div className="space-y-2">
        <Label htmlFor="event-name">الاسم</Label>
        <Input
          id="event-name"
          value={form.name}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, name: e.target.value }))
          }
          placeholder="اسم الحدث"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-start">البداية</Label>
        <Input
          id="event-start"
          type="datetime-local"
          value={form.start_at}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, start_at: e.target.value }))
          }
          required
          dir="ltr"
          className="text-left"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-end">النهاية</Label>
        <Input
          id="event-end"
          type="datetime-local"
          value={form.end_at}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, end_at: e.target.value }))
          }
          required
          dir="ltr"
          className="text-left"
        />
        {form.repeat_mode !== "none" && (
          <p className="text-xs text-muted-foreground">
            التاريخ يحدد مدة السلسلة، والوقت يُطبَّق في كل يوم تكرار.
          </p>
        )}
      </div>

      <SegmentedChoiceField
        legend="التكرار"
        name="event-repeat"
        value={form.repeat_mode}
        onChange={(repeat_mode) =>
          onFormChange((f) => ({
            ...f,
            repeat_mode,
            repeat_weekdays:
              repeat_mode === "weekly" && f.repeat_weekdays.length === 0
                ? [...ALL_WEEKDAYS]
                : f.repeat_weekdays,
          }))
        }
        columns={3}
        options={[
          {
            value: "none",
            label: "بدون تكرار",
            icon: <CalendarRange />,
            activeClassName:
              "border-foreground/30 bg-muted text-foreground",
          },
          {
            value: "daily",
            label: "كل يوم",
            icon: <Repeat />,
            activeClassName:
              "border-primary/40 bg-primary/10 text-foreground",
          },
          {
            value: "weekly",
            label: "أيام محددة",
            icon: <CalendarDays />,
            activeClassName:
              "border-secondary/40 bg-secondary/10 text-foreground",
          },
        ]}
      />

      {form.repeat_mode === "weekly" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none">
            أيام التكرار
          </legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS_SAT_FIRST.map((day) => {
              const selected = form.repeat_weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onFormChange((f) => ({
                      ...f,
                      repeat_weekdays: toggleWeekday(
                        f.repeat_weekdays,
                        day.value,
                      ),
                    }))
                  }
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    selected
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm leading-none font-medium">اللون</legend>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
          {EVENT_COLOR_PALETTE.map((swatch) => {
            const selected = form.color === swatch.value;
            return (
              <button
                key={swatch.key}
                type="button"
                title={swatch.label}
                aria-label={swatch.label}
                aria-pressed={selected}
                onClick={() =>
                  onFormChange((f) => ({ ...f, color: swatch.value }))
                }
                className={`flex size-8 items-center justify-center rounded-xl text-white transition sm:size-9 ${
                  selected
                    ? "ring-2 ring-foreground/70 ring-offset-2 ring-offset-background"
                    : "ring-1 ring-black/5 hover:scale-105"
                }`}
                style={{ backgroundColor: swatch.value }}
              >
                {selected && <Check className="size-3.5 drop-shadow-sm" />}
              </button>
            );
          })}
        </div>
      </fieldset>
    </FormDialog>
  );
}
