import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";
import { buildTestSecrets, decryptTestSecretBlob } from "../scripts/build-test-secrets.mjs";
import { createProjectEnvironment, projectPaths, projectRoot } from "../scripts/project-env.mjs";

const require = createRequire(import.meta.url);
const builderConfigPath = path.join(projectRoot, "build", "electron-builder.config.cjs");

function loadBuilderConfig(channel) {
  const previous = process.env.NGR_BUILD_CHANNEL;
  process.env.NGR_BUILD_CHANNEL = channel;
  delete require.cache[require.resolve(builderConfigPath)];
  const config = require(builderConfigPath);
  if (previous === undefined) {
    delete process.env.NGR_BUILD_CHANNEL;
  } else {
    process.env.NGR_BUILD_CHANNEL = previous;
  }
  return config;
}

test("桌面依赖版本全部精确锁定", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  assert.equal(packageJson.devDependencies.electron, "43.4.1");
  assert.equal(packageJson.devDependencies["electron-builder"], "26.15.3");
  assert.equal(packageJson.dependencies["electron-updater"], "6.8.9");
  assert.equal(packageJson.devDependencies["@playwright/test"], "1.62.1");
});

test("正式构建使用正式入口并排除全部测试密钥代码", () => {
  const config = loadBuilderConfig("release");
  assert.equal(config.appId, "com.chenyuecai.ngrassetpilot");
  assert.equal(config.extraMetadata.main, "desktop/main/index.mjs");
  assert.deepEqual(config.extraResources, []);
  assert.ok(config.files.includes("!build/generated/**/*"));
  assert.ok(config.files.includes("!desktop/main/test-index.mjs"));
  assert.ok(config.files.includes("!desktop/services/test-secrets.mjs"));
  assert.ok(config.files.includes("!app/API配置文件/**/*"));
  assert.equal(config.nsis.perMachine, false);
  assert.equal(config.nsis.allowElevation, false);
  assert.equal(config.nsis.deleteAppDataOnUninstall, false);
  assert.match(config.nsis.artifactName, /3\.0\.0-Setup-x64\.\$\{ext\}$/);
  assert.match(config.portable.artifactName, /3\.0\.0-portable-x64\.\$\{ext\}$/);
});

test("测试构建采用独立入口、应用 ID 和密钥资源", () => {
  const config = loadBuilderConfig("test");
  assert.equal(config.appId, "com.chenyuecai.ngrassetpilot.test");
  assert.equal(config.extraMetadata.version, "3.0.0-test.1");
  assert.equal(config.extraMetadata.main, "desktop/main/test-index.mjs");
  assert.ok(config.files.includes("build/generated/test-secrets-key.mjs"));
  assert.equal(config.extraResources[0].to, "test-secrets.bin");
  assert.equal(config.publish, null);
});

test("Electron ESM 入口不会用顶层 await 阻塞 app ready", () => {
  const stableEntry = fs.readFileSync(path.join(projectRoot, "desktop", "main", "index.mjs"), "utf8");
  const testEntry = fs.readFileSync(path.join(projectRoot, "desktop", "main", "test-index.mjs"), "utf8");
  assert.match(stableEntry, /void runDesktopApp\(\)\.catch\(reportStartupFailure\)/);
  assert.match(testEntry, /void startTestApp\(\)\.catch\(reportStartupFailure\)/);
});

test("缓存、临时文件、日志和产物全部定向桌面工程", () => {
  const env = createProjectEnvironment();
  for (const directory of Object.values(projectPaths)) {
    assert.ok(path.resolve(directory).startsWith(path.resolve(projectRoot) + path.sep));
  }
  assert.equal(env.TEMP, projectPaths.temp);
  assert.equal(env.TMP, projectPaths.temp);
  assert.equal(env.NPM_CONFIG_CACHE, projectPaths.npmCache);
  assert.equal(env.ELECTRON_CACHE, projectPaths.electronCache);
  assert.equal(env.ELECTRON_BUILDER_CACHE, projectPaths.electronBuilderCache);
  assert.equal(env.PLAYWRIGHT_BROWSERS_PATH, projectPaths.playwrightCache);
});

test("测试凭据只以 AES-256-GCM 密文和 XOR 密钥份额落盘", () => {
  fs.mkdirSync(projectPaths.temp, { recursive: true });
  const temporaryDirectory = fs.mkdtempSync(path.join(projectPaths.temp, "packaging-secret-test-"));
  try {
    const fakeEnv = {
      NGR_TEST_KIMI_API_KEY: "fake-kimi-key-for-unit-test-only",
      NGR_TEST_KIMI_BASE_URL: "https://api.moonshot.cn/v1",
      NGR_TEST_KIMI_MODEL: "fake-model",
      NGR_TEST_BAIDU_APP_ID: "fake-baidu-app-id",
      NGR_TEST_BAIDU_SECRET: "fake-baidu-secret-for-unit-test",
      NGR_TEST_BAIDU_ENDPOINT: "https://fanyi-api.baidu.com/api/trans/vip/translate",
    };
    const output = buildTestSecrets({ outputDirectory: temporaryDirectory, env: fakeEnv });
    const blob = fs.readFileSync(output.blobPath);
    const moduleSource = fs.readFileSync(output.modulePath, "utf8");
    for (const secret of [fakeEnv.NGR_TEST_KIMI_API_KEY, fakeEnv.NGR_TEST_BAIDU_APP_ID, fakeEnv.NGR_TEST_BAIDU_SECRET]) {
      assert.equal(blob.includes(Buffer.from(secret)), false);
      assert.equal(moduleSource.includes(secret), false);
    }
    const keyShare = Buffer.from(moduleSource.match(/keyShare: "([^"]+)"/)?.[1] ?? "", "base64");
    const decrypted = decryptTestSecretBlob(blob, keyShare);
    assert.equal(decrypted.ai.apiKey, fakeEnv.NGR_TEST_KIMI_API_KEY);
    assert.equal(decrypted.ai.provider, "kimi");
    assert.equal(decrypted.translation.baiduSecret, fakeEnv.NGR_TEST_BAIDU_SECRET);
    assert.equal(decrypted.translation.provider, "baidu");
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
