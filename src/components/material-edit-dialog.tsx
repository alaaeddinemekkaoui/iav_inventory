"use client";

import { useRef } from "react";
import { Pencil, X } from "lucide-react";
import { buttonStyles, cn, dialogStyles } from "@/lib/ui";

export function MaterialEditDialog({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles({ variant: "secondary", size: "sm" })}
      >
        <Pencil size={15} />
        Modifier
      </button>
      <dialog ref={dialogRef} className={cn(dialogStyles, "w-[min(1060px,calc(100vw-32px))]")}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">Mise a jour admin des codes, classification et affectation.</p>
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
