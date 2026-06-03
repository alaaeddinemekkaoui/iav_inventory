"use server";

import { clearFlashMessage } from "@/lib/flash";

export async function clearFlashAction() {
  await clearFlashMessage();
}
