/* eslint-disable @typescript-eslint/no-require-imports */
const { cpSync, existsSync, rmSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const source = path.join(context.packager.projectDir, ".next", "standalone", "node_modules");
  const target = path.join(context.appOutDir, "resources", "standalone", "node_modules");
  const icon = path.join(context.packager.projectDir, "build", "icon.ico");
  const appExe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const rcedit = path.join(context.packager.projectDir, "node_modules", "electron-winstaller", "vendor", "rcedit.exe");

  if (!existsSync(source)) {
    throw new Error(`Standalone node_modules not found: ${source}`);
  }

  rmSync(target, { force: true, recursive: true });
  cpSync(source, target, { recursive: true });

  if (process.platform === "win32" && existsSync(appExe) && existsSync(icon) && existsSync(rcedit)) {
    execFileSync(rcedit, [
      appExe,
      "--set-icon",
      icon,
      "--set-version-string",
      "FileDescription",
      "Inventaire IAV",
      "--set-version-string",
      "ProductName",
      "Inventaire IAV",
    ]);
  }
};
