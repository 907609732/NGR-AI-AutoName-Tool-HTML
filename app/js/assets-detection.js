/* NGRAI AutoName Tool V2.6 module: assets-detection.js */
function applyBatchSuffix() {
  const suffix = sanitizeName(els.batchSuffix.value);
  if (!suffix) {
    showToast("请先输入要追加的后缀");
    return;
  }
  const selected = assets.filter((asset) => asset.checked);
  const targets = selected.length ? selected : assets;
  targets.forEach((asset) => {
    const base = asset.finalBaseName || makeRecommendations(asset)[0];
    asset.finalBaseName = appendPart(base, suffix);
  });
  renderAssetList();
  showToast("已更新 " + targets.length + " 张图片");
}

function applyBatchSequence() {
  const start = Number.parseInt(els.batchSequenceStart.value || "1", 10);
  if (!Number.isFinite(start) || start < 1) {
    showToast("请先输入有效的起始序号");
    return;
  }
  const selected = assets.filter((asset) => asset.checked);
  const targets = selected.length ? selected : getVisibleAssets();
  targets.forEach((asset, index) => {
    const base = asset.finalBaseName || makeRecommendations(asset)[0];
    asset.finalBaseName = appendPart(removeTrailingSequence(base), formatSequenceNumber(start + index));
  });
  renderAssetList();
  showToast("已给 " + targets.length + " 张图片添加序号");
}

function removeSelectedAssets() {
  const targetIds = new Set(assets.filter((asset) => asset.checked || asset.id === selectedId).map((asset) => asset.id));
  if (!targetIds.size) return;
  assets.forEach((asset) => {
    if (targetIds.has(asset.id)) revokeAssetPreviewUrl(asset);
  });
  assets = assets.filter((asset) => !targetIds.has(asset.id));
  if (!assets.some((asset) => asset.id === selectedId)) selectedId = assets[0]?.id || null;
  assetRenderLimit = ASSET_RENDER_BATCH_SIZE;
  renderAssetList();
  showToast("已删除选中的图片");
}

function toggleProblemFilter() {
  showProblemOnly = !showProblemOnly;
  assetRenderLimit = ASSET_RENDER_BATCH_SIZE;
  els.problemFilter.textContent = showProblemOnly ? "显示全部图片" : "只看问题图片";
  els.problemFilter.setAttribute("aria-pressed", String(showProblemOnly));
  renderAssetList();
}

function toggleDetectionProblemFilter() {
  showDetectionProblemOnly = !showDetectionProblemOnly;
  if (showDetectionProblemOnly) showDetectionWarningOnly = false;
  detectionRenderLimit = DETECTION_RENDER_BATCH_SIZE;
  syncDetectionFilterButtons();
  renderDetectionList();
}

function toggleDetectionWarningFilter() {
  showDetectionWarningOnly = !showDetectionWarningOnly;
  if (showDetectionWarningOnly) showDetectionProblemOnly = false;
  detectionRenderLimit = DETECTION_RENDER_BATCH_SIZE;
  syncDetectionFilterButtons();
  renderDetectionList();
}

function syncDetectionFilterButtons() {
  els.detectionProblemFilter.textContent = showDetectionProblemOnly ? "显示全部图片" : "只看问题图片";
  els.detectionProblemFilter.setAttribute("aria-pressed", String(showDetectionProblemOnly));
  els.detectionWarningFilter.textContent = showDetectionWarningOnly ? "显示全部图片" : "只看警告图片";
  els.detectionWarningFilter.setAttribute("aria-pressed", String(showDetectionWarningOnly));
}

async function addFiles(files) {
  const imageFiles = files.filter(isSupportedImage);
  if (!imageFiles.length) {
    showToast("未发现可处理的图片文件");
    return;
  }

  const seen = new Set(assets.map((asset) => asset.key));
  let loadedCount = 0;
  let loadedIssueCount = 0;
  showToast("开始载入 " + imageFiles.length + " 张图片，正在分批处理");
  for (let start = 0; start < imageFiles.length; start += UPLOAD_PROCESS_BATCH_SIZE) {
    const batch = imageFiles.slice(start, start + UPLOAD_PROCESS_BATCH_SIZE);
    const additions = await mapWithConcurrency(batch, fileToAsset, UPLOAD_CONCURRENCY);
    additions.forEach((asset) => {
      if (!seen.has(asset.key)) {
        assets.push(asset);
        seen.add(asset.key);
        loadedCount += 1;
        if (asset.dimensionIssue) loadedIssueCount += 1;
      }
    });
    if (!selectedId && assets.length) selectedId = assets[0].id;
    if (start === 0 || start + batch.length >= imageFiles.length || loadedCount % (ASSET_RENDER_BATCH_SIZE * 2) === 0) {
      renderAssetList();
      els.fileCount.textContent = assets.length + " 张 / 正在载入 " + Math.min(start + batch.length, imageFiles.length) + "/" + imageFiles.length;
    }
    await yieldToBrowser();
  }
  if (!selectedId && assets.length) selectedId = assets[0].id;
  renderAssetList();
  if (loadedIssueCount) {
    showToast("已载入 " + loadedCount + " 张，其中 " + loadedIssueCount + " 张分辨率有问题");
  } else {
    showToast("已载入 " + loadedCount + " 张切图");
  }
}

async function addDetectionFiles(files) {
  const imageFiles = files.filter(isSupportedImage);
  if (!imageFiles.length) {
    showToast("未发现可检测的图片文件");
    return;
  }

  const seen = new Set(detectionAssets.map((asset) => asset.key));
  let loadedCount = 0;
  let issueCount = 0;
  showToast("开始检测 " + imageFiles.length + " 张图片，正在分批处理");
  for (let start = 0; start < imageFiles.length; start += UPLOAD_PROCESS_BATCH_SIZE) {
    const batch = imageFiles.slice(start, start + UPLOAD_PROCESS_BATCH_SIZE);
    const additions = await mapWithConcurrency(batch, fileToDetectionAsset, UPLOAD_CONCURRENCY);
    additions.forEach((asset) => {
      if (seen.has(asset.key)) return;
      detectionAssets.push(asset);
      seen.add(asset.key);
      loadedCount += 1;
      if (asset.hasIssue) issueCount += 1;
    });
    if (start === 0 || start + batch.length >= imageFiles.length || loadedCount % (DETECTION_RENDER_BATCH_SIZE * 2) === 0) {
      renderDetectionList();
      els.detectionCount.textContent = detectionAssets.length + " 张 / 正在检测 " + Math.min(start + batch.length, imageFiles.length) + "/" + imageFiles.length;
    }
    await yieldToBrowser();
  }
  updateSimilarResourceWarnings();
  renderDetectionList();
  showToast(issueCount ? "已检测 " + loadedCount + " 张，其中 " + issueCount + " 张有问题" : "已检测 " + loadedCount + " 张，全部通过");
}

function isSupportedImage(file) {
  return IMAGE_TYPES.includes(file.type) || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
}

async function mapWithConcurrency(items, mapper, limit = UPLOAD_CONCURRENCY) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      if (currentIndex % 12 === 0) await yieldToBrowser();
    }
  });
  await Promise.all(workers);
  return results;
}

async function fileToAsset(file) {
  const url = URL.createObjectURL(file);
  const dimensions = await readImageDimensions(url).catch(() => ({ width: 0, height: 0 }));
  URL.revokeObjectURL(url);
  const validation = validateUploadDimensions(dimensions);
  const originalBase = file.name.replace(/\.[^.]+$/, "");
  const extension = getExtension(file.name);
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random();
  const key = (file.webkitRelativePath || file.name) + "-" + file.size + "-" + file.lastModified;
  return {
    id,
    key,
    file,
    url: "",
    originalBase,
    extension,
    dimensions,
    sizeCategory: validation.category,
    sizeCategoryLabel: validation.label,
    dimensionIssue: Boolean(validation.problem),
    dimensionWarning: Boolean(validation.warning),
    dimensionIssueMessage: validation.reason || "",
    checked: false,
    recommendations: [],
    finalBaseName: "",
    customPrefix: "",
    customBasePrefix: "",
    customProjectName: "",
    customViewName: "",
    lexiconOpen: false,
    namingStatus: "idle",
    statusMessage: "",
  };
}

async function fileToDetectionAsset(file) {
  const url = URL.createObjectURL(file);
  const dimensions = await readImageDimensions(url).catch(() => ({ width: 0, height: 0 }));
  URL.revokeObjectURL(url);
  const result = validateDetectionDimensions(dimensions, getActiveDetectionProfile());
  const formatMessages = validateDetectionFormat(file);
  if (formatMessages.length) {
    result.messages = [...(result.messages || []), ...formatMessages];
    result.hasIssue = true;
  }
  const duplicateConfig = getDuplicateSensitivityConfig(getActiveDetectionProfile().duplicateSensitivity);
  const fingerprint = duplicateConfig.disabled ? null : await imageFileToFingerprint(file).catch(() => null);
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random();
  const key = (file.webkitRelativePath || file.name) + "-" + file.size + "-" + file.lastModified;
  return {
    id,
    key,
    file,
    url: "",
    name: file.webkitRelativePath || file.name,
    dimensions,
    fingerprint,
    ...result,
  };
}

function getAssetPreviewUrl(asset) {
  if (!asset.url && asset.file) asset.url = URL.createObjectURL(asset.file);
  return asset.url || "";
}

function revokeAssetPreviewUrl(asset) {
  if (!asset?.url) return;
  URL.revokeObjectURL(asset.url);
  asset.url = "";
}

function validateDetectionFormat(file) {
  return /\.png$/i.test(file.name) ? [] : ["注意导出切图格式，NGR只允许png格式，不允许其他格式"];
}

function validateDetectionDimensions(dimensions, profile) {
  const { width, height } = dimensions || {};
  if (!width || !height) {
    return { hasIssue: true, label: "无法读取", messages: ["无法读取图片分辨率"] };
  }
  const config = normalizeDetectionProfile(profile);
  const maxSide = Math.max(width, height);
  const messages = [];
  const warnings = [];
  if (config.mode === "planner") return validatePlannerDetectionDimensions(width, height);
  if (config.mode === "icon") return validateIconDetectionDimensions(width, height);
  const isBackground = width === config.backgroundWidth && height === config.backgroundHeight;
  let label = isBackground ? "背景图" : maxSide > config.largeThreshold ? "大图" : "图集";

  if (width % 2 !== 0 || height % 2 !== 0) {
    messages.push("分辨率不是双数，不允许单数");
  }
  if (maxSide === 2048 && !isBackground) {
    warnings.push("该分辨率允许上传，但是不推荐使用，推荐切2张分辨率1024拼接");
  } else if (maxSide > config.maxSide && !isBackground) {
    messages.push("分辨率单边不能超过" + config.maxSide);
  }
  if (isBackground) {
    label = "背景图";
  } else if (maxSide > config.largeThreshold) {
    label = "大图";
    if (width % config.largeMultiple !== 0 || height % config.largeMultiple !== 0) {
      messages.push("单边超过" + config.largeThreshold + "的大图需要是" + config.largeMultiple + "的倍数");
    }
  } else if (width % config.atlasMultiple !== 0 || height % config.atlasMultiple !== 0) {
    messages.push("分辨率" + config.largeThreshold + "px以下的图片只要不是单数就行");
  }

  return {
    hasIssue: messages.length > 0,
    hasWarning: warnings.length > 0,
    label,
    warnings,
    messages,
  };
}

function validatePlannerDetectionDimensions(width, height) {
  const messages = [];
  const warnings = [];
  if (width % 2 !== 0 || height % 2 !== 0) messages.push("分辨率不是双数，不允许单数");
  if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) messages.push("策划配置切图规范：宽高都需要是2的幂次");
  return {
    hasIssue: messages.length > 0,
    hasWarning: warnings.length > 0,
    label: "策划配置",
    messages,
    warnings,
  };
}

function validateIconDetectionDimensions(width, height) {
  const allowedSizes = [32, 64, 128, 256, 512, 1024];
  const messages = [];
  if (width !== height) messages.push("Icon尺寸只允许正方形");
  if (!allowedSizes.includes(width) || !allowedSizes.includes(height)) messages.push("Icon尺寸只允许32x32、64x64、128x128、256x256、512x512、1024x1024");
  return {
    hasIssue: messages.length > 0,
    hasWarning: false,
    label: "Icon",
    messages,
    warnings: [],
  };
}

function validateUploadDimensions(dimensions) {
  const { width, height } = dimensions || {};
  if (!isNgrProject(getActiveProject())) return { valid: true, category: "", label: "" };
  if (!width || !height) return { valid: true, category: "unknown", label: "未知规格" };
  const isBackgroundSize = width === 3440 && height === 1440;
  const maxDimension = Math.max(width, height);
  if (width % 2 !== 0 || height % 2 !== 0) {
    return { valid: true, problem: true, category: "invalid", label: "问题图片", reason: "分辨率宽高不能是单数" };
  }
  if (maxDimension > 1024 && !isBackgroundSize) {
    if (maxDimension === 2048) return { valid: true, warning: true, category: "large", label: "大图", reason: "该分辨率允许上传，但是不推荐使用，推荐切2张分辨率1024拼接" };
    return { valid: true, problem: true, category: "invalid", label: "问题图片", reason: "除 3440x1440 背景图外，1024 以上分辨率有问题" };
  }
  if (maxDimension >= 512) {
    if (width % 4 !== 0 || height % 4 !== 0) {
      return { valid: true, problem: true, category: "invalid", label: "问题图片", reason: "512 以上大图宽高必须是 4 的倍数" };
    }
    return { valid: true, category: "large", label: "大图" };
  }
  if (width % 2 !== 0 || height % 2 !== 0) {
    return { valid: true, problem: true, category: "invalid", label: "问题图片", reason: "512 以下图集宽高必须是 2 的倍数" };
  }
  return { valid: true, category: "atlas", label: "图集" };
}

function readImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

async function imageFileToFingerprint(file) {
  if (!isRasterImage(file)) return null;
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const size = 12;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, size, size);
    const data = context.getImageData(0, 0, size, size).data;
    const values = [];
    for (let index = 0; index < data.length; index += 4) {
      values.push(Math.round((data[index] + data[index + 1] + data[index + 2]) / 3));
    }
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return values.map((value) => (value >= average ? "1" : "0")).join("");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function updateSimilarResourceWarnings() {
  const duplicateConfig = getDuplicateSensitivityConfig(getActiveDetectionProfile().duplicateSensitivity);
  clearSimilarResourceWarnings();
  if (duplicateConfig.disabled) {
    return;
  }
  if (detectionAssets.length > MAX_DUPLICATE_SCAN_ASSETS) {
    showToast("图片数量超过 " + MAX_DUPLICATE_SCAN_ASSETS + " 张，已跳过重复资源检测以避免卡死");
    return;
  }
  for (let index = 0; index < detectionAssets.length; index += 1) {
    const current = detectionAssets[index];
    if (!current.fingerprint) continue;
    for (let nextIndex = index + 1; nextIndex < detectionAssets.length; nextIndex += 1) {
      const next = detectionAssets[nextIndex];
      if (!next.fingerprint) continue;
      if (!shouldCompareDuplicateAssets(current, next, duplicateConfig)) continue;
      const similarity = getFingerprintSimilarity(current.fingerprint, next.fingerprint);
      if (similarity >= duplicateConfig.threshold) {
        current.similarNames.push(next.name);
        next.similarNames.push(current.name);
      }
    }
  }
  detectionAssets.forEach((asset) => {
    const baseWarnings = (asset.warnings || []).filter((message) => !message.startsWith("疑似重复资源"));
    const similarWarnings = (asset.similarNames || []).slice(0, 3).map((name) => "疑似重复资源：" + name);
    asset.warnings = [...baseWarnings, ...similarWarnings];
    asset.hasWarning = Boolean(asset.warnings.length);
  });
}

function clearSimilarResourceWarnings() {
  detectionAssets.forEach((asset) => {
    asset.similarNames = [];
    const baseWarnings = (asset.warnings || []).filter((message) => !message.startsWith("疑似重复资源"));
    asset.warnings = baseWarnings;
    asset.hasWarning = Boolean(asset.warnings.length);
  });
}

function clearDetectionAssetList() {
  detectionAssets.forEach(revokeAssetPreviewUrl);
  detectionAssets = [];
  detectionRenderLimit = DETECTION_RENDER_BATCH_SIZE;
}

function getDuplicateSensitivityConfig(level) {
  const configs = {
    off: { threshold: 1, dimensionTolerance: 0, minSide: Infinity, disabled: true },
    low: { threshold: 1, dimensionTolerance: 0, minSide: 96, disabled: false },
    medium: { threshold: 0.99, dimensionTolerance: 0, minSide: 48, disabled: false },
    high: { threshold: 0.965, dimensionTolerance: 0.06, minSide: 32, disabled: false },
  };
  return configs[level] || configs.off;
}

function shouldCompareDuplicateAssets(left, right, config) {
  const leftWidth = left.dimensions?.width || 0;
  const leftHeight = left.dimensions?.height || 0;
  const rightWidth = right.dimensions?.width || 0;
  const rightHeight = right.dimensions?.height || 0;
  if (!leftWidth || !leftHeight || !rightWidth || !rightHeight) return false;
  if (Math.min(leftWidth, leftHeight, rightWidth, rightHeight) < config.minSide) return false;
  const widthTolerance = Math.abs(leftWidth - rightWidth) / Math.max(leftWidth, rightWidth);
  const heightTolerance = Math.abs(leftHeight - rightHeight) / Math.max(leftHeight, rightHeight);
  return widthTolerance <= config.dimensionTolerance && heightTolerance <= config.dimensionTolerance;
}

function getFingerprintSimilarity(left, right) {
  const length = Math.min(left.length, right.length);
  if (!length) return 0;
  let same = 0;
  for (let index = 0; index < length; index += 1) {
    if (left[index] === right[index]) same += 1;
  }
  return same / length;
}

function isPowerOfTwo(value) {
  return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;
}

function md5(value) {
  const rotate = (x, c) => (x << c) | (x >>> (32 - c));
  const add = (x, y) => (((x >>> 0) + (y >>> 0)) & 0xffffffff) >>> 0;
  const cmn = (q, a, b, x, s, t) => add(rotate(add(add(a, q), add(x, t)), s), b);
  const ff = (a, b, c, d, x, s, t) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a, b, c, d, x, s, t) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | ~d), a, b, x, s, t);
  const text = unescape(encodeURIComponent(String(value || "")));
  const words = [];
  for (let index = 0; index < text.length; index += 1) {
    words[index >> 2] = (words[index >> 2] || 0) | (text.charCodeAt(index) << ((index % 4) * 8));
  }
  words[text.length >> 2] = (words[text.length >> 2] || 0) | (0x80 << ((text.length % 4) * 8));
  words[(((text.length + 8) >> 6) + 1) * 16 - 2] = text.length * 8;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;
  for (let index = 0; index < words.length; index += 16) {
    const oldA = a;
    const oldB = b;
    const oldC = c;
    const oldD = d;
    a = ff(a, b, c, d, words[index], 7, -680876936);
    d = ff(d, a, b, c, words[index + 1], 12, -389564586);
    c = ff(c, d, a, b, words[index + 2], 17, 606105819);
    b = ff(b, c, d, a, words[index + 3], 22, -1044525330);
    a = ff(a, b, c, d, words[index + 4], 7, -176418897);
    d = ff(d, a, b, c, words[index + 5], 12, 1200080426);
    c = ff(c, d, a, b, words[index + 6], 17, -1473231341);
    b = ff(b, c, d, a, words[index + 7], 22, -45705983);
    a = ff(a, b, c, d, words[index + 8], 7, 1770035416);
    d = ff(d, a, b, c, words[index + 9], 12, -1958414417);
    c = ff(c, d, a, b, words[index + 10], 17, -42063);
    b = ff(b, c, d, a, words[index + 11], 22, -1990404162);
    a = ff(a, b, c, d, words[index + 12], 7, 1804603682);
    d = ff(d, a, b, c, words[index + 13], 12, -40341101);
    c = ff(c, d, a, b, words[index + 14], 17, -1502002290);
    b = ff(b, c, d, a, words[index + 15], 22, 1236535329);
    a = gg(a, b, c, d, words[index + 1], 5, -165796510);
    d = gg(d, a, b, c, words[index + 6], 9, -1069501632);
    c = gg(c, d, a, b, words[index + 11], 14, 643717713);
    b = gg(b, c, d, a, words[index], 20, -373897302);
    a = gg(a, b, c, d, words[index + 5], 5, -701558691);
    d = gg(d, a, b, c, words[index + 10], 9, 38016083);
    c = gg(c, d, a, b, words[index + 15], 14, -660478335);
    b = gg(b, c, d, a, words[index + 4], 20, -405537848);
    a = gg(a, b, c, d, words[index + 9], 5, 568446438);
    d = gg(d, a, b, c, words[index + 14], 9, -1019803690);
    c = gg(c, d, a, b, words[index + 3], 14, -187363961);
    b = gg(b, c, d, a, words[index + 8], 20, 1163531501);
    a = gg(a, b, c, d, words[index + 13], 5, -1444681467);
    d = gg(d, a, b, c, words[index + 2], 9, -51403784);
    c = gg(c, d, a, b, words[index + 7], 14, 1735328473);
    b = gg(b, c, d, a, words[index + 12], 20, -1926607734);
    a = hh(a, b, c, d, words[index + 5], 4, -378558);
    d = hh(d, a, b, c, words[index + 8], 11, -2022574463);
    c = hh(c, d, a, b, words[index + 11], 16, 1839030562);
    b = hh(b, c, d, a, words[index + 14], 23, -35309556);
    a = hh(a, b, c, d, words[index + 1], 4, -1530992060);
    d = hh(d, a, b, c, words[index + 4], 11, 1272893353);
    c = hh(c, d, a, b, words[index + 7], 16, -155497632);
    b = hh(b, c, d, a, words[index + 10], 23, -1094730640);
    a = hh(a, b, c, d, words[index + 13], 4, 681279174);
    d = hh(d, a, b, c, words[index], 11, -358537222);
    c = hh(c, d, a, b, words[index + 3], 16, -722521979);
    b = hh(b, c, d, a, words[index + 6], 23, 76029189);
    a = hh(a, b, c, d, words[index + 9], 4, -640364487);
    d = hh(d, a, b, c, words[index + 12], 11, -421815835);
    c = hh(c, d, a, b, words[index + 15], 16, 530742520);
    b = hh(b, c, d, a, words[index + 2], 23, -995338651);
    a = ii(a, b, c, d, words[index], 6, -198630844);
    d = ii(d, a, b, c, words[index + 7], 10, 1126891415);
    c = ii(c, d, a, b, words[index + 14], 15, -1416354905);
    b = ii(b, c, d, a, words[index + 5], 21, -57434055);
    a = ii(a, b, c, d, words[index + 12], 6, 1700485571);
    d = ii(d, a, b, c, words[index + 3], 10, -1894986606);
    c = ii(c, d, a, b, words[index + 10], 15, -1051523);
    b = ii(b, c, d, a, words[index + 1], 21, -2054922799);
    a = ii(a, b, c, d, words[index + 8], 6, 1873313359);
    d = ii(d, a, b, c, words[index + 15], 10, -30611744);
    c = ii(c, d, a, b, words[index + 6], 15, -1560198380);
    b = ii(b, c, d, a, words[index + 13], 21, 1309151649);
    a = ii(a, b, c, d, words[index + 4], 6, -145523070);
    d = ii(d, a, b, c, words[index + 11], 10, -1120210379);
    c = ii(c, d, a, b, words[index + 2], 15, 718787259);
    b = ii(b, c, d, a, words[index + 9], 21, -343485551);
    a = add(a, oldA);
    b = add(b, oldB);
    c = add(c, oldC);
    d = add(d, oldD);
  }
  return [a, b, c, d].map((word) => [0, 8, 16, 24].map((shift) => ("0" + ((word >>> shift) & 255).toString(16)).slice(-2)).join("")).join("");
}
