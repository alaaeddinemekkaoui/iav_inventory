"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { buttonStyles, cn, dialogStyles } from "@/lib/ui";

export function SettingsDialog({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles()}
      >
        <Plus size={17} />
        {label}
      </button>
      <dialog ref={dialogRef} className={cn(dialogStyles, "w-[min(980px,calc(100vw-32px))]")}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">Choisis le type a ajouter, remplis les champs, puis valide.</p>
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
        <div className="max-h-[calc(100dvh-146px)] overflow-y-auto bg-[#f8faf8] p-5">{children}</div>
      </dialog>
    </>
  );
}
