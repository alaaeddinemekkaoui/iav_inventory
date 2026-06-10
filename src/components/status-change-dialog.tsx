"use client";

import { useMemo, useRef, useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { changeMaterialStatus } from "@/app/actions";
import { materialStatuses, statusLabel, type MaterialStatus } from "@/lib/inventory";
import type { InventorySettings, Material } from "@/lib/store";
import { getDepartmentLabel, getDirectionLabel, getFullAssetCode, getServiceLabel } from "@/lib/coding";
import { buttonStyles, cn, dialogStyles, fieldStyles } from "@/lib/ui";

type ActionMaterial = Pick<
  Material,
  | "id"
  | "codeBarre"
  | "codeFamille"
  | "sousFamille"
  | "numeroSerie"
  | "designation"
  | "niveau1"
  | "niveau2"
  | "niveau3"
  | "localite"
  | "codeLocale"
  | "activeFullName"
  | "activeDecisionNum"
  | "activeMarcheNum"
  | "status"
>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function StatusChangeDialog({ material, settings }: { material: ActionMaterial; settings: InventorySettings }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const statusOptions = useMemo(() => materialStatuses.map((status) => ({ value: status, label: statusLabel(status) })), []);
  const [selectedStatus, setSelectedStatus] = useState<MaterialStatus>(material.status);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles({ variant: "secondary", size: "sm" })}
      >
        <SlidersHorizontal size={15} />
        Changer statut
      </button>
      <dialog ref={dialogRef} className={cn(dialogStyles, "w-[min(920px,calc(100vw-32px))]")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">Changer le statut</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">
              {getFullAssetCode(material)} - statut actuel: {statusLabel(material.status)}
            </p>
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
        <div className="max-h-[calc(100dvh-146px)] overflow-y-auto p-5">
          <form action={changeMaterialStatus} onSubmit={() => dialogRef.current?.close()} className="grid gap-5">
            <input type="hidden" name="materialId" value={material.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectInput
                name="status"
                label="Nouveau statut"
                values={statusOptions}
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as MaterialStatus)}
              />
              <FieldInput name="movementDate" label="Date changement" type="date" defaultValue={today()} required />
            </div>

            <StatusFields status={selectedStatus} material={material} settings={settings} />

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Note</span>
              <textarea name="note" rows={3} className={cn(fieldStyles, "py-2")} />
            </label>

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
                <Check size={17} />
                Enregistrer statut
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

function StatusFields({
  status,
  material,
  settings,
}: {
  status: MaterialStatus;
  material: ActionMaterial;
  settings: InventorySettings;
}) {
  if (status === "STOCK") {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Le materiel sera remis en stock. Les informations du beneficiaire actif seront videes.
      </p>
    );
  }

  if (status === "DECHARGED" || status === "REFORMED") {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Le materiel sera marque comme {statusLabel(status).toLocaleLowerCase("fr")}. Les informations du beneficiaire actif seront videes.
      </p>
    );
  }

  if (status === "MUTATED") {
    return (
      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-slate-950">Formulaire mutation</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectInput name="niveau1" label="Direction / Filiere" values={directionOptions(settings)} defaultValue={material.niveau1} />
          <SelectInput name="niveau2" label="Division / Departement" values={departmentOptions(settings)} defaultValue={material.niveau2} />
          <SelectInput name="niveau3" label="Service / Unite" values={serviceOptions(settings)} defaultValue={material.niveau3} />
          <FieldInput name="localite" label="Nouveau local" defaultValue={material.localite ?? ""} required />
          <FieldInput name="codeLocale" label="Nouveau code local" defaultValue={material.codeLocale ?? ""} required />
          <FieldInput name="fullName" label="Beneficiaire actuel" defaultValue={material.activeFullName ?? ""} />
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      <h3 className="text-sm font-semibold text-slate-950">Formulaire affectation</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FieldInput name="fullName" label="Nom complet du beneficiaire" defaultValue={material.activeFullName ?? ""} required />
        <SelectInput name="niveau1" label="Direction / Filiere" values={directionOptions(settings)} defaultValue={material.niveau1} />
        <SelectInput name="niveau2" label="Division / Departement" values={departmentOptions(settings)} defaultValue={material.niveau2} />
        <SelectInput name="niveau3" label="Service / Unite" values={serviceOptions(settings)} defaultValue={material.niveau3} />
        <FieldInput name="localite" label="Local" defaultValue={material.localite ?? ""} />
        <FieldInput name="codeLocale" label="Code local" defaultValue={material.codeLocale ?? ""} required />
        <FieldInput name="decisionNum" label="N decision" defaultValue={material.activeDecisionNum ?? ""} />
        <FieldInput name="marcheNum" label="N marche" defaultValue={material.activeMarcheNum ?? ""} />
      </div>
    </section>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, name, className, ...rest } = props;

  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input name={name} className={cn(fieldStyles, "h-10", className)} {...rest} />
    </label>
  );
}

function SelectInput({
  label,
  name,
  values,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  name: string;
  values: Array<{ value: string; label: string }>;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} value={value} onChange={onChange} defaultValue={value === undefined ? defaultValue ?? "" : undefined} className={cn(fieldStyles, "h-10")}>
        <option value="">Choisir</option>
        {values.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function directionOptions(settings: InventorySettings) {
  return settings.niveau1.map((item) => ({ value: item.code, label: getDirectionLabel(settings, item.code) }));
}

function departmentOptions(settings: InventorySettings) {
  return settings.niveau2.map((item) => ({ value: item.code, label: getDepartmentLabel(settings, item.code) }));
}

function serviceOptions(settings: InventorySettings) {
  return settings.niveau3.map((item) => ({ value: item.code, label: getServiceLabel(settings, item.code) }));
}
