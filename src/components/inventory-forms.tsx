"use client";

import { addMaterialRange, createMovement } from "@/app/actions";
import { useState } from "react";
import { Field, SelectField, TextArea } from "@/components/inventory-ui";
import { MaterialSearchSelect } from "@/components/material-search-select";
import { InventorySettings, Material } from "@/lib/store";
import { MovementType, movementLabel } from "@/lib/inventory";
import { getCategoryLabel, getDepartmentLabel, getDirectionLabel, getServiceLabel, getSubCategoryLabel } from "@/lib/coding";
import { buttonStyles, cn } from "@/lib/ui";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LotForm({
  nextCode,
  settings,
  compact = false,
}: {
  nextCode: number;
  settings: InventorySettings;
  compact?: boolean;
}) {
  const wideGrid = compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  const [quantity, setQuantity] = useState("1");
  const [familyCode, setFamilyCode] = useState("");
  const [puHt, setPuHt] = useState("");
  const [tvaRate, setTvaRate] = useState("20");
  const quantityValue = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const puHtValue = Number.parseFloat(puHt) || 0;
  const tvaRateValue = Number.parseFloat(tvaRate) || 0;
  const puTtc = puHtValue * (1 + tvaRateValue / 100);
  const ptHt = puHtValue * quantityValue;
  const ptTtc = ptHt * (1 + tvaRateValue / 100);

  function updateFamilyCode(value: string) {
    setFamilyCode(value);
    setTvaRate(String(settings.familles.find((famille) => famille.code === value)?.tvaRate ?? 20));
  }

  return (
    <form action={addMaterialRange} className="grid gap-5">
      <SettingsDatalists settings={settings} />
      <div>
        <h3 className="text-sm font-semibold text-slate-950 text-balance">Identification</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 text-pretty">
          Le code barre est genere automatiquement avec la structure, la famille, la sous-famille et le serial. Avec la quantite, ce lot commence a {nextCode}.
        </p>
        <div className={cn("mt-3 grid gap-3", wideGrid)}>
          <Field
            name="quantite"
            label="Quantite du lot"
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <SelectField
            name="codeFamille"
            label="Famille"
            values={categoryOptions(settings)}
            value={familyCode}
            onChange={(event) => updateFamilyCode(event.target.value)}
          />
          <SelectField name="sousFamille" label="Sous-famille" values={subCategoryOptions(settings)} />
          <Field name="numeroSeriePrefix" label="N serie prefix" />
        </div>
        <div className="mt-3 rounded-lg border border-iav-green/25 bg-iav-green-soft px-3 py-2 text-sm text-iav-green">
          Depart automatique: <span className="font-semibold">{nextCode}</span>. Le code fin sera calcule avec la quantite au moment de l&apos;enregistrement.
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">Materiel</h3>
        <div className={cn("mt-3 grid gap-3", wideGrid)}>
          <Field name="designation" label="Designation" />
          <Field name="marque" label="Marque" />
          <Field name="model" label="Model" />
          <Field
            name="puHt"
            label="PU HT (MAD)"
            type="number"
            step="0.01"
            min="0"
            value={puHt}
            onChange={(event) => setPuHt(event.target.value)}
          />
          <Field name="ptHt" label="PT HT (MAD)" type="number" step="0.01" value={ptHt.toFixed(2)} readOnly />
          <Field
            name="tvaRate"
            label="TVA (%)"
            type="number"
            step="0.01"
            min="0"
            value={tvaRate}
            onChange={(event) => setTvaRate(event.target.value)}
          />
          <Field name="puTtc" label="PU TTC (MAD)" type="number" step="0.01" value={puTtc.toFixed(2)} readOnly />
          <Field name="ptTtc" label="PT TTC (MAD)" type="number" step="0.01" value={ptTtc.toFixed(2)} readOnly />
          <Field name="dateEntree" label="Date entree" type="date" defaultValue={today()} />
          <Field name="duree" label="Duree" type="number" />
          <Field name="taux" label="Taux" type="number" step="0.01" />
          <Field name="typeEntree" label="Type entree" />
          <Field name="typeAmortissement" label="Type amortissement" />
          <Field name="origine" label="Origine" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">Structure du code</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField name="niveau1" label="Direction / Filiere" values={directionOptions(settings)} />
          <SelectField name="niveau2" label="Division / Departement" values={departmentOptions(settings)} />
          <SelectField name="niveau3" label="Service / Unite" values={serviceOptions(settings)} />
          <Field name="localite" label="Local" />
          <Field name="codeLocale" label="Code local" />
          <Field name="accuseReception" label="Accuse de reception" />
          <Field name="marBc" label="MAR / BC" />
          <Field name="facNumero" label="FAC N" />
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button className={buttonStyles()}>
          Ajouter au stock
        </button>
      </div>
    </form>
  );
}

export function MovementForm({
  type,
  materials,
  settings,
  requireDecision = false,
}: {
  type: MovementType;
  materials: Pick<
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
    | "codeLocale"
    | "localite"
    | "activeFullName"
    | "activeDecisionNum"
    | "activeMarcheNum"
  >[];
  settings: InventorySettings;
  requireDecision?: boolean;
}) {
  const isReforme = type === "DECHARGE";
  const isMutation = type === "MUTATION";
  const [movementValues, setMovementValues] = useState(() => valuesFromMaterial(materials[0]));

  function closeDialog(event: React.FormEvent<HTMLFormElement>) {
    event.currentTarget.closest("dialog")?.close();
  }

  return (
    <form action={createMovement} onSubmit={closeDialog} className="grid gap-5">
      <SettingsDatalists settings={settings} />
      <input type="hidden" name="type" value={type} />
      <MaterialSearchSelect
        materials={materials}
        includeBeneficiary={!isReforme}
        onSelect={(material) => setMovementValues(valuesFromMaterial(material))}
      />

      {isReforme ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="movementDate" label="Date" type="date" defaultValue={today()} required />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field name="movementDate" label="Date" type="date" defaultValue={today()} required />
          <Field
            name="fullName"
            label="Nom complet du beneficiaire"
            placeholder="Responsable"
            value={movementValues.fullName}
            onChange={(event) => setMovementValues((current) => ({ ...current, fullName: event.target.value }))}
            required={type === "DISPATCH"}
          />
          <SelectField
            name="niveau1"
            label="Direction / Filiere"
            values={directionOptions(settings)}
            value={movementValues.niveau1}
            onChange={(event) => setMovementValues((current) => ({ ...current, niveau1: event.target.value }))}
          />
          <SelectField
            name="niveau2"
            label="Division / Departement"
            values={departmentOptions(settings)}
            value={movementValues.niveau2}
            onChange={(event) => setMovementValues((current) => ({ ...current, niveau2: event.target.value }))}
          />
          <SelectField
            name="niveau3"
            label="Service / Unite"
            values={serviceOptions(settings)}
            value={movementValues.niveau3}
            onChange={(event) => setMovementValues((current) => ({ ...current, niveau3: event.target.value }))}
          />
          <Field
            name="localite"
            label="Local"
            value={movementValues.localite}
            onChange={(event) => setMovementValues((current) => ({ ...current, localite: event.target.value }))}
            required={isMutation}
          />
          <Field
            name="codeLocale"
            label="Code local"
            value={movementValues.codeLocale}
            onChange={(event) => setMovementValues((current) => ({ ...current, codeLocale: event.target.value }))}
            required={type === "DISPATCH" || isMutation}
          />
          {!isMutation ? (
            <>
              <Field
                name="decisionNum"
                label="N decision"
                value={movementValues.decisionNum}
                onChange={(event) => setMovementValues((current) => ({ ...current, decisionNum: event.target.value }))}
                required={requireDecision}
              />
              <Field
                name="marcheNum"
                label="N marche"
                value={movementValues.marcheNum}
                onChange={(event) => setMovementValues((current) => ({ ...current, marcheNum: event.target.value }))}
                required={requireDecision}
              />
            </>
          ) : null}
        </div>
      )}

      <TextArea name="note" label="Note" />

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button disabled={materials.length === 0} className={buttonStyles()}>
          Valider {movementLabel(type)}
        </button>
      </div>
    </form>
  );
}

function valuesFromMaterial(
  material?: Pick<
    Material,
    | "niveau1"
    | "niveau2"
    | "niveau3"
    | "codeLocale"
    | "localite"
    | "activeFullName"
    | "activeDecisionNum"
    | "activeMarcheNum"
  >,
) {
  return {
    fullName: material?.activeFullName ?? "",
    niveau1: material?.niveau1 ?? "",
    niveau2: material?.niveau2 ?? "",
    niveau3: material?.niveau3 ?? "",
    localite: material?.localite ?? "",
    codeLocale: material?.codeLocale ?? "",
    decisionNum: material?.activeDecisionNum ?? "",
    marcheNum: material?.activeMarcheNum ?? "",
  };
}

function SettingsDatalists({ settings }: { settings: InventorySettings }) {
  return (
    <>
      <datalist id="famille-options">
        {settings.familles.map((famille) => (
          <option key={famille.code} value={famille.code} label={famille.name} />
        ))}
      </datalist>
      <datalist id="sous-famille-options">
        {settings.familles.flatMap((famille) => famille.sousFamilles).map((value) => (
          <option key={value.code} value={value.code} label={value.name} />
        ))}
      </datalist>
      <datalist id="niveau1-options">
        {settings.niveau1.map((value) => (
          <option key={value.code} value={value.code} label={value.name} />
        ))}
      </datalist>
      <datalist id="niveau2-options">
        {settings.niveau2.map((value) => (
          <option key={`${value.parent1}-${value.code}`} value={value.code} label={`${value.name} / ${value.parent1}`} />
        ))}
      </datalist>
      <datalist id="niveau3-options">
        {settings.niveau3.map((value) => (
          <option key={`${value.parent1}-${value.parent2 ?? "direct"}-${value.code}`} value={value.code} label={`${value.name} / ${value.parent1}${value.parent2 ? ` / ${value.parent2}` : ""}`} />
        ))}
      </datalist>
    </>
  );
}

export function directionOptions(settings: InventorySettings) {
  return settings.niveau1.map((item) => ({ value: item.code, label: getDirectionLabel(settings, item.code) }));
}

export function departmentOptions(settings: InventorySettings) {
  return settings.niveau2.map((item) => ({ value: item.code, label: getDepartmentLabel(settings, item.code) }));
}

export function serviceOptions(settings: InventorySettings) {
  return settings.niveau3.map((item) => ({ value: item.code, label: getServiceLabel(settings, item.code) }));
}

export function categoryOptions(settings: InventorySettings) {
  return settings.familles.map((item) => ({ value: item.code, label: getCategoryLabel(settings, item.code) }));
}

export function subCategoryOptions(settings: InventorySettings) {
  return settings.familles
    .flatMap((famille) => famille.sousFamilles)
    .map((item) => ({ value: item.code, label: getSubCategoryLabel(settings, item.code) }));
}
