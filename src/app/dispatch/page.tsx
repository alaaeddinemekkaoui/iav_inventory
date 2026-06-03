import { FileInput } from "lucide-react";
import { MovementForm } from "@/components/inventory-forms";
import { MovementDialog } from "@/components/movement-dialog";
import { MovementFilterForm } from "@/components/movement-filter-form";
import { Content, getPage, MovementTable, PageHeader, paginate, Pagination, Panel } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { readInventory } from "@/lib/store";
import { createQueryString, getSortDirection, getSortKey, getStringParam, matchesGlobalSearch, movementSortKeys, sortRecords } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function DispatchPage({
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
  const stockMaterials = [...data.materials]
    .filter((item) => item.status === "STOCK")
    .sort((a, b) => a.codeBarre - b.codeBarre);
  const movements = [...data.movements]
    .filter((item) => item.type === "DISPATCH")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filteredMovements = movements.filter((movement) => matchesGlobalSearch(movement, query));
  const sortedMovements = sortRecords(filteredMovements, sort, direction);
  const pageMovements = paginate(sortedMovements, page);
  const preservedQuery = createQueryString({ q: query, sort, dir: direction });

  return (
    <main>
      <PageHeader
        title="Dispatch"
        description="Affecter un materiel disponible. La liste commence par le plus petit code barre libre."
        action={
          <MovementDialog type="DISPATCH">
            <MovementForm type="DISPATCH" materials={stockMaterials} settings={data.settings} requireDecision />
          </MovementDialog>
        }
      />
      <Content>
        <section>
          <Panel title="Dispatchs" icon={<FileInput size={18} />} aside={`${filteredMovements.length} sur ${movements.length} operations`}>
            <MovementFilterForm basePath="/dispatch" query={query} sort={sort} direction={direction} />
            <MovementTable movements={pageMovements} basePath="/dispatch" query={preservedQuery} sort={sort} direction={direction} />
            <Pagination page={page} total={filteredMovements.length} basePath="/dispatch" query={preservedQuery} />
          </Panel>
        </section>
      </Content>
    </main>
  );
}
