window.NGR_LOCAL_AI_CONFIG = {
  provider: "openai",
  apiFormat: "responses",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini",
  providerNote: "请在软件设置中仅于本机配置 API"
};

window.NGR_LOCAL_KIMI_CONFIG = {
  provider: "kimi",
  apiFormat: "chat",
  baseUrl: "https://api.moonshot.cn/v1",
  apiKey: "",
  model: "moonshot-v1-8k-vision-preview",
  providerNote: "Kimi / Moonshot 配置默认留空"
};

window.NGR_LOCAL_TRANSLATION_CONFIG = {
  provider: "baidu",
  baiduAppId: "",
  baiduSecret: "",
  baiduEndpoint: "https://fanyi-api.baidu.com/api/trans/vip/translate",
  textBaseUrl: "https://api.openai.com/v1",
  textApiKey: "",
  textModel: "gpt-4.1-mini"
};