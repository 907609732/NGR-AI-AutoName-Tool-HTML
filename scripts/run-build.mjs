import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildTestSecrets } from "./build-test-secrets.mjs";
import { generateReleaseMetadata } from "./generate-release-metadata.mjs";
import { createProjectEnvironment, projectPaths, projectRoot } from "./project-env.mjs";
import { scanArtifacts } from "./scan-package-secrets.mjs";

const channel = process.argv[2] === "test" ? "test" : "release";
const artifactDirectory = channel === "test" ? projectPaths.testArtifacts : projectPaths.releaseArtifacts;
const generatedFiles = [
  path.join(projectPaths.generated, "test-secrets.bin"),
  path.join(projectPaths.generated, "test-secrets-key.mjs"),
];

function safelyResetOutput(directory) {
  const resolved = path.resolve(directory);
  const allowedParent = path.resolve(projectRoot, "artifacts") + path.sep;
  if (!resolved.startsWith(allowedParent) || !["test", "release"].includes(path.basename(resolved))) {
    throw new Error("拒绝清理工程 artifacts 之外的目录");
  }
  fs.rmSync(resolved, { recursive: true, force: true });
  fs.mkdirSync(resolved, { recursive: true });
}

function removeGeneratedSecrets() {
  for (const target of generatedFiles) {
    fs.rmSync(target, { force: true });
  }
}

function resolveSecretSource() {
  const candidates = [
    process.env.NGR_TEST_SECRET_SOURCE,
    path.join(projectRoot, "app", "API配置文件", "local-config.js"),
    process.env.USERPROFILE
      ? path.join(process.env.USERPROFILE, "Documents", "AI资源领航", "app", "API配置文件", "local-config.js")
      : undefined,
  ];
  return candidates.filter(Boolean).map((candidate) => path.resolve(candidate)).find(fs.existsSync);
}

function runBuilder(env) {
  const executable = path.join(projectRoot, "node_modules", "electron-builder", "out", "cli", "cli.js");
  if (!fs.existsSync(executable)) {
    throw new Error("缺少 node_modules；请先在桌面工程根目录执行 npm ci");
  }
  const result = childProcess.spawnSync(process.execPath, [executable, "--config", "build/electron-builder.config.cjs", "--publish", "never"], {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`electron-builder 失败，退出码 ${result.status ?? "unknown"}`);
  }
}

safelyResetOutput(artifactDirectory);
const env = createProjectEnvironment({
  NGR_BUILD_CHANNEL: channel,
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
});

try {
  if (channel === "test") {
    const generatedReady = generatedFiles.every(fs.existsSync);
    if (process.env.NGR_TEST_SECRET_SOURCE || !generatedReady) {
      buildTestSecrets({ sourcePath: resolveSecretSource(), env });
    }
  }
  runBuilder(env);
  const scan = scanArtifacts({ channel, env });
  const manifest = generateReleaseMetadata({ channel });
  console.log(`构建完成：${manifest.version}；凭据扫描 ${scan.fileCount} 个文件。`);
} catch (error) {
  throw error;
}
