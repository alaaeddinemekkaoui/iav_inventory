import Link from "next/link";
import { ArrowLeft, History, MapPin, ReceiptText } from "lucide-react";
import { StatusChangeDialog } from "@/components/status-change-dialog";
import { Content, PageHeader, Panel, formatDate } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { getCategoryLabel, getDepartmentLabel, getDirectionLabel, getFullAssetCode, getServiceLabel, getSubCategoryLabel } from "@/lib/coding";
import { movementLabel, statusLabel } from "@/lib/inventory";
import { readInventory, type Material, type MaterialHistoryEntry } from "@/lib/store";
import { buttonStyles } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const data = await readInventory();
  const material = data.materials.find((item) => item.id === id);

  if (!material) {
    return (
      <main>
        <PageHeader title="Article introuvable" description="Aucun article ne correspond a cet identifiant." />
        <Content>
          <Link href="/inventory" className={buttonStyles({ variant: "secondary" })}>
            <ArrowLeft size={17} />
            Retour inventaire
          </Link>
        </Content>
      </main>
    );
  }

  const histories = [...(data.histories ?? [])]
    .filter((entry) => entry.materialId === material.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const movements = [...data.movements]
    .filter((movement) => movement.materialId === material.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main>
      <PageHeader
        title={material.designation || `Article ${material.codeBarre}`}
        description={`Code barre ${getFullAssetCode(material)} - statut actuel: ${statusLabel(material.status)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory" className={buttonStyles({ variant: "secondary" })}>
              <ArrowLeft size={17} />
              Retour
            </Link>
            <StatusChangeDialog material={material} settings={data.settings} />
          </div>
        }
      />
      <Content>
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <Panel title="Informations generales" icon={<ReceiptText size={18} />}>
              <InfoGrid
                rows={[
                  ["Code barre", getFullAssetCode(material)],
                  ["Famille", getCategoryLabel(data.settings, material.codeFamille)],
                  ["Sous-famille", getSubCategoryLabel(data.settings, material.sousFamille)],
                  ["N serie", material.numeroSerie],
                  ["Marque", material.marque],
                  ["Model", material.model],
                  ["Date entree", formatDate(material.dateEntree)],
                  ["Type amortissement", material.typeAmortissement],
                  ["Origine", material.origine],
                ]}
              />
            </Panel>

            <Panel title="Prix et TVA" icon={<ReceiptText size={18} />}>
              <InfoGrid
                rows={[
                  ["Quantite", material.quantite ?? 1],
                  ["PU HT", formatCurrency(getPuHt(material))],
                  ["PU TTC", formatCurrency(getPuTtc(material))],
                  ["PT HT", formatCurrency(getPtHt(material))],
                  ["PT TTC", formatCurrency(getPtTtc(material))],
                  ["TVA", `${material.tvaRate ?? 20} %`],
                ]}
              />
            </Panel>

            <Panel title="Mutations liees" icon={<MapPin size={18} />}>
              {movements.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Aucune mutation ou operation liee.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {movements.map((movement) => (
                    <div key={movement.id} className="grid gap-2 py-4 sm:grid-cols-[130px_1fr_180px]">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{movementLabel(movement.type)}</p>
                        <p className="text-xs text-slate-500">{formatDate(movement.movementDate)}</p>
                      </div>
                      <p className="text-sm text-slate-700">{movement.fullName ?? "-"}</p>
                      <p className="text-sm text-slate-600">Local {movement.localite ?? "-"} / {movement.codeLocale ?? "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Localisation" icon={<MapPin size={18} />}>
              <InfoGrid
                rows={[
                  ["Direction / Filiere", getDirectionLabel(data.settings, material.niveau1)],
                  ["Division / Departement", getDepartmentLabel(data.settings, material.niveau2)],
                  ["Service / Unite", getServiceLabel(data.settings, material.niveau3)],
                  ["Local", material.localite],
                  ["Code local", material.codeLocale],
                  ["Beneficiaire", material.activeFullName],
                ]}
              />
            </Panel>

            <Panel title="Historique" icon={<History size={18} />}>
              {histories.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Aucun historique enregistre.</p>
              ) : (
                <div className="space-y-4">
                  {histories.map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{entry.label}</p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{historyTypeLabel(entry.type)}</p>
                        </div>
                        <time dateTime={entry.createdAt} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          {formatDate(entry.createdAt)}
                        </time>
                      </div>
                      <HistoryDetails entry={entry} />
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </Content>
    </main>
  );
}

function HistoryDetails({ entry }: { entry: MaterialHistoryEntry }) {
  const rows = getHistoryRows(entry);

  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">Aucune donnee detaillee enregistree.</p>;
  }

  return (
    <dl className="mt-3 space-y-2">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
          <dt className="text-xs font-semibold text-slate-500">{row.label}</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {row.before === undefined ? (
              row.after
            ) : (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 line-through decoration-slate-400">{row.before}</span>
                <span className="text-xs text-slate-400">vers</span>
                <span>{row.after}</span>
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type HistoryRow = {
  label: string;
  before?: string;
  after: string;
};

function getHistoryRows(entry: MaterialHistoryEntry): HistoryRow[] {
  if (entry.type === "CREATE") {
    return historyFieldOrder
      .map((field) => ({
        label: historyFieldLabels[field],
        after: formatHistoryValue(field, entry.after?.[field]),
      }))
      .filter((row) => row.after !== "-");
  }

  return historyFieldOrder
    .map((field) => {
      const before = formatHistoryValue(field, entry.before?.[field]);
      const after = formatHistoryValue(field, entry.after?.[field]);
      return {
        label: historyFieldLabels[field],
        before,
        after,
      };
    })
    .filter((row) => row.before !== row.after);
}

const historyFieldOrder = [
  "status",
  "fullName",
  "activeFullName",
  "decisionNum",
  "activeDecisionNum",
  "marcheNum",
  "activeMarcheNum",
  "codeBarre",
  "codeFamille",
  "sousFamille",
  "categorie",
  "designation",
  "marque",
  "model",
  "numeroSerie",
  "dateEntree",
  "quantite",
  "typeEntree",
  "typeAmortissement",
  "niveau1",
  "niveau2",
  "niveau3",
  "localite",
  "codeLocale",
  "puHt",
  "puTtc",
  "ptHt",
  "ptTtc",
  "tvaRate",
  "valeurBase",
  "duree",
  "taux",
  "accuseReception",
  "marBc",
  "facNumero",
  "origine",
] as const;

const historyFieldLabels: Record<(typeof historyFieldOrder)[number], string> = {
  status: "Statut",
  fullName: "Beneficiaire",
  activeFullName: "Beneficiaire",
  decisionNum: "N decision",
  activeDecisionNum: "N decision",
  marcheNum: "N marche",
  activeMarcheNum: "N marche",
  codeBarre: "Code barre",
  codeFamille: "Famille",
  sousFamille: "Sous-famille",
  categorie: "Categorie",
  designation: "Designation",
  marque: "Marque",
  model: "Model",
  numeroSerie: "N serie",
  dateEntree: "Date entree",
  quantite: "Quantite",
  typeEntree: "Type entree",
  typeAmortissement: "Type amortissement",
  niveau1: "Direction / Filiere",
  niveau2: "Division / Departement",
  niveau3: "Service / Unite",
  localite: "Local",
  codeLocale: "Code local",
  puHt: "PU HT",
  puTtc: "PU TTC",
  ptHt: "PT HT",
  ptTtc: "PT TTC",
  tvaRate: "TVA",
  valeurBase: "Valeur base",
  duree: "Duree",
  taux: "Taux",
  accuseReception: "Accuse reception",
  marBc: "Marche / BC",
  facNumero: "N facture",
  origine: "Origine",
};

function formatHistoryValue(field: (typeof historyFieldOrder)[number], value: unknown) {
  if (value === undefined || value === null || value === "") return "-";
  if (field === "status" && typeof value === "string") return statusLabel(value as Material["status"]);
  if (field === "tvaRate" && typeof value === "number") return `${value} %`;
  if (field === "taux" && typeof value === "number") return `${value} %`;
  if (field === "dateEntree" && typeof value === "string") return formatDate(value);
  if (
    (field === "puHt" || field === "puTtc" || field === "ptHt" || field === "ptTtc" || field === "valeurBase")
    && typeof value === "number"
  ) {
    return formatCurrency(value);
  }
  return String(value);
}

function historyTypeLabel(type: MaterialHistoryEntry["type"]) {
  const labels: Record<MaterialHistoryEntry["type"], string> = {
    CREATE: "Enregistrement",
    UPDATE: "Modification",
    STATUS: "Changement de statut",
    MOVEMENT: "Mouvement",
  };

  return labels[type];
}

function InfoGrid({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <dt className="text-xs font-semibold text-slate-500">{label}</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{value ? String(value) : "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatCurrency(value?: number) {
  return typeof value === "number"
    ? new Intl.NumberFormat("fr-MA", { currency: "MAD", maximumFractionDigits: 2, minimumFractionDigits: 2, style: "currency" }).format(value)
    : "-";
}

function getPuHt(material: Material) {
  return material.puHt ?? material.prixUnitaire ?? material.valeurBase;
}

function getPuTtc(material: Material) {
  const puHt = getPuHt(material);
  return material.puTtc ?? (typeof puHt === "number" ? puHt * (1 + (material.tvaRate ?? 20) / 100) : undefined);
}

function getPtHt(material: Material) {
  const puHt = getPuHt(material);
  return material.ptHt ?? material.prixHt ?? (typeof puHt === "number" ? puHt * (material.quantite || 1) : undefined);
}

function getPtTtc(material: Material) {
  const ptHt = getPtHt(material);
  return material.ptTtc ?? material.prixTtc ?? (typeof ptHt === "number" ? ptHt * (1 + (material.tvaRate ?? 20) / 100) : undefined);
}
