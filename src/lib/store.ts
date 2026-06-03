import { readStore, writeStore } from "@/lib/db";
import { createInventoryBackupSnapshot } from "@/lib/backups";
import { MaterialStatus, MovementType } from "@/lib/inventory";

export type Material = {
  id: string;
  codeBarre: number;
  codeFamille: string;
  sousFamille?: string;
  categorie?: string;
  numeroSerie?: string;
  designation?: string;
  marque?: string;
  model?: string;
  valeurBase?: number;
  dateEntree?: string;
  duree?: number;
  taux?: number;
  quantite: number;
  typeEntree?: string;
  typeAmortissement?: string;
  niveau1?: string;
  niveau2?: string;
  niveau3?: string;
  localite?: string;
  codeLocale?: string;
  accuseReception?: string;
  marBc?: string;
  facNumero?: string;
  origine?: string;
  status: MaterialStatus;
  activeFullName?: string;
  activeDecisionNum?: string;
  activeMarcheNum?: string;
  createdAt: string;
  updatedAt: string;
};

export type Movement = {
  id: string;
  materialId: string;
  type: MovementType;
  movementDate: string;
  fullName?: string;
  codeBarre: number;
  codeFamille: string;
  numeroSerie?: string;
  niveau1?: string;
  niveau2?: string;
  niveau3?: string;
  localite?: string;
  codeLocale?: string;
  decisionNum?: string;
  marcheNum?: string;
  note?: string;
  createdAt: string;
};

export type Level2 = {
  name: string;
  parent1: string;
};

export type Level3 = {
  name: string;
  parent1: string;
  parent2: string;
};

export type SousFamilleSetting = {
  name: string;
  categories: string[];
};

export type FamilleSetting = {
  code: string;
  sousFamilles: SousFamilleSetting[];
};

export type InventorySettings = {
  niveau1: string[];
  niveau2: Level2[];
  niveau3: Level3[];
  familles: FamilleSetting[];
};

export type InventoryData = {
  materials: Material[];
  movements: Movement[];
  settings: InventorySettings;
};

const emptyData: InventoryData = {
  materials: [],
  movements: [],
  settings: {
    niveau1: ["DG", "DEAA", "SG", "DRE"],
    niveau2: [
      { name: "Division RH", parent1: "DG" },
      { name: "Division Scolarite", parent1: "DEAA" },
      { name: "Division Finance", parent1: "SG" },
      { name: "Division Recherche", parent1: "DRE" },
    ],
    niveau3: [
      { name: "Service RH", parent1: "DG", parent2: "Division RH" },
      { name: "Service Etudiants", parent1: "DEAA", parent2: "Division Scolarite" },
      { name: "Service Budget", parent1: "SG", parent2: "Division Finance" },
      { name: "Service Laboratoires", parent1: "DRE", parent2: "Division Recherche" },
    ],
    familles: [
      { code: "INF-PC", sousFamilles: [{ name: "Laptop", categories: ["Portable", "Desktop"] }] },
      { code: "INF-IMP", sousFamilles: [{ name: "Laser", categories: ["Imprimante", "Scanner"] }] },
      { code: "MOB-BUR", sousFamilles: [{ name: "Bureau", categories: ["Table", "Chaise"] }] },
      { code: "LAB-MAT", sousFamilles: [{ name: "Microscope", categories: ["Instrument"] }] },
    ],
  },
};

export async function readInventory(): Promise<InventoryData> {
  return normalizeInventory(await readStore<Partial<InventoryData>>("inventory", emptyData));
}

export async function writeInventory(data: InventoryData) {
  await writeStore("inventory", data);
  await createInventoryBackupSnapshot(data, "auto");
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeInventory(data: Partial<InventoryData>): InventoryData {
  const rawSettings = data.settings as Partial<InventorySettings> | undefined;

  return {
    materials: data.materials ?? [],
    movements: data.movements ?? [],
    settings: {
      niveau1: rawSettings?.niveau1 ?? emptyData.settings.niveau1,
      niveau2: normalizeNiveau2(rawSettings?.niveau2),
      niveau3: normalizeNiveau3(rawSettings?.niveau3),
      familles: normalizeFamilles(rawSettings?.familles),
    },
  };
}

function normalizeNiveau2(value: unknown): Level2[] {
  if (!Array.isArray(value)) return emptyData.settings.niveau2;
  return value
    .map((item) => (typeof item === "string" ? { name: item, parent1: "" } : item as Partial<Level2>))
    .filter((item): item is Level2 => Boolean(item.name))
    .map((item) => ({ name: item.name, parent1: item.parent1 ?? "" }));
}

function normalizeNiveau3(value: unknown): Level3[] {
  if (!Array.isArray(value)) return emptyData.settings.niveau3;
  return value
    .map((item) => (typeof item === "string" ? { name: item, parent1: "", parent2: "" } : item as Partial<Level3>))
    .filter((item): item is Level3 => Boolean(item.name))
    .map((item) => ({ name: item.name, parent1: item.parent1 ?? "", parent2: item.parent2 ?? "" }));
}

function normalizeFamilles(value: unknown): FamilleSetting[] {
  if (!Array.isArray(value)) return emptyData.settings.familles;
  return value
    .map((item) => item as Partial<FamilleSetting> & { sousFamilles?: unknown[] })
    .filter((item): item is Partial<FamilleSetting> & { code: string; sousFamilles?: unknown[] } => Boolean(item.code))
    .map((item) => ({
      code: item.code,
      sousFamilles: Array.isArray(item.sousFamilles)
        ? item.sousFamilles.map((sousFamille) => {
            if (typeof sousFamille === "string") return { name: sousFamille, categories: [] };
            const parsed = sousFamille as Partial<SousFamilleSetting>;
            return { name: parsed.name ?? "", categories: parsed.categories ?? [] };
          }).filter((sousFamille) => sousFamille.name)
        : [],
    }));
}
