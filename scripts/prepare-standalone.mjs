import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const excludedRuntimeDirs = ["data", "desktop-build", "desktop-portable", "dist-desktop", "backups"];

await mkdir(path.join(standaloneDir, ".next"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  force: true,
  recursive: true,
});
await cp(path.join(root, "public"), path.join(standaloneDir, "public"), {
  force: true,
  recursive: true,
});

await Promise.all(
  excludedRuntimeDirs.map((name) =>
    rm(path.join(standaloneDir, name), {
      force: true,
      recursive: true,
    }),
  ),
);
