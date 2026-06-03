/* eslint-disable @typescript-eslint/no-require-imports */
const { cpSync, existsSync, rmSync } = require("node:fs");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const source = path.join(context.packager.projectDir, ".next", "standalone", "node_modules");
  const target = path.join(context.appOutDir, "resources", "standalone", "node_modules");

  if (!existsSync(source)) {
    throw new Error(`Standalone node_modules not found: ${source}`);
  }

  rmSync(target, { force: true, recursive: true });
  cpSync(source, target, { recursive: true });
};
