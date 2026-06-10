import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const mode = process.argv[2] === "start" ? "start" : "dev";
const maxAttempts = 20;

async function loadEnvIfAvailable() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
  ];

  let dotenv;
  try {
    ({ default: dotenv } = await import("dotenv"));
  } catch {
    return;
  }

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file, override: false });
    }
  }
}

function parsePort(value, fallback = 3000) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }

  return parsed;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port);
  });
}

function runNext(port) {
  return new Promise((resolve) => {
    const args = [nextBin, mode, "--port", String(port)];
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
      },
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stderrBuffer = "";

    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderrBuffer += text;
      process.stderr.write(chunk);
    });

    child.on("close", (code) => {
      const portBusy = /EADDRINUSE|address already in use/i.test(stderrBuffer);
      resolve({ code: code ?? 1, portBusy });
    });
  });
}

async function main() {
  await loadEnvIfAvailable();

  const requestedPort = parsePort(process.env.PORT ?? process.env.INVENTAIRE_PORT, 3000);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = requestedPort + attempt;
    const available = await isPortAvailable(port);

    if (!available) {
      if (port >= 65535) {
        break;
      }

      console.warn(`[inventaire] Port ${port} deja utilise. Nouvelle tentative sur ${port + 1}...`);
      continue;
    }

    const { code, portBusy } = await runNext(port);

    if (code === 0) {
      process.exit(0);
      return;
    }

    if (!portBusy) {
      process.exit(code);
      return;
    }

    if (port >= 65535) {
      break;
    }

    console.warn(`[inventaire] Port ${port} deja utilise. Nouvelle tentative sur ${port + 1}...`);
  }

  console.error("[inventaire] Impossible de trouver un port libre pour demarrer Next.js.");
  process.exit(1);
}

main();
