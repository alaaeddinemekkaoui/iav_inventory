import { z } from "zod";

export const materialStatuses = ["STOCK", "DISPATCHED", "MUTATED", "DECHARGED", "REFORMED"] as const;
export type MaterialStatus = (typeof materialStatuses)[number];

export const movementTypes = ["DISPATCH", "MUTATION", "DECHARGE"] as const;
export type MovementType = (typeof movementTypes)[number];

export const materialFields = [
  "codeBarre",
  "codeFamille",
  "sousFamille",
  "categorie",
  "numeroSerie",
  "designation",
  "marque",
  "model",
  "puHt",
  "puTtc",
  "ptHt",
  "ptTtc",
  "tvaRate",
  "prixUnitaire",
  "prixHt",
  "prixTtc",
  "valeurBase",
  "dateEntree",
  "duree",
  "taux",
  "quantite",
  "typeEntree",
  "typeAmortissement",
  "niveau1",
  "niveau2",
  "niveau3",
  "localite",
  "codeLocale",
  "accuseReception",
  "marBc",
  "facNumero",
  "origine",
] as const;

const text = z.string().trim().optional().transform((value) => value || undefined);
const intText = z.coerce.number().int();
const optionalInt = z
  .union([z.literal(""), z.coerce.number().int()])
  .optional()
  .transform((value) => (value === "" ? undefined : value));
const optionalDecimal = z
  .union([z.literal(""), z.coerce.number()])
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value));
const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? new Date(`${value}T00:00:00`) : undefined));

export const addRangeSchema = z
  .object({
    startCodeBarre: optionalInt,
    endCodeBarre: optionalInt,
    codeFamille: text,
    sousFamille: text,
    categorie: text,
    numeroSeriePrefix: text,
    designation: text,
    marque: text,
    model: text,
    puHt: optionalDecimal,
    puTtc: optionalDecimal,
    ptHt: optionalDecimal,
    ptTtc: optionalDecimal,
    tvaRate: optionalDecimal,
    prixUnitaire: optionalDecimal,
    prixHt: optionalDecimal,
    prixTtc: optionalDecimal,
    valeurBase: optionalDecimal,
    dateEntree: optionalDate,
    duree: optionalInt,
    taux: optionalDecimal,
    quantite: optionalInt.default(1),
    typeEntree: text,
    typeAmortissement: text,
    niveau1: text,
    niveau2: text,
    niveau3: text,
    localite: text,
    codeLocale: text,
    accuseReception: text,
    marBc: text,
    facNumero: text,
    origine: text,
  })
  .refine((data) => !data.startCodeBarre || !data.endCodeBarre || data.endCodeBarre >= data.startCodeBarre, {
    message: "Le code fin doit etre superieur ou egal au code debut.",
    path: ["endCodeBarre"],
  });

export const movementSchema = z.object({
  type: z.enum(movementTypes),
  materialId: z.string().min(1),
  movementDate: z.string().min(1).transform((value) => new Date(`${value}T00:00:00`)),
  fullName: text,
  niveau1: text,
  niveau2: text,
  niveau3: text,
  localite: text,
  codeLocale: text,
  decisionNum: text,
  marcheNum: text,
  note: text,
});

export const editCodesSchema = z.object({
  materialId: z.string().min(1),
  codeBarre: intText.min(1),
  codeFamille: text,
  numeroSerie: text,
});

export const adminMaterialSchema = z.object({
  materialId: z.string().min(1),
  codeBarre: intText.min(1),
  codeFamille: text,
  sousFamille: text,
  categorie: text,
  numeroSerie: text,
  designation: text,
  marque: text,
  model: text,
  puHt: optionalDecimal,
  puTtc: optionalDecimal,
  ptHt: optionalDecimal,
  ptTtc: optionalDecimal,
  tvaRate: optionalDecimal,
  prixUnitaire: optionalDecimal,
  prixHt: optionalDecimal,
  prixTtc: optionalDecimal,
  valeurBase: optionalDecimal,
  dateEntree: optionalDate,
  duree: optionalInt,
  taux: optionalDecimal,
  typeEntree: text,
  typeAmortissement: text,
  niveau1: text,
  niveau2: text,
  niveau3: text,
  localite: text,
  codeLocale: text,
  accuseReception: text,
  marBc: text,
  facNumero: text,
  origine: text,
});

export function statusLabel(status: MaterialStatus) {
  const labels: Record<MaterialStatus, string> = {
    STOCK: "En Inventaire",
    DISPATCHED: "Affecte / Dispatche",
    MUTATED: "Mutation",
    DECHARGED: "Decharge",
    REFORMED: "Reforme",
  };

  return labels[status];
}

export function movementLabel(type: MovementType) {
  const labels: Record<MovementType, string> = {
    DISPATCH: "Dispatch",
    MUTATION: "Mutation",
    DECHARGE: "Reforme",
  };

  return labels[type];
}
