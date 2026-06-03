"use client";

import { useId, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { buttonStyles } from "@/lib/ui";

export function ConfirmationDialog({
  title,
  description,
  triggerLabel,
  trigger,
}: {
  title: string;
  description: string;
  triggerLabel: string;
  trigger: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button type="button" aria-label={triggerLabel} title={triggerLabel} onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="fixed inset-0 m-auto w-[min(440px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45"
      >
        <div className="p-5">
          <div className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-700">
            <AlertTriangle size={19} />
          </div>
          <h2 id={titleId} className="mt-4 text-lg font-semibold text-balance">
            {title}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600 text-pretty">
            {description}
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" onClick={() => dialogRef.current?.close()} className={buttonStyles({ variant: "secondary" })}>
            Annuler
          </button>
          <button type="submit" className={buttonStyles({ variant: "danger" })}>
            Supprimer
          </button>
        </div>
      </dialog>
    </>
  );
}
