import { PackagePlus } from "lucide-react";
import { LotForm } from "@/components/inventory-forms";
import { Content, PageHeader, Panel } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { readInventory } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewInventoryPage() {
  await requireUser();
  const data = await readInventory();
  const maxCode = data.materials.reduce((max, item) => Math.max(max, item.codeBarre), 122);
  const nextCode = maxCode + 1;

  return (
    <main>
      <PageHeader
        title="Nouveau lot"
        description="Ajouter une entree de stock par intervalle de code barre. Le prochain code est calcule automatiquement."
      />
      <Content>
        <Panel title="Formulaire d'entree" icon={<PackagePlus size={18} />} aside={`Prochain code ${nextCode}`}>
          <LotForm nextCode={nextCode} settings={data.settings} />
        </Panel>
      </Content>
    </main>
  );
}
