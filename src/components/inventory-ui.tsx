import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { editMaterialAdmin } from "@/app/actions";
import { DialogCloseButton, MaterialEditDialog } from "@/components/material-edit-dialog";
import { MaterialDeleteButton } from "@/components/material-delete-button";
import { StatusChangeDialog } from "@/components/status-change-dialog";
import { InventorySettings, Material, Movement } from "@/lib/store";
import { MaterialStatus, movementLabel, statusLabel } from "@/lib/inventory";
import { getCategoryLabel, getDepartmentLabel, getDirectionLabel, getFullAssetCode, getServiceLabel, getSubCategoryLabel } from "@/lib/coding";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";
import type { SortDirection } from "@/lib/search";

export const pageSize = 12;

export function PageHeader({
  eyebrow = "IAV Hassan II",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200/80 bg-iav-cream">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-7 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold text-iav-green">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 text-balance">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 text-pretty">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function Content({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">{children}</div>;
}

export function Panel({
  title,
  icon,
  aside,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950 text-balance">
          {icon ? <span className="text-iav-green">{icon}</span> : null}
          {title}
        </h2>
        {aside ? <span className="text-xs font-medium text-slate-500">{aside}</span> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, name, className, ...rest } = props;

  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        className={cn(fieldStyles, "h-10", className)}
        {...rest}
      />
    </label>
  );
}

export function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={3}
        className={cn(fieldStyles, "py-2")}
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  values,
  defaultValue,
  value,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  values: Array<string | { value: string; label: string }>;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={value === undefined ? defaultValue ?? "" : undefined}
        value={value}
        onChange={onChange}
        required={required}
        className={cn(fieldStyles, "h-10")}
      >
        <option value="">Choisir</option>
        {values.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return <option key={`${value}-${optionLabel}`} value={value}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

export function MiniField(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, name, className, ...rest } = props;

  return (
    <label className="grid gap-1.5 text-xs text-slate-500">
      {label}
      <input
        name={name}
        className={cn(fieldStyles, "h-9 w-24 px-2", className)}
        {...rest}
      />
    </label>
  );
}

export function Stat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-iav-green-soft text-iav-green">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-950 tabular-nums">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export function Badge({ children, status }: { children: React.ReactNode; status: MaterialStatus }) {
  const styles: Record<MaterialStatus, string> = {
    STOCK: "border-iav-green/25 bg-iav-green-soft text-iav-green",
    DISPATCHED: "border-iav-green/25 bg-white text-iav-green",
    MUTATED: "border-iav-red/25 bg-white text-iav-red",
    DECHARGED: "border-iav-red/25 bg-iav-red-soft text-iav-red",
    REFORMED: "border-iav-red/25 bg-iav-red-soft text-iav-red",
  };

  return (
    <span className={cn("inline-flex max-w-36 items-center rounded-full border px-2.5 py-1 text-xs font-semibold", styles[status])}>
      {children}
    </span>
  );
}

export function MaterialTable({
  materials,
  settings,
  editable = false,
  sort,
  direction,
  query,
}: {
  materials: Material[];
  settings: InventorySettings;
  editable?: boolean;
  sort: string;
  direction: SortDirection;
  query?: string;
}) {
  const headers = [
    { label: "Code barre", sortKey: "codeBarre" },
    { label: "Famille", sortKey: "codeFamille" },
    { label: "Sous-famille", sortKey: "sousFamille" },
    { label: "N serie", sortKey: "numeroSerie" },
    { label: "Designation", sortKey: "designation" },
    { label: "Quantite", sortKey: "quantite" },
    { label: "PU HT", sortKey: "puHt" },
    { label: "PT HT", sortKey: "ptHt" },
    { label: "TVA", sortKey: "tvaRate" },
    { label: "PU TTC", sortKey: "puTtc" },
    { label: "PT TTC", sortKey: "ptTtc" },
    { label: "Marque", sortKey: "marque" },
    { label: "Model", sortKey: "model" },
    { label: "Type amort.", sortKey: "typeAmortissement" },
    { label: "Statut / action", sortKey: "status" },
    { label: "Direction / Filiere", sortKey: "niveau1" },
    { label: "Division / Departement", sortKey: "niveau2" },
    { label: "Service / Unite", sortKey: "niveau3" },
    { label: "Local", sortKey: "localite" },
    { label: "Code local", sortKey: "codeLocale" },
    { label: "Beneficiaire", sortKey: "activeFullName" },
    ...(editable ? [{ label: "Actions" }] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1880px] border-separate border-spacing-0 text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-xs text-slate-500">
          <tr>
            {headers.map((head) => (
              <SortableHeader key={head.label} column={head} basePath="/inventory" query={query} sort={sort} direction={direction} />
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-12 text-center text-sm text-slate-500">
                Aucun materiel trouve.
              </td>
            </tr>
          ) : (
            materials.map((item) => (
              <tr key={item.id} className="align-top even:bg-slate-50/60 hover:bg-iav-green-soft/70">
                <td className="border-b border-slate-100 px-4 py-5 font-semibold text-slate-950 tabular-nums">
                  <Link href={`/inventory/${item.id}`} className="rounded outline-none hover:text-iav-green focus-visible:ring-2 focus-visible:ring-iav-green">
                    {getFullAssetCode(item)}
                  </Link>
                </td>
                <td className="border-b border-slate-100 px-4 py-5 font-medium text-slate-800">{getCategoryLabel(settings, item.codeFamille)}</td>
                <td className="border-b border-slate-100 px-4 py-5">{getSubCategoryLabel(settings, item.sousFamille)}</td>
                <td className="border-b border-slate-100 px-4 py-5 font-mono text-xs leading-5">{item.numeroSerie ?? "-"}</td>
                <td className="border-b border-slate-100 px-4 py-5">{item.designation ?? "-"}</td>
                <td className="border-b border-slate-100 px-4 py-5 tabular-nums">{item.quantite ?? 1}</td>
                <td className="border-b border-slate-100 px-4 py-5 tabular-nums">{formatCurrency(getPuHt(item))}</td>
                <td className="border-b border-slate-100 px-4 py-5 tabular-nums">{formatCurrency(getPtHt(item))}</td>
                <td className="border-b border-slate-100 px-4 py-5 tabular-nums">{formatPercent(item.tvaRate)}</td>
                <td className="border-b border-slate-100 px-4 py-5 tabular-nums">{formatCurrency(getPuTtc(item))}</td>
                <td className="border-b border-slate-100 px-4 py-5 tabular-nums">{formatCurrency(getPtTtc(item))}</td>
                <td className="border-b border-slate-100 px-4 py-5">{item.marque ?? "-"}</td>
                <td className="border-b border-slate-100 px-4 py-5">{item.model ?? "-"}</td>
                <td className="border-b border-slate-100 px-4 py-5">{item.typeAmortissement ?? "-"}</td>
                <td className="border-b border-slate-100 px-4 py-5">
                  <div className="flex flex-col gap-2">
                    <Badge status={item.status}>{statusLabel(item.status)}</Badge>
                    <StatusChangeDialog material={item} settings={settings} />
                  </div>
                </td>
                <td className="border-b border-slate-100 px-4 py-5">{getDirectionLabel(settings, item.niveau1)}</td>
                <td className="border-b border-slate-100 px-4 py-5">{getDepartmentLabel(settings, item.niveau2)}</td>
                <td className="border-b border-slate-100 px-4 py-5">{getServiceLabel(settings, item.niveau3)}</td>
                <td className="border-b border-slate-100 px-4 py-5">{item.localite ?? "-"}</td>
                <td className="border-b border-slate-100 px-4 py-5">{item.codeLocale ?? "-"}</td>
                <td className="border-b border-slate-100 px-4 py-5">{item.activeFullName ?? "-"}</td>
                {editable ? (
                  <td className="border-b border-slate-100 px-4 py-5">
                    <div className="flex items-center gap-2">
                      <MaterialEditDialog title={`Modifier ${item.codeBarre}`}>
                        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-950">Action statut</h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Affecter, muter ou reformer ce materiel depuis l&apos;inventaire.
                            </p>
                          </div>
                          <StatusChangeDialog material={item} settings={settings} />
                        </div>
                        <AdminMaterialForm material={item} settings={settings} />
                      </MaterialEditDialog>
                      <MaterialDeleteButton materialId={item.id} codeBarre={item.codeBarre} />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminMaterialForm({ material, settings }: { material: Material; settings: InventorySettings }) {
  return (
    <form action={editMaterialAdmin} className="grid gap-5">
      <input type="hidden" name="materialId" value={material.id} />
      <section>
        <h3 className="text-sm font-semibold text-slate-950">Codes</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field name="codeBarre" label="Code barre" type="number" defaultValue={material.codeBarre} required />
          <SelectField name="codeFamille" label="Famille" values={categoryOptions(settings)} defaultValue={material.codeFamille} />
          <Field name="numeroSerie" label="N serie" defaultValue={material.numeroSerie ?? ""} />
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-slate-950">Classification</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField name="sousFamille" label="Sous-famille" values={subCategoryOptions(settings)} defaultValue={material.sousFamille} />
          <Field name="designation" label="Designation" defaultValue={material.designation ?? ""} />
          <Field name="marque" label="Marque" defaultValue={material.marque ?? ""} />
          <Field name="model" label="Model" defaultValue={material.model ?? ""} />
          <Field name="quantite" label="Quantite" type="number" min={1} defaultValue={material.quantite ?? 1} readOnly />
          <Field name="puHt" label="PU HT (MAD)" type="number" step="0.01" defaultValue={getPuHt(material) ?? ""} />
          <Field name="ptHt" label="PT HT (MAD)" type="number" step="0.01" defaultValue={getPtHt(material) ?? ""} />
          <Field name="tvaRate" label="TVA (%)" type="number" step="0.01" defaultValue={material.tvaRate ?? 20} />
          <Field name="puTtc" label="PU TTC (MAD)" type="number" step="0.01" defaultValue={getPuTtc(material) ?? ""} />
          <Field name="ptTtc" label="PT TTC (MAD)" type="number" step="0.01" defaultValue={getPtTtc(material) ?? ""} />
          <Field name="dateEntree" label="Date entree" type="date" defaultValue={toDateInput(material.dateEntree)} />
          <Field name="duree" label="Duree" type="number" defaultValue={material.duree ?? ""} />
          <Field name="taux" label="Taux" type="number" step="0.01" defaultValue={material.taux ?? ""} />
          <Field name="typeEntree" label="Type entree" defaultValue={material.typeEntree ?? ""} />
          <Field name="typeAmortissement" label="Type amortissement" defaultValue={material.typeAmortissement ?? ""} />
          <Field name="origine" label="Origine" defaultValue={material.origine ?? ""} />
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-slate-950">Affectation</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField name="niveau1" label="Direction / Filiere" values={directionOptions(settings)} defaultValue={material.niveau1} />
          <SelectField name="niveau2" label="Division / Departement" values={departmentOptions(settings)} defaultValue={material.niveau2} />
          <SelectField name="niveau3" label="Service / Unite" values={serviceOptions(settings)} defaultValue={material.niveau3} />
          <Field name="localite" label="Local" defaultValue={material.localite ?? ""} />
          <Field name="codeLocale" label="Code local" defaultValue={material.codeLocale ?? ""} />
          <Field name="accuseReception" label="Accuse de reception" defaultValue={material.accuseReception ?? ""} />
          <Field name="marBc" label="MAR / BC" defaultValue={material.marBc ?? ""} />
          <Field name="facNumero" label="FAC N" defaultValue={material.facNumero ?? ""} />
        </div>
      </section>
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <DialogCloseButton />
        <button className={buttonStyles()}>
          <Check size={17} />
          Enregistrer
        </button>
      </div>
    </form>
  );
}

function toDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function formatCurrency(value?: number) {
  return typeof value === "number"
    ? new Intl.NumberFormat("fr-MA", { currency: "MAD", maximumFractionDigits: 2, minimumFractionDigits: 2, style: "currency" }).format(value)
    : "-";
}

function formatPercent(value?: number) {
  return typeof value === "number" ? `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value)} %` : "-";
}

function getPuHt(material: Material) {
  return material.puHt ?? material.prixUnitaire ?? material.valeurBase;
}

function getPuTtc(material: Material) {
  const puHt = getPuHt(material);
  return material.puTtc ?? (typeof puHt === "number" ? puHt * (1 + (material.tvaRate ?? 20) / 100) : undefined);
}

function getPtHt(material: Material) {
  const quantity = material.quantite || 1;
  const puHt = getPuHt(material);
  return material.ptHt ?? material.prixHt ?? (typeof puHt === "number" ? puHt * quantity : undefined);
}

function getPtTtc(material: Material) {
  const ptHt = getPtHt(material);
  return material.ptTtc ?? material.prixTtc ?? (typeof ptHt === "number" ? ptHt * (1 + (material.tvaRate ?? 20) / 100) : undefined);
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

function categoryOptions(settings: InventorySettings) {
  return settings.familles.map((item) => ({ value: item.code, label: getCategoryLabel(settings, item.code) }));
}

function subCategoryOptions(settings: InventorySettings) {
  return settings.familles
    .flatMap((famille) => famille.sousFamilles)
    .map((item) => ({ value: item.code, label: getSubCategoryLabel(settings, item.code) }));
}

export function Pagination({
  page,
  total,
  basePath,
  query,
}: {
  page: number;
  total: number;
  basePath: string;
  query?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-500">
        Page <span className="font-semibold text-slate-800">{page}</span> sur <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={`${basePath}?page=${prevPage}${query ? `&${query}` : ""}`}
          aria-disabled={page === 1}
          className={buttonStyles({ variant: "secondary", size: "sm", className: page === 1 ? "pointer-events-none text-slate-300 shadow-none" : undefined })}
        >
          <ChevronLeft size={16} />
          Precedent
        </Link>
        <Link
          href={`${basePath}?page=${nextPage}${query ? `&${query}` : ""}`}
          aria-disabled={page === totalPages}
          className={buttonStyles({ variant: "secondary", size: "sm", className: page === totalPages ? "pointer-events-none text-slate-300 shadow-none" : undefined })}
        >
          Suivant
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export function MovementList({ movements }: { movements: Movement[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {movements.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-slate-500">Aucun mouvement pour le moment.</p>
      ) : (
        movements.map((movement) => (
          <div key={movement.id} className="grid gap-2 py-4 sm:grid-cols-[160px_1fr_190px_160px] sm:items-center">
            <div>
              <p className="text-sm font-semibold">{movementLabel(movement.type)}</p>
              <p className="text-xs text-slate-500">{formatDate(movement.movementDate)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Code barre {movement.codeBarre}</p>
              <p className="text-xs leading-5 text-slate-500">
                Famille {movement.codeFamille} / N serie {movement.numeroSerie ?? "sans serie"}
              </p>
            </div>
            <p className="text-sm text-slate-600">{movement.fullName ?? "-"}</p>
            <p className="text-sm text-slate-600">{movement.localite ?? "-"}</p>
          </div>
        ))
      )}
    </div>
  );
}

export function MovementTable({
  movements,
  settings,
  showType = false,
  showFullName = true,
  showDecisionColumns = true,
  basePath,
  query,
  sort,
  direction,
}: {
  movements: Movement[];
  settings: InventorySettings;
  showType?: boolean;
  showFullName?: boolean;
  showDecisionColumns?: boolean;
  basePath: string;
  query?: string;
  sort: string;
  direction: SortDirection;
}) {
  const headers = [
    ...(showType ? [{ label: "Operation", sortKey: "type" }] : []),
    { label: "Date", sortKey: "movementDate" },
    { label: "Code barre", sortKey: "codeBarre" },
    { label: "Famille", sortKey: "codeFamille" },
    { label: "N serie", sortKey: "numeroSerie" },
    ...(showFullName ? [{ label: "Nom complet", sortKey: "fullName" }] : []),
    { label: "Direction / Filiere", sortKey: "niveau1" },
    { label: "Division / Departement", sortKey: "niveau2" },
    { label: "Service / Unite", sortKey: "niveau3" },
    { label: "Local", sortKey: "localite" },
    ...(showDecisionColumns ? [{ label: "N decision", sortKey: "decisionNum" }, { label: "N marche", sortKey: "marcheNum" }] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1180px] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            {headers.map((head) => (
              <SortableHeader key={head.label} column={head} basePath={basePath} query={query} sort={sort} direction={direction} />
            ))}
          </tr>
        </thead>
        <tbody>
          {movements.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-slate-500">
                Aucun mouvement trouve.
              </td>
            </tr>
          ) : (
            movements.map((movement) => (
              <tr key={movement.id} className="align-top even:bg-slate-50/60 hover:bg-iav-green-soft/70">
                {showType ? (
                  <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-900">{movementLabel(movement.type)}</td>
                ) : null}
                <td className="border-b border-slate-100 px-4 py-4">{formatDate(movement.movementDate)}</td>
                <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-950 tabular-nums">{getFullAssetCode(movement)}</td>
                <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-800">{getCategoryLabel(settings, movement.codeFamille)}</td>
                <td className="border-b border-slate-100 px-4 py-4 font-mono text-xs">{movement.numeroSerie ?? "-"}</td>
                {showFullName ? <td className="border-b border-slate-100 px-4 py-4">{movement.fullName ?? "-"}</td> : null}
                <td className="border-b border-slate-100 px-4 py-4">{getDirectionLabel(settings, movement.niveau1)}</td>
                <td className="border-b border-slate-100 px-4 py-4">{getDepartmentLabel(settings, movement.niveau2)}</td>
                <td className="border-b border-slate-100 px-4 py-4">{getServiceLabel(settings, movement.niveau3)}</td>
                <td className="border-b border-slate-100 px-4 py-4">{movement.localite ?? "-"}</td>
                {showDecisionColumns ? (
                  <>
                    <td className="border-b border-slate-100 px-4 py-4">{movement.decisionNum ?? "-"}</td>
                    <td className="border-b border-slate-100 px-4 py-4">{movement.marcheNum ?? "-"}</td>
                  </>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("fr-MA").format(new Date(value)) : "-";
}

export function getPage(searchParams: Record<string, string | string[] | undefined>) {
  const raw = searchParams.page;
  const page = Number(Array.isArray(raw) ? raw[0] : raw ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function paginate<T>(items: T[], page: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function SortableHeader({
  column,
  basePath,
  query,
  sort,
  direction,
}: {
  column: { label: string; sortKey?: string };
  basePath: string;
  query?: string;
  sort: string;
  direction: SortDirection;
}) {
  const isActive = column.sortKey === sort;

  return (
    <th
      scope="col"
      aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : undefined}
      className="border-b border-slate-200 px-4 py-3 font-semibold"
    >
      {column.sortKey ? (
        <Link
          href={createSortHref(basePath, query, column.sortKey, isActive && direction === "asc" ? "desc" : "asc")}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded outline-none hover:text-iav-green focus-visible:ring-2 focus-visible:ring-iav-green"
        >
          {column.label}
          {isActive ? direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} /> : <ArrowUpDown size={14} className="text-slate-300" />}
        </Link>
      ) : column.label}
    </th>
  );
}

function createSortHref(basePath: string, query: string | undefined, sort: string, direction: SortDirection) {
  const searchParams = new URLSearchParams(query);
  searchParams.set("sort", sort);
  searchParams.set("dir", direction);
  return `${basePath}?${searchParams.toString()}`;
}
