# NGR AssetPilot 官方网站

官网用于介绍 NGR AssetPilot V3 Windows 桌面版，并将用户引导至仓库的 GitHub Releases 页面。安装版、便携版和 SHA-256 尚未发布时，页面不会伪造具体的下载直链。

## 本地命令

要求 Node.js 22.13 或更高版本。

```powershell
npm ci
npm run dev
npm run lint
npm test
```

`dev`、`build` 和 `start` 统一通过根目录的 `scripts/run-website.mjs` 启动，兼容 Windows，并将 npm/临时缓存与 Wrangler 日志定向到桌面工程目录。

官网依赖和构建输出只属于 `website/`，electron-builder 的桌面文件白名单不会把它们打入 EXE。
