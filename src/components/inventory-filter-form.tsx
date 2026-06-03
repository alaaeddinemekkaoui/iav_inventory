"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { MaterialStatus, statusLabel } from "@/lib/inventory";
import type { SortDirection } from "@/lib/search";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";

const materialStatuses: MaterialStatus[] = ["STOCK", "DISPATCHED", "MUTATED", "DECHARGED"];

export function InventoryFilterForm({
  query,
  status,
  editMode,
  sort,
  direction,
}: {
  query: string;
  status: MaterialStatus | "";
  editMode: boolean;
  sort: string;
  direction: SortDirection;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      replaceIfChanged(router, createInventoryHref({ q: search, status: selectedStatus, edit: editMode ? "1" : undefined, sort, dir: direction }));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [direction, editMode, router, search, selectedStatus, sort]);

  function updateStatus(value: string) {
    setSelectedStatus(value as MaterialStatus | "");
    replaceIfChanged(router, createInventoryHref({ q: search, status: value, edit: editMode ? "1" : undefined, sort, dir: direction }));
  }

  function resetFilters() {
    setSearch("");
    setSelectedStatus("");
    replaceIfChanged(router, createInventoryHref({ edit: editMode ? "1" : undefined, sort, dir: direction }));
  }

  return (
    <form
      action="/inventory"
      className="grid gap-3 border-b border-slate-100 bg-[#f8faf8] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end"
    >
      {editMode ? <input type="hidden" name="edit" value="1" /> : null}
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Recherche globale</span>
        <span className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, code, serie, marque, localite..."
            className={cn(fieldStyles, "h-10 w-full pl-10")}
          />
        </span>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Statut</span>
        <select name="status" value={selectedStatus} onChange={(event) => updateStatus(event.target.value)} className={cn(fieldStyles, "h-10")}>
          <option value="">Tous les statuts</option>
          {materialStatuses.map((value) => (
            <option key={value} value={value}>{statusLabel(value)}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={resetFilters} className={buttonStyles({ variant: "secondary" })}>
        Reinitialiser
      </button>
    </form>
  );
}

function createInventoryHref(values: { q?: string; status?: string; edit?: string; sort?: string; dir?: SortDirection }) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `/inventory?${queryString}` : "/inventory";
}

function replaceIfChanged(router: ReturnType<typeof useRouter>, href: string) {
  if (`${window.location.pathname}${window.location.search}` !== href) {
    router.replace(href, { scroll: false });
  }
}
