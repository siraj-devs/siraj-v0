"use client";

import {
  setPublicPageDisabledState,
} from "@/app/actions/disabled-pages";
import { Input } from "@/components/ui/input";
import type { PublicPageStatus } from "@/lib/disabled-pages";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

export function DisabledPagesManager({
  pages,
  canManage,
}: {
  pages: PublicPageStatus[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return pages;

    return pages.filter((page) =>
      page.path.toLowerCase().includes(normalizedQuery),
    );
  }, [pages, query]);

  function onStateChange(page: PublicPageStatus, disabled: boolean) {
    if (!canManage || page.disabled === disabled) return;

    startTransition(async () => {
      const result = await setPublicPageDisabledState({
        path: page.path,
        disabled,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(disabled ? "تم تعطيل الصفحة" : "تم تفعيل الصفحة");
      router.refresh();
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-kufam text-2xl font-semibold text-foreground">
            الصفحات العامة
          </h2>
          <p className="max-w-xl text-sm text-foreground/65">
            هذه القائمة تُبنى تلقائياً من صفحات التطبيق العامة. الصفحة تكون
            معطّلة فقط إذا كان مسارها موجوداً في قاعدة البيانات.
          </p>
        </div>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالمسار…"
          className="pr-10"
        />
      </div>

      {filteredPages.length > 0 ? (
        <ul className="space-y-3">
          {filteredPages.map((page) => (
            <li
              key={page.path}
              className="relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p
                  className="truncate font-mono text-base text-foreground"
                  dir="ltr"
                >
                  {page.path}
                </p>
              </div>

              <fieldset
                className="grid grid-cols-2 gap-2 self-end sm:min-w-72 sm:self-center"
                disabled={!canManage || pending}
              >
                <legend className="sr-only">حالة الصفحة</legend>
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    !page.disabled
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name={`page-state-${page.path}`}
                    className="accent-primary"
                    checked={!page.disabled}
                    onChange={() => onStateChange(page, false)}
                  />
                  مفعّلة
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    page.disabled
                      ? "border-destructive/40 bg-destructive/10 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name={`page-state-${page.path}`}
                    className="accent-red-700"
                    checked={page.disabled}
                    onChange={() => onStateChange(page, true)}
                  />
                  معطّلة
                </label>
              </fieldset>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            جرّب تغيير نص البحث.
          </p>
        </div>
      )}
    </section>
  );
}
