const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const channel = process.env.NGR_BUILD_CHANNEL === "test" ? "test" : "release";
const isTest = channel === "test";
const version = isTest ? "3.0.0-test.1" : "3.0.0";
const output = path.join(projectRoot, "artifacts", channel);

const applicationFiles = [
  "desktop/**/*",
  "app/**/*",
  "package.json",
  "LICENSE",
  "!app/API配置文件/**/*",
  "!**/*.map",
  "!**/.DS_Store",
];

if (isTest) {
  applicationFiles.push("build/generated/test-secrets-key.mjs");
} else {
  applicationFiles.push("!build/generated/**/*", "!desktop/main/test-index.mjs", "!desktop/services/test-secrets.mjs");
}

module.exports = {
  appId: isTest ? "com.chenyuecai.ngrassetpilot.test" : "com.chenyuecai.ngrassetpilot",
  productName: isTest ? "NGR AssetPilot TEST" : "NGR AssetPilot",
  executableName: isTest ? "NGR AssetPilot TEST" : "NGR AssetPilot",
  electronVersion: "43.4.1",
  asar: true,
  compression: "maximum",
  npmRebuild: false,
  buildDependenciesFromSource: false,
  removePackageScripts: true,
  extraMetadata: {
    name: isTest ? "ngr-assetpilot-desktop-test" : "ngr-assetpilot-desktop",
    version,
    main: isTest ? "desktop/main/test-index.mjs" : "desktop/main/index.mjs",
  },
  directories: {
    app: projectRoot,
    buildResources: path.join(projectRoot, "build"),
    output,
  },
  files: applicationFiles,
  extraResources: isTest
    ? [{ from: "build/generated/test-secrets.bin", to: "test-secrets.bin" }]
    : [],
  win: {
    icon: path.join(projectRoot, "build", "icon.ico"),
    target: [
      { target: "nsis", arch: ["x64"] },
      { target: "portable", arch: ["x64"] },
    ],
    verifyUpdateCodeSignature: false,
    legalTrademarks: "NGR AssetPilot",
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: isTest ? "NGR AssetPilot TEST" : "NGR AssetPilot",
    deleteAppDataOnUninstall: false,
    artifactName: `NGR-AssetPilot-${version}-Setup-x64.\${ext}`,
  },
  portable: {
    artifactName: `NGR-AssetPilot-${version}-portable-x64.\${ext}`,
    requestExecutionLevel: "user",
  },
  publish: isTest
    ? null
    : [{
        provider: "github",
        owner: "907609732",
        repo: "NGR-AI-AutoName-Tool",
        releaseType: "draft",
        channel: "latest",
      }],
};
