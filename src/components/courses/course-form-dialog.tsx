"use client";

import { FormDialog } from "@/components/dashboard/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CourseAclMemberOption, CourseVisibility } from "@/lib/course-types";
import { ENROLLMENT_STATUS_LABELS, VISIBILITY_LABELS } from "@/lib/course-types";
import {
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_ORDER,
  type MemberRole,
} from "@/lib/member-role";
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
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">الخصوصية</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["public", "private"] as const).map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                form.visibility === value
                  ? "border-primary/40 bg-primary/10"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                checked={form.visibility === value}
                onChange={() => onFieldChange("visibility", value)}
              />
              {VISIBILITY_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>
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
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">التسجيل</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["open", "closed"] as const).map((status) => (
            <label
              key={status}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                form.enrollmentStatus === status
                  ? "border-primary/40 bg-primary/10"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="enrollment"
                checked={form.enrollmentStatus === status}
                onChange={() => onFieldChange("enrollmentStatus", status)}
              />
              {ENROLLMENT_STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">الظهور</legend>
        <div className="grid grid-cols-2 gap-2">
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              form.isPublished ? "border-primary/40 bg-primary/10" : "border-border"
            }`}
          >
            <input
              type="radio"
              checked={form.isPublished}
              onChange={() => onFieldChange("isPublished", true)}
            />
            منشور
          </label>
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              !form.isPublished ? "border-border bg-muted" : "border-border"
            }`}
          >
            <input
              type="radio"
              checked={!form.isPublished}
              onChange={() => onFieldChange("isPublished", false)}
            />
            مخفي
          </label>
        </div>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="course-thumb">الصورة</Label>
        <Input
          id="course-thumb"
          type="file"
          accept="image/*"
          onChange={(e) => onThumbnailChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </FormDialog>
  );
}
