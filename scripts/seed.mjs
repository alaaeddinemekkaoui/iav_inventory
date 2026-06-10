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
    return { materials: [], movements: [], settings: { startingSerialNumber: 123, niveau1: [], niveau2: [], niveau3: [], familles: [] } };
  }
}

async function readInventory() {
  return readBackup();
}

async function writeInventory(data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(inventoryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function mapCode(value, codeMap) {
  return typeof value === "string" && codeMap[value] ? codeMap[value] : value;
}

function normalizeLocaleCode(value) {
  if (typeof value !== "string") return value;
  const match = /^LOC-(\d+)$/i.exec(value);
  return match ? match[1].padStart(3, "0") : value;
}

function normalizeSeedSerial(item) {
  if (typeof item.numeroSerie !== "string" || !/^IAV-(INF-PC|INF-IMP|MOB-BUR|LAB-MAT|NET-EQ)-\d+$/i.test(item.numeroSerie)) {
    return;
  }

  item.numeroSerie = `IAV-${item.codeFamille}${item.sousFamille ? `-${item.sousFamille}` : ""}-${item.codeBarre}`;
}

function migrateExistingSeedCodes(data, maps) {
  data.materials.forEach((material) => {
    material.codeFamille = mapCode(material.codeFamille, maps.familyCodes);
    material.sousFamille = mapCode(material.sousFamille, maps.subFamilyCodes);
    material.niveau1 = mapCode(material.niveau1, maps.levelCodes);
    material.niveau2 = mapCode(material.niveau2, maps.levelCodes);
    material.niveau3 = mapCode(material.niveau3, maps.levelCodes);
    material.codeLocale = normalizeLocaleCode(material.codeLocale);
    normalizeSeedSerial(material);
  });

  data.movements.forEach((movement) => {
    movement.codeFamille = mapCode(movement.codeFamille, maps.familyCodes);
    movement.sousFamille = mapCode(movement.sousFamille, maps.subFamilyCodes);
    movement.niveau1 = mapCode(movement.niveau1, maps.levelCodes);
    movement.niveau2 = mapCode(movement.niveau2, maps.levelCodes);
    movement.niveau3 = mapCode(movement.niveau3, maps.levelCodes);
    movement.codeLocale = normalizeLocaleCode(movement.codeLocale);
    normalizeSeedSerial(movement);
  });

  data.settings.niveau1 = data.settings.niveau1.map((item) => {
    const rawCode = typeof item === "string" ? item : item.code ?? item.name;
    const code = mapCode(rawCode, maps.levelCodes);
    return { code, name: typeof item === "string" ? maps.levelNames[code] ?? item : item.name ?? maps.levelNames[code] ?? code };
  });
  data.settings.niveau2 = data.settings.niveau2.map((item) => {
    const rawCode = item.code ?? item.name;
    const code = mapCode(rawCode, maps.levelCodes);
    return { code, name: item.name ?? maps.levelNames[code] ?? code, parent1: mapCode(item.parent1, maps.levelCodes) ?? "" };
  });
  data.settings.niveau3 = data.settings.niveau3.map((item) => {
    const rawCode = item.code ?? item.name;
    const code = mapCode(rawCode, maps.levelCodes);
    return {
      code,
      name: item.name ?? maps.levelNames[code] ?? code,
      parent1: mapCode(item.parent1, maps.levelCodes) ?? "",
      parent2: mapCode(item.parent2, maps.levelCodes) || undefined,
    };
  });
  data.settings.familles = data.settings.familles.map((family) => {
    const code = mapCode(family.code, maps.familyCodes);
    return {
      code,
      name: family.name && family.name !== family.code ? family.name : maps.familyNames[code] ?? code,
      sousFamilles: (family.sousFamilles ?? []).map((subFamily) => {
        const subCode = mapCode(subFamily.code ?? subFamily.name, maps.subFamilyCodes);
        return {
          code: subCode,
          name: subFamily.name && !maps.subFamilyCodes[subFamily.name] ? subFamily.name : maps.subFamilyNames[subCode] ?? subCode,
          categories: [],
        };
      }),
    };
  });
}

function addSeedData(data) {
  const materials = data.materials ?? [];
  const movements = data.movements ?? [];
  const settings = data.settings ?? { niveau1: [], niveau2: [], niveau3: [], familles: [] };
  settings.niveau1 ??= [];
  settings.niveau2 ??= [];
  settings.niveau3 ??= [];
  settings.familles ??= [];
  settings.startingSerialNumber ??= 123;

  const maxCode = materials.reduce((max, item) => Math.max(max, item.codeBarre), 122);
  const startCode = maxCode + 1;
  const now = new Date();
  const names = ["Amine El Fassi", "Sara Bennani", "Youssef Idrissi", "Nadia Alaoui", "Hicham Tazi"];
  const families = [
    { code: "10", name: "Informatique PC", subCode: "101", subName: "Laptop", typeName: "Portable" },
    { code: "20", name: "Impression", subCode: "201", subName: "Laser", typeName: "Imprimante" },
    { code: "30", name: "Mobilier bureau", subCode: "301", subName: "Bureau", typeName: "Table" },
    { code: "40", name: "Materiel laboratoire", subCode: "401", subName: "Microscope", typeName: "Instrument" },
    { code: "50", name: "Equipement reseau", subCode: "501", subName: "Switch", typeName: "Reseau" },
  ];
  const designations = ["Ordinateur portable", "Imprimante laser", "Bureau administratif", "Microscope", "Switch reseau"];
  const marques = ["Dell", "HP", "Canon", "Leica", "Cisco"];
  const models = ["Latitude 5450", "LaserJet Pro", "Office 140", "DM750", "Catalyst 9200"];
  const levels = [
    { niveau1: "100", niveau1Name: "Direction Generale", niveau2: "110", niveau2Name: "Division RH", niveau3: "111", niveau3Name: "Service RH" },
    { niveau1: "200", niveau1Name: "Direction Enseignement", niveau2: "210", niveau2Name: "Division Scolarite", niveau3: "211", niveau3Name: "Service Etudiants" },
    { niveau1: "300", niveau1Name: "Secretariat General", niveau2: "310", niveau2Name: "Division Finance", niveau3: "311", niveau3Name: "Service Budget" },
    { niveau1: "400", niveau1Name: "Direction Recherche", niveau2: "410", niveau2Name: "Division Recherche", niveau3: "411", niveau3Name: "Service Laboratoires" },
  ];
  const levelNames = Object.fromEntries(levels.flatMap((level) => [
    [level.niveau1, level.niveau1Name],
    [level.niveau2, level.niveau2Name],
    [level.niveau3, level.niveau3Name],
  ]));
  const familyNames = Object.fromEntries(families.map((family) => [family.code, family.name]));
  const subFamilyNames = Object.fromEntries(families.map((family) => [family.subCode, family.subName]));
  const levelCodes = {
    DG: "100",
    DEAA: "200",
    SG: "300",
    "Secretariat general": "300",
    "Secretariat General": "300",
    DRE: "400",
    RH: "110",
    "Division RH": "110",
    SCO: "210",
    "Division Scolarite": "210",
    FIN: "310",
    "Division Finance": "310",
    REC: "410",
    "Division Recherche": "410",
    SRH: "111",
    "Service RH": "111",
    SETU: "211",
    "Service Etudiants": "211",
    SBUD: "311",
    "Service Budget": "311",
    SLAB: "411",
    "Service Laboratoires": "411",
  };
  const familyCodes = {
    "INF-PC": "10",
    "INF-IMP": "20",
    "MOB-BUR": "30",
    "LAB-MAT": "40",
    "NET-EQ": "50",
  };
  const subFamilyCodes = {
    LAP: "101",
    Laptop: "101",
    LAS: "201",
    Laser: "201",
    BUR: "301",
    Bureau: "301",
    MIC: "401",
    Microscope: "401",
    Switch: "501",
  };
  migrateExistingSeedCodes({ materials, movements, settings }, { levelCodes, levelNames, familyCodes, familyNames, subFamilyCodes, subFamilyNames });
  if (process.env.SEED_ONLY_MIGRATE === "1") return { materials, movements, settings };

  const localites = ["Rabat - Bat A", "Rabat - Bat C", "Complexe Horticole", "Clinique Veterinaire"];
  const createdMaterials = Array.from({ length: 28 }, (_, index) => {
    const familyIndex = index % families.length;
    const family = families[familyIndex];
    const level = levels[index % levels.length];
    const codeBarre = startCode + index;
    const dateEntree = new Date(now);
    dateEntree.setDate(now.getDate() - index * 9);

    return {
      id: newId("mat"),
      codeBarre,
      codeFamille: family.code,
      sousFamille: family.subCode,
      categorie: family.typeName,
      numeroSerie: `IAV-${family.code}-${family.subCode}-${codeBarre}`,
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
      niveau1: level.niveau1,
      niveau2: level.niveau2,
      niveau3: level.niveau3,
      localite: localites[index % localites.length],
      codeLocale: String((index % 18) + 1).padStart(3, "0"),
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
    material.status = type === "DISPATCH" ? "DISPATCHED" : type === "MUTATION" ? "MUTATED" : "REFORMED";
    material.activeFullName = type === "DECHARGE" ? undefined : names[index % names.length];
    material.activeDecisionNum = `DEC-${now.getFullYear()}-${300 + index}`;
    material.activeMarcheNum = `MAR-${now.getFullYear()}-${80 + index}`;
    material.niveau1 = level.niveau1;
    material.niveau2 = level.niveau2;
    material.niveau3 = level.niveau3;
    material.localite = localites[(index + 1) % localites.length];
    material.codeLocale = String((index % 18) + 2).padStart(3, "0");
    material.updatedAt = now.toISOString();

    movements.push({
      id: newId("mov"),
      materialId: material.id,
      type,
      movementDate: movementDate.toISOString(),
      fullName: names[index % names.length],
      codeBarre: material.codeBarre,
      codeFamille: material.codeFamille,
      sousFamille: material.sousFamille,
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
  families.forEach((family) => {
    if (!settings.familles.some((item) => item.code === family.code)) {
      settings.familles.push({
        code: family.code,
        name: family.name,
        sousFamilles: [
          { code: family.subCode, name: family.subName, categories: [] },
        ],
      });
    }
  });
  levels.forEach((level) => {
    if (!settings.niveau1.some((item) => (typeof item === "string" ? item : item.code) === level.niveau1)) {
      settings.niveau1.push({ code: level.niveau1, name: level.niveau1Name });
    }
    if (!settings.niveau2.some((item) => item.code === level.niveau2 && item.parent1 === level.niveau1)) {
      settings.niveau2.push({ code: level.niveau2, name: level.niveau2Name, parent1: level.niveau1 });
    }
    if (!settings.niveau3.some((item) => item.code === level.niveau3 && item.parent1 === level.niveau1 && item.parent2 === level.niveau2)) {
      settings.niveau3.push({ code: level.niveau3, name: level.niveau3Name, parent1: level.niveau1, parent2: level.niveau2 });
    }
  });

  return { materials, movements, settings };
}

const data = addSeedData(await readInventory());
await writeInventory(data);
console.log(`Seed termine: ${data.materials.length} materiels, ${data.movements.length} mouvements.`);
