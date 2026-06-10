"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";
import type { SortDirection } from "@/lib/search";
import type { InventorySettings } from "@/lib/store";
import { materialStatuses, statusLabel } from "@/lib/inventory";
import { getCategoryLabel, getDepartmentLabel, getDirectionLabel, getServiceLabel, getSubCategoryLabel } from "@/lib/coding";

const emptyFilters: Record<string, string> = {};

export function MovementFilterForm({
  basePath,
  query,
  sort,
  direction,
  settings,
  filters = emptyFilters,
}: {
  basePath: string;
  query: string;
  sort: string;
  direction: SortDirection;
  settings?: InventorySettings;
  filters?: Record<string, string>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [filterValues, setFilterValues] = useState(filters);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      replaceIfChanged(router, createHref(basePath, { ...filterValues, q: search, sort, dir: direction }));
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [basePath, direction, filterValues, router, search, sort]);

  function updateFilter(name: string, value: string) {
    setFilterValues((current) => ({ ...current, [name]: value }));
  }

  function resetFilter() {
    setSearch("");
    setFilterValues({});
    replaceIfChanged(router, createHref(basePath, { sort, dir: direction }));
  }

  return (
    <form
      action={basePath}
      className="grid gap-3 border-b border-slate-100 bg-iav-cream px-4 py-4 lg:grid-cols-[minmax(0,1fr)_repeat(3,180px)_auto] lg:items-end"
    >
      <input type="hidden" name="sort" value={sort} />
      <input type="hidden" name="dir" value={direction} />
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Recherche globale</span>
        <span className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, code barre, serie, local, code local..."
            className={cn(fieldStyles, "h-10 w-full pl-10")}
          />
        </span>
      </label>
      {settings ? (
        <>
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
              .flatMap((item) => item.sousFamilles)
              .map((sub) => ({ value: sub.code, label: getSubCategoryLabel(settings, sub.code) }))}
            value={filterValues.sousFamille ?? ""}
            onChange={updateFilter}
          />
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Statut</span>
            <select
              name="status"
              value={filterValues.status ?? ""}
              onChange={(event) => updateFilter("status", event.target.value)}
              className={cn(fieldStyles, "h-10")}
            >
              <option value="">Tous</option>
              {materialStatuses.map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
          </label>
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
            <span className="font-medium text-slate-700">Beneficiaire</span>
            <input
              name="fullName"
              value={filterValues.fullName ?? ""}
              onChange={(event) => updateFilter("fullName", event.target.value)}
              className={cn(fieldStyles, "h-10")}
            />
          </label>
        </>
      ) : null}
      <button type="button" onClick={resetFilter} className={buttonStyles({ variant: "secondary" })}>
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

function createHref(basePath: string, values: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value?.trim()) searchParams.set(key, value.trim());
  });
  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function replaceIfChanged(router: ReturnType<typeof useRouter>, href: string) {
  if (`${window.location.pathname}${window.location.search}` !== href) {
    router.replace(href, { scroll: false });
  }
}
