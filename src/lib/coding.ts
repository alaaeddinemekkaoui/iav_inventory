import type { InventorySettings, Material } from "@/lib/store";

function padSerial(value: number | string | undefined) {
  const serial = Number(value ?? 0);
  return Number.isFinite(serial) ? String(serial).padStart(6, "0") : String(value ?? "").padStart(6, "0");
}

export function getDirectionLabel(settings: InventorySettings, code?: string) {
  if (!code) return "-";
  const item = settings.niveau1.find((entry) => entry.code === code || entry.name === code);
  return item ? `${item.name} (${item.code})` : code;
}

export function getDepartmentLabel(settings: InventorySettings, code?: string) {
  if (!code) return "-";
  const item = settings.niveau2.find((entry) => entry.code === code || entry.name === code);
  return item ? `${item.name} (${item.code})` : code;
}

export function getServiceLabel(settings: InventorySettings, code?: string) {
  if (!code) return "-";
  const item = settings.niveau3.find((entry) => entry.code === code || entry.name === code);
  return item ? `${item.name} (${item.code})` : code;
}

export function getCategoryLabel(settings: InventorySettings, code?: string) {
  if (!code) return "-";
  const item = settings.familles.find((entry) => entry.code === code || entry.name === code);
  return item ? `${item.name} (${item.code})` : code;
}

export function getSubCategoryLabel(settings: InventorySettings, code?: string) {
  if (!code) return "-";
  const item = settings.familles.flatMap((category) => category.sousFamilles).find((entry) => entry.code === code || entry.name === code);
  return item ? `${item.name} (${item.code})` : code;
}

export function getFullAssetCode(
  material: Pick<Material, "codeBarre" | "codeFamille" | "sousFamille" | "niveau1" | "niveau2" | "niveau3">,
) {
  const hierarchy = [material.niveau1, material.niveau2, material.niveau3].filter(Boolean);
  const classification = [material.codeFamille, material.sousFamille].filter(Boolean);
  return [...hierarchy, ...classification, padSerial(material.codeBarre)].join(" ");
}

export function getNextSerial(materials: Pick<Material, "codeBarre">[], settings: InventorySettings) {
  const fallbackStart = settings.startingSerialNumber ?? 123;
  const maxCode = materials.reduce((max, item) => Math.max(max, item.codeBarre), fallbackStart - 1);
  return Math.max(fallbackStart, maxCode + 1);
}
