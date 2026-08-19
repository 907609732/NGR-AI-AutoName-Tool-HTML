import { loadTestSecrets } from "../services/test-secrets.mjs";
import { reportStartupFailure, runDesktopApp } from "./bootstrap.mjs";

async function loadGeneratedTestConfig() {
  try {
    const moduleUrl = new URL("../../build/generated/test-secrets-key.mjs", import.meta.url);
    const generated = await import(moduleUrl.href);
    return generated.default ?? null;
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") return null;
    throw error;
  }
}

async function startTestApp() {
  const config = await loadGeneratedTestConfig();
  const testSecretsProvider = config
    ? ({ resourcesPath }) => loadTestSecrets({ config, resourcesPath })
    : null;
  await runDesktopApp({ isTestBuild: true, testSecretsProvider });
}

void startTestApp().catch(reportStartupFailure);
