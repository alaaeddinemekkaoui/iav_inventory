"use client";

import Link from "next/link";
import { Download, TableProperties, X } from "lucide-react";
import { useRef } from "react";
import { buttonStyles, cn, dialogStyles } from "@/lib/ui";
import type { SortDirection } from "@/lib/search";

const dataColumns = [
  ["fullCode", "Code barre"],
  ["codeBarre", "Code barre"],
  ["codeLocale", "Code local"],
  ["designation", "Designation"],
  ["numeroSerie", "N serie"],
  ["categorie", "Famille"],
  ["sousCategorie", "Sous-famille"],
  ["quantite", "Quantite"],
  ["puHt", "PU HT"],
  ["puTtc", "PU TTC"],
  ["ptHt", "PT HT"],
  ["ptTtc", "PT TTC"],
  ["tvaRate", "TVA"],
  ["marque", "Marque"],
  ["model", "Model"],
  ["typeAmortissement", "Type amortissement"],
  ["status", "Statut"],
  ["niveau1", "Direction / Filiere"],
  ["niveau2", "Division / Departement"],
  ["niveau3", "Service / Unite"],
  ["localite", "Local"],
  ["beneficiaire", "Beneficiaire"],
] as const;

export function ExportInventoryDataDialog({
  query,
  status,
  filters,
  sort,
  direction,
}: {
  query: string;
  status: string;
  filters: Record<string, string>;
  sort: string;
  direction: SortDirection;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const filteredHref = createExportHref({ q: query, status, ...filters, sort, dir: direction, mode: "filtered" });

  return (
    <>
      <Link href={filteredHref} className={buttonStyles({ variant: "secondary" })}>
        <Download size={17} />
        Exporter filtre
      </Link>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles({ variant: "secondary" })}
      >
        <TableProperties size={17} />
        Exporter data
      </button>
      <dialog ref={dialogRef} className={cn(dialogStyles, "w-[min(760px,calc(100vw-32px))]")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">Exporter data</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">Choisir les colonnes a exporter avec le filtre courant.</p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={buttonStyles({ variant: "secondary", size: "icon-sm" })}
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </div>
        <form method="GET" action="/inventory/export" className="grid gap-5 p-5">
          {query ? <input type="hidden" name="q" value={query} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {Object.entries(filters).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={direction} />

          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="col-span-full mb-1 text-sm font-semibold text-slate-950">Colonnes</legend>
            {dataColumns.map(([value, label]) => (
              <Checkbox key={value} name="columns" value={value} label={label} defaultChecked />
            ))}
          </fieldset>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={buttonStyles({ variant: "secondary" })}
            >
              <X size={17} />
              Terminer
            </button>
            <button className={buttonStyles()}>
              <Download size={17} />
              Exporter
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function Checkbox({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <input name={name} value={value} type="checkbox" defaultChecked={defaultChecked} className="size-4 accent-iav-green" />
      {label}
    </label>
  );
}

function createExportHref(values: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `/inventory/export?${queryString}` : "/inventory/export";
}
