"use client";

import { upsertExamQuestion } from "@/app/actions/courses";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExamQuestion, ExamQuestionType } from "@/lib/course-types";
import {
  EXAM_QUESTION_TYPE_LABELS,
  isChoiceQuestionType,
} from "@/lib/course-types";
import { filterArabicInput } from "@/lib/profile-fields";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  Check,
  ListChecks,
  Minus,
  Plus,
  ToggleLeft,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

type OptionRow = { key: number; text: string; correct: boolean };

const TYPE_META: Record<
  ExamQuestionType,
  { icon: LucideIcon; hint: string }
> = {
  multiple_choice: { icon: ListChecks, hint: "خيارات متعددة" },
  true_false: { icon: ToggleLeft, hint: "صح أو خطأ" },
  short_text: { icon: Type, hint: "سطر واحد" },
  long_text: { icon: AlignLeft, hint: "فقرة" },
};

const TYPE_ORDER: ExamQuestionType[] = [
  "multiple_choice",
  "true_false",
  "short_text",
  "long_text",
];

function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-start transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-background hover:bg-muted/40",
      )}
    >
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-background shadow transition-all",
            checked ? "end-0.5" : "start-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function ExamQuestionsDialog({
  courseId,
  contentId,
  contentTitle,
  question,
  nextOrder,
  onClose,
}: {
  courseId: number;
  contentId: number;
  contentTitle: string | null;
  question: ExamQuestion | null;
  nextOrder: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const keyRef = useRef(100);
  const nextKey = () => ++keyRef.current;

  const initial = question;
  const editing = question;
  const [text, setText] = useState(initial?.question_text ?? "");
  const [type, setType] = useState<ExamQuestionType>(
    initial?.question_type ?? "multiple_choice",
  );
  const [rows, setRows] = useState<OptionRow[]>(() =>
    initial
      ? initial.options.map((option, i) => ({
          key: i + 1,
          text: option.text,
          correct: initial.correct_option_ids.includes(option.id),
        }))
      : [
          { key: 1, text: "", correct: false },
          { key: 2, text: "", correct: false },
          { key: 3, text: "", correct: false },
        ],
  );
  const [allowMultiple, setAllowMultiple] = useState(
    initial?.allow_multiple ?? false,
  );
  const [ungraded, setUngraded] = useState(
    initial
      ? isChoiceQuestionType(initial.question_type) &&
          initial.correct_option_ids.length === 0
      : false,
  );
  const [points, setPoints] = useState(initial?.points ?? 1);
  const [isOptional, setIsOptional] = useState(initial?.is_optional ?? false);

  function defaultRows(next: ExamQuestionType): OptionRow[] {
    if (next === "true_false") {
      return [
        { key: nextKey(), text: "صح", correct: false },
        { key: nextKey(), text: "خطأ", correct: false },
      ];
    }
    if (next === "multiple_choice") {
      return [0, 1, 2].map(() => ({
        key: nextKey(),
        text: "",
        correct: false,
      }));
    }
    return [];
  }

  function changeType(next: ExamQuestionType) {
    if (next === type) return;
    setType(next);
    setRows(defaultRows(next));
    setAllowMultiple(false);
    setUngraded(false);
  }

  function toggleCorrect(key: number) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key === key) {
          return { ...row, correct: allowMultiple ? !row.correct : true };
        }
        return allowMultiple ? row : { ...row, correct: false };
      }),
    );
  }

  function setMultiple(on: boolean) {
    setAllowMultiple(on);
    if (!on) {
      setRows((prev) => {
        let seen = false;
        return prev.map((row) => {
          if (row.correct && !seen) {
            seen = true;
            return row;
          }
          return { ...row, correct: false };
        });
      });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!text.trim()) {
      toast.error("اكتب نص السؤال");
      return;
    }

    const choice = isChoiceQuestionType(type);
    const filled = rows.filter((row) => row.text.trim());
    if (choice && filled.length < 2) {
      toast.error("أدخل خيارين على الأقل");
      return;
    }

    const options = filled.map((row, index) => ({
      id: `opt_${index + 1}`,
      text: row.text.trim(),
    }));
    const correct_option_ids = ungraded
      ? []
      : filled
          .map((row, index) => (row.correct ? options[index].id : null))
          .filter((id): id is string => id !== null);

    if (choice && !ungraded && correct_option_ids.length === 0) {
      toast.error("حدد الإجابة الصحيحة أو فعّل «بدون إجابة صحيحة»");
      return;
    }

    startTransition(async () => {
      const result = await upsertExamQuestion({
        id: editing?.id,
        content_id: contentId,
        course_id: courseId,
        question_text: text,
        question_type: type,
        options: choice ? options : [],
        correct_option_ids: choice ? correct_option_ids : [],
        allow_multiple: type === "multiple_choice" && allowMultiple,
        is_optional: isOptional,
        points,
        order_sequence: editing?.order_sequence ?? nextOrder,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "تم تحديث السؤال" : "تمت إضافة السؤال");
      router.refresh();
      onClose();
    });
  }

  const choice = isChoiceQuestionType(type);
  const fixedOptions = type === "true_false";
  const correctCount = rows.filter((row) => row.correct).length;

  return (
    <FormDialog
      title={editing ? "تعديل السؤال" : "سؤال جديد"}
      description={contentTitle || undefined}
      onClose={onClose}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة السؤال"}
      cancelLabel="إلغاء"
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-5">
          {/* Type picker */}
          <div className="space-y-2">
            <Label className="after:ms-0.5 after:text-destructive after:content-['*']">نوع السؤال</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPE_ORDER.map((option) => {
                const Icon = TYPE_META[option].icon;
                const active = option === type;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    onClick={() => changeType(option)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors",
                      active
                        ? "border-primary/50 bg-primary/8 text-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn("size-4.5", active && "text-primary")}
                    />
                    <span className="text-xs font-medium">
                      {EXAM_QUESTION_TYPE_LABELS[option]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {TYPE_META[option].hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question text */}
          <div className="space-y-2">
            <Label htmlFor="exam-question-text" className="after:ms-0.5 after:text-destructive after:content-['*']">
              نص السؤال
            </Label>
            <Input
              id="exam-question-text"
              dir="rtl"
              lang="ar"
              value={text}
              onChange={(e) => setText(filterArabicInput(e.target.value))}
              placeholder="اكتب السؤال هنا…"
              required
            />
          </div>

          {/* Options */}
          {choice && (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="after:ms-0.5 after:text-destructive after:content-['*']">الخيارات</Label>
                  <p className="text-xs text-muted-foreground">
                    {ungraded
                      ? "لن يُصحَّح هذا السؤال تلقائياً"
                      : allowMultiple
                        ? "اضغط الدائرة لتحديد كل الإجابات الصحيحة"
                        : "اضغط الدائرة لتحديد الإجابة الصحيحة"}
                  </p>
                </div>
                {!ungraded && (
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px]",
                      correctCount > 0
                        ? "bg-emerald-500/10 text-emerald-800"
                        : "bg-amber-500/10 text-amber-900",
                    )}
                  >
                    {correctCount > 0
                      ? `${correctCount} صحيحة`
                      : "لم تُحدَّد إجابة"}
                  </span>
                )}
              </div>

              <ul className="space-y-2">
                {rows.map((row, index) => (
                  <li
                    key={row.key}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-1.5 transition-colors",
                      row.correct && !ungraded
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border bg-background",
                    )}
                  >
                    <button
                      type="button"
                      disabled={ungraded}
                      onClick={() => toggleCorrect(row.key)}
                      aria-label="تحديد كإجابة صحيحة"
                      aria-pressed={row.correct}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center border transition-colors disabled:opacity-40",
                        allowMultiple ? "rounded-lg" : "rounded-full",
                        row.correct && !ungraded
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-border bg-background text-transparent hover:border-emerald-500/60 hover:text-emerald-600/40",
                      )}
                    >
                      <Check className="size-4" />
                    </button>
                    {fixedOptions ? (
                      <span
                        dir="rtl"
                        className="flex-1 px-1 text-start text-sm text-foreground"
                      >
                        {row.text}
                      </span>
                    ) : (
                      <Input
                        dir="rtl"
                        lang="ar"
                        value={row.text}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((item) =>
                              item.key === row.key
                                ? {
                                    ...item,
                                    text: filterArabicInput(e.target.value),
                                  }
                                : item,
                            ),
                          )
                        }
                        placeholder={`الخيار ${index + 1}`}
                        className="h-8 flex-1 border-0 bg-transparent px-1 text-start shadow-none focus-visible:ring-0"
                      />
                    )}
                    {!fixedOptions && (
                      <button
                        type="button"
                        disabled={rows.length <= 2}
                        onClick={() =>
                          setRows((prev) =>
                            prev.filter((item) => item.key !== row.key),
                          )
                        }
                        aria-label="حذف الخيار"
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {!fixedOptions && rows.length < 8 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() =>
                    setRows((prev) => [
                      ...prev,
                      { key: nextKey(), text: "", correct: false },
                    ])
                  }
                >
                  <Plus className="size-3.5" />
                  إضافة خيار
                </Button>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {type === "multiple_choice" && (
                  <Switch
                    checked={allowMultiple}
                    onChange={setMultiple}
                    label="إجابات متعددة"
                    description="يختار المتعلم أكثر من خيار"
                  />
                )}
                <Switch
                  checked={ungraded}
                  onChange={(on) => {
                    setUngraded(on);
                    if (on) {
                      setRows((prev) =>
                        prev.map((row) => ({ ...row, correct: false })),
                      );
                    }
                  }}
                  label="بدون إجابة صحيحة"
                  description="لا يدخل في التصحيح الآلي"
                />
              </div>
            </div>
          )}

          <Switch
            checked={isOptional}
            onChange={setIsOptional}
            label="سؤال اختياري"
            description="يمكن للمتعلم تخطيه عند الإرسال"
          />

          {/* Points */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="exam-question-points" className="after:ms-0.5 after:text-destructive after:content-['*']">
                النقاط
              </Label>
              <p className="text-xs text-muted-foreground">
                اجعلها 0 إذا لم يكن للسؤال وزن
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                disabled={points <= 0}
                onClick={() => setPoints((value) => Math.max(0, value - 1))}
                aria-label="إنقاص النقاط"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                id="exam-question-points"
                type="number"
                min={0}
                step={1}
                value={points}
                onChange={(e) => {
                  const parsed = Math.floor(Number(e.target.value));
                  setPoints(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
                }}
                className="h-9 w-16 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => setPoints((value) => value + 1)}
                aria-label="زيادة النقاط"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
      </div>
    </FormDialog>
  );
}
