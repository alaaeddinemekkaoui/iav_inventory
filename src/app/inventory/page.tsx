import Link from "next/link";
import { Boxes, Pencil, X } from "lucide-react";
import { AddInventoryDialog } from "@/components/add-inventory-dialog";
import { InventoryFilterForm } from "@/components/inventory-filter-form";
import { LotForm } from "@/components/inventory-forms";
import { Content, getPage, MaterialTable, PageHeader, paginate, Pagination } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { readInventory } from "@/lib/store";
import { buttonStyles } from "@/lib/ui";
import { MaterialStatus } from "@/lib/inventory";
import { createQueryString, getSortDirection, getSortKey, getStringParam, matchesGlobalSearch, sortRecords, type SortDirection } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const page = getPage(params);
  const data = await readInventory();
  const materials = [...data.materials].sort((a, b) => a.codeBarre - b.codeBarre);
  const query = getStringParam(params.q);
  const status = getStatusParam(params.status);
  const sort = getSortKey(params.sort, materialSortKeys, "createdAt");
  const direction = getSortDirection(params.dir, "desc");
  const filteredMaterials = materials.filter((material) => {
    const matchesQuery = matchesGlobalSearch(material, query);
    return matchesQuery && (!status || material.status === status);
  });
  const sortedMaterials = sortRecords(filteredMaterials, sort, direction);
  const pageMaterials = paginate(sortedMaterials, page);
  const maxCode = materials.reduce((max, item) => Math.max(max, item.codeBarre), 122);
  const nextCode = maxCode + 1;
  const defaultOpen = params.add === "1";
  const canEdit = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const editMode = canEdit && params.edit === "1";
  const preservedQuery = createQueryString({ q: query, status, edit: editMode ? "1" : undefined, sort, dir: direction });
  const editHref = createInventoryHref({ q: query, status, edit: editMode ? undefined : "1", sort, dir: direction });

  return (
    <main>
      <PageHeader
        title="Inventaire"
        description="Liste paginee des materiels avec code barre, code famille, numero de serie, statut et affectation."
      />
      <Content>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <Boxes size={18} />
                Listing inventaire
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredMaterials.length} element{filteredMaterials.length === 1 ? "" : "s"} affiche{filteredMaterials.length === 1 ? "" : "s"} sur {materials.length}, page {page}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit ? (
                <Link
                  href={editHref}
                  className={buttonStyles({ variant: editMode ? "secondary" : "primary" })}
                >
                  {editMode ? <X size={17} /> : <Pencil size={17} />}
                  {editMode ? "Terminer" : "Mode edition"}
                </Link>
              ) : null}
              <AddInventoryDialog defaultOpen={defaultOpen}>
                <LotForm nextCode={nextCode} settings={data.settings} compact />
              </AddInventoryDialog>
            </div>
          </div>
          <InventoryFilterForm query={query} status={status} editMode={editMode} sort={sort} direction={direction} />
          <MaterialTable materials={pageMaterials} settings={data.settings} editable={editMode} sort={sort} direction={direction} query={preservedQuery} />
          <Pagination page={page} total={filteredMaterials.length} basePath="/inventory" query={preservedQuery} />
        </section>
      </Content>
    </main>
  );
}

const materialStatuses: MaterialStatus[] = ["STOCK", "DISPATCHED", "MUTATED", "DECHARGED"];
const materialSortKeys = [
  "createdAt",
  "codeBarre",
  "codeFamille",
  "sousFamille",
  "categorie",
  "numeroSerie",
  "designation",
  "marque",
  "model",
  "status",
  "niveau1",
  "niveau2",
  "niveau3",
  "localite",
  "activeFullName",
] as const;

function getStatusParam(value: string | string[] | undefined): MaterialStatus | "" {
  const status = getStringParam(value);
  return materialStatuses.includes(status as MaterialStatus) ? status as MaterialStatus : "";
}

function createInventoryHref(values: { q?: string; status?: string; edit?: string; sort?: string; dir?: SortDirection }) {
  const query = createQueryString(values);
  return query ? `/inventory?${query}` : "/inventory";
}
