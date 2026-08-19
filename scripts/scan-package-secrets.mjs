import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decryptTestSecretBlob, resolveTestSecretPayload } from "./build-test-secrets.mjs";
import { projectPaths, projectRoot } from "./project-env.mjs";

function getSourcePath(env = process.env) {
  const candidates = [
    env.NGR_TEST_SECRET_SOURCE,
    path.join(projectRoot, "app", "API配置文件", "local-config.js"),
    env.USERPROFILE
      ? path.join(env.USERPROFILE, "Documents", "AI资源领航", "app", "API配置文件", "local-config.js")
      : undefined,
  ];
  return candidates.filter(Boolean).map((candidate) => path.resolve(candidate)).find(fs.existsSync);
}

function collectKnownSecrets(env = process.env) {
  let payload;
  try {
    payload = resolveTestSecretPayload({ sourcePath: getSourcePath(env), env });
  } catch {
    try {
      const moduleSource = fs.readFileSync(path.join(projectPaths.generated, "test-secrets-key.mjs"), "utf8");
      const keyShareText = moduleSource.match(/keyShare:\s*"([^"]+)"/)?.[1];
      if (!keyShareText) return [];
      const blob = fs.readFileSync(path.join(projectPaths.generated, "test-secrets.bin"));
      payload = decryptTestSecretBlob(blob, Buffer.from(keyShareText, "base64"));
    } catch {
      return [];
    }
  }
  return [
    ["Kimi API Key", payload.ai.apiKey],
    ["百度翻译 App ID", payload.translation.baiduAppId],
    ["百度翻译密钥", payload.translation.baiduSecret],
  ].filter(([, value]) => typeof value === "string" && value.length >= 8);
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const files = [];
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function containsBuffer(filePath, needle) {
  if (needle.length === 0) {
    return false;
  }
  const file = fs.openSync(filePath, "r");
  const chunk = Buffer.allocUnsafe(1024 * 1024);
  let overlap = Buffer.alloc(0);
  try {
    for (;;) {
      const count = fs.readSync(file, chunk, 0, chunk.length, null);
      if (count === 0) {
        return false;
      }
      const haystack = overlap.length
        ? Buffer.concat([overlap, chunk.subarray(0, count)])
        : chunk.subarray(0, count);
      if (haystack.indexOf(needle) !== -1) {
        return true;
      }
      const overlapLength = Math.min(needle.length - 1, haystack.length);
      overlap = overlapLength ? Buffer.from(haystack.subarray(haystack.length - overlapLength)) : Buffer.alloc(0);
    }
  } finally {
    fs.closeSync(file);
  }
}

export function scanArtifacts({ channel = "release", env = process.env } = {}) {
  const artifactDirectory = channel === "test" ? projectPaths.testArtifacts : projectPaths.releaseArtifacts;
  const files = walkFiles(artifactDirectory);
  if (files.length === 0) {
    throw new Error(`没有可扫描的 ${channel} 构建产物`);
  }

  const forbidden = collectKnownSecrets(env).map(([label, value]) => [label, Buffer.from(value, "utf8")]);
  if (channel === "release") {
    forbidden.push(
      ["测试密钥文件名", Buffer.from("test-secrets.bin", "utf8")],
      ["测试密钥模块名", Buffer.from("test-secrets-key.mjs", "utf8")],
      ["测试密钥 magic", Buffer.from("NGRSEC1\0", "ascii")],
    );
  }

  const findings = [];
  for (const filePath of files) {
    for (const [label, needle] of forbidden) {
      if (containsBuffer(filePath, needle)) {
        findings.push({ label, file: path.relative(artifactDirectory, filePath) });
      }
    }
  }

  if (findings.length > 0) {
    const locations = findings.map(({ label, file }) => `${label} @ ${file}`).join("；");
    throw new Error(`凭据扫描未通过：${locations}`);
  }
  return { artifactDirectory, fileCount: files.length, knownSecretCount: collectKnownSecrets(env).length };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const channel = process.argv[2] === "test" ? "test" : "release";
  try {
    const result = scanArtifacts({ channel });
    console.log(`凭据扫描通过：检查 ${result.fileCount} 个文件，未输出任何凭据值。`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "凭据扫描失败");
    process.exitCode = 1;
  }
}
