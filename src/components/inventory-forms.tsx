import { addMaterialRange, createMovement } from "@/app/actions";
import { Field, SelectField, TextArea } from "@/components/inventory-ui";
import { InventorySettings, Material } from "@/lib/store";
import { MovementType, movementLabel } from "@/lib/inventory";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LotForm({
  nextCode,
  settings,
  compact = false,
}: {
  nextCode: number;
  settings: InventorySettings;
  compact?: boolean;
}) {
  const wideGrid = compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <form action={addMaterialRange} className="grid gap-5">
      <SettingsDatalists settings={settings} />
      <div>
        <h3 className="text-sm font-semibold text-slate-950 text-balance">Identification</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 text-pretty">
          Les codes barre sont generes automatiquement depuis le dernier code. Avec la quantite, ce lot commence a {nextCode}.
        </p>
        <div className={cn("mt-3 grid gap-3", wideGrid)}>
          <Field name="quantite" label="Quantite du lot" type="number" min={1} defaultValue={1} required />
          <Field name="codeFamille" label="Code famille" list="famille-options" required />
          <Field name="sousFamille" label="Sous categorie" list="sous-famille-options" />
          <Field name="categorie" label="Type detaille" list="categorie-options" />
          <Field name="numeroSeriePrefix" label="N serie prefix" />
        </div>
        <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Depart automatique: <span className="font-semibold">{nextCode}</span>. Le code fin sera calcule avec la quantite au moment de l&apos;enregistrement.
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">Materiel</h3>
        <div className={cn("mt-3 grid gap-3", wideGrid)}>
          <Field name="designation" label="Designation" />
          <Field name="marque" label="Marque" />
          <Field name="model" label="Model" />
          <Field name="valeurBase" label="Valeur base" type="number" step="0.01" />
          <Field name="dateEntree" label="Date entree" type="date" defaultValue={today()} />
          <Field name="duree" label="Duree" type="number" />
          <Field name="taux" label="Taux" type="number" step="0.01" />
          <Field name="typeEntree" label="Type entree" />
          <Field name="typeAmortissement" label="Type amortissement" />
          <Field name="origine" label="Origine" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">Affectation initiale</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField name="niveau1" label="Niveau 1" values={settings.niveau1} />
          <SelectField name="niveau2" label="Niveau 2" values={settings.niveau2.map((item) => item.name)} />
          <SelectField name="niveau3" label="Niveau 3" values={settings.niveau3.map((item) => item.name)} />
          <Field name="localite" label="Localite" />
          <Field name="codeLocale" label="Code locale" />
          <Field name="accuseReception" label="Accuse de reception" />
          <Field name="marBc" label="MAR / BC" />
          <Field name="facNumero" label="FAC N" />
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button className={buttonStyles()}>
          Ajouter au stock
        </button>
      </div>
    </form>
  );
}

export function MovementForm({
  type,
  materials,
  settings,
  requireDecision = false,
}: {
  type: MovementType;
  materials: Pick<Material, "id" | "codeBarre" | "codeFamille" | "numeroSerie" | "designation">[];
  settings: InventorySettings;
  requireDecision?: boolean;
}) {
  return (
    <form action={createMovement} className="grid gap-5">
      <SettingsDatalists settings={settings} />
      <input type="hidden" name="type" value={type} />
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Materiel</span>
        <select name="materialId" required className={cn(fieldStyles, "h-10")}>
          {materials.length === 0 ? (
            <option value="">Aucun materiel disponible</option>
          ) : (
            materials.map((item) => (
              <option key={item.id} value={item.id}>
                Code barre {item.codeBarre} | Code famille {item.codeFamille} | N serie {item.numeroSerie ?? "sans serie"} | {item.designation ?? "materiel"}
              </option>
            ))
          )}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field name="movementDate" label="Date" type="date" defaultValue={today()} required />
        <Field name="fullName" label="Nom complet" placeholder="Responsable" />
        <SelectField name="niveau1" label="Niveau 1" values={settings.niveau1} />
        <SelectField name="niveau2" label="Niveau 2" values={settings.niveau2.map((item) => item.name)} />
        <SelectField name="niveau3" label="Niveau 3" values={settings.niveau3.map((item) => item.name)} />
        <Field name="localite" label="Local" />
        <Field name="codeLocale" label="Code local" />
        <Field name="decisionNum" label="N decision" required={requireDecision} />
        <Field name="marcheNum" label="N marche" required={requireDecision} />
      </div>

      <TextArea name="note" label="Note" />

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button disabled={materials.length === 0} className={buttonStyles()}>
          Valider {movementLabel(type)}
        </button>
      </div>
    </form>
  );
}

function SettingsDatalists({ settings }: { settings: InventorySettings }) {
  const sousFamilles = settings.familles.flatMap((famille) => famille.sousFamilles.map((sousFamille) => sousFamille.name));
  const categories = settings.familles.flatMap((famille) =>
    famille.sousFamilles.flatMap((sousFamille) => sousFamille.categories),
  );

  return (
    <>
      <datalist id="famille-options">
        {settings.familles.map((famille) => (
          <option key={famille.code} value={famille.code} />
        ))}
      </datalist>
      <datalist id="sous-famille-options">
        {sousFamilles.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="categorie-options">
        {categories.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="niveau1-options">
        {settings.niveau1.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="niveau2-options">
        {settings.niveau2.map((value) => (
          <option key={`${value.parent1}-${value.name}`} value={value.name} label={value.parent1} />
        ))}
      </datalist>
      <datalist id="niveau3-options">
        {settings.niveau3.map((value) => (
          <option key={`${value.parent1}-${value.parent2}-${value.name}`} value={value.name} label={`${value.parent1} / ${value.parent2}`} />
        ))}
      </datalist>
    </>
  );
}
