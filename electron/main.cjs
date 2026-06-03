/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, Menu } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const port = process.env.INVENTAIRE_PORT || "38217";
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

function startServer() {
  const serverFile = path.join(standaloneDir(), "server.js");
  serverProcess = spawn(process.execPath, [serverFile], {
    cwd: standaloneDir(),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "127.0.0.1",
      INVENTAIRE_DATA_DIR: dataDir(),
      NODE_ENV: "production",
      PORT: port,
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

async function createWindow() {
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
    Menu.setApplicationMenu(null);
    startServer();
    await createWindow();
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
