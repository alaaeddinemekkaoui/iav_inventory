import { ArrowRightLeft } from "lucide-react";
import { MovementForm } from "@/components/inventory-forms";
import { MovementDialog } from "@/components/movement-dialog";
import { MovementFilterForm } from "@/components/movement-filter-form";
import { Content, getPage, MovementTable, PageHeader, paginate, Pagination, Panel } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { readInventory } from "@/lib/store";
import { createQueryString, getSortDirection, getSortKey, getStringParam, matchesGlobalSearch, movementSortKeys, sortRecords } from "@/lib/search";
import { getFullAssetCode } from "@/lib/coding";

export const dynamic = "force-dynamic";

export default async function MutationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = (await searchParams) ?? {};
  const page = getPage(params);
  const query = getStringParam(params.q);
  const filters = {
    niveau1: getStringParam(params.niveau1),
    niveau2: getStringParam(params.niveau2),
    niveau3: getStringParam(params.niveau3),
    codeFamille: getStringParam(params.codeFamille),
    sousFamille: getStringParam(params.sousFamille),
    localite: getStringParam(params.localite),
    codeLocale: getStringParam(params.codeLocale),
    fullName: getStringParam(params.fullName),
    status: getStringParam(params.status),
  };
  const sort = getSortKey(params.sort, movementSortKeys, "createdAt");
  const direction = getSortDirection(params.dir, "desc");
  const data = await readInventory();
  const activeMaterials = [...data.materials]
    .filter((item) => item.status !== "STOCK" && item.status !== "DECHARGED" && item.status !== "REFORMED")
    .sort((a, b) => a.codeBarre - b.codeBarre);
  const movements = [...data.movements]
    .filter((item) => item.type === "MUTATION")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const materialById = new Map(data.materials.map((material) => [material.id, material]));
  const filteredMovements = movements.filter((movement) => {
    const matchesQuery = matchesGlobalSearch({ ...movement, fullAssetCode: getFullAssetCode(movement) }, query);
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === "status") return materialById.get(movement.materialId)?.status === value;
      return String(movement[key as keyof typeof movement] ?? "").toLocaleLowerCase("fr").includes(value.toLocaleLowerCase("fr"));
    });
    return matchesQuery && matchesFilters;
  });
  const sortedMovements = sortRecords(filteredMovements, sort, direction);
  const pageMovements = paginate(sortedMovements, page);
  const preservedQuery = createQueryString({ q: query, ...filters, sort, dir: direction });

  return (
    <main>
      <PageHeader
        title="Mutation"
        description="Changer le responsable, le niveau, le local et le code local d'un materiel deja affecte."
        action={
          <MovementDialog type="MUTATION">
            <MovementForm type="MUTATION" materials={activeMaterials} settings={data.settings} />
          </MovementDialog>
        }
      />
      <Content>
        <section>
          <Panel title="Mutations" icon={<ArrowRightLeft size={18} />} aside={`${filteredMovements.length} sur ${movements.length} operations`}>
            <MovementFilterForm basePath="/mutation" query={query} sort={sort} direction={direction} settings={data.settings} filters={filters} />
            <MovementTable movements={pageMovements} settings={data.settings} basePath="/mutation" query={preservedQuery} sort={sort} direction={direction} showDecisionColumns={false} />
            <Pagination page={page} total={filteredMovements.length} basePath="/mutation" query={preservedQuery} />
          </Panel>
        </section>
      </Content>
    </main>
  );
}
