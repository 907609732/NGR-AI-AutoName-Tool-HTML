/* NGRAI AutoName Tool V2.6 module: lifecycle-rules.js */
function init() {
  bindNavigation();
  bindRules();
  bindUploads();
  bindEditor();
  bindDetection();
  bindTranslator();
  protectEditableShortcuts();
  fillListDisplayMode();
  fillListSortMode();
  fillRulesForm();
  fillDetectionProfileForm();
  fillAiSettings();
  fillTranslationSettings();
  upsertScheme(rules, false);
  saveProjects();
  renderProjectSelect();
  renderSchemeSelect();
  renderDetectionProfileSelect();
  renderDetectionList();
  syncWorkProjectFields();
  updateRulePreview();
  updateActiveRuleText();
}

function protectEditableShortcuts(root = document) {
  root.querySelectorAll("input, textarea").forEach((field) => {
    if (field.dataset.shortcutProtected) return;
    field.dataset.shortcutProtected = "true";
    ["keydown", "keyup", "keypress", "copy", "cut", "paste"].forEach((eventName) => {
      field.addEventListener(eventName, (event) => event.stopPropagation());
    });
  });
}

function bindNavigation() {
  els.rulesEntry.addEventListener("click", () => showView("rules"));
  els.workEntry.addEventListener("click", () => showView("work"));
  els.detectEntry.addEventListener("click", () => showView("detect"));
  els.detectionSettingsEntry?.addEventListener("click", () => showView("detectionSettings"));
  els.backToDetection.addEventListener("click", () => showView("detect"));
  els.backButton.addEventListener("click", () => showView("home"));
}

function showView(name) {
  Object.entries(els.views).forEach(([key, node]) => node.classList.toggle("active", key === name));
  els.backButton.classList.toggle("hidden", name === "home");
  els.rulesEntry.classList.toggle("hidden", name === "detect" || name === "detectionSettings");
  const hints = {
    home: "批量整理 UI 切图名称，让文件名保持统一、清楚、可追踪。",
    rules: "配置全局命名前缀、分隔符与通用标签。工程名可在开始命名页按当前界面填写。",
    work: "填写当前界面工程名，上传切图后可在每张图片旁边直接改名。",
    detect: "上传切图文件夹，按项目组规则检测分辨率是否符合规范。",
    detectionSettings: "单独配置 UI 切图检测项目组和分辨率参数。",
  };
  els.pageHint.textContent = hints[name];
}

function bindRules() {
  [els.projectConfigName, els.projectConfigDescription, els.schemeName, els.basePrefix, els.projectName, els.separator, els.tags, els.pageTerms, els.componentTerms, els.stateTerms, els.filenameRules, els.contextDocs].forEach((input) => {
    input.addEventListener("input", () => {
      rules = collectRulesForm();
      if (input === els.projectName) els.workProjectName.value = rules.projectName;
      updateRulePreview();
      updateActiveRuleText();
      renderAssetList();
    });
  });

  els.projectSelect.addEventListener("change", () => switchProject(els.projectSelect.value));

  els.schemeSelect.addEventListener("change", () => {
    switchScheme(els.schemeSelect.value);
  });

  els.workSchemeSelect.addEventListener("change", () => {
    switchScheme(els.workSchemeSelect.value);
  });

  els.prefixPreset.addEventListener("change", () => {
    if (!els.prefixPreset.value) return;
    const prefixValue = els.prefixPreset.value === "__none" ? "" : els.prefixPreset.value;
    els.basePrefix.value = prefixValue;
    els.workBasePrefix.value = prefixValue;
    rules = collectRulesForm();
    saveRules(rules);
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
  });

  els.workBasePrefix.addEventListener("change", () => {
    rules.basePrefix = els.workBasePrefix.value;
    els.basePrefix.value = rules.basePrefix;
    els.prefixPreset.value = getPrefixPresetValue(rules.basePrefix);
    saveRules(rules);
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
  });

  els.workProjectName.addEventListener("input", () => {
    rules.projectName = sanitizeName(els.workProjectName.value) || defaultRules.projectName;
    els.projectName.value = rules.projectName;
    saveRules(rules);
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
  });

  els.workViewName.addEventListener("input", () => {
    rules.viewName = sanitizeName(els.workViewName.value);
    saveRules(rules);
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
  });

  els.saveRules.addEventListener("click", () => {
    rules = collectRulesForm();
    saveRules(rules);
    upsertScheme(rules);
    saveProjectMeta();
    fillRulesForm();
    renderProjectSelect();
    renderSchemeSelect();
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
    showToast("项目配置方案已保存");
  });

  els.saveAsScheme.addEventListener("click", () => {
    rules = collectRulesForm();
    saveRules(rules);
    upsertScheme(rules);
    saveProjectMeta();
    fillRulesForm();
    renderProjectSelect();
    renderSchemeSelect();
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
    showToast("已保存配置方案：" + rules.schemeName);
  });

  els.deleteScheme.addEventListener("click", deleteCurrentScheme);
  els.newProject.addEventListener("click", createProject);
  els.saveProject.addEventListener("click", () => {
    saveProjectMeta();
    renderProjectSelect();
    showToast("项目已保存");
  });
  els.deleteProject.addEventListener("click", deleteCurrentProject);

  els.resetRules.addEventListener("click", () => {
    rules = { ...defaultRules };
    saveRules(rules);
    upsertScheme(rules);
    fillRulesForm();
    renderProjectSelect();
    renderSchemeSelect();
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
    showToast("已恢复默认规则");
  });

  [els.aiProvider, els.aiApiFormat, els.aiBaseUrl, els.openaiApiKey, els.openaiModel, els.aiProviderNote].forEach((input) => {
    input.addEventListener("input", () => {
      aiSettings = collectAiSettings();
    });
  });

  els.aiProvider.addEventListener("change", () => {
    applyProviderPreset();
    aiSettings = collectAiSettings();
  });

  els.saveAiSettings.addEventListener("click", () => {
    aiSettings = collectAiSettings();
    saveAiSettings(aiSettings);
    showToast("AI 配置已保存");
  });

  els.useTempAiSettings.addEventListener("click", useTempAiSettings);

  els.testAiSettings.addEventListener("click", testAiSettings);

  els.exportAiSettings.addEventListener("click", exportAiSettings);
  els.importAiSettings.addEventListener("change", importAiSettings);

  els.exportSchemeTemplate.addEventListener("click", exportSchemeTemplate);
  els.importSchemeTemplate.addEventListener("change", importSchemeTemplate);
}

function switchScheme(schemeName) {
  const selected = schemes.find((scheme) => scheme.schemeName === schemeName);
  if (!selected) return;
  rules = normalizeLoadedRules({ ...defaultRules, ...selected });
  getActiveProject().activeSchemeName = rules.schemeName;
  saveProjects();
  saveRules(rules);
  fillRulesForm();
  renderProjectSelect();
  renderSchemeSelect();
  syncWorkProjectFields();
  updateRulePreview();
  updateActiveRuleText();
  renderAssetList();
  showToast("已切换配置方案");
}

function createProject() {
  const index = projects.length + 1;
  const project = {
    id: "project-" + Date.now(),
    name: "新项目 " + index,
    description: "新的项目命名配置",
    activeSchemeName: "默认配置方案",
    schemes: [
      normalizeLoadedRules({
        ...defaultRules,
        schemeName: "默认配置方案",
        projectName: "NewProject",
        contextDocs: "填写这个项目的页面结构、组件约定和命名偏好。AI 命名时会参考这里的内容。",
      }),
    ],
  };
  projects.push(project);
  activeProjectId = project.id;
  schemes = project.schemes;
  rules = normalizeLoadedRules({ ...defaultRules, ...schemes[0] });
  saveProjects();
  saveRules(rules);
  fillRulesForm();
  renderProjectSelect();
  renderSchemeSelect();
  syncWorkProjectFields();
  updateRulePreview();
  updateActiveRuleText();
  renderAssetList();
  showToast("已新建项目");
}

function switchProject(projectId) {
  const nextProject = projects.find((project) => project.id === projectId);
  if (!nextProject) return;
  activeProjectId = projectId;
  localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
  schemes = nextProject.schemes.length ? nextProject.schemes : [normalizeLoadedRules({ ...defaultRules })];
  nextProject.schemes = schemes;
  rules = normalizeLoadedRules({ ...defaultRules, ...getProjectActiveScheme(nextProject) });
  saveProjects();
  saveRules(rules);
  fillRulesForm();
  renderProjectSelect();
  renderSchemeSelect();
  syncWorkProjectFields();
  updateRulePreview();
  updateActiveRuleText();
  renderAssetList();
  showToast("已切换项目");
}

function saveProjectMeta() {
  const project = getActiveProject();
  project.name = els.projectConfigName.value.trim() || project.name || "未命名项目";
  project.description = els.projectConfigDescription.value.trim();
  project.activeSchemeName = rules.schemeName;
  saveProjects();
}

function deleteCurrentScheme() {
  if (schemes.length <= 1) {
    showToast("至少保留一个配置方案");
    return;
  }
  const target = rules.schemeName;
  schemes = schemes.filter((scheme) => scheme.schemeName !== target);
  const project = getActiveProject();
  project.schemes = schemes;
  rules = normalizeLoadedRules({ ...defaultRules, ...schemes[0] });
  project.activeSchemeName = rules.schemeName;
  saveProjects();
  saveRules(rules);
  fillRulesForm();
  renderProjectSelect();
  renderSchemeSelect();
  syncWorkProjectFields();
  updateRulePreview();
  updateActiveRuleText();
  renderAssetList();
  showToast("已删除配置方案");
}

function deleteCurrentProject() {
  if (projects.length <= 1) {
    showToast("至少保留一个项目");
    return;
  }
  projects = projects.filter((project) => project.id !== activeProjectId);
  activeProjectId = projects[0].id;
  schemes = getActiveProject().schemes;
  rules = normalizeLoadedRules({ ...defaultRules, ...schemes[0] });
  saveProjects();
  localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
  saveRules(rules);
  fillRulesForm();
  renderProjectSelect();
  renderSchemeSelect();
  syncWorkProjectFields();
  updateRulePreview();
  updateActiveRuleText();
  renderAssetList();
  showToast("已删除项目");
}
