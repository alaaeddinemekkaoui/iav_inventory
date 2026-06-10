"use server";

import { revalidatePath } from "next/cache";
import { addRangeSchema, adminMaterialSchema, editCodesSchema, materialStatuses, MaterialStatus, MovementType, movementSchema } from "@/lib/inventory";
import { requireRole, requireUser } from "@/lib/auth";
import { runWithFlash } from "@/lib/flash";
import { newId, readInventory, writeInventory } from "@/lib/store";
import { createInventoryBackupSnapshot } from "@/lib/backups";
import { getNextSerial } from "@/lib/coding";

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

function assertNumericCode(value: string, label: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} doit etre numerique.`);
  }
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const defaultTvaRate = 20;

function normalizeRate(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : defaultTvaRate;
}

function getFamilyTvaRate(data: Awaited<ReturnType<typeof readInventory>>, codeFamille?: string) {
  return normalizeRate(data.settings.familles.find((famille) => famille.code === codeFamille)?.tvaRate);
}

function calculatePrices({
  puHt,
  quantity,
  tvaRate,
  puTtc,
  ptHt,
  ptTtc,
}: {
  puHt?: number;
  quantity: number;
  tvaRate: number;
  puTtc?: number;
  ptHt?: number;
  ptTtc?: number;
}) {
  const rate = normalizeRate(tvaRate);
  const taxMultiplier = 1 + rate / 100;
  const nextPuHt = puHt;
  const nextPuTtc = puTtc ?? (nextPuHt !== undefined ? roundMoney(nextPuHt * taxMultiplier) : undefined);
  const nextPtHt = ptHt ?? (nextPuHt !== undefined ? roundMoney(nextPuHt * quantity) : undefined);
  const nextPtTtc = ptTtc ?? (nextPtHt !== undefined ? roundMoney(nextPtHt * taxMultiplier) : undefined);

  return { puHt: nextPuHt, puTtc: nextPuTtc, ptHt: nextPtHt, ptTtc: nextPtTtc, tvaRate: rate };
}

function pickMaterialSnapshot(material: Record<string, unknown>) {
  return {
    codeBarre: material.codeBarre,
    codeFamille: material.codeFamille,
    sousFamille: material.sousFamille,
    categorie: material.categorie,
    designation: material.designation,
    marque: material.marque,
    model: material.model,
    numeroSerie: material.numeroSerie,
    status: material.status,
    activeFullName: material.activeFullName,
    activeDecisionNum: material.activeDecisionNum,
    activeMarcheNum: material.activeMarcheNum,
    niveau1: material.niveau1,
    niveau2: material.niveau2,
    niveau3: material.niveau3,
    localite: material.localite,
    codeLocale: material.codeLocale,
    puHt: material.puHt,
    puTtc: material.puTtc,
    ptHt: material.ptHt,
    ptTtc: material.ptTtc,
    tvaRate: material.tvaRate,
    prixUnitaire: material.prixUnitaire,
    prixHt: material.prixHt,
    prixTtc: material.prixTtc,
    valeurBase: material.valeurBase,
    dateEntree: material.dateEntree,
    duree: material.duree,
    taux: material.taux,
    quantite: material.quantite,
    typeEntree: material.typeEntree,
    typeAmortissement: material.typeAmortissement,
    accuseReception: material.accuseReception,
    marBc: material.marBc,
    facNumero: material.facNumero,
    origine: material.origine,
  };
}

function addHistory(
  data: Awaited<ReturnType<typeof readInventory>>,
  entry: {
    materialId: string;
    type: "CREATE" | "UPDATE" | "STATUS" | "MOVEMENT";
    label: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    createdAt: string;
  },
) {
  data.histories ??= [];
  data.histories.push({
    id: newId("hist"),
    ...entry,
  });
}

async function addMaterialRangeImpl(formData: FormData) {
  await requireUser();
  const parsed = addRangeSchema.parse(Object.fromEntries(formData.entries()));
  const data = await readInventory();
  const quantity = Math.max(1, parsed.quantite ?? 1);
  const tvaRate = parsed.tvaRate ?? getFamilyTvaRate(data, parsed.codeFamille);
  const prices = calculatePrices({
    puHt: parsed.puHt ?? parsed.prixUnitaire,
    puTtc: parsed.puTtc,
    ptHt: parsed.ptHt ?? parsed.prixHt,
    ptTtc: parsed.ptTtc ?? parsed.prixTtc,
    quantity,
    tvaRate,
  });
  const startCodeBarre = parsed.startCodeBarre ?? getNextSerial(data.materials, data.settings);
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
  const newMaterials = codes.map((codeBarre) => ({
      id: newId("mat"),
      codeBarre,
      codeFamille: parsed.codeFamille ?? "",
      sousFamille: parsed.sousFamille,
      categorie: parsed.categorie,
      numeroSerie: parsed.numeroSeriePrefix ? `${parsed.numeroSeriePrefix}-${codeBarre}` : undefined,
      designation: parsed.designation,
      marque: parsed.marque,
      model: parsed.model,
      puHt: prices.puHt,
      puTtc: prices.puTtc,
      ptHt: prices.ptHt,
      ptTtc: prices.ptTtc,
      tvaRate: prices.tvaRate,
      prixUnitaire: prices.puHt,
      prixHt: prices.ptHt,
      prixTtc: prices.ptTtc,
      valeurBase: parsed.valeurBase ?? prices.puHt,
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
      statusChangedAt: now,
      createdAt: now,
      updatedAt: now,
    }));

  data.materials.push(...newMaterials);
  newMaterials.forEach((material) => {
    addHistory(data, {
      materialId: material.id,
      type: "CREATE",
      label: "Creation article",
      after: pickMaterialSnapshot(material),
      createdAt: now,
    });
  });

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

  if (nextStatus === "DISPATCHED" && (!fullName || !codeLocale)) {
    throw new Error("Le statut affecte exige le nom complet du beneficiaire et le code local.");
  }

  if (nextStatus === "MUTATED" && (!localite || !codeLocale)) {
    throw new Error("Le statut mutation exige le local et le code local.");
  }

  const before = pickMaterialSnapshot(material);
  const now = new Date().toISOString();
  material.codeBarre = parsed.codeBarre;
  material.codeFamille = parsed.codeFamille ?? "";
  material.numeroSerie = parsed.numeroSerie;
  material.updatedAt = now;
  addHistory(data, {
    materialId: material.id,
    type: "UPDATE",
    label: "Modification code barre",
    before,
    after: pickMaterialSnapshot(material),
    createdAt: now,
  });

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

  const before = pickMaterialSnapshot(material);
  const nextTvaRate = parsed.tvaRate ?? material.tvaRate ?? getFamilyTvaRate(data, parsed.codeFamille ?? material.codeFamille);
  const nextPrices = calculatePrices({
    puHt: parsed.puHt ?? parsed.prixUnitaire,
    puTtc: parsed.puTtc,
    ptHt: parsed.ptHt ?? parsed.prixHt,
    ptTtc: parsed.ptTtc ?? parsed.prixTtc,
    quantity: material.quantite || 1,
    tvaRate: nextTvaRate,
  });
  const now = new Date().toISOString();

  Object.assign(material, {
    codeBarre: parsed.codeBarre,
    codeFamille: parsed.codeFamille ?? "",
    sousFamille: parsed.sousFamille,
    categorie: parsed.categorie,
    numeroSerie: parsed.numeroSerie,
    designation: parsed.designation,
    marque: parsed.marque,
    model: parsed.model,
    puHt: nextPrices.puHt,
    puTtc: nextPrices.puTtc,
    ptHt: nextPrices.ptHt,
    ptTtc: nextPrices.ptTtc,
    tvaRate: nextPrices.tvaRate,
    prixUnitaire: nextPrices.puHt,
    prixHt: nextPrices.ptHt,
    prixTtc: nextPrices.ptTtc,
    valeurBase: parsed.valeurBase ?? nextPrices.puHt,
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
    updatedAt: now,
  });
  addHistory(data, {
    materialId: material.id,
    type: "UPDATE",
    label: "Modification article",
    before,
    after: pickMaterialSnapshot(material),
    createdAt: now,
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

  if (material.status === "DECHARGED" || material.status === "REFORMED") {
    throw new Error("Ce materiel est reforme et ne peut plus etre affecte.");
  }

  if (parsed.type === "DISPATCH" && material.status !== "STOCK") {
    throw new Error("Le dispatch utilise seulement les materiels disponibles en stock.");
  }

  if (parsed.type === "MUTATION" && material.status === "STOCK") {
    throw new Error("La mutation utilise seulement les materiels deja affectes.");
  }

  if (parsed.type === "DECHARGE" && material.status === "STOCK") {
    throw new Error("La reforme utilise seulement les materiels deja affectes.");
  }

  if (parsed.type === "DISPATCH" && (!parsed.fullName || !parsed.codeLocale)) {
    throw new Error("Le dispatch exige le nom complet du beneficiaire et le code local.");
  }

  if (parsed.type === "MUTATION" && (!parsed.localite || !parsed.codeLocale)) {
    throw new Error("La mutation exige le local et le code local.");
  }

  const now = new Date().toISOString();
  const nextStatus: MaterialStatus =
    parsed.type === "DISPATCH" ? "DISPATCHED" : parsed.type === "MUTATION" ? "MUTATED" : "REFORMED";
  const nextFullName = parsed.type === "DECHARGE" ? undefined : parsed.fullName ?? material.activeFullName;
  const nextDecisionNum = parsed.type === "DECHARGE" ? undefined : parsed.decisionNum ?? material.activeDecisionNum;
  const nextMarcheNum = parsed.type === "DECHARGE" ? undefined : parsed.marcheNum ?? material.activeMarcheNum;
  const nextNiveau1 = parsed.niveau1 ?? material.niveau1;
  const nextNiveau2 = parsed.niveau2 ?? material.niveau2;
  const nextNiveau3 = parsed.niveau3 ?? material.niveau3;
  const nextLocalite = parsed.localite ?? material.localite;
  const nextCodeLocale = parsed.codeLocale ?? material.codeLocale;
  const beforeMovement = {
    status: material.status,
    fullName: material.activeFullName,
    decisionNum: material.activeDecisionNum,
    marcheNum: material.activeMarcheNum,
    niveau1: material.niveau1,
    niveau2: material.niveau2,
    niveau3: material.niveau3,
    localite: material.localite,
    codeLocale: material.codeLocale,
  };

  data.movements.push({
    id: newId("mov"),
    materialId: material.id,
    type: parsed.type,
    movementDate: parsed.movementDate.toISOString(),
    fullName: nextFullName,
    codeBarre: material.codeBarre,
    codeFamille: material.codeFamille,
    sousFamille: material.sousFamille,
    numeroSerie: material.numeroSerie,
    niveau1: nextNiveau1,
    niveau2: nextNiveau2,
    niveau3: nextNiveau3,
    localite: nextLocalite,
    codeLocale: nextCodeLocale,
    decisionNum: nextDecisionNum,
    marcheNum: nextMarcheNum,
    note: parsed.note,
    createdAt: now,
  });

  material.status = nextStatus;
  material.activeFullName = nextFullName;
  material.activeDecisionNum = nextDecisionNum;
  material.activeMarcheNum = nextMarcheNum;
  material.niveau1 = nextNiveau1;
  material.niveau2 = nextNiveau2;
  material.niveau3 = nextNiveau3;
  material.localite = nextLocalite;
  material.codeLocale = nextCodeLocale;
  material.statusChangedAt = now;
  if (nextStatus === "REFORMED") material.reformedAt = now;
  material.updatedAt = now;
  addHistory(data, {
    materialId: material.id,
    type: "STATUS",
    label: `Statut: ${nextStatus}`,
    before: beforeMovement,
    after: {
      status: nextStatus,
      fullName: nextFullName,
      decisionNum: nextDecisionNum,
      marcheNum: nextMarcheNum,
      niveau1: nextNiveau1,
      niveau2: nextNiveau2,
      niveau3: nextNiveau3,
      localite: nextLocalite,
      codeLocale: nextCodeLocale,
    },
    createdAt: now,
  });

  await writeInventory(data);
  refreshInventoryPages();
}

async function changeMaterialStatusImpl(formData: FormData) {
  await requireUser();
  const materialId = cleanSettingValue(formData.get("materialId"));
  const statusValue = cleanSettingValue(formData.get("status"));
  const nextStatus = materialStatuses.includes(statusValue as MaterialStatus) ? statusValue as MaterialStatus : undefined;
  const movementDateValue = cleanSettingValue(formData.get("movementDate"));
  const movementDate = movementDateValue ? new Date(`${movementDateValue}T00:00:00`) : new Date();
  const fullName = formValue(formData, "fullName");
  const niveau1 = formValue(formData, "niveau1");
  const niveau2 = formValue(formData, "niveau2");
  const niveau3 = formValue(formData, "niveau3");
  const localite = formValue(formData, "localite");
  const codeLocale = formValue(formData, "codeLocale");
  const decisionNum = formValue(formData, "decisionNum");
  const marcheNum = formValue(formData, "marcheNum");
  const note = formValue(formData, "note");

  if (!materialId || !nextStatus) {
    throw new Error("Statut invalide.");
  }

  const data = await readInventory();
  const material = data.materials.find((item) => item.id === materialId);

  if (!material) {
    throw new Error("Materiel introuvable.");
  }

  const now = new Date().toISOString();
  const before = {
    status: material.status,
    fullName: material.activeFullName,
    decisionNum: material.activeDecisionNum,
    marcheNum: material.activeMarcheNum,
    niveau1: material.niveau1,
    niveau2: material.niveau2,
    niveau3: material.niveau3,
    localite: material.localite,
    codeLocale: material.codeLocale,
  };
  const clearsAssignment = nextStatus === "STOCK" || nextStatus === "DECHARGED" || nextStatus === "REFORMED";
  const nextFullName = clearsAssignment ? undefined : fullName ?? material.activeFullName;
  const nextDecisionNum = clearsAssignment ? undefined : decisionNum ?? material.activeDecisionNum;
  const nextMarcheNum = clearsAssignment ? undefined : marcheNum ?? material.activeMarcheNum;
  const nextNiveau1 = niveau1 ?? material.niveau1;
  const nextNiveau2 = niveau2 ?? material.niveau2;
  const nextNiveau3 = niveau3 ?? material.niveau3;
  const nextLocalite = localite ?? material.localite;
  const nextCodeLocale = codeLocale ?? material.codeLocale;
  const movementType = statusMovementType(nextStatus);

  if (movementType) {
    data.movements.push({
      id: newId("mov"),
      materialId: material.id,
      type: movementType,
      movementDate: movementDate.toISOString(),
      fullName: nextFullName,
      codeBarre: material.codeBarre,
      codeFamille: material.codeFamille,
      sousFamille: material.sousFamille,
      numeroSerie: material.numeroSerie,
      niveau1: nextNiveau1,
      niveau2: nextNiveau2,
      niveau3: nextNiveau3,
      localite: nextLocalite,
      codeLocale: nextCodeLocale,
      decisionNum: nextDecisionNum,
      marcheNum: nextMarcheNum,
      note,
      createdAt: now,
    });
  }

  material.status = nextStatus;
  material.activeFullName = nextFullName;
  material.activeDecisionNum = nextDecisionNum;
  material.activeMarcheNum = nextMarcheNum;
  material.niveau1 = nextNiveau1;
  material.niveau2 = nextNiveau2;
  material.niveau3 = nextNiveau3;
  material.localite = nextLocalite;
  material.codeLocale = nextCodeLocale;
  material.statusChangedAt = now;
  material.reformedAt = nextStatus === "REFORMED" ? now : undefined;
  material.updatedAt = now;
  addHistory(data, {
    materialId: material.id,
    type: "STATUS",
    label: `Statut: ${nextStatus}`,
    before,
    after: {
      status: nextStatus,
      fullName: nextFullName,
      decisionNum: nextDecisionNum,
      marcheNum: nextMarcheNum,
      niveau1: nextNiveau1,
      niveau2: nextNiveau2,
      niveau3: nextNiveau3,
      localite: nextLocalite,
      codeLocale: nextCodeLocale,
    },
    createdAt: now,
  });

  await writeInventory(data);
  refreshInventoryPages();
}

function statusMovementType(status: MaterialStatus): MovementType | undefined {
  if (status === "DISPATCHED") return "DISPATCH";
  if (status === "MUTATED") return "MUTATION";
  if (status === "DECHARGED" || status === "REFORMED") return "DECHARGE";
  return undefined;
}

async function addSettingItemImpl(formData: FormData) {
  await requireRole("ADMIN");
  const kind = cleanSettingValue(formData.get("kind"));
  const value = cleanSettingValue(formData.get("value"));
  const parent = cleanSettingValue(formData.get("parent"));
  const parent1 = cleanSettingValue(formData.get("parent1"));
  const parent2 = cleanSettingValue(formData.get("parent2"));
  const name = cleanSettingValue(formData.get("name")) || value;
  const tvaRateValue = Number(cleanSettingValue(formData.get("tvaRate")));
  const tvaRate = Number.isFinite(tvaRateValue) && tvaRateValue >= 0 ? tvaRateValue : defaultTvaRate;

  if (!value) {
    throw new Error("Valeur obligatoire.");
  }

  const data = await readInventory();

  if (kind === "serialStart") {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 1) throw new Error("Numero de depart invalide.");
    data.settings.startingSerialNumber = Math.floor(serial);
  } else if (kind === "niveau1") {
    assertNumericCode(value, "Le code Direction / Filiere");
    if (!data.settings.niveau1.some((item) => item.code === value)) {
      data.settings.niveau1.push({ code: value, name });
      data.settings.niveau1.sort((a, b) => a.code.localeCompare(b.code));
    }
  } else if (kind === "niveau2") {
    assertNumericCode(value, "Le code Division / Departement");
    if (!parent1) {
      throw new Error("Choisir une Direction / Filiere.");
    }
    if (!data.settings.niveau1.some((item) => item.code === parent1)) {
      throw new Error("Direction / Filiere introuvable.");
    }
    if (!data.settings.niveau2.some((item) => item.code === value)) {
      data.settings.niveau2.push({ code: value, name, parent1 });
      data.settings.niveau2.sort((a, b) => a.parent1.localeCompare(b.parent1) || a.code.localeCompare(b.code));
    }
  } else if (kind === "niveau3") {
    assertNumericCode(value, "Le code Service");
    if (!parent1) {
      throw new Error("Choisir une Direction / Filiere.");
    }
    if (parent2 && !data.settings.niveau2.some((item) => item.code === parent2 && item.parent1 === parent1)) {
      throw new Error("Division / Departement introuvable pour cette Direction / Filiere.");
    }
    if (!data.settings.niveau3.some((item) => item.code === value)) {
      data.settings.niveau3.push({ code: value, name, parent1, parent2: parent2 || undefined });
      data.settings.niveau3.sort((a, b) => a.parent1.localeCompare(b.parent1) || (a.parent2 ?? "").localeCompare(b.parent2 ?? "") || a.code.localeCompare(b.code));
    }
  } else if (kind === "famille") {
    if (!data.settings.familles.some((item) => item.code === value)) {
      data.settings.familles.push({ code: value, name, tvaRate, sousFamilles: [] });
      data.settings.familles.sort((a, b) => a.code.localeCompare(b.code));
    }
  } else if (kind === "sousFamille") {
    if (!parent) {
      throw new Error("Choisir une famille.");
    }
    let famille = data.settings.familles.find((item) => item.code === parent);
    if (!famille) {
      famille = { code: parent, name: parent, tvaRate: defaultTvaRate, sousFamilles: [] };
      data.settings.familles.push(famille);
    }
    if (!famille.sousFamilles.some((item) => item.code === value)) {
      famille.sousFamilles.push({ code: value, name, categories: [] });
      famille.sousFamilles.sort((a, b) => a.code.localeCompare(b.code));
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
  const name = cleanSettingValue(formData.get("name")) || value;
  const parent1 = cleanSettingValue(formData.get("parent1"));
  const parent2 = cleanSettingValue(formData.get("parent2"));
  const tvaRateValue = Number(cleanSettingValue(formData.get("tvaRate")));
  const tvaRate = Number.isFinite(tvaRateValue) && tvaRateValue >= 0 ? tvaRateValue : undefined;

  if (!previousValue || !value) {
    throw new Error("Valeur obligatoire.");
  }

  const data = await readInventory();
  const updatedAt = new Date().toISOString();

  if (kind === "niveau1") {
    assertNumericCode(value, "Le code Direction / Filiere");
    const item = data.settings.niveau1.find((entry) => entry.code === previousValue);
    if (!item) throw new Error("Direction / Filiere introuvable.");
    if (data.settings.niveau1.some((entry) => entry.code === value && entry.code !== previousValue)) throw new Error("Cette Direction / Filiere existe deja.");

    item.code = value;
    item.name = name;
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
    assertNumericCode(value, "Le code Division / Departement");
    const item = data.settings.niveau2.find((entry) => entry.code === previousValue && entry.parent1 === parent1);
    if (!item) throw new Error("Division / Departement introuvable.");
    if (data.settings.niveau2.some((entry) => entry.code === value && entry.code !== previousValue)) {
      throw new Error("Cette Division / Departement existe deja.");
    }

    item.code = value;
    item.name = name;
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
    assertNumericCode(value, "Le code Service");
    const item = data.settings.niveau3.find(
      (entry) => entry.code === previousValue && entry.parent1 === parent1 && (entry.parent2 ?? "") === parent2,
    );
    if (!item) throw new Error("Service introuvable.");
    if (data.settings.niveau3.some((entry) => entry.code === value && entry.code !== previousValue)) {
      throw new Error("Ce Service existe deja.");
    }

    item.code = value;
    item.name = name;
    data.materials.forEach((material) => {
      if (material.niveau1 === parent1 && material.niveau2 === parent2 && material.niveau3 === previousValue) {
        material.niveau3 = value;
        material.updatedAt = updatedAt;
      }
    });
  } else if (kind === "famille") {
    const item = data.settings.familles.find((entry) => entry.code === previousValue);
    if (!item) throw new Error("Famille introuvable.");
    if (data.settings.familles.some((entry) => entry.code === value && entry.code !== previousValue)) {
      throw new Error("Cette famille existe deja.");
    }

    item.code = value;
    item.name = name;
    if (tvaRate !== undefined) item.tvaRate = tvaRate;
    data.materials.forEach((material) => {
      if (material.codeFamille === previousValue) {
        material.codeFamille = value;
        material.updatedAt = updatedAt;
      }
    });
    data.movements.forEach((movement) => {
      if (movement.codeFamille === previousValue) movement.codeFamille = value;
    });
  } else if (kind === "sousFamille") {
    const famille = data.settings.familles.find((entry) => entry.code === parent1);
    const item = famille?.sousFamilles.find((entry) => entry.code === previousValue);
    if (!famille || !item) throw new Error("Sous-famille introuvable.");
    if (famille.sousFamilles.some((entry) => entry.code === value && entry.code !== previousValue)) {
      throw new Error("Cette sous-famille existe deja.");
    }

    item.code = value;
    item.name = name;
    data.materials.forEach((material) => {
      if (material.codeFamille === parent1 && material.sousFamille === previousValue) {
        material.sousFamille = value;
        material.updatedAt = updatedAt;
      }
    });
    data.movements.forEach((movement) => {
      if (movement.codeFamille === parent1 && movement.sousFamille === previousValue) movement.sousFamille = value;
    });
  } else {
    throw new Error("Type de parametre invalide.");
  }

  data.settings.niveau1.sort((a, b) => a.code.localeCompare(b.code));
  data.settings.niveau2.sort((a, b) => a.parent1.localeCompare(b.parent1) || a.code.localeCompare(b.code));
  data.settings.niveau3.sort((a, b) => a.parent1.localeCompare(b.parent1) || (a.parent2 ?? "").localeCompare(b.parent2 ?? "") || a.code.localeCompare(b.code));
  data.settings.familles.sort((a, b) => a.code.localeCompare(b.code));
  data.settings.familles.forEach((famille) => {
    famille.sousFamilles.sort((a, b) => a.code.localeCompare(b.code));
  });

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
    data.settings.niveau1 = data.settings.niveau1.filter((item) => item.code !== value);
    data.settings.niveau2 = data.settings.niveau2.filter((item) => item.parent1 !== value);
    data.settings.niveau3 = data.settings.niveau3.filter((item) => item.parent1 !== value);
  } else if (kind === "niveau2") {
    data.settings.niveau2 = data.settings.niveau2.filter((item) => item.code !== value || item.parent1 !== parent1);
    data.settings.niveau3 = data.settings.niveau3.filter((item) => item.parent1 !== parent1 || item.parent2 !== value);
  } else if (kind === "niveau3") {
    data.settings.niveau3 = data.settings.niveau3.filter((item) => item.code !== value || item.parent1 !== parent1 || (item.parent2 ?? "") !== parent2);
  } else if (kind === "famille") {
    data.settings.familles = data.settings.familles.filter((item) => item.code !== value);
  } else if (kind === "sousFamille") {
    const famille = data.settings.familles.find((item) => item.code === parent);
    if (famille) {
      famille.sousFamilles = famille.sousFamilles.filter((item) => item.code !== value);
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

export async function changeMaterialStatus(formData: FormData) {
  await runWithFlash("Statut modifie.", () => changeMaterialStatusImpl(formData));
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
