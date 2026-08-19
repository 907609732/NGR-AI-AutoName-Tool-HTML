import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { _electron as electron } from "playwright";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testEntry = path.join(projectRoot, "desktop", "main", "test-index.mjs");

test("Electron test build boots with an isolated renderer and visible TEST BUILD UI", { timeout: 45_000 }, async () => {
  const electronApp = await electron.launch({
    args: [testEntry],
    cwd: projectRoot,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: "0",
    },
  });

  try {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState("domcontentloaded");
    await window.waitForFunction(() => Boolean(window.ngrDesktop?.environment?.getInfo));

    const environment = await window.evaluate(() => window.ngrDesktop.environment.getInfo());
    assert.equal(environment.platform, "win32");
    assert.equal(environment.isTestBuild, true);
    assert.equal(environment.distribution, "test");

    await window.waitForFunction(() => {
      const banner = document.querySelector("#testBuildBanner");
      const badge = document.querySelector("#testBuildBadge");
      return banner && badge && !banner.classList.contains("hidden") && !badge.classList.contains("hidden");
    });

    const renderer = await window.evaluate(() => ({
      url: location.href,
      title: document.title,
      nodeRequireType: typeof window.require,
      nodeProcessType: typeof window.process,
      bridgeNamespaces: Object.keys(window.ngrDesktop).sort(),
      bannerText: document.querySelector("#testBuildBanner")?.textContent?.trim(),
      badgeText: document.querySelector("#testBuildBadge")?.textContent?.trim(),
    }));

    assert.match(renderer.url, /^ngr-assetpilot:\/\/app\//);
    assert.match(renderer.title, /NGR AssetPilot/);
    assert.equal(renderer.nodeRequireType, "undefined");
    assert.equal(renderer.nodeProcessType, "undefined");
    assert.match(renderer.bannerText, /^TEST BUILD .*不得公开分发$/);
    assert.equal(renderer.badgeText, "TEST BUILD");
    assert.deepEqual(renderer.bridgeNamespaces, [
      "app",
      "backup",
      "credentials",
      "environment",
      "files",
      "network",
      "shell",
      "updater",
    ]);
  } finally {
    await electronApp.close();
  }
});
