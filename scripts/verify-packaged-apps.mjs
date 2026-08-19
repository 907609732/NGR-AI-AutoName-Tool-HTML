import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { _electron as electron } from "playwright";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runRoot = path.join(projectRoot, ".tmp", `packaged-smoke-${Date.now()}`);

function executable(channel) {
  const fileName = channel === "test" ? "NGR AssetPilot TEST.exe" : "NGR AssetPilot.exe";
  return path.join(projectRoot, "artifacts", channel, "win-unpacked", fileName);
}

async function verify(channel) {
  const appData = path.join(runRoot, channel, "Roaming");
  const localAppData = path.join(runRoot, channel, "Local");
  fs.mkdirSync(appData, { recursive: true });
  fs.mkdirSync(localAppData, { recursive: true });

  const electronApp = await electron.launch({
    executablePath: executable(channel),
    env: {
      ...process.env,
      APPDATA: appData,
      LOCALAPPDATA: localAppData,
      ELECTRON_ENABLE_LOGGING: "0",
    },
    timeout: 30_000,
  });

  try {
    const mainPaths = await electronApp.evaluate(({ app }) => ({
      userData: app.getPath("userData"),
      resources: process.resourcesPath,
    }));
    const window = await electronApp.firstWindow({ timeout: 30_000 });
    await window.waitForLoadState("domcontentloaded");
    await window.waitForFunction(() => Boolean(window.ngrDesktop?.environment?.getInfo));
    const info = await window.evaluate(() => window.ngrDesktop.environment.getInfo());
    const credentialStatus = await window.evaluate(() => window.ngrDesktop.credentials.getStatus());
    await window.waitForFunction((expectTestBuild) => {
      const banner = document.querySelector("#testBuildBanner");
      const badge = document.querySelector("#testBuildBadge");
      if (!banner || !badge) return false;
      return banner.classList.contains("hidden") !== expectTestBuild
        && badge.classList.contains("hidden") !== expectTestBuild;
    }, channel === "test");
    const surface = await window.evaluate(() => ({
      url: location.href,
      bannerHidden: document.querySelector("#testBuildBanner")?.classList.contains("hidden"),
      badgeHidden: document.querySelector("#testBuildBadge")?.classList.contains("hidden"),
      nodeRequireType: typeof window.require,
      nodeProcessType: typeof window.process,
    }));

    assert.match(surface.url, /^ngr-assetpilot:\/\/app\//);
    assert.equal(surface.nodeRequireType, "undefined");
    assert.equal(surface.nodeProcessType, "undefined");
    assert.equal(info.isTestBuild, channel === "test");
    assert.equal(fs.existsSync(path.join(mainPaths.resources, "test-secrets.bin")), channel === "test");
    assert.equal(surface.bannerHidden, channel !== "test");
    assert.equal(surface.badgeHidden, channel !== "test");
    assert.equal(credentialStatus.available, true);

    if (channel === "test") {
      assert.match(info.testSecretsState, /^(seeded|already-configured)$/);
      assert.equal(credentialStatus.configured, true);
      assert.equal(credentialStatus.providers.ai, true);
      assert.equal(credentialStatus.providers.translation, true);
      assert.ok(credentialStatus.configuredFieldCount >= 3);

      const credentialEnvelopePath = path.join(mainPaths.userData, "credentials.v1.json");
      const envelope = JSON.parse(fs.readFileSync(credentialEnvelopePath, "utf8"));
      assert.equal(envelope.protection, "electron-safe-storage");
      assert.match(envelope.ciphertext, /^[A-Za-z0-9+/]+={0,2}$/);
      assert.equal(Object.hasOwn(envelope, "credentials"), false);
    } else {
      assert.equal(info.testSecretsState, "not-applicable");
      assert.equal(credentialStatus.configured, false);
      assert.equal(fs.existsSync(path.join(mainPaths.userData, "credentials.v1.json")), false);
    }

    return {
      channel,
      version: info.version,
      distribution: info.distribution,
      isTestBuild: info.isTestBuild,
      credentialProtection: credentialStatus.protection,
      configuredFieldCount: credentialStatus.configuredFieldCount,
    };
  } finally {
    await electronApp.close();
  }
}

for (const channel of ["test", "release"]) {
  const result = await verify(channel);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

process.stdout.write(`PACKAGED_SMOKE_OK ${runRoot}\n`);
