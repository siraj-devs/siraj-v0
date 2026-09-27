"use client";

import {
  createTransaction,
  deleteTransaction,
  type ClubTransaction,
  type TransactionType,
} from "@/app/actions/transactions";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { SearchFilterBar, matchesSelection } from "@/components/dashboard/search-filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownLeft, ArrowUpRight, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type TypeFilter = TransactionType;

type TransactionFormState = {
  due_at: string;
  amount: string;
  type: TransactionType;
  note: string;
};

function todayInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const emptyForm = (): TransactionFormState => ({
  due_at: todayInputValue(),
  amount: "",
  type: "income",
  note: "",
});

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("ar-MA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function FinanceTracker({
  initialTransactions,
  canManage,
}: {
  initialTransactions: ClubTransaction[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TransactionFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter[]>([]);
  const [deleting, setDeleting] = useState<ClubTransaction | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const totals = useMemo(() => {
    return initialTransactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") acc.income += tx.amount;
        else acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [initialTransactions]);

  const balance = totals.income - totals.expense;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialTransactions.filter((tx) => {
      if (!matchesSelection(typeFilter, tx.type)) return false;
      if (!q) return true;
      return tx.note.toLowerCase().includes(q);
    });
  }, [initialTransactions, query, typeFilter]);

  function openCreate() {
    if (!canManage) return;
    setForm(emptyForm());
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm());
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    startTransition(async () => {
      const result = await createTransaction({
        due_at: form.due_at,
        amount: Number(form.amount),
        type: form.type,
        note: form.note,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("تم تسجيل المعاملة");
      closeModal();
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!canManage || !deleting) return;
    startTransition(async () => {
      const result = await deleteTransaction(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف المعاملة");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-primary">إدارة الصندوق</p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              المالية
            </h1>
            <p className="max-w-lg text-foreground/65">
              تتبّع مداخيل ومصاريف النادي، وسجّل كل معاملة بتاريخ استحقاقها.
            </p>
          </div>

          {canManage && (
            <Button
              onClick={openCreate}
              className="shrink-0 gap-2 self-start md:self-auto"
            >
              <Plus className="size-4" />
              معاملة جديدة
            </Button>
          )}
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">إجمالي الدخل</p>
            <p className="mt-1 font-kufam text-2xl text-emerald-700">
              {formatAmount(totals.income)}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">إجمالي المصروف</p>
            <p className="mt-1 font-kufam text-2xl text-rose-700">
              {formatAmount(totals.expense)}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">الرصيد</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {formatAmount(balance)}
            </p>
          </div>
        </div>
      </header>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="ابحث في الملاحظات…"
        menuTitle="تصفية المالية"
        onReset={() => setTypeFilter([])}
        groups={[
          {
            title: "النوع",
            selected: typeFilter,
            onChange: (next) => setTypeFilter(next as TypeFilter[]),
            options: [
              { key: "income", label: "دخل", tone: "emerald", icon: <ArrowDownLeft /> },
              { key: "expense", label: "مصروف", tone: "rose", icon: <ArrowUpRight /> },
            ],
          },
        ]}
      />

      {filtered.length > 0 ? (
        <ul className="space-y-3">
          {filtered.map((tx) => (
            <li
              key={tx.id}
              className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                      tx.type === "income"
                        ? "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20"
                        : "bg-rose-500/10 text-rose-800 ring-rose-500/20"
                    }`}
                  >
                    {tx.type === "income" ? "دخل" : "مصروف"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(tx.due_at)}
                  </span>
                </div>
                <p
                  className={`font-kufam text-xl ${
                    tx.type === "income" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {tx.type === "income" ? "+" : "−"}
                  {formatAmount(tx.amount)}
                </p>
                {tx.note ? (
                  <p className="truncate text-sm text-foreground/70">{tx.note}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/50">بدون ملاحظة</p>
                )}
              </div>

              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  aria-label="حذف المعاملة"
                  onClick={() => setDeleting(tx)}
                  className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-center"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Search className="size-6" />
          </div>
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {initialTransactions.length === 0
              ? "لم تُسجَّل أي معاملة بعد. ابدأ بإضافة أول دخل أو مصروف."
              : "جرّب تغيير البحث أو فلتر النوع."}
          </p>
          {canManage && initialTransactions.length === 0 && (
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="size-4" />
              إضافة معاملة
            </Button>
          )}
        </div>
      )}

      {canManage && modalOpen && (
        <FormDialog
          title="إضافة معاملة"
          description="سجّل دخلاً أو مصروفاً مع تاريخ الاستحقاق."
          onClose={closeModal}
          onSubmit={onSubmit}
          pending={pending}
          submitLabel="حفظ"
        >
          <div className="space-y-2">
            <Label htmlFor="due_at">تاريخ الاستحقاق</Label>
            <Input
              id="due_at"
              type="date"
              required
              autoFocus
              value={form.due_at}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, due_at: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (درهم)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>نوع المعاملة</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["income", "دخل"],
                  ["expense", "مصروف"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: value }))}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    form.type === value
                      ? "border-primary/50 bg-primary/10 font-medium text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">ملاحظة</Label>
            <Input
              id="note"
              type="text"
              maxLength={500}
              placeholder="مثال: تبرع لفعالية، شراء مستلزمات…"
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
            />
          </div>
        </FormDialog>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف المعاملة"
        description={
          deleting
            ? `هل تريد حذف معاملة «${deleting.note || formatAmount(deleting.amount)}»؟`
            : ""
        }
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
