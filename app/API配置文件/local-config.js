window.NGR_LOCAL_AI_CONFIG = {
  provider: "openai",
  apiFormat: "responses",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini",
  providerNote: "OpenAI 配置留空，当前临时测试优先使用 Kimi"
};

window.NGR_LOCAL_KIMI_CONFIG = {
  provider: "kimi",
  apiFormat: "chat",
  baseUrl: "https://api.moonshot.cn/v1",
  apiKey: "sk-WswTKghm5M9slN1KbFzpxVoIsszr9cQP79yPw9a8BR2C8cPd",
  model: "moonshot-v1-8k-vision-preview",
  providerNote: "Kimi / Moonshot 视觉模型"
};

window.NGR_LOCAL_TRANSLATION_CONFIG = {
  provider: "baidu",
  baiduAppId: "20260601002624122",
  baiduSecret: "_0WK3DDHa56FcJvxXeM2",
  baiduEndpoint: "https://fanyi-api.baidu.com/api/trans/vip/translate",
  textBaseUrl: "https://api.openai.com/v1",
  textApiKey: "",
  textModel: "gpt-4.1-mini"
};
