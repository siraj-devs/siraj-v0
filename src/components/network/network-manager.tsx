"use client";

import {
  addNetworkProfile,
  deleteNetworkProfile,
  refreshNetworkProfile,
  updateNetworkProfile,
  type NetworkProfile,
} from "@/app/actions/network";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { campusLabelAr } from "@/lib/network-labels";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  DEFAULT_NETWORK_FILTERS,
  NetworkFiltersBar,
  type NetworkFiltersState,
} from "./network-filters";
import {
  NetworkFormDialog,
  type NetworkFormState,
} from "./network-form-dialog";
import { NetworkList } from "./network-list";

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
  const [filters, setFilters] = useState<NetworkFiltersState>(
    DEFAULT_NETWORK_FILTERS,
  );
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

  const campusOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of profiles) {
      const raw = p.campus?.trim();
      if (!raw) continue;
      const label = campusLabelAr(raw) ?? raw;
      if (!map.has(raw)) map.set(raw, label);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [profiles]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const p of profiles) {
      if (p.pool_year != null) years.add(p.pool_year);
    }
    return [...years].sort((a, b) => b - a);
  }, [profiles]);

  const counts = useMemo(() => {
    let students = 0;
    let poolers = 0;
    let members = 0;
    let connected = 0;
    for (const p of profiles) {
      if (p.kind === "student") students += 1;
      else poolers += 1;
      if (p.is_member) members += 1;
      if (p.has_connection) connected += 1;
    }
    return {
      all: profiles.length,
      students,
      poolers,
      members,
      connected,
    };
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return profiles.filter((p) => {
      if (filters.ranks.length > 0 && !filters.ranks.includes(p.rank))
        return false;
      if (
        filters.campuses.length > 0 &&
        !filters.campuses.includes(p.campus?.trim() ?? "")
      )
        return false;
      if (
        filters.years.length > 0 &&
        (p.pool_year == null || !filters.years.includes(p.pool_year))
      )
        return false;
      if (filters.kinds.length > 0 && !filters.kinds.includes(p.kind))
        return false;

      if (!q) return true;
      const kindHay =
        p.kind === "student" ? "student طالب" : "pooler سباح piscine";
      const campusAr = campusLabelAr(p.campus)?.toLowerCase() ?? "";
      return (
        p.name.toLowerCase().includes(q) ||
        p.login.toLowerCase().includes(q) ||
        (p.campus?.toLowerCase().includes(q) ?? false) ||
        campusAr.includes(q) ||
        (p.pool_year != null && String(p.pool_year).includes(q)) ||
        kindHay.includes(q)
      );
    });
  }, [profiles, query, filters]);

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

  function onRefresh(profile: NetworkProfile) {
    if (!canManage) return;
    setOpenMenuId(null);
    startTransition(async () => {
      const result = await refreshNetworkProfile(profile.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم تحديث بيانات 42");
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
        description="أضف حسابات 42 باللوجين، رتّبهم من أ إلى د، وتابع حالة العضوية والاتصال."
        action={
          canManage && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              إضافة حساب
            </Button>
          )
        }
        stats={[
          { key: "all", label: "في الشبكة", value: counts.all },
          { key: "students", label: "طلاب", value: counts.students },
          { key: "poolers", label: "سباحون", value: counts.poolers },
          { key: "members", label: "أعضاء النادي", value: counts.members },
          { key: "connected", label: "متصلون", value: counts.connected },
        ]}
        statsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      />

      <NetworkFiltersBar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        campusOptions={campusOptions}
        yearOptions={yearOptions}
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
        onRefresh={onRefresh}
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
