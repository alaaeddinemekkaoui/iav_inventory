"use client";

import { Trash2 } from "lucide-react";
import { deleteMaterial } from "@/app/actions";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { buttonStyles } from "@/lib/ui";

export function MaterialDeleteButton({
  materialId,
  codeBarre,
}: {
  materialId: string;
  codeBarre: number;
}) {
  return (
    <form action={deleteMaterial}>
      <input type="hidden" name="materialId" value={materialId} />
      <ConfirmationDialog
        title={`Supprimer le materiel ${codeBarre} ?`}
        description="Cette action retire definitivement le materiel de l'inventaire. Elle ne peut pas etre annulee."
        triggerLabel={`Supprimer le materiel ${codeBarre}`}
        trigger={<span className={buttonStyles({ variant: "danger", size: "icon-sm" })}><Trash2 size={15} /></span>}
      />
    </form>
  );
}
