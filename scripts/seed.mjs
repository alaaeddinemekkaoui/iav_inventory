import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = process.env.INVENTAIRE_DATA_DIR
  ? path.resolve(process.env.INVENTAIRE_DATA_DIR)
  : path.join(process.cwd(), "data");
const inventoryFile = path.join(dataDir, "inventory.json");

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readBackup() {
  try {
    return JSON.parse(await readFile(inventoryFile, "utf8"));
  } catch {
    return { materials: [], movements: [], settings: { niveau1: [], niveau2: [], niveau3: [], familles: [] } };
  }
}

async function readInventory() {
  return readBackup();
}

async function writeInventory(data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(inventoryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function addSeedData(data) {
  const materials = data.materials ?? [];
  const movements = data.movements ?? [];
  const settings = data.settings ?? { niveau1: [], niveau2: [], niveau3: [], familles: [] };
  settings.niveau1 ??= [];
  settings.niveau2 ??= [];
  settings.niveau3 ??= [];
  settings.familles ??= [];

  const maxCode = materials.reduce((max, item) => Math.max(max, item.codeBarre), 122);
  const startCode = maxCode + 1;
  const now = new Date();
  const names = ["Amine El Fassi", "Sara Bennani", "Youssef Idrissi", "Nadia Alaoui", "Hicham Tazi"];
  const families = ["INF-PC", "INF-IMP", "MOB-BUR", "LAB-MAT", "NET-EQ"];
  const designations = ["Ordinateur portable", "Imprimante laser", "Bureau administratif", "Microscope", "Switch reseau"];
  const marques = ["Dell", "HP", "Canon", "Leica", "Cisco"];
  const models = ["Latitude 5450", "LaserJet Pro", "Office 140", "DM750", "Catalyst 9200"];
  const levels = [
    ["DG", "Division RH", "Service RH"],
    ["DEAA", "Division Scolarite", "Service Etudiants"],
    ["SG", "Division Finance", "Service Budget"],
    ["DRE", "Division Recherche", "Service Laboratoires"],
  ];
  const localites = ["Rabat - Bat A", "Rabat - Bat C", "Complexe Horticole", "Clinique Veterinaire"];
  const createdMaterials = Array.from({ length: 28 }, (_, index) => {
    const familyIndex = index % families.length;
    const level = levels[index % levels.length];
    const codeBarre = startCode + index;
    const dateEntree = new Date(now);
    dateEntree.setDate(now.getDate() - index * 9);

    return {
      id: newId("mat"),
      codeBarre,
      codeFamille: families[familyIndex],
      sousFamille: ["Laptop", "Laser", "Bureau", "Microscope", "Switch"][familyIndex],
      categorie: ["Portable", "Imprimante", "Table", "Instrument", "Reseau"][familyIndex],
      numeroSerie: `IAV-${families[familyIndex]}-${codeBarre}`,
      designation: designations[familyIndex],
      marque: marques[familyIndex],
      model: models[familyIndex],
      valeurBase: [8200, 2600, 1450, 18500, 6400][familyIndex],
      dateEntree: dateEntree.toISOString(),
      duree: [5, 4, 10, 8, 5][familyIndex],
      taux: [20, 25, 10, 12.5, 20][familyIndex],
      quantite: 1,
      typeEntree: index % 3 === 0 ? "Achat" : "Marche",
      typeAmortissement: "Lineaire",
      niveau1: level[0],
      niveau2: level[1],
      niveau3: level[2],
      localite: localites[index % localites.length],
      codeLocale: `LOC-${String((index % 18) + 1).padStart(2, "0")}`,
      accuseReception: `AR-${now.getFullYear()}-${100 + index}`,
      marBc: `BC-${now.getFullYear()}-${220 + index}`,
      facNumero: `FAC-${now.getFullYear()}-${870 + index}`,
      origine: index % 2 === 0 ? "Budget IAV" : "Projet",
      status: "STOCK",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });

  createdMaterials.slice(0, 16).forEach((material, index) => {
    const type = index < 10 ? "DISPATCH" : index < 14 ? "MUTATION" : "DECHARGE";
    const level = levels[(index + 1) % levels.length];
    const movementDate = new Date(now);
    movementDate.setDate(now.getDate() - (16 - index));
    material.status = type === "DISPATCH" ? "DISPATCHED" : type === "MUTATION" ? "MUTATED" : "DECHARGED";
    material.activeFullName = type === "DECHARGE" ? undefined : names[index % names.length];
    material.activeDecisionNum = `DEC-${now.getFullYear()}-${300 + index}`;
    material.activeMarcheNum = `MAR-${now.getFullYear()}-${80 + index}`;
    material.niveau1 = level[0];
    material.niveau2 = level[1];
    material.niveau3 = level[2];
    material.localite = localites[(index + 1) % localites.length];
    material.codeLocale = `LOC-${String((index % 18) + 2).padStart(2, "0")}`;
    material.updatedAt = now.toISOString();

    movements.push({
      id: newId("mov"),
      materialId: material.id,
      type,
      movementDate: movementDate.toISOString(),
      fullName: names[index % names.length],
      codeBarre: material.codeBarre,
      codeFamille: material.codeFamille,
      numeroSerie: material.numeroSerie,
      niveau1: material.niveau1,
      niveau2: material.niveau2,
      niveau3: material.niveau3,
      localite: material.localite,
      codeLocale: material.codeLocale,
      decisionNum: material.activeDecisionNum,
      marcheNum: material.activeMarcheNum,
      note: "Donnees de demonstration",
      createdAt: movementDate.toISOString(),
    });
  });

  materials.push(...createdMaterials);
  families.forEach((family, index) => {
    if (!settings.familles.some((item) => item.code === family)) {
      settings.familles.push({
        code: family,
        sousFamilles: [
          [{ name: "Laptop", categories: ["Portable", "Desktop"] }],
          [{ name: "Laser", categories: ["Imprimante", "Scanner"] }],
          [{ name: "Bureau", categories: ["Table", "Chaise"] }],
          [{ name: "Microscope", categories: ["Instrument"] }],
          [{ name: "Switch", categories: ["Reseau", "Routeur"] }],
        ][index],
      });
    }
  });
  levels.forEach(([niveau1, niveau2, niveau3]) => {
    if (!settings.niveau1.includes(niveau1)) settings.niveau1.push(niveau1);
    if (!settings.niveau2.some((item) => item.name === niveau2 && item.parent1 === niveau1)) {
      settings.niveau2.push({ name: niveau2, parent1: niveau1 });
    }
    if (!settings.niveau3.some((item) => item.name === niveau3 && item.parent1 === niveau1 && item.parent2 === niveau2)) {
      settings.niveau3.push({ name: niveau3, parent1: niveau1, parent2: niveau2 });
    }
  });

  return { materials, movements, settings };
}

const data = addSeedData(await readInventory());
await writeInventory(data);
console.log(`Seed termine: ${data.materials.length} materiels, ${data.movements.length} mouvements.`);
