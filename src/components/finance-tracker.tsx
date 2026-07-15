"use client";

import {
  createTransaction,
  deleteTransaction,
  type ClubTransaction,
  type TransactionType,
} from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

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

function todayInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function FinanceTracker({
  initialTransactions,
}: {
  initialTransactions: ClubTransaction[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dueAt, setDueAt] = useState(todayInputValue);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("income");
  const [note, setNote] = useState("");

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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createTransaction({
        due_at: dueAt,
        amount: Number(amount),
        type,
        note,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("تم تسجيل المعاملة");
      setAmount("");
      setNote("");
      router.refresh();
    });
  }

  function onDelete(id: number) {
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف المعاملة");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="space-y-2 text-center md:text-start">
        <p className="text-sm text-primary">إدارة الصندوق</p>
        <h1 className="font-kufam text-3xl font-semibold text-foreground md:text-4xl">
          المالية
        </h1>
        <p className="text-foreground/65">
          تتبّع مداخيل ومصاريف النادي، وسجّل كل معاملة بتاريخ استحقاقها.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-background/60 p-5 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
          <p className="text-sm text-muted-foreground">إجمالي الدخل</p>
          <p className="mt-2 font-kufam text-2xl text-emerald-700">
            {formatAmount(totals.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-background/60 p-5 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
          <p className="text-sm text-muted-foreground">إجمالي المصروف</p>
          <p className="mt-2 font-kufam text-2xl text-rose-700">
            {formatAmount(totals.expense)}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <p className="text-sm text-primary/80">الرصيد</p>
          <p className="mt-2 font-kufam text-2xl text-foreground">
            {formatAmount(balance)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-background/60 p-6 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] md:p-8">
        <h2 className="mb-6 font-kufam text-xl font-medium text-foreground">
          إضافة معاملة
        </h2>
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="due_at">تاريخ الاستحقاق</Label>
            <Input
              id="due_at"
              type="date"
              required
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>نوع المعاملة</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as TransactionType)}
              className="flex flex-wrap gap-4"
            >
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="income" id="type-income" />
                <span>دخل</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="expense" id="type-expense" />
                <span>مصروف</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="note">ملاحظة</Label>
            <Input
              id="note"
              type="text"
              maxLength={500}
              placeholder="مثال: تبرع لفعالية، شراء مستلزمات…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "جاري الحفظ…" : "تسجيل المعاملة"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-kufam text-xl font-medium text-foreground">
          سجل المعاملات ({initialTransactions.length})
        </h2>

        {initialTransactions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            لا توجد معاملات بعد. سجّل أول دخل أو مصروف للنادي.
          </p>
        ) : (
          <ul className="space-y-3">
            {initialTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        tx.type === "income"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {tx.type === "income" ? "دخل" : "مصروف"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(tx.due_at)}
                    </span>
                  </div>
                  <p className="font-kufam text-lg text-foreground">
                    {formatAmount(tx.amount)}
                  </p>
                  {tx.note && (
                    <p className="truncate text-sm text-foreground/70">
                      {tx.note}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  aria-label="حذف المعاملة"
                  onClick={() => onDelete(tx.id)}
                  className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-center"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
