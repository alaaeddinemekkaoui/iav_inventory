import path from "node:path";

export function getDataDir() {
  return process.env.INVENTAIRE_DATA_DIR
    ? path.resolve(process.env.INVENTAIRE_DATA_DIR)
    : path.join(process.cwd(), "data");
}

export function getBackupDir() {
  return path.join(getDataDir(), "backups");
}
