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
  puHt?: number;
  puTtc?: number;
  ptHt?: number;
  ptTtc?: number;
  tvaRate?: number;
  prixUnitaire?: number;
  prixHt?: number;
  prixTtc?: number;
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
  statusChangedAt?: string;
  reformedAt?: string;
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
  sousFamille?: string;
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

export type MaterialHistoryEntry = {
  id: string;
  materialId: string;
  type: "CREATE" | "UPDATE" | "STATUS" | "MOVEMENT";
  label: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
};

export type Level2 = {
  code: string;
  name: string;
  parent1: string;
};

export type Level3 = {
  code: string;
  name: string;
  parent1: string;
  parent2?: string;
};

export type SousFamilleSetting = {
  code: string;
  name: string;
  categories: string[];
};

export type FamilleSetting = {
  code: string;
  name: string;
  tvaRate: number;
  sousFamilles: SousFamilleSetting[];
};

export type InventorySettings = {
  niveau1: Array<{ code: string; name: string }>;
  niveau2: Level2[];
  niveau3: Level3[];
  familles: FamilleSetting[];
  startingSerialNumber: number;
};

export type InventoryData = {
  materials: Material[];
  movements: Movement[];
  histories: MaterialHistoryEntry[];
  settings: InventorySettings;
};

const emptyData: InventoryData = {
  materials: [],
  movements: [],
  histories: [],
  settings: {
    startingSerialNumber: 123,
    niveau1: [
      { code: "100", name: "Direction Generale" },
      { code: "200", name: "Direction Enseignement" },
      { code: "300", name: "Secretariat General" },
      { code: "400", name: "Direction Recherche" },
    ],
    niveau2: [
      { code: "110", name: "Division RH", parent1: "100" },
      { code: "210", name: "Division Scolarite", parent1: "200" },
      { code: "310", name: "Division Finance", parent1: "300" },
      { code: "410", name: "Division Recherche", parent1: "400" },
    ],
    niveau3: [
      { code: "111", name: "Service RH", parent1: "100", parent2: "110" },
      { code: "211", name: "Service Etudiants", parent1: "200", parent2: "210" },
      { code: "311", name: "Service Budget", parent1: "300", parent2: "310" },
      { code: "411", name: "Service Laboratoires", parent1: "400", parent2: "410" },
    ],
    familles: [
      { code: "10", name: "Informatique PC", tvaRate: 20, sousFamilles: [{ code: "101", name: "Laptop", categories: [] }] },
      { code: "20", name: "Impression", tvaRate: 20, sousFamilles: [{ code: "201", name: "Laser", categories: [] }] },
      { code: "30", name: "Mobilier bureau", tvaRate: 20, sousFamilles: [{ code: "301", name: "Bureau", categories: [] }] },
      { code: "40", name: "Materiel laboratoire", tvaRate: 20, sousFamilles: [{ code: "401", name: "Microscope", categories: [] }] },
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
    histories: data.histories ?? [],
    settings: {
      startingSerialNumber: normalizeSerialStart(rawSettings?.startingSerialNumber),
      niveau1: normalizeNiveau1(rawSettings?.niveau1),
      niveau2: normalizeNiveau2(rawSettings?.niveau2),
      niveau3: normalizeNiveau3(rawSettings?.niveau3),
      familles: normalizeFamilles(rawSettings?.familles),
    },
  };
}

function normalizeSerialStart(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : emptyData.settings.startingSerialNumber;
}

function normalizeNiveau1(value: unknown): Array<{ code: string; name: string }> {
  if (!Array.isArray(value)) return emptyData.settings.niveau1;
  return value
    .map((item) => (typeof item === "string" ? { code: item, name: item } : item as Partial<{ code: string; name: string }>))
    .filter((item): item is { code: string; name: string } => Boolean(item.code || item.name))
    .map((item) => ({ code: item.code || item.name, name: item.name || item.code }));
}

function normalizeNiveau2(value: unknown): Level2[] {
  if (!Array.isArray(value)) return emptyData.settings.niveau2;
  return value
    .map((item) => (typeof item === "string" ? { code: item, name: item, parent1: "" } : item as Partial<Level2>))
    .filter((item): item is Level2 => Boolean(item.code || item.name))
    .map((item) => ({ code: item.code || item.name, name: item.name || item.code, parent1: item.parent1 ?? "" }));
}

function normalizeNiveau3(value: unknown): Level3[] {
  if (!Array.isArray(value)) return emptyData.settings.niveau3;
  return value
    .map((item) => (typeof item === "string" ? { code: item, name: item, parent1: "", parent2: "" } : item as Partial<Level3>))
    .filter((item): item is Level3 => Boolean(item.code || item.name))
    .map((item) => ({ code: item.code || item.name, name: item.name || item.code, parent1: item.parent1 ?? "", parent2: item.parent2 || undefined }));
}

function normalizeFamilles(value: unknown): FamilleSetting[] {
  if (!Array.isArray(value)) return emptyData.settings.familles;
  return value
    .map((item) => item as Partial<FamilleSetting> & { sousFamilles?: unknown[] })
    .filter((item): item is Partial<FamilleSetting> & { code: string; sousFamilles?: unknown[] } => Boolean(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name || item.code,
      tvaRate: normalizeTvaRate(item.tvaRate),
      sousFamilles: Array.isArray(item.sousFamilles)
        ? item.sousFamilles.map((sousFamille) => {
            if (typeof sousFamille === "string") return { code: sousFamille, name: sousFamille, categories: [] };
            const parsed = sousFamille as Partial<SousFamilleSetting>;
            return { code: parsed.code || parsed.name || "", name: parsed.name || parsed.code || "", categories: [] };
          }).filter((sousFamille) => sousFamille.code || sousFamille.name)
        : [],
    }));
}

function normalizeTvaRate(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 20;
}
