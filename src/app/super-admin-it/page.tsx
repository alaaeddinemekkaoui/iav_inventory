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
              <Stat icon={<ShieldCheck size={18} />} label="Disponibles" value={stock} detail="En stock" />
              <Stat icon={<UserCog size={18} />} label="Affectes" value={assigned} detail="Dispatch, mutation, decharge" />
              <Stat icon={<Settings size={18} />} label="Niveaux" value={niveaux} detail="N1 + N2 + N3" />
              <Stat icon={<Database size={18} />} label="Familles" value={families} detail="Categories racines" />
            </div>
          </Panel>

          <Panel title="Maintenance" icon={<Database size={18} />} aside={lastUpdate ? `Derniere maj ${new Date(lastUpdate).toLocaleDateString("fr-MA")}` : "Aucune donnee"}>
            <div className="grid gap-3 md:grid-cols-3">
              <AdminLink href="/inventory?edit=1" icon={<UserCog size={18} />} label="Inventaire" detail="Modifier ou supprimer les materiels" />
              <AdminLink href="/settings" icon={<Settings size={18} />} label="Parametres" detail="Niveaux, categories et types" />
              <AdminLink href="/users" icon={<Users size={18} />} label="Utilisateurs" detail="Creer les comptes" />
              <AdminLink href="/history" icon={<FileClock size={18} />} label="Historique" detail={`${data.movements.length} mouvements`} />
            </div>
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              Cette page est cachee de la navigation utilisateur. Pour une vraie securite, il faudra ajouter une authentification et limiter cette route au role IT.
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
    <Link href={href} className="flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-[#f8faf8] px-4 py-3 outline-none hover:border-teal-200 hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-700">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-teal-700 shadow-sm">{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span>
      </span>
    </Link>
  );
}
