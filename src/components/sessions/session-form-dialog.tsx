"use client";

import type {
  SessionMemberOption,
  SessionPerson,
  SessionSeries,
} from "@/app/actions/sessions";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { FormSection } from "@/components/dashboard/form-section";
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
import { cn } from "@/lib/utils";
import { isYoutubeUrl } from "@/lib/youtube";
import { YoutubeLogoIcon } from "@phosphor-icons/react";
import {
  Check,
  FileText,
  Mic,
  Plus,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { SessionPeopleField } from "./session-people";

export type SessionFormState = {
  title: string;
  due_date: string;
  record_link: string;
  series_id: string;
  is_published: boolean;
  presenters: SessionPerson[];
  participants: SessionPerson[];
};

const NO_SERIES = "__none__";

function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-background px-2.5 py-0.5 text-xs text-muted-foreground ring-1 ring-inset ring-border/70">
      {count}
    </span>
  );
}

export function SessionFormDialog({
  mode,
  form,
  onFormChange,
  seriesList,
  members,
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
  members: SessionMemberOption[];
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
  const [addingSeries, setAddingSeries] = useState(false);

  const link = form.record_link.trim();
  const linkValid = link ? isYoutubeUrl(link) : null;

  function submitNewSeries() {
    if (!newSeriesName.trim()) return;
    onCreateSeries();
    setAddingSeries(false);
  }

  return (
    <FormDialog
      title={mode === "create" ? "أمسية جديدة" : "تعديل الأمسية"}
      description="المعلومات الأساسية، المقدّمون والمشاركون، والتسجيل."
      onClose={onClose}
      onSubmit={(event) => {
        if (linkValid === false) {
          event.preventDefault();
          return;
        }
        onSubmit(event);
      }}
      pending={pending}
      submitLabel={mode === "create" ? "إنشاء الأمسية" : "حفظ التعديلات"}
      maxWidthClassName="max-w-2xl"
    >
      <FormSection
        icon={<FileText />}
        title="المعلومات الأساسية"
        hint="العنوان والتاريخ والسلسلة."
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
            className="bg-background"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-series">السلسلة</Label>
            {addingSeries ? (
              <div className="flex gap-1.5">
                <Input
                  value={newSeriesName}
                  onChange={(e) => onNewSeriesNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitNewSeries();
                    } else if (e.key === "Escape") {
                      e.stopPropagation();
                      setAddingSeries(false);
                    }
                  }}
                  placeholder="اسم السلسلة الجديدة"
                  aria-label="اسم سلسلة جديدة"
                  autoFocus
                  className="bg-background"
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={pending || !newSeriesName.trim()}
                  onClick={submitNewSeries}
                  aria-label="حفظ السلسلة"
                  className="shrink-0"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setAddingSeries(false);
                    onNewSeriesNameChange("");
                  }}
                  aria-label="إلغاء"
                  className="shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <Select
                  value={form.series_id || NO_SERIES}
                  onValueChange={(value) =>
                    onFormChange((f) => ({
                      ...f,
                      series_id: value === NO_SERIES ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger
                    id="session-series"
                    className="w-full min-w-0 bg-background"
                  >
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
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setAddingSeries(true)}
                  aria-label="سلسلة جديدة"
                  title="سلسلة جديدة"
                  className="shrink-0"
                >
                  <Plus className="size-4" />
                </Button>
                {form.series_id && (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={pending}
                    onClick={() => onDeleteSeries(form.series_id)}
                    aria-label="حذف السلسلة المحددة"
                    title="حذف السلسلة المحددة"
                    className="shrink-0 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={<Mic />}
        title="المقدّمون"
        hint="اختر من الأعضاء أو أضف بلوجين 42."
        aside={<CountBadge count={form.presenters.length} />}
      >
        <SessionPeopleField
          id="session-presenters"
          label="المقدّمون"
          hideLabel
          emptyText="لم يُحدَّد مقدّم بعد."
          people={form.presenters}
          onChange={(presenters) =>
            onFormChange((f) => ({ ...f, presenters }))
          }
          members={members}
          disabled={pending}
        />
      </FormSection>

      <FormSection
        icon={<Users />}
        title="المشاركون"
        hint="من حضر أو شارك في الأمسية."
        aside={<CountBadge count={form.participants.length} />}
      >
        <SessionPeopleField
          id="session-participants"
          label="المشاركون"
          hideLabel
          emptyText="لا مشاركين بعد."
          people={form.participants}
          onChange={(participants) =>
            onFormChange((f) => ({ ...f, participants }))
          }
          members={members}
          disabled={pending}
        />
      </FormSection>

      <FormSection
        icon={<Video />}
        title="التسجيل والصورة"
        hint="رابط يوتيوب اختياري، يمكن إضافته لاحقاً."
      >
        <div className="space-y-2">
          <Label htmlFor="session-record">رابط يوتيوب</Label>
          <div className="relative">
            <YoutubeLogoIcon
              weight="fill"
              className={cn(
                "pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 transition",
                linkValid ? "text-[#FF0000]" : "text-muted-foreground/50",
              )}
            />
            <Input
              id="session-record"
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={form.record_link}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, record_link: e.target.value }))
              }
              dir="ltr"
              aria-invalid={linkValid === false}
              className={cn(
                "bg-background pl-10 text-left",
                linkValid === false &&
                  "border-destructive/60 focus-visible:ring-destructive/40",
              )}
            />
          </div>
          {linkValid === false && (
            <p className="text-xs text-destructive">رابط يوتيوب غير صالح.</p>
          )}
        </div>

        <ThumbnailField imageUrl={currentImage} onChange={onImageChange} />
      </FormSection>

      <PublishStatusField
        name="session-publish"
        value={form.is_published}
        onChange={(is_published) =>
          onFormChange((f) => ({ ...f, is_published }))
        }
      />
    </FormDialog>
  );
}
