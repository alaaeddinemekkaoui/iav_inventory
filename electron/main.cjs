/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, Menu } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const fs = require("node:fs");
const dotenv = require("dotenv");

const DEFAULT_PORT = 38217;
let serverProcess;
let mainWindow;

function appBaseDir() {
  if (app.isPackaged && process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }

  return app.isPackaged ? path.dirname(process.execPath) : app.getAppPath();
}

function standaloneDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(app.getAppPath(), ".next", "standalone");
}

function dataDir() {
  return path.join(appBaseDir(), "data");
}

function iconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico")
    : path.join(app.getAppPath(), "build", "icon.ico");
}

function loadDesktopEnv() {
  const envFiles = [
    path.join(appBaseDir(), ".env"),
    path.join(appBaseDir(), ".env.local"),
    path.join(app.getAppPath(), ".env"),
    path.join(app.getAppPath(), ".env.local"),
  ];

  for (const envFile of [...new Set(envFiles)]) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: false });
    }
  }
}

function parsePort(value) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }

  return parsed;
}

function isPortAvailable(portToTest) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && (error.code === "EADDRINUSE" || error.code === "EACCES")) {
        resolve(false);
        return;
      }

      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(portToTest, "127.0.0.1");
  });
}

async function findAvailablePort(preferredPort, maxAttempts = 50) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = preferredPort + offset;
    if (candidate > 65535) {
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error("Aucun port local disponible n'a ete trouve.");
}

function waitForServer(url, attempts = 80) {
  return new Promise((resolve, reject) => {
    let remaining = attempts;

    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        remaining -= 1;

        if (remaining <= 0) {
          reject(new Error("Le serveur local n'a pas demarre."));
          return;
        }

        setTimeout(check, 250);
      });
    };

    check();
  });
}

function startServer(port) {
  const serverFile = path.join(standaloneDir(), "server.js");
  serverProcess = spawn(process.execPath, [serverFile], {
    cwd: standaloneDir(),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "0.0.0.0",
      INVENTAIRE_DATA_DIR: dataDir(),
      INVENTAIRE_PORT: String(port),
      NODE_ENV: "production",
      PORT: String(port),
    },
    stdio: "ignore",
    windowsHide: true,
  });

  serverProcess.on("exit", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });
}

async function createWindow(port) {
  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    icon: iconPath(),
    show: false,
    title: "Inventaire IAV",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  await mainWindow.loadURL(url);
}

app.whenReady().then(async () => {
  try {
    loadDesktopEnv();
    const requestedPort = parsePort(process.env.INVENTAIRE_PORT) ?? DEFAULT_PORT;
    const selectedPort = await findAvailablePort(requestedPort);

    if (selectedPort !== requestedPort) {
      console.warn(
        `[Inventaire IAV] Le port ${requestedPort} est occupe. Port ${selectedPort} utilise a la place.`,
      );
    }

    Menu.setApplicationMenu(null);
    startServer(selectedPort);
    await createWindow(selectedPort);
  } catch (error) {
    dialog.showErrorBox("Inventaire IAV", error instanceof Error ? error.message : "Erreur de demarrage.");
    app.quit();
  }
});

app.on("before-quit", () => {
  serverProcess?.kill();
});

app.on("window-all-closed", () => {
  app.quit();
});
