import { requireRole } from "@/lib/auth";
import { readInventoryBackupFile } from "@/lib/backups";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  await requireRole("ADMIN");
  const { name } = await params;

  try {
    const body = await readInventoryBackupFile(name);

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch {
    return new Response("Backup introuvable.", { status: 404 });
  }
}
