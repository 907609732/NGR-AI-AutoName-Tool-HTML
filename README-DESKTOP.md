# NGR AssetPilot V3 桌面版

这是 NGR AssetPilot 的独立 Windows 10/11 x64 Electron 工程。桌面源码、依赖、缓存、临时文件、测试日志和发布物都保存在本目录内，不会写入原网页版工作区。

## 环境与安装

- Node.js 22.13 或更高版本（当前锁定 Electron 43.4.1）。
- npm 负责复现 `package-lock.json`；在工程根目录运行 `npm ci`。
- 运行 `npm run env:check` 可确认 Node/npm 以及工程内缓存目录。
- 首版 Windows 产物不签名，启动时可能出现 SmartScreen“未知发布者”提示。

项目脚本会将 npm、Electron、electron-builder、Playwright、`TEMP` 和 `TMP` 分别定向到 `.cache/` 与 `.tmp/`。官网依赖保留在 `website/node_modules/`，不会进入桌面安装包。

## 构建

### 内部测试版

```powershell
$env:NGR_TEST_SECRET_SOURCE = 'C:\绝对路径\local-config.js'
npm run build:test
```

也可以通过 `NGR_TEST_KIMI_API_KEY`、`NGR_TEST_BAIDU_APP_ID` 和 `NGR_TEST_BAIDU_SECRET` 等环境变量提供凭据。`build:test-secrets` 只在内存中读取明文，然后生成：

- `build/generated/test-secrets-key.mjs`：AES 内容密钥的随机 XOR 份额。
- `build/generated/test-secrets.bin`：另一份 XOR 份额、IV、认证标签和 AES-256-GCM 密文。

两者都被 Git 忽略。它们允许测试版在任意电脑自动解锁，所以只属于可逆混淆，不能抵御逆向提取；测试包不得公开分发，完成验收后必须轮换凭据。

### 正式版

```powershell
npm run build:release
```

正式入口不引用测试密钥加载器；electron-builder 白名单还会排除测试入口、加载器、`build/generated/**`、source map 和 `app/API配置文件/local-config.js`。构建结束后执行全产物凭据扫描、npm CycloneDX SBOM、SHA-256 和构建清单生成。

## 产物

- `artifacts/test/NGR-AssetPilot-3.0.0-test.1-Setup-x64.exe`
- `artifacts/test/NGR-AssetPilot-3.0.0-test.1-portable-x64.exe`
- `artifacts/release/NGR-AssetPilot-3.0.0-Setup-x64.exe`
- `artifacts/release/NGR-AssetPilot-3.0.0-portable-x64.exe`
- 正式目录同时包含 `latest.yml`、blockmap、`SHA256SUMS.txt`、`sbom.cdx.json` 和 `build-manifest.json`。

安装版为无需管理员权限的 per-user NSIS 安装器，卸载默认保留 `%APPDATA%\NGR AssetPilot`。正式安装版支持 GitHub Releases 更新；便携版只提示用户前往 Releases 下载。

## 测试与官网

- `npm test`：运行原有测试与桌面打包安全测试。
- `npm run test:packaging`：仅运行构建配置、路径隔离和密钥密文测试。
- 官网使用 `node ../scripts/run-website.mjs build` 以兼容 Windows，并将 Wrangler 日志写入工程 `logs/`。
