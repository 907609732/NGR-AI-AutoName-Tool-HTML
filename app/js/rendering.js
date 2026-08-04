/* NGR AssetPilot V2.23 module: rendering.js */
function renderAssetList() {
  const problemCount = assets.filter((asset) => asset.dimensionIssue).length;
  els.fileCount.textContent = assets.length + " 张" + (problemCount ? " / " + problemCount + " 张问题" : "");
  renderNamingSessionList();
  syncSelectAllControl();
  if (!assets.length) {
    els.assetList.className = "asset-list-body empty-state";
    els.assetList.textContent = "请先上传切图文件夹";
    return;
  }
  const visibleAssets = getVisibleAssets();
  if (!visibleAssets.length) {
    els.assetList.className = "asset-list-body empty-state";
    els.assetList.textContent = "当前没有分辨率问题图片";
    syncSelectAllControl();
    return;
  }

  els.assetList.className = "asset-list-body" + (listDisplayMode === "compact" ? " compact-list-mode" : "");
  els.assetList.innerHTML = "";
  const duplicateContext = buildDuplicateStatusContext();
  const renderLimit = Math.min(Math.max(assetRenderLimit || ASSET_RENDER_BATCH_SIZE, ASSET_RENDER_BATCH_SIZE), visibleAssets.length);
  const renderedAssets = visibleAssets.slice(0, renderLimit);
  if (visibleAssets.length > renderLimit) {
    els.fileCount.textContent += " / 已显示 " + renderLimit + " 张";
  }
  renderedAssets.forEach((asset) => {
    const row = document.createElement("div");
    row.className = "asset-item" + (asset.dimensionIssue ? " has-issue" : asset.dimensionWarning ? " has-warning" : "") + (asset.id === selectedId ? " active" : "");
    row.addEventListener("click", (event) => {
      if (event.target.closest(".asset-meta") && window.getSelection?.().toString().trim()) return;
      selectedId = asset.id;
      saveCurrentNamingSession();
      renderAssetList();
    });

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = asset.checked;
    checkbox.addEventListener("click", (event) => event.stopPropagation());
    checkbox.addEventListener("change", (event) => {
      event.stopPropagation();
      asset.checked = checkbox.checked;
      saveCurrentNamingSession();
      syncSelectAllControl();
      renderNamingSessionList();
    });

    const img = document.createElement("img");
    img.src = getAssetPreviewUrl(asset);
    img.alt = asset.originalBase;
    img.loading = "lazy";
    img.decoding = "async";

    const text = document.createElement("div");
    text.className = "asset-meta";
    const beforeName = createMetaLine("修改前名称", asset.originalBase + asset.extension);
    const afterName = createMetaLine("修改后名称", asset.finalBaseName ? buildExportName(asset) : "待命名");
    beforeName.classList.add("full-line");
    afterName.classList.add("full-line", "after-name-line");
    const resolution = createMetaLine("分辨率", formatResolution(asset.dimensions));
    const sizeCategory = createMetaLine("规格", asset.sizeCategoryLabel || getSizeCategoryLabel(asset.dimensions));
    const dimensionCheck = createMetaLine("分辨率检查", asset.dimensionIssue || asset.dimensionWarning ? asset.dimensionIssueMessage : asset.dimensionInfoMessage || "通过");
    dimensionCheck.classList.add("full-line");
    dimensionCheck.classList.toggle("warning-line", asset.dimensionIssue || asset.dimensionWarning);
    const duplicateStatus = getDuplicateStatus(asset, duplicateContext);
    const duplicateCheck = createMetaLine("重名检测", duplicateStatus.message);
    duplicateCheck.classList.toggle("warning-line", duplicateStatus.hasIssue);
    const historyMatch = duplicateContext.historicalMatch;
    const historyLine = createMetaLine("历史工程", historyMatch ? historyMatch.name + " / " + historyMatch.fileCount + " 张" : "未匹配");
    const status = document.createElement("span");
    status.className = "status-badge status-" + getAssetStatus(asset);
    status.textContent = getAssetStatusText(asset);
    const statusHint = document.createElement("em");
    statusHint.textContent = asset.statusMessage || "";
    text.append(beforeName, afterName, resolution, sizeCategory, dimensionCheck, duplicateCheck, historyLine, status, statusHint);

    const editor = document.createElement("div");
    editor.className = "inline-editor";
    editor.addEventListener("click", (event) => event.stopPropagation());

    const nameRow = document.createElement("div");
    nameRow.className = "inline-name-row";

    const prefix = document.createElement("label");
    prefix.className = "inline-prefix inline-prefix-choice";
    const prefixLabel = document.createElement("span");
    prefixLabel.textContent = "前缀名";
    const prefixInput = document.createElement("select");
    [
      { value: "", label: "无" },
      { value: "T_UI", label: "T_UI" },
      { value: "T_UI_Img", label: "T_UI_Img" },
      { value: "T_UI_Icon", label: "T_UI_Icon" },
    ].forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      option.selected = item.value === buildAssetBasePrefix(asset);
      prefixInput.appendChild(option);
    });
    prefixInput.addEventListener("change", () => {
      asset.customPrefix = "";
      asset.customBasePrefix = prefixInput.value === "" ? "__none" : prefixInput.value;
      afterName.querySelector("strong").textContent = asset.finalBaseName ? buildExportName(asset) : "待命名";
      saveCurrentNamingSession();
    });
    prefix.append(prefixLabel, prefixInput);

    const project = document.createElement("label");
    project.className = "inline-prefix";
    const projectLabel = document.createElement("span");
    projectLabel.textContent = "工程名";
    const projectInput = document.createElement("input");
    projectInput.type = "text";
    projectInput.value = buildAssetProjectName(asset);
    projectInput.placeholder = rules.projectName;
    projectInput.addEventListener("input", () => {
      asset.customPrefix = "";
      asset.customProjectName = sanitizeName(projectInput.value);
      afterName.querySelector("strong").textContent = asset.finalBaseName ? buildExportName(asset) : "待命名";
      saveCurrentNamingSession();
    });
    project.append(projectLabel, projectInput);

    const view = document.createElement("label");
    view.className = "inline-prefix";
    const viewLabel = document.createElement("span");
    viewLabel.textContent = "界面名";
    const viewInput = document.createElement("input");
    viewInput.type = "text";
    viewInput.value = buildAssetViewName(asset);
    viewInput.placeholder = rules.viewName || "可不填";
    viewInput.addEventListener("input", () => {
      asset.customPrefix = "";
      asset.customViewName = sanitizeName(viewInput.value);
      afterName.querySelector("strong").textContent = asset.finalBaseName ? buildExportName(asset) : "待命名";
      saveCurrentNamingSession();
    });
    view.append(viewLabel, viewInput);

    const recommendationWrap = document.createElement("div");
    recommendationWrap.className = "inline-recommendations";
    const recommendationLabel = document.createElement("span");
    recommendationLabel.textContent = "AI 推荐命名";
    const recommendationButtons = document.createElement("div");
    recommendationButtons.className = "recommendations compact";
    const recommendations = asset.recommendations.length ? asset.recommendations : makeRecommendations(asset);
    recommendations.forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recommendation";
      const nameText = document.createElement("span");
      nameText.className = "recommendation-name";
      nameText.textContent = name;
      const meaningText = document.createElement("span");
      meaningText.className = "recommendation-meaning";
      meaningText.dataset.meaningKey = getMeaningKey(name);
      meaningText.textContent = "中文含义：" + getDisplayMeaning(name);
      button.append(nameText, meaningText);
      button.addEventListener("click", () => {
        asset.finalBaseName = formatNamingName(name);
        saveCurrentNamingSession();
        renderAssetList();
        showToast("已填入推荐名称");
      });
      recommendationButtons.appendChild(button);
    });
    recommendationWrap.append(recommendationLabel, recommendationButtons);

    const finalLabel = document.createElement("label");
    finalLabel.className = "inline-final-name";
    finalLabel.classList.add("inline-final-compact");
    const finalText = document.createElement("span");
    finalText.textContent = "最终名称";
    const finalField = document.createElement("div");
    finalField.className = "inline-final-field";
    const finalInput = document.createElement("input");
    finalInput.type = "text";
    finalInput.value = asset.finalBaseName;
    finalInput.placeholder = "请选择推荐名称或手动输入";
    const finalMeaning = document.createElement("span");
    finalMeaning.className = "name-meaning";
    finalMeaning.dataset.meaningKey = getMeaningKey(asset.finalBaseName);
    finalMeaning.textContent = "中文含义：" + getDisplayMeaning(asset.finalBaseName);
    finalInput.addEventListener("input", () => {
      asset.finalBaseName = formatNamingName(finalInput.value);
      afterName.querySelector("strong").textContent = asset.finalBaseName ? buildExportName(asset) : "待命名";
      finalMeaning.dataset.meaningKey = getMeaningKey(asset.finalBaseName);
      finalMeaning.textContent = "中文含义：" + getDisplayMeaning(asset.finalBaseName);
      saveCurrentNamingSession();
    });
    finalField.append(finalInput, finalMeaning);
    finalLabel.append(finalText, finalField);

    const lexiconWrap = document.createElement("details");
    lexiconWrap.className = "inline-lexicon";
    lexiconWrap.open = Boolean(asset.lexiconOpen);
    lexiconWrap.addEventListener("toggle", () => {
      asset.lexiconOpen = lexiconWrap.open;
      saveCurrentNamingSession();
    });
    const lexiconSummary = document.createElement("summary");
    lexiconSummary.textContent = "词库";
    const lexiconContent = document.createElement("div");
    lexiconContent.className = "lexicon-content";
    const categories = buildLexiconCategories();
    if (!categories.some((category) => category.title === activeLexiconCategory)) activeLexiconCategory = categories[0]?.title || "";
    const tabs = document.createElement("div");
    tabs.className = "lexicon-tabs";
    const chips = document.createElement("div");
    chips.className = "lexicon-chips";
    const renderLexiconTerms = () => {
      chips.innerHTML = "";
      const currentParts = new Set(cleanNamingName(asset.finalBaseName).split(/_+/).map((part) => part.toLowerCase()).filter(Boolean));
      const category = categories.find((item) => item.title === activeLexiconCategory) || categories[0];
      (category?.terms || []).forEach((term) => {
        const selected = currentParts.has(term.toLowerCase());
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "lexicon-chip" + (selected ? " selected" : "");
        chip.textContent = term;
        chip.title = selected ? "再次点击移除：" + explainEnglishName(term) : explainEnglishName(term);
        chip.addEventListener("click", () => {
          asset.finalBaseName = toggleLexiconTerm(asset.finalBaseName, term);
          finalInput.value = asset.finalBaseName;
          afterName.querySelector("strong").textContent = asset.finalBaseName ? buildExportName(asset) : "待命名";
          finalMeaning.dataset.meaningKey = getMeaningKey(asset.finalBaseName);
          finalMeaning.textContent = "中文含义：" + getDisplayMeaning(asset.finalBaseName);
          const nextDuplicateStatus = getDuplicateStatus(asset);
          duplicateCheck.querySelector("strong").textContent = nextDuplicateStatus.message;
          duplicateCheck.classList.toggle("warning-line", nextDuplicateStatus.hasIssue);
          saveCurrentNamingSession();
          renderLexiconTerms();
        });
        chips.appendChild(chip);
      });
    };
    categories.forEach((category) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "lexicon-tab" + (category.title === activeLexiconCategory ? " active" : "");
      tab.textContent = category.title;
      tab.addEventListener("click", () => {
        activeLexiconCategory = category.title;
        tabs.querySelectorAll(".lexicon-tab").forEach((node) => node.classList.toggle("active", node === tab));
        renderLexiconTerms();
      });
      tabs.appendChild(tab);
    });
    renderLexiconTerms();
    lexiconContent.append(tabs, chips);
    lexiconWrap.append(lexiconSummary, lexiconContent);

    nameRow.append(prefix, project, view, finalLabel);
    editor.append(nameRow);
    if (listDisplayMode !== "compact") editor.append(recommendationWrap, lexiconWrap);
    row.append(checkbox, img, text, editor);
    els.assetList.appendChild(row);
  });
  renderListPager(els.assetList, renderLimit, visibleAssets.length, () => {
    assetRenderLimit = Math.min((assetRenderLimit || ASSET_RENDER_BATCH_SIZE) + ASSET_RENDER_BATCH_SIZE, visibleAssets.length);
    renderAssetList();
  });
  protectEditableShortcuts(els.assetList);
}

function renderNamingSessionList() {
  if (!els.namingSessionList) return;
  if (!namingSessions.length) {
    els.namingSessionList.innerHTML = "";
    return;
  }
  els.namingSessionList.innerHTML = "";
  namingSessions.forEach((session) => {
    const sessionAssets = session.id === activeNamingSessionId ? assets : session.assets || [];
    const doneCount = sessionAssets.filter((asset) => asset.finalBaseName).length;
    const issueCount = sessionAssets.filter((asset) => asset.dimensionIssue).length;
    const button = document.createElement("div");
    button.setAttribute("role", "button");
    button.tabIndex = 0;
    button.className = "naming-session-item" + (session.id === activeNamingSessionId ? " active" : "");
    button.dataset.sessionId = session.id;
    const name = document.createElement("strong");
    name.textContent = session.name;
    name.title = "双击修改记录名称";
    name.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      renameNamingSession(session.id);
    });
    const meta = document.createElement("span");
    meta.textContent = sessionAssets.length + " 张 / 完成 " + doneCount + (issueCount ? " / 问题 " + issueCount : "");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "session-delete";
    deleteButton.textContent = "×";
    deleteButton.title = "删除这条记录";
    deleteButton.setAttribute("aria-label", "删除命名记录：" + session.name);
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteNamingSession(session.id);
    });
    button.append(name, meta, deleteButton);
    button.addEventListener("click", () => switchNamingSession(session.id));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      switchNamingSession(session.id);
    });
    els.namingSessionList.appendChild(button);
  });
}

function buildDuplicateStatusContext() {
  const counts = new Map();
  assets.forEach((asset) => {
    if (!asset.finalBaseName) return;
    const exportName = buildExportName(asset).toLowerCase();
    counts.set(exportName, (counts.get(exportName) || 0) + 1);
  });
  const historicalMatch = getHistoricalModuleMatch();
  const historicalNames = new Set((historicalMatch?.filenames || []).map((name) => String(name).toLowerCase()));
  return { counts, historicalMatch, historicalNames };
}

function loadListDisplayMode() {
  return localStorage.getItem(LIST_DISPLAY_MODE_KEY) === "compact" ? "compact" : "full";
}

function fillListViewSortMode() {
  els.listViewSortMode.value = listDisplayMode + ":" + listSortMode;
}

function loadListSortMode() {
  return normalizeListSortMode(localStorage.getItem(LIST_SORT_MODE_KEY));
}

function normalizeListSortMode(mode) {
  return ["upload", "name-asc", "name-desc"].includes(mode) ? mode : "name-asc";
}

function parseListViewSortMode(value) {
  const [displayMode, sortMode] = String(value || "").split(":");
  return {
    displayMode: displayMode === "compact" ? "compact" : "full",
    sortMode: normalizeListSortMode(sortMode),
  };
}

function getVisibleAssets() {
  const visibleAssets = showProblemOnly ? assets.filter((asset) => asset.dimensionIssue) : [...assets];
  if (listSortMode === "upload") return visibleAssets;
  return [...visibleAssets].sort((left, right) => {
    const leftName = (left.originalBase + left.extension).trim();
    const rightName = (right.originalBase + right.extension).trim();
    const result = leftName.localeCompare(rightName, "zh-Hans-CN", { numeric: true, sensitivity: "base" });
    return listSortMode === "name-desc" ? -result : result;
  });
}

function renderDetectionList() {
  const issueCount = detectionAssets.filter((asset) => asset.hasIssue).length;
  const warningCount = detectionAssets.filter((asset) => asset.hasWarning).length;
  els.detectionCount.textContent = detectionAssets.length + " 张" + (issueCount ? " / " + issueCount + " 张问题" : "") + (warningCount ? " / " + warningCount + " 张警告" : "");
  syncDetectionFilterButtons();

  if (!detectionAssets.length) {
    els.detectionList.className = "asset-list-body empty-state";
    els.detectionList.textContent = "请先上传需要检测的切图文件夹";
    return;
  }

  const visibleAssets = showDetectionProblemOnly
    ? detectionAssets.filter((asset) => asset.hasIssue)
    : showDetectionWarningOnly
      ? detectionAssets.filter((asset) => asset.hasWarning && !asset.hasIssue).sort(compareDetectionWarnings)
      : detectionAssets;
  if (!visibleAssets.length) {
    els.detectionList.className = "asset-list-body empty-state";
    els.detectionList.textContent = showDetectionWarningOnly ? "当前没有警告图片" : "当前没有问题图片";
    return;
  }

  els.detectionList.className = "asset-list-body detection-list";
  els.detectionList.innerHTML = "";
  const renderLimit = Math.min(Math.max(detectionRenderLimit || DETECTION_RENDER_BATCH_SIZE, DETECTION_RENDER_BATCH_SIZE), visibleAssets.length);
  const renderedAssets = visibleAssets.slice(0, renderLimit);
  if (visibleAssets.length > renderLimit) {
    els.detectionCount.textContent += " / 已显示 " + renderLimit + " 张";
  }
  renderedAssets.forEach((asset) => {
    const row = document.createElement("div");
    row.className = "asset-item detection-item" + (asset.hasIssue ? " has-issue" : asset.hasWarning ? " has-warning" : " passed");

    const img = document.createElement("img");
    img.src = getAssetPreviewUrl(asset);
    img.alt = asset.name;
    img.loading = "lazy";
    img.decoding = "async";

    const meta = document.createElement("div");
    meta.className = "asset-meta";
    const status = document.createElement("span");
    status.className = "status-badge " + (asset.hasIssue ? "status-failed" : asset.hasWarning ? "status-running" : "status-done");
    status.textContent = asset.hasIssue ? "有问题" : asset.hasWarning ? "警告" : "通过";
    meta.append(
      createMetaLine("文件名称", asset.name),
      createMetaLine("分辨率", formatResolution(asset.dimensions)),
      createMetaLine("规格标注", asset.label),
      createMetaLine("检测结果", asset.hasIssue ? asset.messages.join("；") : asset.hasWarning ? asset.warnings.join("；") : (asset.notes || []).join("；") || "通过"),
      status
    );

    row.append(img, meta);
    els.detectionList.appendChild(row);
  });
  renderListPager(els.detectionList, renderLimit, visibleAssets.length, () => {
    detectionRenderLimit = Math.min((detectionRenderLimit || DETECTION_RENDER_BATCH_SIZE) + DETECTION_RENDER_BATCH_SIZE, visibleAssets.length);
    renderDetectionList();
  });
}

function renderListPager(container, renderedCount, totalCount, onMore) {
  if (renderedCount >= totalCount) return;
  const pager = document.createElement("div");
  pager.className = "list-pager";
  const text = document.createElement("span");
  text.textContent = "已显示 " + renderedCount + " / " + totalCount + " 张";
  const more = document.createElement("button");
  more.type = "button";
  more.className = "ghost-action";
  more.textContent = "继续显示";
  more.addEventListener("click", onMore);
  pager.append(text, more);
  container.appendChild(pager);
}

function compareDetectionWarnings(left, right) {
  return getDetectionWarningSortKey(left).localeCompare(getDetectionWarningSortKey(right), "zh-Hans-CN", {
    numeric: true,
    sensitivity: "base",
  });
}

function getDetectionWarningSortKey(asset) {
  const warningType = getDetectionWarningType(asset);
  const warningText = (asset.warnings || []).join("；");
  const width = String(asset.dimensions?.width || 0).padStart(5, "0");
  const height = String(asset.dimensions?.height || 0).padStart(5, "0");
  return [warningType, warningText, asset.label || "", width, height, asset.name || ""].join("|");
}

function getDetectionWarningType(asset) {
  const warnings = asset.warnings || [];
  if (warnings.some((message) => message.startsWith("疑似重复资源"))) return "01-疑似重复资源";
  if (warnings.some((message) => message.includes("单边2048") || message.includes("白名单审批"))) return "02-2048白名单风险";
  if (warnings.some((message) => message.includes("效果图尺寸"))) return "03-效果图尺寸提示";
  if (warnings.some((message) => message.includes("1024"))) return "04-1024以上提示";
  return "99-其他警告";
}

function createMetaLine(label, value) {
  const line = document.createElement("div");
  line.className = "meta-line";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  line.append(labelNode, valueNode);
  return line;
}

function formatResolution(dimensions) {
  if (!dimensions?.width || !dimensions?.height) return "无法读取";
  return dimensions.width + " x " + dimensions.height;
}

function getSizeCategoryLabel(dimensions) {
  const validation = validateUploadDimensions(dimensions);
  return validation.label || "通用";
}

function getAssetStatus(asset) {
  if (asset.namingStatus && asset.namingStatus !== "idle") return asset.namingStatus;
  return asset.finalBaseName ? "done" : "pending";
}

function getAssetStatusText(asset) {
  const status = getAssetStatus(asset);
  const labels = {
    pending: "待命名",
    running: "命名中",
    done: "已完成",
    failed: "失败",
  };
  return labels[status] || "待命名";
}
