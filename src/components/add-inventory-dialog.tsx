"use client";

import { useEffect, useRef } from "react";
import { PackagePlus, X } from "lucide-react";
import { buttonStyles, cn, dialogStyles } from "@/lib/ui";

export function AddInventoryDialog({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (defaultOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [defaultOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles()}
      >
        <PackagePlus size={17} />
        Nouveau lot
      </button>
      <dialog ref={dialogRef} className={cn(dialogStyles, "w-[min(1100px,calc(100vw-32px))]")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">Ajouter un lot</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">La quantite calcule automatiquement le debut et la fin des codes barre.</p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={buttonStyles({ variant: "secondary", size: "icon-sm" })}
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[calc(100dvh-146px)] overflow-y-auto p-5">{children}</div>
      </dialog>
    </>
  );
}
