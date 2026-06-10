"use client";

import { useRef } from "react";
import { ArrowRightLeft, FileInput, ShieldCheck, X } from "lucide-react";
import type { MovementType } from "@/lib/inventory";
import { buttonStyles, cn, dialogStyles } from "@/lib/ui";

const dialogContent: Record<
  MovementType,
  {
    label: string;
    title: string;
    description: string;
    icon: typeof FileInput;
  }
> = {
  DISPATCH: {
    label: "Nouvelle affectation",
    title: "Nouvelle affectation",
    description: "Selectionne un materiel disponible et renseigne son affectation.",
    icon: FileInput,
  },
  MUTATION: {
    label: "Nouvelle mutation",
    title: "Nouvelle mutation",
    description: "Selectionne un materiel affecte et renseigne sa nouvelle affectation.",
    icon: ArrowRightLeft,
  },
  DECHARGE: {
    label: "Nouvelle reforme",
    title: "Nouvelle reforme",
    description: "Selectionne le materiel a sortir du parc et valide la reforme.",
    icon: ShieldCheck,
  },
};

export function MovementDialog({
  type,
  children,
}: {
  type: MovementType;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const content = dialogContent[type];
  const Icon = content.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles()}
      >
        <Icon size={17} />
        {content.label}
      </button>
      <dialog ref={dialogRef} className={cn(dialogStyles, "w-[min(980px,calc(100vw-32px))]")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">{content.title}</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">{content.description}</p>
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
