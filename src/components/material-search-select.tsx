"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Material } from "@/lib/store";
import { getFullAssetCode } from "@/lib/coding";
import { cn, fieldStyles } from "@/lib/ui";

type MaterialOption = Pick<
  Material,
  | "id"
  | "codeBarre"
  | "codeFamille"
  | "sousFamille"
  | "numeroSerie"
  | "designation"
  | "niveau1"
  | "niveau2"
  | "niveau3"
  | "codeLocale"
  | "localite"
  | "activeFullName"
  | "activeDecisionNum"
  | "activeMarcheNum"
>;

function materialLabel(item: MaterialOption, includeBeneficiary: boolean) {
  return [
    `Code barre ${getFullAssetCode(item)}`,
    `N serie ${item.numeroSerie ?? "sans serie"}`,
    item.designation ?? "materiel",
    item.codeLocale ? `Code local ${item.codeLocale}` : undefined,
    includeBeneficiary ? item.activeFullName : undefined,
    item.localite,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function MaterialSearchSelect({
  materials,
  includeBeneficiary = true,
  onSelect,
}: {
  materials: MaterialOption[];
  includeBeneficiary?: boolean;
  onSelect?: (material: MaterialOption) => void;
}) {
  const [selectedId, setSelectedId] = useState(materials[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = materials.find((item) => item.id === selectedId);

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return materials.slice(0, 30);

    return materials
      .filter((item) => materialLabel(item, includeBeneficiary).toLocaleLowerCase("fr").includes(query))
      .slice(0, 30);
  }, [includeBeneficiary, materials, search]);

  if (materials.length === 0) {
    return (
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Materiel</span>
        <input className={cn(fieldStyles, "h-12 text-base")} value="Aucun materiel disponible" disabled readOnly />
      </label>
    );
  }

  return (
    <div className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">Materiel</span>
      <input type="hidden" name="materialId" value={selectedId} />
      <div className="relative">
        <Search size={20} className="pointer-events-none absolute left-4 top-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={includeBeneficiary ? "Rechercher par code, serie, designation, beneficiaire..." : "Rechercher par code, serie, designation..."}
          className={cn(fieldStyles, "h-14 rounded-xl pl-12 text-base shadow-sm")}
        />
        {open ? (
          <div className="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {filteredMaterials.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">Aucun materiel trouve.</p>
            ) : (
              filteredMaterials.map((item) => {
                const isSelected = item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      onSelect?.(item);
                      setSearch("");
                      setOpen(false);
                    }}
                    className={cn(
                      "grid w-full gap-1 rounded-lg border px-4 py-3 text-left transition hover:border-iav-green/40 hover:bg-iav-green-soft",
                      isSelected ? "border-iav-green bg-iav-green-soft text-iav-green" : "border-slate-100 text-slate-700",
                    )}
                  >
                    <span className="text-base font-semibold text-slate-950">{getFullAssetCode(item)}</span>
                    <span className="text-sm text-slate-600">{item.designation ?? "Materiel"} / N serie {item.numeroSerie ?? "sans serie"}</span>
                    <span className="text-xs text-slate-500">
                      Code local {item.codeLocale ?? "-"} / Local {item.localite ?? "-"}
                      {includeBeneficiary && item.activeFullName ? ` / ${item.activeFullName}` : ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
      {selected ? (
        <div className="rounded-xl border border-iav-green/20 bg-iav-green-soft px-4 py-3">
          <p className="text-sm font-semibold text-slate-950">{getFullAssetCode(selected)}</p>
          <p className="mt-1 text-xs text-slate-600">
            {selected.designation ?? "Materiel"} / N serie {selected.numeroSerie ?? "sans serie"} / Code local {selected.codeLocale ?? "-"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
