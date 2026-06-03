"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/auth-actions";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";

const initialState = {
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 px-6 py-6">
      {state.message && (
        <p role="alert" aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      )}
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Username</span>
        <input name="username" required className={cn(fieldStyles, "h-10")} />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Mot de passe</span>
        <input name="password" type="password" required className={cn(fieldStyles, "h-10")} />
      </label>
      <button disabled={pending} className={buttonStyles({ className: "w-full" })}>
        <LogIn size={17} />
        {pending ? "Connexion..." : "Se connecter"}
      </button>
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 text-pretty">
        Authentification locale: les comptes et sessions sont conserves dans le dossier data de cette application.
      </p>
    </form>
  );
}
