"use client";

import { useRef } from "react";
import { Download, X } from "lucide-react";
import { buttonStyles, cn, dialogStyles, fieldStyles } from "@/lib/ui";

export function ExportCodeBarresDialog({
  query,
  status,
  filters,
}: {
  query: string;
  status: string;
  filters: Record<string, string>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles({ variant: "secondary" })}
      >
        <Download size={17} />
        Exporter codes barres
      </button>
      <dialog ref={dialogRef} className={cn(dialogStyles, "w-[min(620px,calc(100vw-32px))]")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">Exporter codes barres</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">Choisir les colonnes et l&apos;intervalle code barre.</p>
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
        <form method="GET" action="/inventory/code-barres" className="grid gap-5 p-5">
          <input type="hidden" name="exportOptions" value="1" />
          {query ? <input type="hidden" name="q" value={query} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {Object.entries(filters).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-slate-950">Colonnes</legend>
            <Checkbox name="columns" value="fullCode" label="Code barre" defaultChecked />
            <Checkbox name="columns" value="codeLocale" label="Code local" defaultChecked />
            <Checkbox name="columns" value="mutationStatus" label="Statut mutation" defaultChecked />
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Code barre debut</span>
              <input name="from" type="number" min={1} placeholder="1" className={cn(fieldStyles, "h-10")} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Code barre fin</span>
              <input name="to" type="number" min={1} placeholder="20" className={cn(fieldStyles, "h-10")} />
            </label>
          </div>

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
