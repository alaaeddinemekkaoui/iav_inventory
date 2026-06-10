import { FileClock } from "lucide-react";
import { Content, getPage, MovementTable, PageHeader, paginate, Pagination, Panel } from "@/components/inventory-ui";
import { MovementFilterForm } from "@/components/movement-filter-form";
import { requireUser } from "@/lib/auth";
import { readInventory } from "@/lib/store";
import { createQueryString, getSortDirection, getSortKey, getStringParam, matchesGlobalSearch, movementSortKeys, sortRecords } from "@/lib/search";
import { getFullAssetCode } from "@/lib/coding";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = (await searchParams) ?? {};
  const page = getPage(params);
  const query = getStringParam(params.q);
  const sort = getSortKey(params.sort, movementSortKeys, "createdAt");
  const direction = getSortDirection(params.dir, "desc");
  const data = await readInventory();
  const movements = [...data.movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filteredMovements = movements.filter((movement) => matchesGlobalSearch({ ...movement, fullAssetCode: getFullAssetCode(movement) }, query));
  const sortedMovements = sortRecords(filteredMovements, sort, direction);
  const pageMovements = paginate(sortedMovements, page);
  const preservedQuery = createQueryString({ q: query, sort, dir: direction });

  return (
    <main>
      <PageHeader
        title="Historique"
        description="Liste paginee des dispatchs, mutations et decharges."
      />
      <Content>
        <Panel title="Mouvements" icon={<FileClock size={18} />} aside={`${filteredMovements.length} sur ${movements.length} operations`}>
          <MovementFilterForm basePath="/history" query={query} sort={sort} direction={direction} />
          <MovementTable movements={pageMovements} settings={data.settings} showType basePath="/history" query={preservedQuery} sort={sort} direction={direction} />
          <Pagination page={page} total={filteredMovements.length} basePath="/history" query={preservedQuery} />
        </Panel>
      </Content>
    </main>
  );
}
