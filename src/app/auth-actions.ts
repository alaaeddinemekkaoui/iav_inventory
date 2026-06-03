"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createInitialSuperAdmin, createUserAccount, login, logout, roles } from "@/lib/auth";
import { runWithFlash, setFlashMessage } from "@/lib/flash";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const userSchema = z.object({
  fullName: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z.string().min(6),
  role: z.enum(roles),
});

const setupSchema = z.object({
  fullName: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
  confirmPassword: z.string().min(1),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

export async function loginAction(_previousState: { message: string }, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { message: "Renseignez votre username et votre mot de passe." };
  }

  const authenticated = await login(parsed.data.username, parsed.data.password);
  if (!authenticated) {
    return { message: "Identifiants invalides." };
  }

  await setFlashMessage("success", "Connexion reussie.");
  redirect("/");
}

export async function setupLocalAdminAction(_previousState: { message: string }, formData: FormData) {
  const parsed = setupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Verifiez les informations du compte." };
  }

  try {
    await createInitialSuperAdmin(parsed.data);
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Impossible de configurer le compte local." };
  }

  await setFlashMessage("success", "Compte Super Admin local cree.");
  redirect("/");
}

export async function logoutAction() {
  await logout();
  await setFlashMessage("success", "Deconnexion reussie.");
  redirect("/login");
}

export async function createUserAction(formData: FormData) {
  await runWithFlash("Utilisateur cree.", async () => {
    const parsed = userSchema.parse(Object.fromEntries(formData.entries()));
    await createUserAccount(parsed);
    revalidatePath("/users");
  });
}
