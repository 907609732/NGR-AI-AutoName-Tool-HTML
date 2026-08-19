import electron from "electron";
import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_URL } from "../shared/constants.mjs";
import { errorCodeOnly } from "../shared/core.mjs";
import { BackupFileService } from "../services/backup-files.mjs";
import { CredentialStore } from "../services/credential-store.mjs";
import { DirectoryTokenStore } from "../services/directory-tokens.mjs";
import { NetworkClient } from "../services/network-client.mjs";
import { UpdaterController } from "../services/updater-controller.mjs";
import { registerDesktopIpc } from "./ipc.mjs";
import { QuitCoordinator } from "./lifecycle.mjs";
import { installAppProtocol, registerAppScheme } from "./protocol.mjs";
import { createSecureWindowOptions, hardenSession, hardenWindow } from "./security.mjs";
import channels from "../shared/ipc-channels.cjs";

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
  safeStorage,
  session,
  shell,
} = electron;
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(moduleDirectory, "../../app");
const preloadPath = path.resolve(moduleDirectory, "../preload/index.cjs");

function writeStartupLog(app, stage, details = {}) {
  try {
    const userDataPath = app.getPath("userData");
    mkdirSync(userDataPath, { recursive: true });
    appendFileSync(path.join(userDataPath, "desktop-startup.log"), `${JSON.stringify({
      at: new Date().toISOString(),
      stage,
      ...details,
    })}\n`, "utf8");
  } catch {
    // Startup diagnostics must never prevent the application from opening.
  }
}

async function resolveAutoUpdater(enabled) {
  if (!enabled) return null;
  try {
    const module = await import("electron-updater");
    return module.autoUpdater ?? module.default?.autoUpdater ?? null;
  } catch {
    return null;
  }
}

export async function runDesktopApp({ isTestBuild = false, testSecretsProvider = null } = {}) {
  registerAppScheme(protocol);
  app.setName(isTestBuild ? "NGR AssetPilot Test" : "NGR AssetPilot");
  app.setPath(
    "userData",
    path.join(app.getPath("appData"), isTestBuild ? "NGR AssetPilot Test" : "NGR AssetPilot"),
  );
  writeStartupLog(app, "bootstrap-start", { isTestBuild });

  const hasSingleInstanceLock = app.requestSingleInstanceLock();
  writeStartupLog(app, "single-instance", { acquired: hasSingleInstanceLock });
  if (!hasSingleInstanceLock) {
    app.quit();
    return;
  }

  let mainWindow = null;
  app.on("second-instance", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  await app.whenReady();
  writeStartupLog(app, "app-ready");
  app.setAppUserModelId(
    isTestBuild ? "com.chenyuecai.ngrassetpilot.test" : "com.chenyuecai.ngrassetpilot",
  );
  await installAppProtocol({ protocol, appRoot });
  writeStartupLog(app, "protocol-ready");
  hardenSession(session.defaultSession);

  const credentialStore = new CredentialStore({ safeStorage, userDataPath: app.getPath("userData") });
  let testSecretsState = isTestBuild ? "not-present" : "not-applicable";
  if (isTestBuild && typeof testSecretsProvider === "function") {
    try {
      const testCredentials = await testSecretsProvider({ resourcesPath: process.resourcesPath });
      if (testCredentials) {
        const result = await credentialStore.seedIfEmpty(testCredentials);
        testSecretsState = result.seeded ? "seeded" : "already-configured";
      }
    } catch {
      testSecretsState = "unavailable";
    }
  }
  writeStartupLog(app, "credentials-ready", { testSecretsState });

  const isPortable = Boolean(process.env.PORTABLE_EXECUTABLE_FILE);
  const updaterRequested = app.isPackaged && !isTestBuild && !isPortable;
  const autoUpdater = await resolveAutoUpdater(updaterRequested);
  const updater = new UpdaterController({
    autoUpdater,
    enabled: updaterRequested && Boolean(autoUpdater),
    currentVersion: app.getVersion(),
  });
  const directoryTokens = new DirectoryTokenStore();
  const networkClient = new NetworkClient({ fetchImpl: net.fetch.bind(net) });
  const lifecycle = new QuitCoordinator({ app, channel: channels.appBeforeQuit });
  const backupService = new BackupFileService({ dialog, getWindow: () => mainWindow });

  mainWindow = new BrowserWindow(createSecureWindowOptions({ preloadPath, isPackaged: app.isPackaged }));
  writeStartupLog(app, "window-created");
  const rendererOwnerId = mainWindow.webContents.id;
  hardenWindow(mainWindow, { shell });
  lifecycle.attachWindow(mainWindow);

  const environmentInfo = () => ({
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    isTestBuild,
    isPortable,
    distribution: isTestBuild ? "test" : isPortable ? "portable" : app.isPackaged ? "installer" : "development",
    updaterEnabled: updater.getState().enabled,
    credentialProtection: "windows-dpapi",
    testSecretsState,
  });
  const disposeIpc = registerDesktopIpc({
    ipcMain,
    dialog,
    shell,
    getWindow: () => mainWindow,
    credentialStore,
    networkClient,
    directoryTokens,
    backupService,
    updater,
    lifecycle,
    environmentInfo,
  });

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow?.isDestroyed()) mainWindow.show();
  });
  mainWindow.on("closed", () => {
    directoryTokens.revokeOwner(rendererOwnerId);
    mainWindow = null;
  });
  try {
    await mainWindow.loadURL(APP_URL);
    writeStartupLog(app, "renderer-loaded");
  } catch (error) {
    writeStartupLog(app, "renderer-load-failed", { code: errorCodeOnly(error) });
    throw error;
  }

  app.on("activate", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.once("will-quit", () => {
    disposeIpc();
    updater.dispose();
    lifecycle.dispose();
  });
}

export function reportStartupFailure(error) {
  const code = errorCodeOnly(error, "DESKTOP_STARTUP_FAILED");
  process.stderr.write(`[desktop] startup failed (${code})\n`);
  process.exitCode = 1;
}
