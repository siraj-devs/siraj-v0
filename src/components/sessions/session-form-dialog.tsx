"use client";

import type { SessionSeries } from "@/app/actions/sessions";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import type { FormEvent } from "react";

export type SessionFormState = {
  title: string;
  due_date: string;
  record_link: string;
  series_id: string;
  is_published: boolean;
};

export function SessionFormDialog({
  mode,
  form,
  onFormChange,
  seriesList,
  newSeriesName,
  onNewSeriesNameChange,
  onCreateSeries,
  onDeleteSeries,
  currentImage,
  onImageChange,
  pending,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: SessionFormState;
  onFormChange: (updater: (prev: SessionFormState) => SessionFormState) => void;
  seriesList: SessionSeries[];
  newSeriesName: string;
  onNewSeriesNameChange: (value: string) => void;
  onCreateSeries: () => void;
  onDeleteSeries: (id: string) => void;
  currentImage: string | null;
  onImageChange: (file: File | null) => void;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <FormDialog
      title={mode === "create" ? "أمسية جديدة" : "تعديل الأمسية"}
      description="العنوان، التاريخ، رابط يوتيوب، والصورة المصغّرة."
      onClose={onClose}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel={mode === "create" ? "إنشاء" : "حفظ"}
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-2">
        <Label htmlFor="session-title">العنوان</Label>
        <Input
          id="session-title"
          value={form.title}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, title: e.target.value }))
          }
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="session-due-date">التاريخ</Label>
        <Input
          id="session-due-date"
          type="date"
          value={form.due_date}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, due_date: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="session-record">رابط يوتيوب</Label>
        <Input
          id="session-record"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={form.record_link}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, record_link: e.target.value }))
          }
          required
          dir="ltr"
          className="text-left"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="session-series">السلسلة</Label>
        <select
          id="session-series"
          value={form.series_id}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, series_id: e.target.value }))
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">بدون سلسلة</option>
          {seriesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Input
            value={newSeriesName}
            onChange={(e) => onNewSeriesNameChange(e.target.value)}
            placeholder="سلسلة جديدة…"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !newSeriesName.trim()}
            onClick={onCreateSeries}
          >
            إضافة
          </Button>
        </div>
        {form.series_id && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onDeleteSeries(form.series_id)}
            className="text-xs text-destructive hover:underline disabled:opacity-40"
          >
            حذف السلسلة المحددة
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="session-thumb">الصورة المصغّرة</Label>
        {currentImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border">
            <Image
              src={currentImage}
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        )}
        <Input
          id="session-thumb"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) =>
            onFormChange((f) => ({
              ...f,
              is_published: e.target.checked,
            }))
          }
          className="size-4 rounded border-border"
        />
        نشر الأمسية
      </label>
    </FormDialog>
  );
}
