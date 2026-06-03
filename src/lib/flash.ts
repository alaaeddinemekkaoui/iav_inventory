import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

export type FlashMessage = {
  id: string;
  type: "success" | "error";
  message: string;
};

const flashCookie = "iav_flash";

export async function setFlashMessage(type: FlashMessage["type"], message: string) {
  const cookieStore = await cookies();
  const flash: FlashMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
  };

  cookieStore.set(flashCookie, encodeURIComponent(JSON.stringify(flash)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  });
}

export async function getFlashMessage(): Promise<FlashMessage | undefined> {
  const value = (await cookies()).get(flashCookie)?.value;
  if (!value) return undefined;

  try {
    return JSON.parse(decodeURIComponent(value)) as FlashMessage;
  } catch {
    return undefined;
  }
}

export async function clearFlashMessage() {
  (await cookies()).delete(flashCookie);
}

export async function runWithFlash(successMessage: string, action: () => Promise<void>) {
  try {
    await action();
    await setFlashMessage("success", successMessage);
  } catch (error) {
    unstable_rethrow(error);
    await setFlashMessage("error", getErrorMessage(error));
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Verifier les informations saisies.";
  }

  return error instanceof Error ? error.message : "Une erreur est survenue.";
}
