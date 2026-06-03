import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getBackupDir } from "@/lib/paths";
import type { InventoryData } from "@/lib/store";

export type BackupInfo = {
  name: string;
  size: number;
  createdAt: string;
};

const backupNamePattern = /^inventaire-(auto|manual)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/;
const maxAutoBackups = 50;

export async function createInventoryBackupSnapshot(data: InventoryData, mode: "auto" | "manual" = "manual") {
  const backupDir = getBackupDir();
  await mkdir(backupDir, { recursive: true });

  const now = new Date();
  const name = `inventaire-${mode}-${formatBackupTimestamp(now)}.json`;
  const payload = {
    app: "inventaire",
    version: 1,
    mode,
    createdAt: now.toISOString(),
    data,
  };
  const content = `${JSON.stringify(payload, null, 2)}\n`;

  await writeFile(path.join(backupDir, name), content, "utf8");

  if (mode === "auto") {
    await pruneAutoBackups();
  }

  return toBackupInfo(name, Buffer.byteLength(content, "utf8"), now);
}

export async function listInventoryBackups(): Promise<BackupInfo[]> {
  const backupDir = getBackupDir();
  await mkdir(backupDir, { recursive: true });
  const names = await readdir(backupDir);
  const backups = await Promise.all(
    names.filter(isBackupName).map(async (name) => {
      const details = await stat(path.join(backupDir, name));
      return toBackupInfo(name, details.size, details.mtime);
    }),
  );

  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readInventoryBackupFile(name: string) {
  if (!isBackupName(name)) {
    throw new Error("Nom de backup invalide.");
  }

  return readFile(path.join(getBackupDir(), name), "utf8");
}

function isBackupName(name: string) {
  return backupNamePattern.test(name);
}

function formatBackupTimestamp(value: Date) {
  return value.toISOString().replaceAll(":", "-").replace(".", "-");
}

function toBackupInfo(name: string, size: number, date: Date): BackupInfo {
  return {
    name,
    size,
    createdAt: date.toISOString(),
  };
}

async function pruneAutoBackups() {
  const backupDir = getBackupDir();
  const backups = (await listInventoryBackups()).filter((backup) => backup.name.startsWith("inventaire-auto-"));
  const staleBackups = backups.slice(maxAutoBackups);

  await Promise.all(staleBackups.map((backup) => unlink(path.join(backupDir, backup.name)).catch(() => undefined)));
}
