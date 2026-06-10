import { PackagePlus } from "lucide-react";
import { LotForm } from "@/components/inventory-forms";
import { Content, PageHeader, Panel } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { readInventory } from "@/lib/store";
import { getNextSerial } from "@/lib/coding";

export const dynamic = "force-dynamic";

export default async function NewInventoryPage() {
  await requireUser();
  const data = await readInventory();
  const nextCode = getNextSerial(data.materials, data.settings);

  return (
    <main>
      <PageHeader
        title="Nouveau lot"
        description="Ajouter une entree de stock. Le code complet est calcule automatiquement."
      />
      <Content>
        <Panel title="Formulaire d'entree" icon={<PackagePlus size={18} />} aside={`Prochain code ${nextCode}`}>
          <LotForm nextCode={nextCode} settings={data.settings} />
        </Panel>
      </Content>
    </main>
  );
}
