"use server";

import { revalidatePath } from "next/cache";
import { addRangeSchema, adminMaterialSchema, editCodesSchema, MaterialStatus, movementSchema } from "@/lib/inventory";
import { requireRole, requireUser } from "@/lib/auth";
import { runWithFlash } from "@/lib/flash";
import { newId, readInventory, writeInventory } from "@/lib/store";
import { createInventoryBackupSnapshot } from "@/lib/backups";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function refreshInventoryPages() {
  revalidatePath("/", "layout");
}

function cleanSettingValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function addMaterialRangeImpl(formData: FormData) {
  await requireUser();
  const parsed = addRangeSchema.parse(Object.fromEntries(formData.entries()));
  const data = await readInventory();
  const quantity = Math.max(1, parsed.quantite ?? 1);
  const latestCode = data.materials.reduce((max, item) => Math.max(max, item.codeBarre), 122);
  const startCodeBarre = parsed.startCodeBarre ?? latestCode + 1;
  const endCodeBarre = parsed.endCodeBarre ?? startCodeBarre + quantity - 1;
  const codes = Array.from(
    { length: endCodeBarre - startCodeBarre + 1 },
    (_, index) => startCodeBarre + index,
  );
  const existing = data.materials.filter((item) => codes.includes(item.codeBarre));

  if (existing.length > 0) {
    throw new Error(`Codes deja existants: ${existing.map((item) => item.codeBarre).join(", ")}`);
  }

  const now = new Date().toISOString();
  data.materials.push(
    ...codes.map((codeBarre) => ({
      id: newId("mat"),
      codeBarre,
      codeFamille: parsed.codeFamille,
      sousFamille: parsed.sousFamille,
      categorie: parsed.categorie,
      numeroSerie: parsed.numeroSeriePrefix ? `${parsed.numeroSeriePrefix}-${codeBarre}` : undefined,
      designation: parsed.designation,
      marque: parsed.marque,
      model: parsed.model,
      valeurBase: parsed.valeurBase,
      dateEntree: parsed.dateEntree?.toISOString(),
      duree: parsed.duree,
      taux: parsed.taux,
      quantite: 1,
      typeEntree: parsed.typeEntree,
      typeAmortissement: parsed.typeAmortissement,
      niveau1: parsed.niveau1,
      niveau2: parsed.niveau2,
      niveau3: parsed.niveau3,
      localite: parsed.localite,
      codeLocale: parsed.codeLocale,
      accuseReception: parsed.accuseReception,
      marBc: parsed.marBc,
      facNumero: parsed.facNumero,
      origine: parsed.origine,
      status: "STOCK" as MaterialStatus,
      createdAt: now,
      updatedAt: now,
    })),
  );

  await writeInventory(data);
  refreshInventoryPages();
}

async function editMaterialCodesImpl(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = editCodesSchema.parse({
    materialId: formValue(formData, "materialId"),
    codeBarre: formValue(formData, "codeBarre"),
    codeFamille: formValue(formData, "codeFamille"),
    numeroSerie: formValue(formData, "numeroSerie"),
  });
  const data = await readInventory();
  const duplicate = data.materials.find((item) => item.id !== parsed.materialId && item.codeBarre === parsed.codeBarre);
  const duplicateSerie = parsed.numeroSerie
    ? data.materials.find((item) => item.id !== parsed.materialId && item.numeroSerie === parsed.numeroSerie)
    : undefined;

  if (duplicate) {
    throw new Error("Ce code barre existe deja.");
  }

  if (duplicateSerie) {
    throw new Error("Ce numero de serie existe deja.");
  }

  const material = data.materials.find((item) => item.id === parsed.materialId);
  if (!material) {
    throw new Error("Materiel introuvable.");
  }

  material.codeBarre = parsed.codeBarre;
  material.codeFamille = parsed.codeFamille;
  material.numeroSerie = parsed.numeroSerie;
  material.updatedAt = new Date().toISOString();

  await writeInventory(data);
  refreshInventoryPages();
}

async function editMaterialAdminImpl(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = adminMaterialSchema.parse(Object.fromEntries(formData.entries()));
  const data = await readInventory();
  const duplicateCode = data.materials.find((item) => item.id !== parsed.materialId && item.codeBarre === parsed.codeBarre);
  const duplicateSerie = parsed.numeroSerie
    ? data.materials.find((item) => item.id !== parsed.materialId && item.numeroSerie === parsed.numeroSerie)
    : undefined;

  if (duplicateCode) {
    throw new Error("Ce code barre existe deja.");
  }

  if (duplicateSerie) {
    throw new Error("Ce numero de serie existe deja.");
  }

  const material = data.materials.find((item) => item.id === parsed.materialId);
  if (!material) {
    throw new Error("Materiel introuvable.");
  }

  Object.assign(material, {
    codeBarre: parsed.codeBarre,
    codeFamille: parsed.codeFamille,
    sousFamille: parsed.sousFamille,
    categorie: parsed.categorie,
    numeroSerie: parsed.numeroSerie,
    designation: parsed.designation,
    marque: parsed.marque,
    model: parsed.model,
    valeurBase: parsed.valeurBase,
    dateEntree: parsed.dateEntree?.toISOString(),
    duree: parsed.duree,
    taux: parsed.taux,
    typeEntree: parsed.typeEntree,
    typeAmortissement: parsed.typeAmortissement,
    niveau1: parsed.niveau1,
    niveau2: parsed.niveau2,
    niveau3: parsed.niveau3,
    localite: parsed.localite,
    codeLocale: parsed.codeLocale,
    accuseReception: parsed.accuseReception,
    marBc: parsed.marBc,
    facNumero: parsed.facNumero,
    origine: parsed.origine,
    updatedAt: new Date().toISOString(),
  });

  await writeInventory(data);
  refreshInventoryPages();
}

async function deleteMaterialImpl(formData: FormData) {
  await requireRole("ADMIN");
  const materialId = cleanSettingValue(formData.get("materialId"));
  const data = await readInventory();

  if (!data.materials.some((item) => item.id === materialId)) {
    throw new Error("Materiel introuvable.");
  }

  data.materials = data.materials.filter((item) => item.id !== materialId);

  await writeInventory(data);
  refreshInventoryPages();
}

async function createMovementImpl(formData: FormData) {
  await requireUser();
  const parsed = movementSchema.parse({
    type: formValue(formData, "type"),
    materialId: formValue(formData, "materialId"),
    movementDate: formValue(formData, "movementDate"),
    fullName: formValue(formData, "fullName"),
    niveau1: formValue(formData, "niveau1"),
    niveau2: formValue(formData, "niveau2"),
    niveau3: formValue(formData, "niveau3"),
    localite: formValue(formData, "localite"),
    codeLocale: formValue(formData, "codeLocale"),
    decisionNum: formValue(formData, "decisionNum"),
    marcheNum: formValue(formData, "marcheNum"),
    note: formValue(formData, "note"),
  });
  const data = await readInventory();
  const material = data.materials.find((item) => item.id === parsed.materialId);

  if (!material) {
    throw new Error("Materiel introuvable.");
  }

  if (material.status === "DECHARGED") {
    throw new Error("Ce materiel est decharge et ne peut plus etre affecte.");
  }

  if (parsed.type === "DISPATCH" && material.status !== "STOCK") {
    throw new Error("Le dispatch utilise seulement les materiels disponibles en stock.");
  }

  const now = new Date().toISOString();
  const nextStatus: MaterialStatus =
    parsed.type === "DISPATCH" ? "DISPATCHED" : parsed.type === "MUTATION" ? "MUTATED" : "DECHARGED";

  data.movements.push({
    id: newId("mov"),
    materialId: material.id,
    type: parsed.type,
    movementDate: parsed.movementDate.toISOString(),
    fullName: parsed.fullName,
    codeBarre: material.codeBarre,
    codeFamille: material.codeFamille,
    numeroSerie: material.numeroSerie,
    niveau1: parsed.niveau1,
    niveau2: parsed.niveau2,
    niveau3: parsed.niveau3,
    localite: parsed.localite,
    codeLocale: parsed.codeLocale,
    decisionNum: parsed.decisionNum,
    marcheNum: parsed.marcheNum,
    note: parsed.note,
    createdAt: now,
  });

  material.status = nextStatus;
  material.activeFullName = parsed.type === "DECHARGE" ? undefined : parsed.fullName;
  material.activeDecisionNum = parsed.decisionNum;
  material.activeMarcheNum = parsed.marcheNum;
  material.niveau1 = parsed.niveau1 ?? material.niveau1;
  material.niveau2 = parsed.niveau2 ?? material.niveau2;
  material.niveau3 = parsed.niveau3 ?? material.niveau3;
  material.localite = parsed.localite ?? material.localite;
  material.codeLocale = parsed.codeLocale ?? material.codeLocale;
  material.updatedAt = now;

  await writeInventory(data);
  refreshInventoryPages();
}

async function addSettingItemImpl(formData: FormData) {
  await requireRole("ADMIN");
  const kind = cleanSettingValue(formData.get("kind"));
  const value = cleanSettingValue(formData.get("value"));
  const parent = cleanSettingValue(formData.get("parent"));
  const parent1 = cleanSettingValue(formData.get("parent1"));
  const parent2 = cleanSettingValue(formData.get("parent2"));

  if (!value) {
    throw new Error("Valeur obligatoire.");
  }

  const data = await readInventory();

  if (kind === "niveau1") {
    if (!data.settings.niveau1.includes(value)) {
      data.settings.niveau1.push(value);
      data.settings.niveau1.sort((a, b) => a.localeCompare(b));
    }
  } else if (kind === "niveau2") {
    if (!parent1) {
      throw new Error("Choisir Niveau 1.");
    }
    if (!data.settings.niveau1.includes(parent1)) {
      throw new Error("Niveau 1 introuvable.");
    }
    if (!data.settings.niveau2.some((item) => item.name === value && item.parent1 === parent1)) {
      data.settings.niveau2.push({ name: value, parent1 });
      data.settings.niveau2.sort((a, b) => a.parent1.localeCompare(b.parent1) || a.name.localeCompare(b.name));
    }
  } else if (kind === "niveau3") {
    if (!parent1 || !parent2) {
      throw new Error("Choisir Niveau 1 et Niveau 2.");
    }
    if (!data.settings.niveau2.some((item) => item.name === parent2 && item.parent1 === parent1)) {
      throw new Error("Niveau 2 introuvable pour ce Niveau 1.");
    }
    if (!data.settings.niveau3.some((item) => item.name === value && item.parent1 === parent1 && item.parent2 === parent2)) {
      data.settings.niveau3.push({ name: value, parent1, parent2 });
      data.settings.niveau3.sort((a, b) => a.parent1.localeCompare(b.parent1) || a.parent2.localeCompare(b.parent2) || a.name.localeCompare(b.name));
    }
  } else if (kind === "famille") {
    if (!data.settings.familles.some((item) => item.code === value)) {
      data.settings.familles.push({ code: value, sousFamilles: [] });
      data.settings.familles.sort((a, b) => a.code.localeCompare(b.code));
    }
  } else if (kind === "sousFamille") {
    if (!parent) {
      throw new Error("Choisir une categorie.");
    }
    let famille = data.settings.familles.find((item) => item.code === parent);
    if (!famille) {
      famille = { code: parent, sousFamilles: [] };
      data.settings.familles.push(famille);
    }
    if (!famille.sousFamilles.some((item) => item.name === value)) {
      famille.sousFamilles.push({ name: value, categories: [] });
      famille.sousFamilles.sort((a, b) => a.name.localeCompare(b.name));
    }
  } else if (kind === "categorie") {
    if (!parent || !parent2) {
      throw new Error("Choisir une categorie et une sous-categorie.");
    }
    const famille = data.settings.familles.find((item) => item.code === parent);
    const sousFamille = famille?.sousFamilles.find((item) => item.name === parent2);
    if (!sousFamille) {
      throw new Error("Sous-categorie introuvable.");
    }
    if (!sousFamille.categories.includes(value)) {
      sousFamille.categories.push(value);
      sousFamille.categories.sort((a, b) => a.localeCompare(b));
    }
  }

  await writeInventory(data);
  refreshInventoryPages();
}

async function editSettingItemImpl(formData: FormData) {
  await requireRole("ADMIN");
  const kind = cleanSettingValue(formData.get("kind"));
  const previousValue = cleanSettingValue(formData.get("previousValue"));
  const value = cleanSettingValue(formData.get("value"));
  const parent1 = cleanSettingValue(formData.get("parent1"));
  const parent2 = cleanSettingValue(formData.get("parent2"));

  if (!previousValue || !value) {
    throw new Error("Valeur obligatoire.");
  }

  if (previousValue === value) return;

  const data = await readInventory();
  const updatedAt = new Date().toISOString();

  if (kind === "niveau1") {
    const index = data.settings.niveau1.indexOf(previousValue);
    if (index < 0) throw new Error("Niveau 1 introuvable.");
    if (data.settings.niveau1.includes(value)) throw new Error("Ce Niveau 1 existe deja.");

    data.settings.niveau1[index] = value;
    data.settings.niveau2.forEach((item) => {
      if (item.parent1 === previousValue) item.parent1 = value;
    });
    data.settings.niveau3.forEach((item) => {
      if (item.parent1 === previousValue) item.parent1 = value;
    });
    data.materials.forEach((item) => {
      if (item.niveau1 === previousValue) {
        item.niveau1 = value;
        item.updatedAt = updatedAt;
      }
    });
  } else if (kind === "niveau2") {
    const item = data.settings.niveau2.find((entry) => entry.name === previousValue && entry.parent1 === parent1);
    if (!item) throw new Error("Niveau 2 introuvable.");
    if (data.settings.niveau2.some((entry) => entry.name === value && entry.parent1 === parent1)) {
      throw new Error("Ce Niveau 2 existe deja.");
    }

    item.name = value;
    data.settings.niveau3.forEach((entry) => {
      if (entry.parent1 === parent1 && entry.parent2 === previousValue) entry.parent2 = value;
    });
    data.materials.forEach((material) => {
      if (material.niveau1 === parent1 && material.niveau2 === previousValue) {
        material.niveau2 = value;
        material.updatedAt = updatedAt;
      }
    });
  } else if (kind === "niveau3") {
    const item = data.settings.niveau3.find(
      (entry) => entry.name === previousValue && entry.parent1 === parent1 && entry.parent2 === parent2,
    );
    if (!item) throw new Error("Niveau 3 introuvable.");
    if (data.settings.niveau3.some((entry) => entry.name === value && entry.parent1 === parent1 && entry.parent2 === parent2)) {
      throw new Error("Ce Niveau 3 existe deja.");
    }

    item.name = value;
    data.materials.forEach((material) => {
      if (material.niveau1 === parent1 && material.niveau2 === parent2 && material.niveau3 === previousValue) {
        material.niveau3 = value;
        material.updatedAt = updatedAt;
      }
    });
  } else {
    throw new Error("Type de niveau invalide.");
  }

  data.settings.niveau1.sort((a, b) => a.localeCompare(b));
  data.settings.niveau2.sort((a, b) => a.parent1.localeCompare(b.parent1) || a.name.localeCompare(b.name));
  data.settings.niveau3.sort((a, b) => a.parent1.localeCompare(b.parent1) || a.parent2.localeCompare(b.parent2) || a.name.localeCompare(b.name));

  await writeInventory(data);
  refreshInventoryPages();
}

async function deleteSettingItemImpl(formData: FormData) {
  await requireRole("ADMIN");
  const kind = cleanSettingValue(formData.get("kind"));
  const value = cleanSettingValue(formData.get("value"));
  const parent = cleanSettingValue(formData.get("parent"));
  const parent1 = cleanSettingValue(formData.get("parent1"));
  const parent2 = cleanSettingValue(formData.get("parent2"));
  const data = await readInventory();

  if (kind === "niveau1") {
    data.settings.niveau1 = data.settings.niveau1.filter((item) => item !== value);
    data.settings.niveau2 = data.settings.niveau2.filter((item) => item.parent1 !== value);
    data.settings.niveau3 = data.settings.niveau3.filter((item) => item.parent1 !== value);
  } else if (kind === "niveau2") {
    data.settings.niveau2 = data.settings.niveau2.filter((item) => item.name !== value || item.parent1 !== parent1);
    data.settings.niveau3 = data.settings.niveau3.filter((item) => item.parent1 !== parent1 || item.parent2 !== value);
  } else if (kind === "niveau3") {
    data.settings.niveau3 = data.settings.niveau3.filter((item) => item.name !== value || item.parent1 !== parent1 || item.parent2 !== parent2);
  } else if (kind === "famille") {
    data.settings.familles = data.settings.familles.filter((item) => item.code !== value);
  } else if (kind === "sousFamille") {
    const famille = data.settings.familles.find((item) => item.code === parent);
    if (famille) {
      famille.sousFamilles = famille.sousFamilles.filter((item) => item.name !== value);
    }
  } else if (kind === "categorie") {
    const famille = data.settings.familles.find((item) => item.code === parent);
    const sousFamille = famille?.sousFamilles.find((item) => item.name === parent2);
    if (sousFamille) {
      sousFamille.categories = sousFamille.categories.filter((item) => item !== value);
    }
  }

  await writeInventory(data);
  refreshInventoryPages();
}

async function createManualBackupImpl() {
  await requireRole("ADMIN");
  const data = await readInventory();
  await createInventoryBackupSnapshot(data, "manual");
  revalidatePath("/settings");
}

export async function addMaterialRange(formData: FormData) {
  await runWithFlash("Lot ajoute au stock.", () => addMaterialRangeImpl(formData));
}

export async function editMaterialCodes(formData: FormData) {
  await runWithFlash("Codes du materiel modifies.", () => editMaterialCodesImpl(formData));
}

export async function editMaterialAdmin(formData: FormData) {
  await runWithFlash("Materiel modifie.", () => editMaterialAdminImpl(formData));
}

export async function deleteMaterial(formData: FormData) {
  await runWithFlash("Materiel supprime.", () => deleteMaterialImpl(formData));
}

export async function createMovement(formData: FormData) {
  await runWithFlash("Operation enregistree.", () => createMovementImpl(formData));
}

export async function addSettingItem(formData: FormData) {
  await runWithFlash("Parametre ajoute.", () => addSettingItemImpl(formData));
}

export async function editSettingItem(formData: FormData) {
  await runWithFlash("Parametre modifie.", () => editSettingItemImpl(formData));
}

export async function deleteSettingItem(formData: FormData) {
  await runWithFlash("Parametre supprime.", () => deleteSettingItemImpl(formData));
}

export async function createManualBackup() {
  await runWithFlash("Backup JSON cree.", createManualBackupImpl);
}
