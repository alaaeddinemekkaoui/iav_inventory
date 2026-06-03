import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDataDir } from "@/lib/paths";

type StoreName = "auth" | "inventory";

function storeFile(name: StoreName) {
  return path.join(getDataDir(), `${name}.json`);
}

async function readJsonFile<T>(name: StoreName, fallback: T): Promise<T> {
  try {
    const raw = await readFile(storeFile(name), "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code !== "ENOENT") {
      throw new Error(`Impossible de lire data/${name}.json.`);
    }

    await writeStore(name, fallback);
    return fallback;
  }
}

async function writeJsonFile<T>(name: StoreName, data: T) {
  await mkdir(getDataDir(), { recursive: true });
  const target = storeFile(name);
  const temp = `${target}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temp, target);
}

export async function readStore<T>(name: StoreName, fallback: T): Promise<T> {
  return readJsonFile(name, fallback);
}

export async function writeStore<T>(name: StoreName, data: T) {
  await writeJsonFile(name, data);
}
