import { requireUser } from "@/lib/auth";
import { getCategoryLabel, getDepartmentLabel, getDirectionLabel, getFullAssetCode, getServiceLabel, getSubCategoryLabel } from "@/lib/coding";
import { materialStatuses, statusLabel, type MaterialStatus } from "@/lib/inventory";
import { getSortDirection, getSortKey, getStringParam, matchesGlobalSearch, sortRecords } from "@/lib/search";
import { readInventory, type InventorySettings, type Material } from "@/lib/store";

export const dynamic = "force-dynamic";

const materialSortKeys = [
  "createdAt",
  "codeBarre",
  "codeFamille",
  "sousFamille",
  "categorie",
  "numeroSerie",
  "designation",
  "quantite",
  "puHt",
  "puTtc",
  "ptHt",
  "ptTtc",
  "tvaRate",
  "marque",
  "model",
  "typeAmortissement",
  "status",
  "niveau1",
  "niveau2",
  "niveau3",
  "localite",
  "codeLocale",
  "activeFullName",
] as const;

function escapeCell(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableCell(value: unknown) {
  return `<td style="mso-number-format:'\\@';">${escapeCell(value)}</td>`;
}

function compactFullCode(material: Parameters<typeof getFullAssetCode>[0]) {
  return getFullAssetCode(material).replace(/\s+/g, "");
}

const exportColumns = {
  fullCode: {
    header: "Code barre",
    value: (material: Material) => compactFullCode(material),
  },
  codeBarre: {
    header: "Code barre",
    value: (material: Material) => material.codeBarre,
  },
  codeLocale: {
    header: "Code local",
    value: (material: Material) => material.codeLocale ?? "",
  },
  designation: {
    header: "Designation",
    value: (material: Material) => material.designation ?? "",
  },
  quantite: {
    header: "Quantite",
    value: (material: Material) => material.quantite ?? 1,
  },
  numeroSerie: {
    header: "N serie",
    value: (material: Material) => material.numeroSerie ?? "",
  },
  categorie: {
    header: "Famille",
    value: (material: Material, settings: InventorySettings) => getCategoryLabel(settings, material.codeFamille),
  },
  sousCategorie: {
    header: "Sous-famille",
    value: (material: Material, settings: InventorySettings) => getSubCategoryLabel(settings, material.sousFamille),
  },
  valeurBase: {
    header: "PU HT",
    value: (material: Material) => material.valeurBase ?? "",
  },
  prixUnitaire: {
    header: "PU HT",
    value: (material: Material) => getPuHt(material) ?? "",
  },
  puHt: {
    header: "PU HT",
    value: (material: Material) => getPuHt(material) ?? "",
  },
  puTtc: {
    header: "PU TTC",
    value: (material: Material) => getPuTtc(material) ?? "",
  },
  ptHt: {
    header: "PT HT",
    value: (material: Material) => getPtHt(material) ?? "",
  },
  ptTtc: {
    header: "PT TTC",
    value: (material: Material) => getPtTtc(material) ?? "",
  },
  tvaRate: {
    header: "TVA",
    value: (material: Material) => material.tvaRate ?? 20,
  },
  marque: {
    header: "Marque",
    value: (material: Material) => material.marque ?? "",
  },
  model: {
    header: "Model",
    value: (material: Material) => material.model ?? "",
  },
  typeAmortissement: {
    header: "Type amortissement",
    value: (material: Material) => material.typeAmortissement ?? "",
  },
  status: {
    header: "Statut",
    value: (material: Material) => statusLabel(material.status),
  },
  niveau1: {
    header: "Direction / Filiere",
    value: (material: Material, settings: InventorySettings) => getDirectionLabel(settings, material.niveau1),
  },
  niveau2: {
    header: "Division / Departement",
    value: (material: Material, settings: InventorySettings) => getDepartmentLabel(settings, material.niveau2),
  },
  niveau3: {
    header: "Service / Unite",
    value: (material: Material, settings: InventorySettings) => getServiceLabel(settings, material.niveau3),
  },
  localite: {
    header: "Local",
    value: (material: Material) => material.localite ?? "",
  },
  beneficiaire: {
    header: "Beneficiaire",
    value: (material: Material) => material.activeFullName ?? "",
  },
} as const;

type ExportColumn = keyof typeof exportColumns;

const defaultColumns: ExportColumn[] = [
  "fullCode",
  "categorie",
  "sousCategorie",
  "numeroSerie",
  "designation",
  "quantite",
  "puHt",
  "puTtc",
  "ptHt",
  "ptTtc",
  "tvaRate",
  "marque",
  "model",
  "typeAmortissement",
  "status",
  "niveau1",
  "niveau2",
  "niveau3",
  "localite",
  "codeLocale",
  "beneficiaire",
];

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

function getExportColumns(url: URL): ExportColumn[] {
  const requested = url.searchParams.getAll("columns").filter((value): value is ExportColumn => value in exportColumns);
  return requested.length > 0 ? requested : defaultColumns;
}

function getStatusParam(value: string | null): MaterialStatus | "" {
  const status = getStringParam(value ?? undefined);
  return materialStatuses.includes(status as MaterialStatus) ? status as MaterialStatus : "";
}

export async function GET(request: Request) {
  await requireUser();
  const url = new URL(request.url);
  const query = getStringParam(url.searchParams.get("q") ?? undefined);
  const status = getStatusParam(url.searchParams.get("status"));
  const filters = {
    niveau1: getStringParam(url.searchParams.get("niveau1") ?? undefined),
    niveau2: getStringParam(url.searchParams.get("niveau2") ?? undefined),
    niveau3: getStringParam(url.searchParams.get("niveau3") ?? undefined),
    codeFamille: getStringParam(url.searchParams.get("codeFamille") ?? undefined),
    sousFamille: getStringParam(url.searchParams.get("sousFamille") ?? undefined),
    localite: getStringParam(url.searchParams.get("localite") ?? undefined),
    codeLocale: getStringParam(url.searchParams.get("codeLocale") ?? undefined),
    fullName: getStringParam(url.searchParams.get("fullName") ?? undefined),
    dateEntreeFrom: getStringParam(url.searchParams.get("dateEntreeFrom") ?? undefined),
    dateEntreeTo: getStringParam(url.searchParams.get("dateEntreeTo") ?? undefined),
    statusChangedFrom: getStringParam(url.searchParams.get("statusChangedFrom") ?? undefined),
    statusChangedTo: getStringParam(url.searchParams.get("statusChangedTo") ?? undefined),
  };
  const sort = getSortKey(url.searchParams.get("sort") ?? undefined, materialSortKeys, "createdAt");
  const direction = getSortDirection(url.searchParams.get("dir") ?? undefined, "desc");
  const columns = getExportColumns(url);
  const data = await readInventory();
  const materials = sortRecords(
    data.materials.filter((material) => {
      const matchesQuery = matchesGlobalSearch({ ...material, fullAssetCode: getFullAssetCode(material) }, query);
      const matchesStatus = !status || material.status === status;
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        if (key === "fullName") {
          return String(material.activeFullName ?? "").toLocaleLowerCase("fr").includes(value.toLocaleLowerCase("fr"));
        }
        if (key === "dateEntreeFrom") return matchesDateLowerBound(material.dateEntree, value);
        if (key === "dateEntreeTo") return matchesDateUpperBound(material.dateEntree, value);
        if (key === "statusChangedFrom") return matchesDateLowerBound(material.statusChangedAt, value);
        if (key === "statusChangedTo") return matchesDateUpperBound(material.statusChangedAt, value);
        return String(material[key as keyof typeof material] ?? "").toLocaleLowerCase("fr").includes(value.toLocaleLowerCase("fr"));
      });
      return matchesQuery && matchesStatus && matchesFilters;
    }),
    sort,
    direction,
  );
  const rows = materials.map((material) => columns.map((column) => exportColumns[column].value(material, data.settings)));

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <table>
      <thead>
        <tr>
          ${columns.map((column) => `<th>${escapeCell(exportColumns[column].header)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map(tableCell).join("")}</tr>`).join("")}
      </tbody>
    </table>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Disposition": `attachment; filename="inventaire-data.xls"`,
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
    },
  });
}

function matchesDateLowerBound(value: string | undefined, bound: string) {
  if (!bound) return true;
  return value ? new Date(value).getTime() >= new Date(`${bound}T00:00:00`).getTime() : false;
}

function matchesDateUpperBound(value: string | undefined, bound: string) {
  if (!bound) return true;
  return value ? new Date(value).getTime() <= new Date(`${bound}T23:59:59`).getTime() : false;
}
