"use client";

import { ContentManager } from "@/components/content-manager";
import { DisabledPagesManager } from "@/components/disabled-pages-manager";
import type { ProposedProgram } from "@/app/actions/content";
import type { PublicPageStatus } from "@/lib/disabled-pages";
import { useState } from "react";

type ContentTab = "programs" | "disabled";

export function ContentDashboard({
  programs,
  pages,
  canManage,
}: {
  programs: ProposedProgram[];
  pages: PublicPageStatus[];
  canManage: boolean;
}) {
  const [tab, setTab] = useState<ContentTab>("programs");
  const disabledCount = pages.filter((page) => page.disabled).length;

  const tabs = [
    {
      id: "programs" as const,
      label: "البرامج المقترحة",
      count: programs.length,
    },
    {
      id: "disabled" as const,
      label: "صفحات معطّلة",
      count: disabledCount,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-6 pb-16 md:gap-12 md:py-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative space-y-3">
          <p className="text-sm text-primary">إدارة الموقع</p>
          <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            المحتوى
          </h1>
          <p className="max-w-lg text-foreground/65">
            إدارة البرامج المقترحة وتعطيل الصفحات العامة للموقع.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="أقسام المحتوى"
          className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {tabs.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`content-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`content-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(item.id)}
                className={`rounded-2xl border px-4 py-3 text-right transition-all ${
                  selected
                    ? "border-primary/40 bg-background shadow-sm"
                    : "border-transparent bg-background/50 hover:border-border hover:bg-background/80"
                }`}
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-kufam text-2xl text-foreground">
                  {item.count}
                </p>
              </button>
            );
          })}
        </div>
      </header>

      <div
        role="tabpanel"
        id="content-panel-programs"
        aria-labelledby="content-tab-programs"
        hidden={tab !== "programs"}
      >
        {tab === "programs" && (
          <ContentManager programs={programs} canManage={canManage} />
        )}
      </div>

      <div
        role="tabpanel"
        id="content-panel-disabled"
        aria-labelledby="content-tab-disabled"
        hidden={tab !== "disabled"}
      >
        {tab === "disabled" && (
          <DisabledPagesManager pages={pages} canManage={canManage} />
        )}
      </div>
    </div>
  );
}
