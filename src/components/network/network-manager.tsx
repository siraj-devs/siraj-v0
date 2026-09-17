"use client";

import {
  addNetworkProfile,
  deleteNetworkProfile,
  updateNetworkProfile,
  type NetworkProfile,
  type NetworkRank,
} from "@/app/actions/network";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  NetworkFormDialog,
  type NetworkFormState,
} from "./network-form-dialog";
import { NetworkList } from "./network-list";

type RankFilter = "all" | NetworkRank;

const emptyForm = (): NetworkFormState => ({
  login: "",
  rank: "D",
});

export function NetworkManager({
  profiles,
  canManage,
}: {
  profiles: NetworkProfile[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [deleting, setDeleting] = useState<NetworkProfile | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NetworkFormState>(emptyForm);
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [layout, setLayout] = useState<ViewLayout>("grid");

  useEffect(() => {
    if (!openMenuId && !modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenuId(null);
      if (!pending) closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openMenuId, modal, pending]);

  const counts = useMemo(() => {
    const byRank: Record<NetworkRank, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const p of profiles) byRank[p.rank] += 1;
    return {
      all: profiles.length,
      ...byRank,
    };
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (rankFilter !== "all" && p.rank !== rankFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.login.toLowerCase().includes(q) ||
        (p.pool_year != null && String(p.pool_year).includes(q))
      );
    });
  }, [profiles, query, rankFilter]);

  function openCreate() {
    if (!canManage) return;
    setForm(emptyForm());
    setEditingId(null);
    setModal("create");
    setOpenMenuId(null);
  }

  function openEdit(profile: NetworkProfile) {
    if (!canManage) return;
    setForm({ login: profile.login, rank: profile.rank });
    setEditingId(profile.id);
    setModal("edit");
    setOpenMenuId(null);
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setForm(emptyForm());
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    startTransition(async () => {
      if (modal === "edit" && editingId) {
        const result = await updateNetworkProfile({
          id: editingId,
          rank: form.rank,
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("تم تحديث الرتبة");
        closeModal();
        router.refresh();
        return;
      }

      const result = await addNetworkProfile({
        login: form.login,
        rank: form.rank,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تمت الإضافة إلى الشبكة");
      closeModal();
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!canManage || !deleting) return;
    startTransition(async () => {
      const result = await deleteNetworkProfile(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم الحذف من الشبكة");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <DashboardHeader
        eyebrow="إدارة المجتمع"
        title="الشبكة"
        description="أضف حسابات 42 باللوجين، رتّبهم من A إلى D، وتابع حالة العضوية والاتصال."
        action={
          canManage && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              إضافة حساب
            </Button>
          )
        }
        stats={[
          { key: "all", label: "الإجمالي", value: counts.all },
          { key: "A", label: "A", value: counts.A },
          { key: "B", label: "B", value: counts.B },
          { key: "C", label: "C", value: counts.C },
          { key: "D", label: "D", value: counts.D },
        ]}
        activeStat={rankFilter}
        onStatClick={setRankFilter}
        statsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      />

      <DashboardToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="ابحث بالاسم أو الحساب أو السنة…"
        filters={[
          { key: "all", label: "الكل" },
          { key: "A", label: "A" },
          { key: "B", label: "B" },
          { key: "C", label: "C" },
          { key: "D", label: "D" },
        ]}
        activeFilter={rankFilter}
        onFilterChange={setRankFilter}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <NetworkList
        profiles={filtered}
        allProfilesCount={profiles.length}
        layout={layout}
        canManage={canManage}
        openMenuId={openMenuId}
        onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
        onCloseMenu={() => setOpenMenuId(null)}
        onEdit={openEdit}
        onDelete={setDeleting}
        onCreate={openCreate}
      />

      {modal && (
        <NetworkFormDialog
          mode={modal}
          form={form}
          onFormChange={setForm}
          pending={pending}
          onClose={closeModal}
          onSubmit={onSubmit}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleting}
        title="حذف من الشبكة"
        description={
          deleting
            ? `هل تريد حذف «${deleting.name}» (@${deleting.login}) من الشبكة؟`
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
