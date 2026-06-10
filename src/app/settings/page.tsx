import Link from "next/link";
import { Check, DatabaseBackup, Download, HardDriveDownload, Layers3, Pencil, Share2, Tags, Trash2, X } from "lucide-react";
import { addSettingItem, createManualBackup, deleteSettingItem, editSettingItem } from "@/app/actions";
import { SettingsDialog } from "@/components/settings-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Content, Field, PageHeader } from "@/components/inventory-ui";
import { LanShareSettings } from "@/components/lan-share-settings";
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
  const latestBackup = backups[0];

  return (
    <main>
        <PageHeader
        title="Parametres"
        description="Configurer l'organisation, les familles, les sous-familles, la TVA et la sequence des codes."
      />

      <Content>
        <div className="space-y-6">
          <SettingsSection
            icon={<DatabaseBackup size={18} />}
            title="Backups JSON"
            hint="Un backup automatique est cree apres chaque modification. Les 50 derniers backups automatiques sont gardes."
            action={
              <div className="flex flex-wrap gap-2">
                {latestBackup ? (
                  <Link
                    href={`/backups/${latestBackup.name}`}
                    download
                    className={buttonStyles({ variant: "secondary" })}
                  >
                    <Download size={17} />
                    Telecharger dernier backup
                  </Link>
                ) : null}
                <form action={createManualBackup}>
                  <button className={buttonStyles()}>
                    <HardDriveDownload size={17} />
                    Creer backup
                  </button>
                </form>
              </div>
            }
          >
            <BackupTable backups={backups} />
          </SettingsSection>

          <SettingsSection
            icon={<Layers3 size={18} />}
            title="Structure organisationnelle"
            hint="Direction / Filiere -> Division / Departement -> Service / Unite. Une unite peut aussi etre rattachee directement a une Direction / Filiere."
            action={
              <div className="flex flex-wrap gap-2">
                <EditModeLink editMode={editMode} />
                <SettingsDialog label="Creer element" title="Creer un element organisationnel">
                  <NiveauForms niveau1={settings.niveau1} niveau2={settings.niveau2} />
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
            title="Familles"
            hint="Famille -> sous-famille. Chaque famille porte une TVA appliquee automatiquement aux nouveaux articles."
            action={
              <SettingsDialog label="Ajouter famille" title="Ajouter famille / sous-famille">
                <CategoryForms familles={settings.familles} />
              </SettingsDialog>
            }
          >
            <CategoryTable familles={settings.familles} editMode={editMode} />
          </SettingsSection>

          <SettingsSection
            icon={<Pencil size={18} />}
            title="Sequence des codes"
            hint="Numero de depart utilise pour les prochains codes complets."
            action={null}
          >
            <SerialSettingsForm startingSerialNumber={settings.startingSerialNumber} />
          </SettingsSection>

          <SettingsSection
            icon={<Share2 size={18} />}
            title="Partage web app"
            hint="Lien LAN genere depuis la connexion internet active de ce poste."
            action={null}
          >
            <LanShareSettings />
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
              <tr key={backup.name} className="even:bg-slate-50/60 hover:bg-iav-green-soft/70">
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
  niveau1: Array<{ code: string; name: string }>;
  niveau2: Array<{ code: string; name: string; parent1: string }>;
  niveau3: Array<{ code: string; name: string; parent1: string; parent2?: string }>;
  editMode: boolean;
}) {
  return (
    <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-3">
      <NiveauList title="Direction / Filiere" hint="Niveau organisationnel principal." empty={niveau1.length === 0}>
        {niveau1.map((item) => (
          <NiveauRow key={item.code} kind="niveau1" value={item.code} name={item.name} editMode={editMode} />
        ))}
      </NiveauList>
      <NiveauList title="Division / Departement" hint="Rattache a une Direction / Filiere." empty={niveau2.length === 0}>
        {niveau2.map((item) => (
          <NiveauRow
            key={`${item.parent1}-${item.code}`}
            kind="niveau2"
            value={item.code}
            name={item.name}
            parent1={item.parent1}
            editMode={editMode}
          />
        ))}
      </NiveauList>
      <NiveauList title="Service / Unite" hint="Rattache a une Division / Departement ou directement a une Direction / Filiere." empty={niveau3.length === 0}>
        {niveau3.map((item) => (
          <NiveauRow
            key={`${item.parent1}-${item.parent2 ?? "direct"}-${item.code}`}
            kind="niveau3"
            value={item.code}
            name={item.name}
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
  name,
  parent1,
  parent2,
  editMode,
}: {
  kind: "niveau1" | "niveau2" | "niveau3";
  value: string;
  name: string;
  parent1?: string;
  parent2?: string;
  editMode: boolean;
}) {
  const parentLabel = [parent1, parent2 || "Direct"].filter(Boolean).join(" / ");

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
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={value}
            required
            aria-label={`Modifier code ${value}`}
            className={cn(fieldStyles, "h-9 w-24 px-2")}
          />
          <input
            name="name"
            defaultValue={name}
            required
            aria-label={`Modifier nom ${name}`}
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
          <p className="truncate text-sm font-medium text-slate-900">{name} <span className="text-slate-500">({value})</span></p>
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
      return [{ category: famille.code, categoryName: famille.name, tvaRate: famille.tvaRate, sub: "", subName: "" }];
    }

    return famille.sousFamilles.map((sousFamille) => ({
      category: famille.code,
      categoryName: famille.name,
      tvaRate: famille.tvaRate,
      sub: sousFamille.code,
      subName: sousFamille.name,
    }));
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Famille</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">TVA</th>
            <th className="border-b border-slate-200 px-4 py-4 font-semibold">Sous-famille</th>
            {editMode ? <th className="border-b border-slate-200 px-4 py-4 font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={editMode ? 4 : 3} className="px-4 py-10 text-center text-sm text-slate-500">Aucune famille.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.category}-${row.sub}-${index}`} className="even:bg-slate-50/60 hover:bg-iav-green-soft/70">
                <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-900">
                  {editMode ? (
                    <CategoryEditForm kind="famille" value={row.category} name={row.categoryName} tvaRate={row.tvaRate} />
                  ) : (
                    <>
                      {row.categoryName} <span className="text-slate-500">({row.category})</span>
                    </>
                  )}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 tabular-nums">{row.tvaRate ?? 20} %</td>
                <td className="border-b border-slate-100 px-4 py-4">
                  {editMode && row.sub ? (
                    <CategoryEditForm kind="sousFamille" value={row.sub} name={row.subName} parent={row.category} />
                  ) : row.sub ? (
                    `${row.subName} (${row.sub})`
                  ) : (
                    "-"
                  )}
                </td>
                {editMode ? (
                  <td className="border-b border-slate-100 px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <IconDelete kind="famille" value={row.category} title="Supprimer famille" />
                      {row.sub ? <IconDelete kind="sousFamille" value={row.sub} parent={row.category} title="Supprimer sous-famille" /> : null}
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

function CategoryEditForm({
  kind,
  value,
  name,
  parent,
  tvaRate,
}: {
  kind: "famille" | "sousFamille";
  value: string;
  name: string;
  parent?: string;
  tvaRate?: number;
}) {
  return (
    <form action={editSettingItem} className="flex min-w-[280px] items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="previousValue" value={value} />
      {parent ? <input type="hidden" name="parent1" value={parent} /> : null}
      <input
        name="value"
        defaultValue={value}
        required
        aria-label={`Modifier code ${value}`}
        className={cn(fieldStyles, "h-9 w-24 px-2")}
      />
      <input
        name="name"
        defaultValue={name}
        required
        aria-label={`Modifier nom ${name}`}
        className={cn(fieldStyles, "h-9 min-w-0 flex-1 px-2")}
      />
      {kind === "famille" ? (
        <input
          name="tvaRate"
          type="number"
          step="0.01"
          min={0}
          defaultValue={tvaRate ?? 20}
          aria-label={`Modifier TVA ${value}`}
          className={cn(fieldStyles, "h-9 w-24 px-2")}
        />
      ) : null}
      <button title="Enregistrer" aria-label={`Enregistrer ${value}`} className={buttonStyles({ size: "icon-sm" })}>
        <Check size={15} />
      </button>
    </form>
  );
}

function NiveauForms({ niveau1, niveau2 }: { niveau1: Array<{ code: string; name: string }>; niveau2: Array<{ code: string; name: string; parent1: string }> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <FormBlock title="Direction / Filiere" hint="Niveau organisationnel principal.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="niveau1" />
          <Field name="value" label="Code" inputMode="numeric" pattern="[0-9]*" placeholder="100" required />
          <Field name="name" label="Nom" placeholder="Direction Informatique" required />
          <SubmitButton dark>Ajouter Direction / Filiere</SubmitButton>
        </form>
      </FormBlock>
      <FormBlock title="Division / Departement" hint="Rattache a une Direction / Filiere.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="niveau2" />
          <Select name="parent1" label="Direction / Filiere" values={niveau1.map((item) => ({ value: item.code, label: `${item.name} (${item.code})` }))} />
          <Field name="value" label="Code" inputMode="numeric" pattern="[0-9]*" placeholder="110" required />
          <Field name="name" label="Nom" placeholder="Departement Infrastructure" required />
          <SubmitButton>Ajouter Division / Departement</SubmitButton>
        </form>
      </FormBlock>
      <FormBlock title="Service / Unite" hint="Rattache a une Division / Departement, ou directement a une Direction / Filiere.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="niveau3" />
          <Select name="parent1" label="Direction / Filiere" values={niveau1.map((item) => ({ value: item.code, label: `${item.name} (${item.code})` }))} />
          <Select name="parent2" label="Division / Departement (optionnel)" values={niveau2.map((item) => ({ value: item.code, label: `${item.name} (${item.code})` }))} required={false} />
          <Field name="value" label="Code" inputMode="numeric" pattern="[0-9]*" placeholder="111" required />
          <Field name="name" label="Nom" placeholder="Service Reseaux" required />
          <SubmitButton>Ajouter Service / Unite</SubmitButton>
        </form>
      </FormBlock>
    </div>
  );
}

function CategoryForms({ familles }: { familles: FamilleSetting[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FormBlock title="Famille" hint="Famille principale avec code unique et TVA par defaut.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="famille" />
          <Field name="value" label="Code" placeholder="INF-PC" required />
          <Field name="name" label="Nom" placeholder="Informatique" required />
          <Field name="tvaRate" label="TVA (%)" type="number" step="0.01" min={0} defaultValue={20} />
          <SubmitButton>Ajouter famille</SubmitButton>
        </form>
      </FormBlock>
      <FormBlock title="Sous-famille" hint="Rattachee a une famille.">
        <form action={addSettingItem} className="grid gap-3">
          <input type="hidden" name="kind" value="sousFamille" />
          <Select name="parent" label="Famille" values={familles.map((item) => ({ value: item.code, label: `${item.name} (${item.code})` }))} />
          <Field name="value" label="Code" placeholder="LAPTOP" required />
          <Field name="name" label="Nom" placeholder="Laptop" required />
          <SubmitButton>Ajouter sous-famille</SubmitButton>
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

function SerialSettingsForm({ startingSerialNumber }: { startingSerialNumber: number }) {
  return (
    <form action={addSettingItem} className="flex flex-col gap-3 bg-slate-50 p-4 sm:flex-row sm:items-end">
      <input type="hidden" name="kind" value="serialStart" />
      <Field name="value" label="Starting Serial Number" type="number" min={1} defaultValue={startingSerialNumber} required />
      <button className={buttonStyles()}>
        Enregistrer
      </button>
    </form>
  );
}

function Select({
  name,
  label,
  values,
  required = true,
}: {
  name: string;
  label: string;
  values: Array<string | { value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} required={required} className={cn(fieldStyles, "h-10")}>
        <option value="">Choisir</option>
        {values.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return <option key={`${value}-${optionLabel}`} value={value}>{optionLabel}</option>;
        })}
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
        trigger={<span className={buttonStyles({ variant: "ghost", size: "icon-sm", className: "text-slate-400 hover:text-iav-red" })}><Trash2 size={14} /></span>}
      />
    </form>
  );
}
