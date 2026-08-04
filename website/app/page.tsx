import { MotionController } from "./motion";

const githubUrl = "https://github.com/907609732/NGR-AI-AutoName-Tool";

const features = [
  {
    code: "AI",
    title: "多模式智能命名",
    description: "结合 AI 视觉、百度翻译 API 与本地知识库，为批量切图生成清晰、统一的英文名称。",
  },
  {
    code: "KB",
    title: "项目专属知识库",
    description: "按项目维护页面、组件、状态与关键词规则，让每个团队都能沉淀自己的命名习惯。",
  },
  {
    code: "QC",
    title: "UI 切图规范检测",
    description: "在资源入库前检查格式、分辨率、大图尺寸、图标规格与疑似重复文件。",
  },
  {
    code: "FX",
    title: "批量整理与导出",
    description: "逐张确认最终名称，统一追加后缀和序号；导出时只改文件名，不重新编码图片。",
  },
  {
    code: "LC",
    title: "本地优先工作流",
    description: "核心整理、知识库与检测流程都可在浏览器本地运行，重要资源始终由你掌控。",
  },
  {
    code: "TM",
    title: "多项目多方案",
    description: "为不同项目组保存独立规则、上下文和提示词，在多套界面之间快速切换。",
  },
];

const steps = [
  {
    number: "01",
    title: "导入资源",
    description: "选择切图文件夹，按需补充参考效果图和当前界面信息。",
  },
  {
    number: "02",
    title: "生成并确认",
    description: "运行合适的命名模式，使用词库建议逐张校准最终名称。",
  },
  {
    number: "03",
    title: "检测与交付",
    description: "完成规范检测后批量下载，让资源以统一命名进入项目。",
  },
];

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`logo-mark${compact ? " logo-mark-compact" : ""}`} aria-hidden="true">
      <span className="logo-ring" />
      <span className="logo-needle" />
      <span className="logo-core" />
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <MotionController />
      <header className="site-header" data-site-header>
        <a className="brand" href="#top" aria-label="NGR AssetPilot 首页">
          <LogoMark compact />
          <span className="brand-copy">
            <strong>NGR AssetPilot</strong>
            <small>AI资源领航</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="主导航">
          <a href="#features">核心能力</a>
          <a href="#workflow">使用流程</a>
          <a href="#security">安全说明</a>
        </nav>
        <a className="header-cta" href={githubUrl} target="_blank" rel="noreferrer">
          GitHub 下载
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <div className="eyebrow"><span /> V2.23 · 游戏 UI 资源工作台</div>
          <h1>让每一张 UI 资源，<br /><em>驶向正确的名字。</em></h1>
          <p>
            NGR AssetPilot 将 AI 命名、团队知识库、规范检测和批量导出放进一个本地工作流，
            帮助美术与项目组更快整理资源、更少出错。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href={githubUrl} target="_blank" rel="noreferrer">
              前往 GitHub 下载 <span aria-hidden="true">↗</span>
            </a>
            <a className="secondary-button" href="#features">查看核心能力</a>
          </div>
          <ul className="hero-notes" aria-label="产品特性">
            <li><span>✓</span> 本地优先</li>
            <li><span>✓</span> 批量处理</li>
            <li><span>✓</span> 团队规则可配置</li>
          </ul>
        </div>

        <div className="product-stage" aria-label="NGR AssetPilot 产品界面示意">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="product-window">
            <div className="window-bar">
              <div className="window-brand"><LogoMark compact /><strong>NGR AssetPilot</strong></div>
              <span className="window-version">V2.23</span>
            </div>
            <div className="window-body">
              <aside className="window-sidebar">
                <span className="side-item active"><i>01</i> 开始命名</span>
                <span className="side-item"><i>02</i> 项目知识库</span>
                <span className="side-item"><i>03</i> 切图检测</span>
              </aside>
              <div className="window-content">
                <div className="content-heading">
                  <div><small>当前项目</small><strong>NGR / Home</strong></div>
                  <button type="button">运行智能命名</button>
                </div>
                <div className="asset-row">
                  <span className="asset-thumb thumb-one" />
                  <span className="asset-origin">首页按钮.png</span>
                  <span className="asset-arrow">→</span>
                  <strong>T_UI_NGR_Home_Button</strong>
                  <span className="pass-pill">已通过</span>
                </div>
                <div className="asset-row">
                  <span className="asset-thumb thumb-two" />
                  <span className="asset-origin">商城背景.png</span>
                  <span className="asset-arrow">→</span>
                  <strong>T_UI_NGR_Shop_BG</strong>
                  <span className="pass-pill">已通过</span>
                </div>
                <div className="asset-row">
                  <span className="asset-thumb thumb-three" />
                  <span className="asset-origin">背包图标.png</span>
                  <span className="asset-arrow">→</span>
                  <strong>T_UI_Icon_NGR_Bag</strong>
                  <span className="review-pill">待确认</span>
                </div>
                <div className="progress-card">
                  <div><span>命名进度</span><strong>18 / 20</strong></div>
                  <div className="progress-track"><span /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-status"><span>✓</span><div><small>规范检测</small><strong>18 项已通过</strong></div></div>
        </div>
      </section>

      <section className="signal-strip" aria-label="产品特点概览">
        <div><strong>3</strong><span>种命名模式</span></div>
        <div><strong>多项目</strong><span>规则与知识库隔离</span></div>
        <div><strong>本地优先</strong><span>资源处理更安心</span></div>
        <div><strong>原图无损</strong><span>导出只修改文件名</span></div>
      </section>

      <section className="section features-section" id="features">
        <div className="section-heading">
          <span className="section-label">CORE CAPABILITIES</span>
          <h2>从命名到检测，<br />一站式整理 UI 资源</h2>
          <p>把重复、琐碎、容易出错的资源整理步骤，变成清晰可追踪的标准流程。</p>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.code}>
              <div className="feature-top">
                <span className="feature-code">{feature.code}</span>
                <span className="feature-index">0{index + 1}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section workflow-section" id="workflow">
        <div className="workflow-intro">
          <span className="section-label light">WORKFLOW</span>
          <h2>三步完成<br />资源标准化</h2>
          <p>从原始切图到可直接交付的规范资源，让团队拥有一致、可靠的整理节奏。</p>
        </div>
        <div className="steps-list">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span>{step.number}</span>
              <div><h3>{step.title}</h3><p>{step.description}</p></div>
              <i aria-hidden="true">↗</i>
            </article>
          ))}
        </div>
      </section>

      <section className="section security-section" id="security">
        <div className="security-visual">
          <div className="security-rings"><LogoMark /></div>
          <span className="local-chip chip-one">LOCAL</span>
          <span className="local-chip chip-two">PNG</span>
          <span className="local-chip chip-three">RULES</span>
        </div>
        <div className="security-copy">
          <span className="section-label">LOCAL FIRST</span>
          <h2>资源留在本地，<br />能力由你选择</h2>
          <p>图片尺寸、规范和相似度检测在浏览器本地完成。只有在你主动配置并运行视觉 AI 时，才会调用对应服务。</p>
          <ul>
            <li><span>01</span><div><strong>无需上传服务器</strong><small>基础命名、知识库和检测可本地运行</small></div></li>
            <li><span>02</span><div><strong>API 配置由你管理</strong><small>服务类型、接口地址与模型均可自行选择</small></div></li>
            <li><span>03</span><div><strong>导出不重编码</strong><small>保留原始图片内容，只更新文件名称</small></div></li>
          </ul>
        </div>
      </section>

      <section className="download-section">
        <div className="download-logo"><LogoMark /></div>
        <span className="section-label light">READY TO START</span>
        <h2>让资源管理，从名字开始变简单。</h2>
        <p>下载 NGR AssetPilot｜AI资源领航，建立属于团队自己的 UI 资源规范工作流。</p>
        <a className="primary-button lime" href={githubUrl} target="_blank" rel="noreferrer">
          在 GitHub 获取项目 <span aria-hidden="true">↗</span>
        </a>
        <small>当前版本 V2.23 · 更新于 2026-06-29</small>
      </section>

      <footer>
        <div className="footer-brand"><LogoMark compact /><div><strong>NGR AssetPilot</strong><small>AI资源领航</small></div></div>
        <p>面向游戏 UI 资源整理流程的本地 AI 工作台。</p>
        <div className="footer-links">
          <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>
          <a href="mailto:907609732@qq.com">联系作者</a>
        </div>
        <span>© 2026 by 五成（月财）</span>
      </footer>
    </main>
  );
}
