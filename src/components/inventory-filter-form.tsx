"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { materialStatuses, MaterialStatus, statusLabel } from "@/lib/inventory";
import type { SortDirection } from "@/lib/search";
import type { InventorySettings } from "@/lib/store";
import { getCategoryLabel, getDepartmentLabel, getDirectionLabel, getServiceLabel, getSubCategoryLabel } from "@/lib/coding";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";

export function InventoryFilterForm({
  query,
  status,
  filters,
  settings,
  editMode,
  sort,
  direction,
}: {
  query: string;
  status: MaterialStatus | "";
  filters: Record<string, string>;
  settings: InventorySettings;
  editMode: boolean;
  sort: string;
  direction: SortDirection;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ ...filters, status });
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      replaceIfChanged(router, createInventoryHref({ ...filterValues, q: search, edit: editMode ? "1" : undefined, sort, dir: direction }));
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [direction, editMode, filterValues, router, search, sort]);

  function updateFilter(name: string, value: string) {
    setFilterValues((current) => ({ ...current, [name]: value }));
  }

  function resetFilters() {
    setSearch("");
    setFilterValues({});
    replaceIfChanged(router, createInventoryHref({ edit: editMode ? "1" : undefined, sort, dir: direction }));
  }

  return (
    <form
      action="/inventory"
      className="grid gap-3 border-b border-slate-100 bg-iav-cream px-4 py-4 lg:grid-cols-[minmax(0,1fr)_repeat(3,180px)_auto] lg:items-end"
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
            placeholder="Nom, code barre, serie, marque, local..."
            className={cn(fieldStyles, "h-10 w-full pl-10")}
          />
        </span>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Statut</span>
        <select name="status" value={filterValues.status ?? ""} onChange={(event) => updateFilter("status", event.target.value)} className={cn(fieldStyles, "h-10")}>
          <option value="">Tous les statuts</option>
          {materialStatuses.map((value) => (
            <option key={value} value={value}>{statusLabel(value)}</option>
          ))}
        </select>
      </label>
      <FilterSelect
        name="niveau1"
        label="Direction / Filiere"
        values={settings.niveau1.map((item) => ({ value: item.code, label: getDirectionLabel(settings, item.code) }))}
        value={filterValues.niveau1 ?? ""}
        onChange={updateFilter}
      />
      <FilterSelect
        name="niveau2"
        label="Division / Departement"
        values={settings.niveau2.map((item) => ({ value: item.code, label: getDepartmentLabel(settings, item.code) }))}
        value={filterValues.niveau2 ?? ""}
        onChange={updateFilter}
      />
      <FilterSelect
        name="niveau3"
        label="Service / Unite"
        values={settings.niveau3.map((item) => ({ value: item.code, label: getServiceLabel(settings, item.code) }))}
        value={filterValues.niveau3 ?? ""}
        onChange={updateFilter}
      />
      <FilterSelect
        name="codeFamille"
        label="Famille"
        values={settings.familles.map((item) => ({ value: item.code, label: getCategoryLabel(settings, item.code) }))}
        value={filterValues.codeFamille ?? ""}
        onChange={updateFilter}
      />
      <FilterSelect
        name="sousFamille"
        label="Sous-famille"
        values={settings.familles
          .flatMap((famille) => famille.sousFamilles)
          .map((item) => ({ value: item.code, label: getSubCategoryLabel(settings, item.code) }))}
        value={filterValues.sousFamille ?? ""}
        onChange={updateFilter}
      />
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Local</span>
        <input
          name="localite"
          value={filterValues.localite ?? ""}
          onChange={(event) => updateFilter("localite", event.target.value)}
          className={cn(fieldStyles, "h-10")}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Code local</span>
        <input
          name="codeLocale"
          value={filterValues.codeLocale ?? ""}
          onChange={(event) => updateFilter("codeLocale", event.target.value)}
          className={cn(fieldStyles, "h-10")}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Date entree min</span>
        <input
          name="dateEntreeFrom"
          type="date"
          value={filterValues.dateEntreeFrom ?? ""}
          onChange={(event) => updateFilter("dateEntreeFrom", event.target.value)}
          className={cn(fieldStyles, "h-10")}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Date entree max</span>
        <input
          name="dateEntreeTo"
          type="date"
          value={filterValues.dateEntreeTo ?? ""}
          onChange={(event) => updateFilter("dateEntreeTo", event.target.value)}
          className={cn(fieldStyles, "h-10")}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Changement statut min</span>
        <input
          name="statusChangedFrom"
          type="date"
          value={filterValues.statusChangedFrom ?? ""}
          onChange={(event) => updateFilter("statusChangedFrom", event.target.value)}
          className={cn(fieldStyles, "h-10")}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Changement statut max</span>
        <input
          name="statusChangedTo"
          type="date"
          value={filterValues.statusChangedTo ?? ""}
          onChange={(event) => updateFilter("statusChangedTo", event.target.value)}
          className={cn(fieldStyles, "h-10")}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Beneficiaire</span>
        <input
          name="fullName"
          value={filterValues.fullName ?? ""}
          onChange={(event) => updateFilter("fullName", event.target.value)}
          className={cn(fieldStyles, "h-10")}
        />
      </label>
      <button type="button" onClick={resetFilters} className={buttonStyles({ variant: "secondary" })}>
        Reinitialiser
      </button>
    </form>
  );
}

function FilterSelect({
  name,
  label,
  values,
  value,
  onChange,
}: {
  name: string;
  label: string;
  values: Array<{ value: string; label: string }>;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} value={value} onChange={(event) => onChange(name, event.target.value)} className={cn(fieldStyles, "h-10")}>
        <option value="">Tous</option>
        {values.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function createInventoryHref(values: Record<string, string | undefined>) {
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
