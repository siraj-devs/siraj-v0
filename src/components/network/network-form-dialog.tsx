"use client";

import type { NetworkRank } from "@/app/actions/network";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { SegmentedChoiceField } from "@/components/dashboard/segmented-choice-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RANK_AR } from "@/lib/network-labels";
import type { FormEvent } from "react";

export type NetworkFormState = {
  login: string;
  rank: NetworkRank;
};

const RANK_OPTIONS: {
  value: NetworkRank;
  label: string;
  activeClassName: string;
}[] = [
  {
    value: "A",
    label: `رتبة ${RANK_AR.A}`,
    activeClassName: "border-emerald-500 bg-emerald-50 text-emerald-800",
  },
  {
    value: "B",
    label: `رتبة ${RANK_AR.B}`,
    activeClassName: "border-sky-500 bg-sky-50 text-sky-800",
  },
  {
    value: "C",
    label: `رتبة ${RANK_AR.C}`,
    activeClassName: "border-amber-500 bg-amber-50 text-amber-800",
  },
  {
    value: "D",
    label: `رتبة ${RANK_AR.D}`,
    activeClassName: "border-slate-500 bg-slate-50 text-slate-700",
  },
];

export function NetworkFormDialog({
  mode,
  form,
  onFormChange,
  pending,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: NetworkFormState;
  onFormChange: (updater: (prev: NetworkFormState) => NetworkFormState) => void;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <FormDialog
      title={mode === "create" ? "إضافة إلى الشبكة" : "تعديل الرتبة"}
      description={
        mode === "create"
          ? "أدخل حساب 42 واختر الرتبة. سيتم جلب الاسم والصورة وسنة المسابح تلقائياً."
          : "حدّث رتبة هذا الشخص في الشبكة."
      }
      onClose={onClose}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel={mode === "create" ? "إضافة" : "حفظ"}
      pendingLabel={mode === "create" ? "جاري الجلب…" : "جاري الحفظ…"}
      maxWidthClassName="max-w-md"
    >
      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="network-login">حساب 42</Label>
          <Input
            id="network-login"
            value={form.login}
            onChange={(e) =>
              onFormChange((f) => ({ ...f, login: e.target.value }))
            }
            placeholder="login"
            required
            autoFocus
            dir="ltr"
            className="text-left"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      <SegmentedChoiceField
        legend="الرتبة"
        name="network-rank"
        value={form.rank}
        onChange={(rank) => onFormChange((f) => ({ ...f, rank }))}
        columns={2}
        options={RANK_OPTIONS.map((opt) => ({
          ...opt,
          icon: (
            <span className="flex size-5 items-center justify-center rounded-md bg-current/10 text-xs font-semibold">
              {RANK_AR[opt.value]}
            </span>
          ),
        }))}
      />
    </FormDialog>
  );
}
