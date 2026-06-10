import { requireUser } from "@/lib/auth";
import { getFullAssetCode } from "@/lib/coding";
import type { MaterialStatus } from "@/lib/inventory";
import { getStringParam, matchesGlobalSearch } from "@/lib/search";
import { readInventory } from "@/lib/store";

export const dynamic = "force-dynamic";

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
    value: (material: { codeBarre: number; codeFamille: string; sousFamille?: string; niveau1?: string; niveau2?: string; niveau3?: string }) =>
      compactFullCode(material),
  },
  codeLocale: {
    header: "Code local",
    value: (material: { codeLocale?: string }) => material.codeLocale ?? "",
  },
  mutationStatus: {
    header: "Statut",
    value: (material: { status: MaterialStatus }) => (material.status === "MUTATED" ? "Mutation" : ""),
  },
} as const;

type ExportColumn = keyof typeof exportColumns;

function getExportColumns(url: URL): ExportColumn[] {
  const requested = url.searchParams.getAll("columns").filter((value): value is ExportColumn => value in exportColumns);
  if (requested.length > 0) return requested;
  return url.searchParams.get("exportOptions") === "1" ? ["fullCode"] : ["fullCode", "codeLocale", "mutationStatus"];
}

function getIntervalValue(url: URL, key: string) {
  const value = Number(getStringParam(url.searchParams.get(key) ?? undefined));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
}

export async function GET(request: Request) {
  await requireUser();
  const url = new URL(request.url);
  const query = getStringParam(url.searchParams.get("q") ?? undefined);
  const status = getStringParam(url.searchParams.get("status") ?? undefined) as MaterialStatus | "";
  const filters = {
    niveau1: getStringParam(url.searchParams.get("niveau1") ?? undefined),
    niveau2: getStringParam(url.searchParams.get("niveau2") ?? undefined),
    niveau3: getStringParam(url.searchParams.get("niveau3") ?? undefined),
    codeFamille: getStringParam(url.searchParams.get("codeFamille") ?? undefined),
    sousFamille: getStringParam(url.searchParams.get("sousFamille") ?? undefined),
    localite: getStringParam(url.searchParams.get("localite") ?? undefined),
    fullName: getStringParam(url.searchParams.get("fullName") ?? undefined),
  };
  const from = getIntervalValue(url, "from");
  const to = getIntervalValue(url, "to");
  const columns = getExportColumns(url);
  const data = await readInventory();
  const rows = data.materials
    .filter((material) => {
      const matchesQuery = matchesGlobalSearch({ ...material, fullAssetCode: getFullAssetCode(material) }, query);
      const matchesStatus = !status || material.status === status;
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        if (key === "fullName") {
          return String(material.activeFullName ?? "").toLocaleLowerCase("fr").includes(value.toLocaleLowerCase("fr"));
        }
        return String(material[key as keyof typeof material] ?? "").toLocaleLowerCase("fr").includes(value.toLocaleLowerCase("fr"));
      });
      const matchesFrom = from === undefined || material.codeBarre >= from;
      const matchesTo = to === undefined || material.codeBarre <= to;
      return matchesQuery && matchesStatus && matchesFilters && matchesFrom && matchesTo;
    })
    .sort((a, b) => a.codeBarre - b.codeBarre)
    .map((material) => columns.map((column) => exportColumns[column].value(material)));

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
      "Content-Disposition": `attachment; filename="code-barres-inventaire.xls"`,
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
    },
  });
}
