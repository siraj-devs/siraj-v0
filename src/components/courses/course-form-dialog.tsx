"use client";

import { FormDialog } from "@/components/dashboard/form-dialog";
import { PublishStatusField } from "@/components/dashboard/publish-status-field";
import { SegmentedChoiceField } from "@/components/dashboard/segmented-choice-field";
import { ThumbnailField } from "@/components/dashboard/thumbnail-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CourseAclMemberOption, CourseVisibility } from "@/lib/course-types";
import { ENROLLMENT_STATUS_LABELS, VISIBILITY_LABELS } from "@/lib/course-types";
import {
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_ORDER,
  type MemberRole,
} from "@/lib/member-role";
import { Globe, Lock, Shield, Unlock } from "lucide-react";
import type { FormEvent } from "react";

export type CourseFormState = {
  title: string;
  description: string;
  enrollmentStatus: "open" | "closed";
  isPublished: boolean;
  visibility: CourseVisibility;
  allowedRoles: MemberRole[];
  allowedMemberIds: number[];
};

export function CourseFormDialog({
  mode,
  form,
  onFieldChange,
  onToggleRole,
  onToggleMember,
  members,
  thumbnailUrl,
  onThumbnailChange,
  pending,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: CourseFormState;
  onFieldChange: <K extends keyof CourseFormState>(
    key: K,
    value: CourseFormState[K],
  ) => void;
  onToggleRole: (role: MemberRole) => void;
  onToggleMember: (id: number) => void;
  members: CourseAclMemberOption[];
  thumbnailUrl: string | null;
  onThumbnailChange: (file: File | null) => void;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <FormDialog
      title={mode === "create" ? "دورة جديدة" : "تعديل الدورة"}
      description="العنوان، الوصف، الخصوصية، التسجيل، والظهور."
      onClose={onClose}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="حفظ"
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-2">
        <Label htmlFor="course-title">العنوان</Label>
        <Input
          id="course-title"
          value={form.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-desc">الوصف</Label>
        <textarea
          id="course-desc"
          required
          rows={4}
          value={form.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>

      <SegmentedChoiceField
        legend="الخصوصية"
        name="course-visibility"
        value={form.visibility}
        onChange={(visibility) => onFieldChange("visibility", visibility)}
        options={[
          {
            value: "public",
            label: VISIBILITY_LABELS.public,
            icon: <Globe />,
            activeClassName: "border-slate-400/50 bg-slate-50 text-slate-900",
          },
          {
            value: "private",
            label: VISIBILITY_LABELS.private,
            icon: <Shield />,
            activeClassName:
              "border-violet-400/50 bg-violet-50 text-violet-900",
          },
        ]}
      />

      {form.visibility === "private" && (
        <>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">الأدوار المسموحة</legend>
            <p className="text-xs text-muted-foreground">
              من لديه أحد هذه الأدوار يمكنه رؤية الدورة (أو الأعضاء المحددين
              أدناه).
            </p>
            <div className="flex flex-wrap gap-2">
              {MEMBER_ROLE_ORDER.map((role) => (
                <label
                  key={role}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                    form.allowedRoles.includes(role)
                      ? "border-violet-400 bg-violet-50 text-violet-900"
                      : "border-border text-foreground/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.allowedRoles.includes(role)}
                    onChange={() => onToggleRole(role)}
                  />
                  {MEMBER_ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">أعضاء محددون</legend>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {members.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  لا أعضاء متاحون للاختيار.
                </p>
              ) : (
                members.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted ${
                      form.allowedMemberIds.includes(m.id) ? "bg-violet-50" : ""
                    }`}
                  >
                    <span className="truncate">
                      {m.name}
                      <span className="ms-2 text-xs text-muted-foreground">
                        {MEMBER_ROLE_LABELS[m.role]}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.allowedMemberIds.includes(m.id)}
                      onChange={() => onToggleMember(m.id)}
                    />
                  </label>
                ))
              )}
            </div>
          </fieldset>
        </>
      )}

      <SegmentedChoiceField
        legend="التسجيل"
        name="course-enrollment"
        value={form.enrollmentStatus}
        onChange={(enrollmentStatus) =>
          onFieldChange("enrollmentStatus", enrollmentStatus)
        }
        options={[
          {
            value: "open",
            label: ENROLLMENT_STATUS_LABELS.open,
            icon: <Unlock />,
            activeClassName: "border-sky-400/50 bg-sky-50 text-sky-900",
          },
          {
            value: "closed",
            label: ENROLLMENT_STATUS_LABELS.closed,
            icon: <Lock />,
            activeClassName: "border-rose-400/50 bg-rose-50 text-rose-900",
          },
        ]}
      />

      <PublishStatusField
        name="course-publish"
        value={form.isPublished}
        onChange={(isPublished) => onFieldChange("isPublished", isPublished)}
      />
      <ThumbnailField
        label="الصورة"
        imageUrl={thumbnailUrl}
        onChange={onThumbnailChange}
        accept="image/*"
      />
    </FormDialog>
  );
}
