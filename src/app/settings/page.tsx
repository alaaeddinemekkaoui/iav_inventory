import Link from "next/link";
import { Check, DatabaseBackup, Download, HardDriveDownload, Layers3, Pencil, Tags, Trash2, X } from "lucide-react";
import { addSettingItem, createManualBackup, deleteSettingItem, editSettingItem } from "@/app/actions";
import { SettingsDialog } from "@/components/settings-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Content, Field, PageHeader } from "@/components/inventory-ui";
import { requireRole } from "@/lib/auth";
import { listInventoryBackups, type BackupInfo } from "@/lib/backups";
import { FamilleSetting, readInventory } from "@/lib/store";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN");
  const params = (await searchParams) ?? {};
  const [data, backups] = await Promise.all([readInventory(), listInventoryBackups()]);
  const { settings } = data;
  const editMode = params.edit === "1";

  return (
    <main>
      <PageHeader
        title="Parametres"
        description="Configurer les niveaux organisationnels, categories, sous-categories et types detailles."
      />

      <Content>
        <div className="space-y-6">
          <SettingsSection
            icon={<DatabaseBackup size={18} />}
            title="Backups JSON"
            hint="Un backup automatique est cree apres chaque modification. Les 50 derniers backups automatiques sont gardes."
            action={
              <form action={createManualBackup}>
                <button className={buttonStyles()}>
                  <HardDriveDownload size={17} />
                  Creer backup
                </button>
              </form>
            }
          >
            <BackupTable backups={backups} />
          </SettingsSection>

          <SettingsSection
            icon={<Layers3 size={18} />}
            title="Niveaux organisationnels"
            hint="Niveau 2 depend de Niveau 1. Niveau 3 depend de Niveau 1 et Niveau 2."
            action={
              <div className="flex flex-wrap gap-2">
                <EditModeLink editMode={editMode} />
                <SettingsDialog label="Creer niveau" title="Creer un niveau">
                  <NiveauForms niveau1={settings.niveau1} niveau2={settings.niveau2.map((item) => item.name)} />
                </SettingsDialog>
              </div>
            }
          >
            <NiveauTable
              niveau1={settings.niveau1}
              niveau2={settings.niveau2}
              niveau3={settings.niveau3}
              editMode={editMode}
            />
          </SettingsSection>

          <SettingsSection
            icon={<Tags size={18} />}
            title="Categories"
            hint="Categorie -> sous-categorie -> type detaille. Ces valeurs sont proposees dans le formulaire d'inventaire."
            action={
              <SettingsDialog label="Ajouter categorie" title="Ajouter categorie / sous-categorie / type">
                <CategoryForms familles={settings.familles} />
              </SettingsDialog>
            }
          >
            <CategoryTable familles={settings.familles} editMode={editMode} />
          </SettingsSection>
        </div>
      </Content>
    </main>
  );
}

function BackupTable({ backups }: { backups: BackupInfo[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Fichier</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Type</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Date</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Taille</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {backups.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                Aucun backup pour le moment. Clique sur Creer backup pour generer un fichier JSON.
              </td>
            </tr>
          ) : (
            backups.map((backup) => (
              <tr key={backup.name} className="even:bg-slate-50/60 hover:bg-teal-50/45">
                <td className="max-w-[360px] truncate border-b border-slate-100 px-4 py-4 font-medium text-slate-900">
                  {backup.name}
                </td>
                <td className="border-b border-slate-100 px-4 py-4">
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                    {backup.name.startsWith("inventaire-manual-") ? "Manuel" : "Auto"}
                  </span>
                </td>
                <td className="border-b border-slate-100 px-4 py-4 tabular-nums text-slate-700">
                  {formatBackupDate(backup.createdAt)}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 tabular-nums text-slate-700">
                  {formatBytes(backup.size)}
                </td>
                <td className="border-b border-slate-100 px-4 py-4">
                  <Link href={`/backups/${backup.name}`} download className={buttonStyles({ variant: "secondary", size: "sm" })}>
                    <Download size={15} />
                    Telecharger
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function SettingsSection({
  icon,
  title,
  hint,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">{icon}{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function NiveauTable({
  niveau1,
  niveau2,
  niveau3,
  editMode,
}: {
  niveau1: string[];
  niveau2: Array<{ name: string; parent1: string }>;
  niveau3: Array<{ name: string; parent1: string; parent2: string }>;
  editMode: boolean;
}) {
  return (
    <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-3">
      <NiveauList title="Niveau 1" hint="Directions principales." empty={niveau1.length === 0}>
        {niveau1.map((value) => (
          <NiveauRow key={value} kind="niveau1" value={value} editMode={editMode} />
        ))}
      </NiveauList>
      <NiveauList title="Niveau 2" hint="Divisions rattachees au Niveau 1." empty={niveau2.length === 0}>
        {niveau2.map((item) => (
          <NiveauRow
            key={`${item.parent1}-${item.name}`}
            kind="niveau2"
            value={item.name}
            parent1={item.parent1}
            editMode={editMode}
          />
        ))}
      </NiveauList>
      <NiveauList title="Niveau 3" hint="Services rattaches aux Niveaux 1 et 2." empty={niveau3.length === 0}>
        {niveau3.map((item) => (
          <NiveauRow
            key={`${item.parent1}-${item.parent2}-${item.name}`}
            kind="niveau3"
            value={item.name}
            parent1={item.parent1}
            parent2={item.parent2}
            editMode={editMode}
          />
        ))}
      </NiveauList>
    </div>
  );
}

function EditModeLink({ editMode }: { editMode: boolean }) {
  return (
    <Link
      href={editMode ? "/settings" : "/settings?edit=1"}
      className={buttonStyles({ variant: editMode ? "secondary" : "primary" })}
    >
      {editMode ? <X size={17} /> : <Pencil size={17} />}
      {editMode ? "Terminer" : "Mode edition"}
    </Link>
  );
}

function NiveauList({
  title,
  hint,
  empty,
  children,
}: {
  title: string;
  hint: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {empty ? <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun niveau.</p> : children}
      </div>
    </section>
  );
}

function NiveauRow({
  kind,
  value,
  parent1,
  parent2,
  editMode,
}: {
  kind: "niveau1" | "niveau2" | "niveau3";
  value: string;
  parent1?: string;
  parent2?: string;
  editMode: boolean;
}) {
  const parentLabel = [parent1, parent2].filter(Boolean).join(" / ");

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {editMode ? (
        <form action={editSettingItem} className="flex min-w-0 flex-1 items-center gap-2">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="previousValue" value={value} />
          {parent1 ? <input type="hidden" name="parent1" value={parent1} /> : null}
          {parent2 ? <input type="hidden" name="parent2" value={parent2} /> : null}
          <input
            name="value"
            defaultValue={value}
            required
            aria-label={`Modifier ${value}`}
            className={cn(fieldStyles, "h-9 flex-1 px-2")}
          />
          <button
            title="Enregistrer"
            aria-label={`Enregistrer ${value}`}
            className={buttonStyles({ size: "icon-sm" })}
          >
            <Check size={15} />
          </button>
        </form>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{value}</p>
          {parentLabel ? <p className="mt-1 truncate text-xs text-slate-500">{parentLabel}</p> : null}
        </div>
      )}
      {editMode ? (
        <IconDelete kind={kind} value={value} parent1={parent1} parent2={parent2} title="Supprimer" />
      ) : null}
    </div>
  );
}

function CategoryTable({ familles, editMode }: { familles: FamilleSetting[]; editMode: boolean }) {
  const rows = familles.flatMap((famille) => {
    if (famille.sousFamilles.length === 0) {
      return [{ category: famille.code, sub: "", type: "" }];
    }

    return famille.sousFamilles.flatMap((sousFamille) => {
      if (sousFamille.categories.length === 0) {
        return [{ category: famille.code, sub: sousFamille.name, type: "" }];
      }

      return sousFamille.categories.map((type) => ({
        category: famille.code,
        sub: sousFamille.name,
        type,
      }));
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Categorie</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Sous categorie</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Type detaille</th>
            {editMode ? <th className="border-b border-slate-200 px-4 py-4 font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={editMode ? 4 : 3} className="px-4 py-10 text-center text-sm text-slate-500">Aucune categorie.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.category}-${row.sub}-${row.type}-${index}`} className="even:bg-slate-50/60 hover:bg-teal-50/45">
                <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-900">{row.category}</td>
                <td className="border-b border-slate-100 px-4 py-4">{row.sub || "-"}</td>
                <td className="border-b border-slate-100 px-4 py-4">{row.type || "-"}</td>
                {editMode ? (
                  <td className="border-b border-slate-100 px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <IconDelete kind="famille" value={row.category} title="Supprimer categorie" />
                      {row.sub ? <IconDelete kind="sousFamille" value={row.sub} parent={row.category} title="Supprimer sous-categorie" /> : null}
                      {row.type ? <IconDelete kind="categorie" value={row.type} parent={row.category} parent2={row.sub} title="Supprimer type" /> : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function NiveauForms({ niveau1, niveau2 }: { niveau1: string[]; niveau2: string[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <FormBlock title="Niveau 1" hint="Direction principale.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="niveau1" />
          <Field name="value" label="Nom" placeholder="DG" required />
          <SubmitButton dark>Ajouter Niveau 1</SubmitButton>
        </form>
      </FormBlock>
      <FormBlock title="Niveau 2" hint="Rattache a un Niveau 1.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="niveau2" />
          <Select name="parent1" label="Niveau 1" values={niveau1} />
          <Field name="value" label="Nom" placeholder="Division RH" required />
          <SubmitButton>Ajouter Niveau 2</SubmitButton>
        </form>
      </FormBlock>
      <FormBlock title="Niveau 3" hint="Rattache a Niveau 1 + 2.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="niveau3" />
          <Select name="parent1" label="Niveau 1" values={niveau1} />
          <Select name="parent2" label="Niveau 2" values={niveau2} />
          <Field name="value" label="Nom" placeholder="Service RH" required />
          <SubmitButton>Ajouter Niveau 3</SubmitButton>
        </form>
      </FormBlock>
    </div>
  );
}

function CategoryForms({ familles }: { familles: FamilleSetting[] }) {
  const sousFamilles = familles.flatMap((famille) => famille.sousFamilles.map((item) => item.name));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <FormBlock title="Categorie" hint="Ancien code famille.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="famille" />
          <Field name="value" label="Nom" placeholder="INF-PC" required />
          <SubmitButton>Ajouter categorie</SubmitButton>
        </form>
      </FormBlock>
      <FormBlock title="Sous-categorie" hint="Rattachee a une categorie.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="sousFamille" />
          <Select name="parent" label="Categorie" values={familles.map((item) => item.code)} />
          <Field name="value" label="Nom" placeholder="Laptop" required />
          <SubmitButton>Ajouter sous-categorie</SubmitButton>
        </form>
      </FormBlock>
      <FormBlock title="Type detaille" hint="Rattache a categorie + sous-categorie.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="categorie" />
          <Select name="parent" label="Categorie" values={familles.map((item) => item.code)} />
          <Select name="parent2" label="Sous categorie" values={sousFamilles} />
          <Field name="value" label="Nom" placeholder="Portable" required />
          <SubmitButton dark>Ajouter type detaille</SubmitButton>
        </form>
      </FormBlock>
    </div>
  );
}

function FormBlock({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950 text-balance">{title}</h3>
      <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500 text-pretty">{hint}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Select({ name, label, values }: { name: string; label: string; values: string[] }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} required className={cn(fieldStyles, "h-10")}>
        <option value="">Choisir</option>
        {values.map((value) => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <button className={buttonStyles({ className: dark ? "bg-slate-950 hover:bg-slate-800" : undefined })}>
      {children}
    </button>
  );
}

function IconDelete({
  kind,
  value,
  title,
  parent,
  parent1,
  parent2,
}: {
  kind: string;
  value: string;
  title: string;
  parent?: string;
  parent1?: string;
  parent2?: string;
}) {
  return (
    <form action={deleteSettingItem} className="inline-flex">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="value" value={value} />
      {parent ? <input type="hidden" name="parent" value={parent} /> : null}
      {parent1 ? <input type="hidden" name="parent1" value={parent1} /> : null}
      {parent2 ? <input type="hidden" name="parent2" value={parent2} /> : null}
      <ConfirmationDialog
        title={`${title} ?`}
        description={`Cette action supprime definitivement "${value}" des parametres de l'inventaire.`}
        triggerLabel={`${title}: ${value}`}
        trigger={<span className={buttonStyles({ variant: "ghost", size: "icon-sm", className: "text-slate-400 hover:text-rose-700" })}><Trash2 size={14} /></span>}
      />
    </form>
  );
}
