import Link from "next/link";
import {
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  FileClock,
  FileInput,
  PackagePlus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge, Content, formatDate, MovementList, PageHeader, Panel, Stat } from "@/components/inventory-ui";
import { requireUser } from "@/lib/auth";
import { Material, readInventory } from "@/lib/store";
import { statusLabel } from "@/lib/inventory";
import { getFullAssetCode, getNextSerial } from "@/lib/coding";
import { buttonStyles } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireUser();
  const data = await readInventory();
  const materials = [...data.materials].sort((a, b) => a.codeBarre - b.codeBarre);
  const movements = [...data.movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lastMovements = movements.slice(0, 5);
  const lastMaterials = [...materials].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const stock = materials.filter((item) => item.status === "STOCK");
  const nextCode = getNextSerial(materials, data.settings);
  const countByStatus = materials.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
  const stockRate = materials.length ? Math.round((stock.length / materials.length) * 100) : 0;
  const quickActions = pickQuickActions();

  return (
    <main>
      <PageHeader
        title="Dashboard inventaire"
        description="Statistiques, actions rapides et derniers changements du parc IAV."
      />

      <Content>
        <section className="space-y-5">
          <Panel title="Statistiques" icon={<CheckCircle2 size={18} />} aside={`Prochain code ${nextCode}`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Stat icon={<Boxes size={18} />} label="Inventaire" value={materials.length} detail={`Prochain ${nextCode}`} />
              <Stat icon={<CheckCircle2 size={18} />} label="En inventaire" value={countByStatus.STOCK ?? 0} detail={`${stockRate}% du parc`} />
              <Stat icon={<FileInput size={18} />} label="Affecte / Dispatche" value={countByStatus.DISPATCHED ?? 0} detail="Affectation initiale" />
              <Stat icon={<ArrowRightLeft size={18} />} label="Mutation" value={countByStatus.MUTATED ?? 0} detail="Changement owner" />
              <Stat icon={<Trash2 size={18} />} label="Reforme" value={(countByStatus.REFORMED ?? 0) + (countByStatus.DECHARGED ?? 0)} detail="Sortie du parc" />
            </div>
          </Panel>

          <Panel title="Boutons rapides" icon={<PackagePlus size={18} />} aside="Selection aleatoire">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <QuickLink
                  key={action.href}
                  href={action.href}
                  label={action.label}
                  description={action.description}
                  icon={action.icon}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="Derniers mouvements"
            icon={<FileClock size={18} />}
            aside={movements.length > 5 ? "5 derniers" : `${movements.length} lignes`}
          >
            <MovementList movements={lastMovements} />
            <div className="mt-4 flex justify-end">
              <SeeMore href="/history" label="Voir plus" />
            </div>
          </Panel>

          <Panel
            title="Derniers materiels"
            icon={<Boxes size={18} />}
            aside={materials.length > 5 ? "5 derniers" : `${materials.length} lignes`}
          >
            <LastMaterials materials={lastMaterials} />
            <div className="mt-4 flex justify-end">
              <SeeMore href="/inventory" label="Voir plus" />
            </div>
          </Panel>
        </section>
      </Content>
    </main>
  );
}

function pickQuickActions() {
  const actions = [
    {
      href: "/inventory?add=1",
      label: "Nouveau lot",
      description: "Ajouter une entree au stock",
      icon: <PackagePlus size={18} />,
    },
    {
      href: "/dispatch",
      label: "Dispatch",
      description: "Affecter un materiel libre",
      icon: <FileInput size={18} />,
    },
    {
      href: "/mutation",
      label: "Mutation",
      description: "Changer owner ou local",
      icon: <ArrowRightLeft size={18} />,
    },
    {
      href: "/decharge",
      label: "Decharge",
      description: "Sortir un materiel du parc",
      icon: <ShieldCheck size={18} />,
    },
    {
      href: "/inventory",
      label: "Listing",
      description: "Consulter tous les materiels",
      icon: <Boxes size={18} />,
    },
    {
      href: "/history",
      label: "Historique",
      description: "Voir les mouvements",
      icon: <FileClock size={18} />,
    },
  ];

  return actions.sort(() => Math.random() - 0.5).slice(0, 4);
}

function QuickLink({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-iav-cream px-4 py-3 text-slate-700 outline-none hover:border-iav-green/25 hover:bg-iav-green-soft hover:text-iav-green focus-visible:ring-2 focus-visible:ring-iav-green">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-iav-green shadow-sm">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-950">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <span className="ml-auto shrink-0 text-sm" aria-hidden="true">→</span>
    </Link>
  );
}

function LastMaterials({ materials }: { materials: Material[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {materials.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-slate-500">Aucun materiel pour le moment.</p>
      ) : (
        materials.map((item) => (
          <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[130px_1fr_180px_150px] sm:items-center">
            <div>
              <p className="text-sm font-semibold tabular-nums">Code barre</p>
              <p className="text-xs text-slate-500">{getFullAssetCode(item)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">{item.designation ?? "Materiel"}</p>
              <p className="text-xs leading-5 text-slate-500">N serie {item.numeroSerie ?? "Sans serie"} / {item.marque ?? "-"}</p>
            </div>
            <Badge status={item.status}>{statusLabel(item.status)}</Badge>
            <p className="text-sm text-slate-600">{formatDate(item.createdAt)}</p>
          </div>
        ))
      )}
    </div>
  );
}

function SeeMore({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonStyles({ variant: "secondary", size: "sm" })}>
      {label}
    </Link>
  );
}
