import { ArrowRightLeft } from "lucide-react";
import { MovementForm } from "@/components/inventory-forms";
import { MovementDialog } from "@/components/movement-dialog";
import { MovementFilterForm } from "@/components/movement-filter-form";
import { Content, getPage, MovementTable, PageHeader, paginate, Pagination, Panel } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { readInventory } from "@/lib/store";
import { createQueryString, getSortDirection, getSortKey, getStringParam, matchesGlobalSearch, movementSortKeys, sortRecords } from "@/lib/search";

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
  const sort = getSortKey(params.sort, movementSortKeys, "createdAt");
  const direction = getSortDirection(params.dir, "desc");
  const data = await readInventory();
  const activeMaterials = [...data.materials]
    .filter((item) => item.status !== "STOCK" && item.status !== "DECHARGED")
    .sort((a, b) => a.codeBarre - b.codeBarre);
  const movements = [...data.movements]
    .filter((item) => item.type === "MUTATION")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filteredMovements = movements.filter((movement) => matchesGlobalSearch(movement, query));
  const sortedMovements = sortRecords(filteredMovements, sort, direction);
  const pageMovements = paginate(sortedMovements, page);
  const preservedQuery = createQueryString({ q: query, sort, dir: direction });

  return (
    <main>
      <PageHeader
        title="Mutation"
        description="Changer le responsable, le niveau ou la localite d'un materiel deja affecte."
        action={
          <MovementDialog type="MUTATION">
            <MovementForm type="MUTATION" materials={activeMaterials} settings={data.settings} />
          </MovementDialog>
        }
      />
      <Content>
        <section>
          <Panel title="Mutations" icon={<ArrowRightLeft size={18} />} aside={`${filteredMovements.length} sur ${movements.length} operations`}>
            <MovementFilterForm basePath="/mutation" query={query} sort={sort} direction={direction} />
            <MovementTable movements={pageMovements} basePath="/mutation" query={preservedQuery} sort={sort} direction={direction} />
            <Pagination page={page} total={filteredMovements.length} basePath="/mutation" query={preservedQuery} />
          </Panel>
        </section>
      </Content>
    </main>
  );
}
