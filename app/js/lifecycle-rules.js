/* NGRAI AutoName Tool V2.23 module: lifecycle-rules.js */
function init() {
  bindNavigation();
  bindRules();
  bindUploads();
  bindEditor();
  bindDetection();
  bindTranslator();
  protectEditableShortcuts();
  fillListViewSortMode();
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
  initNamingSessions();
  updateRulePreview();
  updateActiveRuleText();
  renderAssetList();
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
  els.tutorialEntry.addEventListener("click", openDetectionTutorial);
  els.guideEntry.addEventListener("click", startGuideTour);
  els.rulesEntry.addEventListener("click", () => showView("rules"));
  els.workEntry.addEventListener("click", () => showView("work"));
  els.detectEntry.addEventListener("click", () => showView("detect"));
  els.detectionSettingsEntry?.addEventListener("click", () => showView("detectionSettings"));
  els.backToDetection.addEventListener("click", () => showView("detect"));
  els.backButton.addEventListener("click", () => showView("home"));
  els.guidePrev.addEventListener("click", () => moveGuideStep(-1));
  els.guideNext.addEventListener("click", () => {
    if (guideStepIndex === guideSteps.length - 1) closeGuideTour();
    else moveGuideStep(1);
  });
  els.guideClose.addEventListener("click", closeGuideTour);
  els.tutorialPrev.addEventListener("click", () => moveDetectionTutorial(-1));
  els.tutorialNext.addEventListener("click", () => moveDetectionTutorial(1));
  els.tutorialClose.addEventListener("click", closeDetectionTutorial);
  els.tutorialOverlay.addEventListener("click", (event) => {
    if (event.target === els.tutorialOverlay) closeDetectionTutorial();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.tutorialOverlay.classList.contains("hidden")) closeDetectionTutorial();
    if (event.key === "Escape" && !els.guideOverlay.classList.contains("hidden")) closeGuideTour();
    if (els.tutorialOverlay.classList.contains("hidden")) return;
    if (event.key === "ArrowLeft") moveDetectionTutorial(-1);
    if (event.key === "ArrowRight") moveDetectionTutorial(1);
  });
  window.addEventListener("resize", () => {
    if (!els.guideOverlay.classList.contains("hidden")) showGuideStep(guideStepIndex);
  });
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

const detectionTutorialSlides = Array.from({ length: 10 }, (_, index) => {
  const page = String(index + 1).padStart(2, "0");
  return {
    src: "assets/tutorials/detection/slide-" + page + ".png",
    alt: "UI切图检测教程第 " + (index + 1) + " 页",
  };
});

function openDetectionTutorial() {
  tutorialSlideIndex = 0;
  preloadDetectionTutorialSlides();
  els.tutorialOverlay.classList.remove("hidden");
  els.tutorialOverlay.setAttribute("aria-hidden", "false");
  renderDetectionTutorialSlide();
}

function closeDetectionTutorial() {
  els.tutorialOverlay.classList.add("hidden");
  els.tutorialOverlay.setAttribute("aria-hidden", "true");
}

function moveDetectionTutorial(direction) {
  const nextIndex = Math.max(0, Math.min(tutorialSlideIndex + direction, detectionTutorialSlides.length - 1));
  if (nextIndex === tutorialSlideIndex) return;
  tutorialSlideIndex = nextIndex;
  renderDetectionTutorialSlide();
}

function renderDetectionTutorialSlide() {
  const slide = detectionTutorialSlides[tutorialSlideIndex];
  els.tutorialImage.src = slide.src;
  els.tutorialImage.alt = slide.alt;
  els.tutorialStepCount.textContent = tutorialSlideIndex + 1 + " / " + detectionTutorialSlides.length;
  els.tutorialPrev.disabled = tutorialSlideIndex === 0;
  els.tutorialNext.disabled = tutorialSlideIndex === detectionTutorialSlides.length - 1;
  els.tutorialNext.textContent = tutorialSlideIndex === detectionTutorialSlides.length - 1 ? "已到最后一页" : "下一页";
}

function preloadDetectionTutorialSlides() {
  detectionTutorialSlides.forEach((slide) => {
    if (slide.image) return;
    slide.image = new Image();
    slide.image.src = slide.src;
  });
}

const guideSteps = [
  {
    view: "home",
    selector: "#homeView",
    title: "从主界面开始",
    text: "这里是工具入口：开始命名用于批量改名，UI切图检测用于检查分辨率、格式和重复资源。",
  },
  {
    view: "rules",
    selector: "#rulesForm",
    title: "配置项目和方案",
    text: "在这里切换项目、项目配置方案、前缀和工程名。每个项目可以维护自己的知识库和命名规则。",
  },
  {
    view: "work",
    selector: "#uploadDropZone",
    title: "上传切图和参考图",
    text: "把文件夹拖进上传区域，或者补充上传单张图片；参考效果图会辅助 AI 理解界面语义。",
  },
  {
    view: "work",
    selector: ".naming-batch-tools",
    title: "填写当前界面命名参数",
    text: "这里控制当前批次的前缀、工程名、界面名、批量添加后缀和序号以及列表显示。工程名只使用你填写的内容。",
  },
  {
    view: "work",
    selector: ".work-toolbar .toolbar-actions",
    title: "运行命名",
    text: "先选择命名模式，再点击运行按钮。支持百度翻译 API、本地知识库和 AI 视觉命名，命名过程中可随时终止。",
  },
  {
    view: "work",
    selector: "#assetList",
    title: "逐张确认最终名称",
    text: "上传后图片会出现在这里。你可以查看推荐名、编辑最终名称、使用词库或筛选问题图片。",
  },
  {
    view: "work",
    selector: "#translatorPanel",
    title: "使用翻译面板辅助命名",
    text: "右侧翻译面板可以把中文文件名转成英文命名词，并一键填入当前选中图片的最终名称。",
    beforeShow: () => els.translatorPanel.classList.remove("collapsed"),
  },
  {
    view: "detect",
    selector: "#detectionDropZone",
    title: "检测切图规范",
    text: "在 UI切图检测页上传资源，工具会检查格式、分辨率、警告项和问题图片。",
  },
];

function startGuideTour() {
  guideStepIndex = 0;
  els.guideOverlay.classList.remove("hidden");
  els.guideOverlay.setAttribute("aria-hidden", "false");
  showGuideStep(guideStepIndex);
}

function moveGuideStep(direction) {
  showGuideStep(guideStepIndex + direction);
}

function showGuideStep(nextIndex) {
  const boundedIndex = Math.max(0, Math.min(nextIndex, guideSteps.length - 1));
  const step = guideSteps[boundedIndex];
  guideStepIndex = boundedIndex;
  showView(step.view);
  step.beforeShow?.();
  window.setTimeout(() => positionGuideStep(step), 60);
}

function positionGuideStep(step) {
  const target = document.querySelector(step.selector);
  if (!target) {
    if (guideStepIndex < guideSteps.length - 1) return showGuideStep(guideStepIndex + 1);
    return closeGuideTour();
  }
  target.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
  const rect = target.getBoundingClientRect();
  const padding = 8;
  els.guideHighlight.style.left = Math.max(8, rect.left - padding) + "px";
  els.guideHighlight.style.top = Math.max(8, rect.top - padding) + "px";
  els.guideHighlight.style.width = Math.min(window.innerWidth - 16, rect.width + padding * 2) + "px";
  els.guideHighlight.style.height = Math.min(window.innerHeight - 16, rect.height + padding * 2) + "px";
  els.guideTitle.textContent = step.title;
  els.guideText.textContent = step.text;
  els.guideStepCount.textContent = guideStepIndex + 1 + " / " + guideSteps.length;
  els.guidePrev.disabled = guideStepIndex === 0;
  els.guideNext.textContent = guideStepIndex === guideSteps.length - 1 ? "完成" : "下一步";
  placeGuidePopover(rect);
}

function placeGuidePopover(rect) {
  const popover = els.guidePopover;
  const width = Math.min(360, window.innerWidth - 28);
  popover.style.width = width + "px";
  let left = rect.right + 18;
  if (left + width > window.innerWidth - 14) left = rect.left - width - 18;
  if (left < 14) left = (window.innerWidth - width) / 2;
  let top = rect.top;
  const popoverHeight = popover.offsetHeight || 210;
  if (top + popoverHeight > window.innerHeight - 14) top = window.innerHeight - popoverHeight - 14;
  popover.style.left = Math.max(14, left) + "px";
  popover.style.top = Math.max(14, top) + "px";
}

function closeGuideTour() {
  els.guideOverlay.classList.add("hidden");
  els.guideOverlay.setAttribute("aria-hidden", "true");
}

function bindRules() {
  [els.projectConfigName, els.projectConfigDescription, els.schemeName, els.basePrefix, els.projectName, els.separator, els.tags, els.pageTerms, els.componentTerms, els.stateTerms, els.filenameRules, els.contextDocs, els.aiPromptText].forEach((input) => {
    input.addEventListener("input", () => {
      rules = collectRulesForm();
      if (input === els.projectName) els.workProjectName.value = rules.projectName;
      updateRulePreview();
      updateActiveRuleText();
      renderAssetList();
      syncSessionNamingParams();
    });
  });

  els.projectSelect.addEventListener("change", () => {
    saveCurrentNamingSession();
    switchProject(els.projectSelect.value);
  });

  els.schemeSelect.addEventListener("change", () => {
    saveCurrentNamingSession();
    switchScheme(els.schemeSelect.value);
  });

  els.workSchemeSelect.addEventListener("change", () => {
    saveCurrentNamingSession();
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
    syncSessionNamingParams();
  });

  els.workBasePrefix.addEventListener("change", () => {
    rules.basePrefix = els.workBasePrefix.value;
    els.basePrefix.value = rules.basePrefix;
    els.prefixPreset.value = getPrefixPresetValue(rules.basePrefix);
    saveRules(rules);
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
    syncSessionNamingParams();
  });

  els.workProjectName.addEventListener("input", () => {
    rules.projectName = sanitizeName(els.workProjectName.value) || defaultRules.projectName;
    els.projectName.value = rules.projectName;
    saveRules(rules);
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
    syncSessionNamingParams();
  });

  els.workViewName.addEventListener("input", () => {
    rules.viewName = sanitizeName(els.workViewName.value);
    saveRules(rules);
    updateRulePreview();
    updateActiveRuleText();
    renderAssetList();
    syncSessionNamingParams();
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
    syncSessionNamingParams();
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
    syncSessionNamingParams();
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
    syncSessionNamingParams();
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
  els.exportPromptText.addEventListener("click", exportPromptText);
  els.importPromptText.addEventListener("change", importPromptText);
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
  syncSessionNamingParams();
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
  syncSessionNamingParams();
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
  syncSessionNamingParams();
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
  syncSessionNamingParams();
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
  syncSessionNamingParams();
  showToast("已删除项目");
}
