import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole("ADMIN");
  redirect("/inventory?edit=1");
}
