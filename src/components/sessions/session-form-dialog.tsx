"use client";

import type { SessionSeries } from "@/app/actions/sessions";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { PublishStatusField } from "@/components/dashboard/publish-status-field";
import { ThumbnailField } from "@/components/dashboard/thumbnail-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";

export type SessionFormState = {
  title: string;
  due_date: string;
  record_link: string;
  series_id: string;
  is_published: boolean;
};

const NO_SERIES = "__none__";

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
          placeholder="عنوان الأمسية"
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
        <Select
          value={form.series_id || NO_SERIES}
          onValueChange={(value) =>
            onFormChange((f) => ({
              ...f,
              series_id: value === NO_SERIES ? "" : value,
            }))
          }
        >
          <SelectTrigger id="session-series" className="w-full">
            <SelectValue placeholder="اختر سلسلة…" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value={NO_SERIES}>بدون سلسلة</SelectItem>
            {seriesList.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            value={newSeriesName}
            onChange={(e) => onNewSeriesNameChange(e.target.value)}
            placeholder="سلسلة جديدة…"
            aria-label="اسم سلسلة جديدة"
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending || !newSeriesName.trim()}
            onClick={onCreateSeries}
            className="shrink-0 gap-1.5"
          >
            <Plus className="size-4" />
            إضافة
          </Button>
        </div>

        {form.series_id && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onDeleteSeries(form.series_id)}
            className="inline-flex items-center gap-1.5 text-xs text-destructive transition hover:underline disabled:opacity-40"
          >
            <Trash2 className="size-3.5" />
            حذف السلسلة المحددة
          </button>
        )}
      </div>

      <PublishStatusField
        name="session-publish"
        value={form.is_published}
        onChange={(is_published) =>
          onFormChange((f) => ({ ...f, is_published }))
        }
      />

      <ThumbnailField
        imageUrl={currentImage}
        onChange={onImageChange}
      />
    </FormDialog>
  );
}
