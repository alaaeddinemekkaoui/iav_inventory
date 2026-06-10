"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { setupLocalAdminAction } from "@/app/auth-actions";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";

const initialState = {
  message: "",
};

export function LocalSetupForm() {
  const [state, formAction, pending] = useActionState(setupLocalAdminAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 px-6 py-6">
      {state.message ? (
        <p role="alert" aria-live="polite" className="rounded-lg border border-iav-red/25 bg-iav-red-soft px-3 py-2 text-sm text-iav-red">
          {state.message}
        </p>
      ) : null}
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Nom complet</span>
        <input name="fullName" required className={cn(fieldStyles, "h-10")} />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Username admin</span>
        <input name="username" required className={cn(fieldStyles, "h-10")} />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Mot de passe</span>
        <input name="password" type="password" required minLength={8} className={cn(fieldStyles, "h-10")} />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Confirmer le mot de passe</span>
        <input name="confirmPassword" type="password" required minLength={8} className={cn(fieldStyles, "h-10")} />
      </label>
      <button disabled={pending} className={buttonStyles({ className: "w-full" })}>
        <ShieldCheck size={17} />
        {pending ? "Configuration..." : "Creer le Super Admin local"}
      </button>
      <p className="rounded-lg border border-iav-green/25 bg-iav-green-soft px-3 py-2 text-xs leading-5 text-iav-green text-pretty">
        Ce compte est enregistre localement dans le dossier data de cette application. Aucun service externe n est utilise.
      </p>
    </form>
  );
}
