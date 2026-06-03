export function getStringParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export function matchesGlobalSearch(record: object, query: string) {
  if (!query) return true;
  return Object.values(record).some((value) => matchesSearch(value, query));
}

export function createQueryString(values: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return query.toString();
}

export type SortDirection = "asc" | "desc";

export const movementSortKeys = [
  "createdAt",
  "type",
  "movementDate",
  "codeBarre",
  "codeFamille",
  "numeroSerie",
  "fullName",
  "niveau1",
  "niveau2",
  "niveau3",
  "localite",
  "decisionNum",
  "marcheNum",
] as const;

export function getSortDirection(value: string | string[] | undefined, fallback: SortDirection = "asc"): SortDirection {
  const direction = getStringParam(value);
  return direction === "asc" || direction === "desc" ? direction : fallback;
}

export function getSortKey<T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  const key = getStringParam(value) as T;
  return allowed.includes(key) ? key : fallback;
}

export function sortRecords<T extends object>(records: T[], key: keyof T, direction: SortDirection) {
  return [...records].sort((a, b) => {
    const comparison = compareValues(a[key], b[key]);
    return direction === "asc" ? comparison : -comparison;
  });
}

function matchesSearch(value: unknown, query: string) {
  if (typeof value !== "string" && typeof value !== "number") return false;
  return normalizeSearch(String(value)).includes(normalizeSearch(query));
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr");
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""), "fr", { numeric: true, sensitivity: "base" });
}
