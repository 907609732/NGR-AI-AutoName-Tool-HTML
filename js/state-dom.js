/* NGRAI AutoName Tool V2.0 module: state-dom.js */
let projects;
let activeProjectId;
let schemes;
let rules;
let aiSettings;
let translationSettings;
let assets;
let detectionProfiles;
let activeDetectionProfileId;
let detectionAssets;
let selectedId;
let referenceFile;
let namingController;
let stopRequested;
let showProblemOnly;
let showDetectionProblemOnly;
let showDetectionWarningOnly;
let toastTimer;
let activeLexiconCategory;
let listDisplayMode;
let listSortMode;
let knowledgeCacheKey;
let knowledgeCacheValue;

function bootstrapState() {
  projects = loadProjects();
  activeProjectId = loadActiveProjectId(projects);
  schemes = getActiveProject().schemes;
  rules = normalizeLoadedRules({ ...defaultRules, ...getProjectActiveScheme(getActiveProject()) });
  aiSettings = loadAiSettings();
  translationSettings = loadTranslationSettings();
  assets = [];
  detectionProfiles = loadDetectionProfiles();
  activeDetectionProfileId = loadActiveDetectionProfileId(detectionProfiles);
  detectionAssets = [];
  selectedId = null;
  referenceFile = null;
  namingController = null;
  stopRequested = false;
  showProblemOnly = false;
  showDetectionProblemOnly = false;
  showDetectionWarningOnly = false;
  toastTimer = null;
  activeLexiconCategory = "状态";
  listDisplayMode = loadListDisplayMode();
  listSortMode = loadListSortMode();
  knowledgeCacheKey = "";
  knowledgeCacheValue = null;
}

const els = {
  backButton: document.querySelector("#backButton"),
  pageHint: document.querySelector("#pageHint"),
  views: {
    home: document.querySelector("#homeView"),
    rules: document.querySelector("#rulesView"),
    work: document.querySelector("#workView"),
    detect: document.querySelector("#detectView"),
    detectionSettings: document.querySelector("#detectionSettingsView"),
  },
  rulesEntry: document.querySelector("#rulesEntry"),
  workEntry: document.querySelector("#workEntry"),
  detectEntry: document.querySelector("#detectEntry"),
  projectSelect: document.querySelector("#projectSelect"),
  projectConfigName: document.querySelector("#projectConfigName"),
  projectConfigDescription: document.querySelector("#projectConfigDescription"),
  schemeSelect: document.querySelector("#schemeSelect"),
  workSchemeSelect: document.querySelector("#workSchemeSelect"),
  schemeName: document.querySelector("#schemeName"),
  basePrefix: document.querySelector("#basePrefix"),
  prefixPreset: document.querySelector("#prefixPreset"),
  projectName: document.querySelector("#projectName"),
  workBasePrefix: document.querySelector("#workBasePrefix"),
  workProjectName: document.querySelector("#workProjectName"),
  workViewName: document.querySelector("#workViewName"),
  separator: document.querySelector("#separator"),
  tags: document.querySelector("#tags"),
  pageTerms: document.querySelector("#pageTerms"),
  componentTerms: document.querySelector("#componentTerms"),
  stateTerms: document.querySelector("#stateTerms"),
  filenameRules: document.querySelector("#filenameRules"),
  contextDocs: document.querySelector("#contextDocs"),
  aiProvider: document.querySelector("#aiProvider"),
  aiApiFormat: document.querySelector("#aiApiFormat"),
  aiBaseUrl: document.querySelector("#aiBaseUrl"),
  openaiApiKey: document.querySelector("#openaiApiKey"),
  openaiModel: document.querySelector("#openaiModel"),
  aiProviderNote: document.querySelector("#aiProviderNote"),
  saveAiSettings: document.querySelector("#saveAiSettings"),
  useTempAiSettings: document.querySelector("#useTempAiSettings"),
  testAiSettings: document.querySelector("#testAiSettings"),
  exportAiSettings: document.querySelector("#exportAiSettings"),
  importAiSettings: document.querySelector("#importAiSettings"),
  exportSchemeTemplate: document.querySelector("#exportSchemeTemplate"),
  importSchemeTemplate: document.querySelector("#importSchemeTemplate"),
  prefixPreview: document.querySelector("#prefixPreview"),
  saveRules: document.querySelector("#saveRules"),
  saveAsScheme: document.querySelector("#saveAsScheme"),
  deleteScheme: document.querySelector("#deleteScheme"),
  newProject: document.querySelector("#newProject"),
  saveProject: document.querySelector("#saveProject"),
  deleteProject: document.querySelector("#deleteProject"),
  resetRules: document.querySelector("#resetRules"),
  activeRuleText: document.querySelector("#activeRuleText"),
  uploadDropZone: document.querySelector("#uploadDropZone"),
  folderInput: document.querySelector("#folderInput"),
  singleInput: document.querySelector("#singleInput"),
  referenceInput: document.querySelector("#referenceInput"),
  referencePreviewWrap: document.querySelector("#referencePreviewWrap"),
  referencePreview: document.querySelector("#referencePreview"),
  referenceName: document.querySelector("#referenceName"),
  assetList: document.querySelector("#assetList"),
  fileCount: document.querySelector("#fileCount"),
  runNaming: document.querySelector("#runNaming"),
  runLocalNaming: document.querySelector("#runLocalNaming"),
  stopNaming: document.querySelector("#stopNaming"),
  exportFiles: document.querySelector("#exportFiles"),
  batchSuffix: document.querySelector("#batchSuffix"),
  batchSequenceStart: document.querySelector("#batchSequenceStart"),
  listDisplayMode: document.querySelector("#listDisplayMode"),
  listSortMode: document.querySelector("#listSortMode"),
  applySuffix: document.querySelector("#applySuffix"),
  applySequence: document.querySelector("#applySequence"),
  problemFilter: document.querySelector("#problemFilter"),
  removeSelected: document.querySelector("#removeSelected"),
  detectionProfileSelect: document.querySelector("#detectionProfileSelect"),
  detectionModeSelect: document.querySelector("#detectionModeSelect"),
  duplicateSensitivitySelect: document.querySelector("#duplicateSensitivitySelect"),
  detectionSettingsEntry: document.querySelector("#detectionSettingsEntry"),
  detectionSettingsProfileSelect: document.querySelector("#detectionSettingsProfileSelect"),
  detectionProfileName: document.querySelector("#detectionProfileName"),
  detectionProfileMode: document.querySelector("#detectionProfileMode"),
  duplicateSensitivityProfile: document.querySelector("#duplicateSensitivityProfile"),
  detectionMaxSide: document.querySelector("#detectionMaxSide"),
  detectionBgWidth: document.querySelector("#detectionBgWidth"),
  detectionBgHeight: document.querySelector("#detectionBgHeight"),
  detectionLargeThreshold: document.querySelector("#detectionLargeThreshold"),
  detectionLargeMultiple: document.querySelector("#detectionLargeMultiple"),
  detectionAtlasMultiple: document.querySelector("#detectionAtlasMultiple"),
  saveDetectionProfile: document.querySelector("#saveDetectionProfile"),
  newDetectionProfile: document.querySelector("#newDetectionProfile"),
  deleteDetectionProfile: document.querySelector("#deleteDetectionProfile"),
  backToDetection: document.querySelector("#backToDetection"),
  detectionDropZone: document.querySelector("#detectionDropZone"),
  detectionFolderInput: document.querySelector("#detectionFolderInput"),
  detectionSingleInput: document.querySelector("#detectionSingleInput"),
  detectionRulesToggle: document.querySelector("#detectionRulesToggle"),
  detectionRulesPanel: document.querySelector("#detectionRulesPanel"),
  detectionProblemFilter: document.querySelector("#detectionProblemFilter"),
  detectionWarningFilter: document.querySelector("#detectionWarningFilter"),
  clearDetectionAssets: document.querySelector("#clearDetectionAssets"),
  detectionCount: document.querySelector("#detectionCount"),
  detectionList: document.querySelector("#detectionList"),
  translatorPanel: document.querySelector("#translatorPanel"),
  translatorToggle: document.querySelector("#translatorToggle"),
  translatorClose: document.querySelector("#translatorClose"),
  translatorSettingsToggle: document.querySelector("#translatorSettingsToggle"),
  translatorSettings: document.querySelector("#translatorSettings"),
  translatorProvider: document.querySelector("#translatorProvider"),
  baiduTranslateAppId: document.querySelector("#baiduTranslateAppId"),
  baiduTranslateSecret: document.querySelector("#baiduTranslateSecret"),
  baiduTranslateEndpoint: document.querySelector("#baiduTranslateEndpoint"),
  saveTranslatorSettings: document.querySelector("#saveTranslatorSettings"),
  testTranslatorSettings: document.querySelector("#testTranslatorSettings"),
  translatorInput: document.querySelector("#translatorInput"),
  translatorToName: document.querySelector("#translatorToName"),
  translatorExplain: document.querySelector("#translatorExplain"),
  translatorOutput: document.querySelector("#translatorOutput"),
  toast: document.querySelector("#toast"),
};
