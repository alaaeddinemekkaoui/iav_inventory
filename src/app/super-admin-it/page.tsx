import Link from "next/link";
import { Boxes, Database, FileClock, Settings, ShieldCheck, UserCog, Users } from "lucide-react";
import { Content, PageHeader, Panel, Stat } from "@/components/inventory-ui";
import { requireRole } from "@/lib/auth";
import { readInventory } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SuperAdminItPage() {
  await requireRole("SUPER_ADMIN");
  const data = await readInventory();
  const materials = data.materials;
  const stock = materials.filter((item) => item.status === "STOCK").length;
  const assigned = materials.length - stock;
  const families = data.settings.familles.length;
  const niveaux = data.settings.niveau1.length + data.settings.niveau2.length + data.settings.niveau3.length;
  const lastUpdate = materials
    .map((item) => item.updatedAt)
    .sort((a, b) => b.localeCompare(a))
    .at(0);

  return (
    <main>
      <PageHeader
        eyebrow="IT uniquement"
        title="Super Admin IT"
        description="Espace technique cache pour la supervision globale, les acces sensibles et la maintenance des donnees."
      />

      <Content>
        <section className="space-y-5">
          <Panel title="Vue technique" icon={<ShieldCheck size={18} />} aside="Non affiche aux utilisateurs">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Stat icon={<Boxes size={18} />} label="Materiels" value={materials.length} detail="Total inventaire" />
              <Stat icon={<ShieldCheck size={18} />} label="En inventaire" value={stock} detail="Non affectes" />
              <Stat icon={<UserCog size={18} />} label="Affectes" value={assigned} detail="Dispatch, mutation, decharge" />
              <Stat icon={<Settings size={18} />} label="Organisation" value={niveaux} detail="Directions, departements, services" />
              <Stat icon={<Database size={18} />} label="Familles" value={families} detail="Familles racines" />
            </div>
          </Panel>

          <Panel title="Maintenance" icon={<Database size={18} />} aside={lastUpdate ? `Derniere maj ${new Date(lastUpdate).toLocaleDateString("fr-MA")}` : "Aucune donnee"}>
            <div className="grid gap-3 md:grid-cols-3">
              <AdminLink href="/inventory?edit=1" icon={<UserCog size={18} />} label="Inventaire" detail="Modifier ou supprimer les materiels" />
              <AdminLink href="/settings" icon={<Settings size={18} />} label="Parametres" detail="Organisation, familles et sequence" />
              <AdminLink href="/users" icon={<Users size={18} />} label="Utilisateurs" detail="Creer les comptes" />
              <AdminLink href="/history" icon={<FileClock size={18} />} label="Historique" detail={`${data.movements.length} mouvements`} />
            </div>
            <p className="mt-4 rounded-md border border-iav-green/25 bg-iav-green-soft px-3 py-2 text-sm leading-6 text-iav-green">
              Cette page est protegee par l authentification locale et limitee au role Super Admin IT.
            </p>
          </Panel>
        </section>
      </Content>
    </main>
  );
}

function AdminLink({
  href,
  icon,
  label,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <Link href={href} className="flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-iav-cream px-4 py-3 outline-none hover:border-iav-green/25 hover:bg-iav-green-soft focus-visible:ring-2 focus-visible:ring-iav-green">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-iav-green shadow-sm">{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span>
      </span>
    </Link>
  );
}
