# BrewYuKoLi 通用 B 端官网框架 — 重构计划

**日期**: 2026-05-13
**目标**: 将 KitchenYuKoLi 抽取为通用 B 端/B+C 端官网脚手架框架
**核心价值**: 通过一个 `site.config.js` + 一套 CSS，快速搭建完整的企业官网

---

## 一、项目定位

| 维度 | 说明 |
|------|------|
| 目标用户 | B 端 / B+C 端企业官网（设备、制造、SaaS 等） |
| 快速搭建 | 提供一套 CSS + 导航配置 → 生成完整多语言响应式官网 |
| 保留能力 | 页面框架、数据加载、多语言框架（25 语言）、共用组件、三屏方案（PC/Tablet/Mobile）、ROI 计算器、询价系统、案例系统 |
| 仓库 | `https://github.com/leappower/BrewYuKoLi.git` |

---

## 二、现有代码分层（55 个 JS 文件，22,078 行）

### 2.1 通用框架层（直接保留，需配置化改造）

已完成的 ui-js-config（15 个文件）：
- ✅ `ui/navigator.js` — 导航栏，已读 `_cfg.nav`
- ✅ `ui/footer.js` — Footer，已读 `_cfg.footer`
- ✅ `ui/slide-menu.js` — 移动端菜单，已读 `_cfg.nav`
- ✅ `ui/floating-actions.js` — 浮动按钮，已读 `_cfg.contacts`
- ✅ `ui/products-dropdown.js` — 产品下拉，已读 `_cfg.nav`
- ✅ `ui/applications-dropdown.js` — 应用场景下拉
- ✅ `ui/support-dropdown.js` — 支持下拉
- ✅ `ui/about-dropdown.js` — 关于下拉
- ✅ `ui/contact-dropdown.js` — 联系下拉
- ✅ `contacts.js` — WhatsApp/社交渠道
- ✅ `router.js` — WhatsApp 号码 fallback
- ✅ `page-interactions.js` — 表单交互
- ✅ `ui/hero-video.js` — Hero 视频
- ✅ `ui/search-engine.js` — 搜索
- ✅ `ui/currency.js` — 货币切换

无需改造的纯通用模块：
- `main.js` — App 模块系统、懒加载、错误处理
- `common.js` — debounce/throttle/format
- `utils.js` / `utils/device-utils.js` / `utils/spa-events.js`
- `media-queries.js` — 响应式断点
- `ui/dropdown-base.js` / `ui/dropdown-styles.js` — 下拉菜单基类
- `ui/custom-select.js` — 自定义 select
- `ui/page-effects.js` — 页面动效
- `ui/form-interactions.js` — 表单增强
- `ui/helpers.js` — UI 工具
- `translations.js` — 翻译引擎（766 行，通用）
- `news-detail.js` — 新闻详情
- `quote-form.js` — 询价表单（B 端通用）
- `quote-budget-i18n.js` — 预算选项 i18n
- `vendor/chart.umd.min.js` — Chart.js（ROI 用）
- `vendor/html2canvas.min.js` — 截图功能（通用）
- `vendor/jspdf.umd.min.js` — PDF 生成（通用）

### 2.2 需数据化改造的业务文件

| # | 文件 | 行数 | 改造内容 | 优先级 |
|---|------|------|---------|--------|
| 1 | `roi-data.js` | 226 | ROI 系数表、薪资参考、设备投资区间、案例、WhatsApp 模板 → `site.config.roi` | P0 |
| 2 | `case-grid.js` | 385 | 8 个硬编码案例 + 4 组筛选 → `site.config.cases` | P0 |
| 3 | `cases-page.js` | 569 | 5 个详细案例数据 + 模态框 → `site.config.caseStudies` | P0 |
| 4 | `cross-sell.js` | 544 | 搭配推荐 + 场景入口 → `site.config.crossSell` | P0 |
| 5 | `breadcrumb.js` | ~400 | PRODUCT_SLUGS / APP_SLUGS / SUPPORT_SLUGS → `site.config.categories` | P0 |
| 6 | `lang-registry.js` | ~200 | 25 种语言硬编码 → `site.config.i18n.languages` | P1 |
| 7 | `image-assets.js` | ~80 | 静态图片映射 → `site.config.images` | P1 |
| 8 | `router.js` | ~200 | PAGES 常量 → `site.config.routes.pages` | P1 |
| 9 | `spa-router.js` | ~300 | 路由例外 → `site.config.routes.exceptions` | P1 |
| 10 | `init.js` | ~180 | IoT pulse + GEO hero → 可选功能开关 | P2 |
| 11 | `support-contact-channels.js` | ~30 | 支持渠道 → `site.config.contacts.support` | P2 |
| 12 | `support-wechat-modal.js` | ~30 | 微信弹窗 → `site.config.contacts.wechat` | P2 |
| 13 | `profit-calculator.js` | ~500 | 薪资数据外部化 → `site.config.roi.salaries` | P1 |

### 2.3 无需保留的厨具专用内容

以下将从 JS 中移除硬编码，仅通过 `site.config.js` 提供：
- 厨具产品分类名（翻炒系列、切配系列、煎炸系列…）
- 厨具行业场景名（小型餐饮、中央厨房、智慧食堂…）
- 厨具品牌名（YuKoLi、跃迁力科技）
- 厨具产品型号（YK-AW2000、YK-RC800 等）
- 厨具专属案例文案
- IoT 脉冲动画（IoT sensor node 相关）
- GEO 动态 hero（SEA 专区 vs Global）

---

## 三、`site.config.js` 设计

### 3.1 配置结构

```javascript
// site.config.js — 唯一站点配置入口
// 替换此文件即可搭建一个全新的 B 端官网
module.exports = {
  // ── 品牌 ──
  brand: {
    name: "YuKoLi",
    fullName: "YuKoLi Technology",
    fullNameCN: "跃迁力科技",
    slogan: { en: "...", "zh-CN": "..." },
    logo: "/assets/images/logo_html.webp",
    logoDark: "/assets/images/logo_html_2.webp",
    domain: "www.kitchen.yukoli.com",
    url: "https://www.kitchen.yukoli.com",
  },

  // ── SEO ──
  seo: {
    title: "YuKoLi 智能厨具 | 专业商用厨房设备制造商",
    description: "YuKoLi 跃迁力科技 — 20年专注...",
    ogImage: "/assets/images/logo_header.webp",
  },

  // ── 联系渠道 ──
  contacts: {
    whatsapp: "8613163756465",
    email: "info@yukoli.com",
    phone: "",
    social: {
      facebook: "", instagram: "", youtube: "",
      linkedin: "", tiktok: "", wechat: "",
    },
  },

  // ── 导航（含 CTA） ──
  nav: {
    items: [
      { id: "products", label: { en: "Products", "zh-CN": "产品中心" },
        children: [
          { id: "stirfry", label: { en: "Stir-fry", "zh-CN": "翻炒系列" }, icon: "local_fire_department", slug: "stirfry" },
          // ...
        ]
      },
      // ...
    ],
    cta: { text: { en: "Get Quote", "zh-CN": "获取报价" }, href: "/quote", i18nKey: "nav_get_quote" },
  },

  // ── Footer ──
  footer: {
    mobileItems: [...],
    tabletItems: [...],
  },

  // ── 页面分类体系 ──
  categories: {
    products: [
      { slug: "stirfry", key: "nav_products_stirfry", label: "翻炒系列", icon: "local_fire_department", emoji: "🔥" },
      // ...
    ],
    applications: [
      { slug: "small-restaurant", label: "小型餐饮", icon: "storefront", desc: "..." },
      // ...
    ],
    support: [
      { slug: "faq", label: "技术问答", icon: "help" },
      // ...
    ],
  },

  // ── 路由配置 ──
  routes: {
    pages: {
      home: "/home/", products: "/products/", quote: "/quote/",
      thankYou: "/thank-you/", support: "/support/", cases: "/cases/",
      roiCalculator: "/profit-calculator/",
    },
    exceptions: {
      "/": "/home/index.html",
      "/home/": "/home/index.html",
      "/news/detail/": "/news/detail-pc.html",
      "/applications/cases/": "/cases/index.html",
    },
  },

  // ── ROI 计算器数据 ──
  roi: {
    savingsTable: { ... },
    salaries: { ... },
    equipmentCost: { ... },
    exchangeRates: { ... },
    whatsappTemplates: { ... },
  },

  // ── 案例系统 ──
  cases: {
    grid: [ /* 8 条案例，供 case-grid.js */ ],
    detail: { /* 5 条详细案例，供 cases-page.js */ },
    filters: { ... },
  },

  // ── 搭配推荐 & 场景入口 ──
  crossSell: {
    map: { /* category → recommended items */ },
    scenes: { /* category → scene entries */ },
    appLabels: { /* slug → label */ },
  },

  // ── 图片资源 ──
  images: {
    static: { /* key → path */ },
    hero: "...", heroMain: "...",
  },

  // ── 多语言 ──
  i18n: {
    languages: [ /* 25 种语言定义 */ ],
    overrides: { /* 站点专用翻译覆盖 */ },
  },

  // ── 功能开关 ──
  features: {
    iotPulse: false,        // IoT 传感器脉冲动画
    geoHero: false,          // GEO 动态 hero badge
    smartPopup: true,        // 智能弹窗
    profitCalculator: true,  // ROI 计算器
    productCompare: true,    // 产品对比
    cases: true,             // 案例系统
    crossSell: true,         // 搭配推荐
    screenshot: true,        // html2canvas 截图
    pdfExport: true,         // jsPDF PDF 生成
  },
};
```

### 3.2 运行时加载方式

```html
<!-- 在 index.html 最早位置加载 -->
<script src="/site.config.js"></script>
<script>
  // webpack 构建时注入，或运行时全局挂载
  window.SITE_CONFIG = window.SITE_CONFIG || {};
</script>
```

所有模块统一通过 `var _cfg = window.SITE_CONFIG || {};` 读取配置，已有 fallback 值保障。

---

## 四、i18n 最小化方案

### 4.1 三层翻译架构

```
┌──────────────────────────────────────────────────┐
│ Layer 1: 框架内置 (~100-150 keys)                  │
│   导航骨架、表单元素、通用操作                        │
│   随框架发布，所有站点共享                            │
├──────────────────────────────────────────────────┤
│ Layer 2: UI 组件翻译 (现有 25 语言 JSON)              │
│   目前每个语言 ~数百 key                              │
│   需精简为 base subset（去掉业务专用 key）             │
│   文件: /assets/lang/{code}-ui.json                  │
├──────────────────────────────────────────────────┤
│ Layer 3: 站点专用 (site.config.js → i18n.overrides) │
│   hero 标题、产品分类名、案例文案、行业描述              │
│   随站点不同，放在 config 里                           │
└──────────────────────────────────────────────────┘
```

### 4.2 精简策略

| 类别 | 当前 key 数 | 目标 | 处理方式 |
|------|-----------|------|---------|
| 框架通用（导航/表单/按钮） | ~150 | 保留 | 内嵌在翻译引擎或 base JSON |
| 产品/业务专用 | ~300+ | 移除 | 迁移到 `site.config.i18n.overrides` |
| 案例文案 | ~50 | 移除 | 迁移到 `site.config.cases` |
| ROI 文案 | ~30 | 移除 | 迁移到 `site.config.roi` |
| 厨具品牌/型号名 | ~100 | 移除 | 迁移到 `site.config.brand` |

**每个新站点只需翻译 ~100-150 个框架 key + 站点专有文案**。

---

## 五、执行计划

### Phase 0: 基础搭建（本次）
- [ ] 创建 `site.config.js`（从现有文件提取所有硬编码数据）
- [ ] 创建 `docs/REFACTOR-PLAN.md`（本文档）
- [ ] Git init + 首次 commit + push

### Phase 1: 数据化改造 — P0 文件（子 agent 并行）

| Agent | 文件 | 改造内容 |
|-------|------|---------|
| agent-1 | `roi-data.js` | ROI 数据 → 读 `_cfg.roi` |
| agent-2 | `case-grid.js` | 案例+筛选 → 读 `_cfg.cases.grid` + `_cfg.cases.filters` |
| agent-3 | `cases-page.js` | 详细案例 → 读 `_cfg.cases.detail` |
| agent-4 | `cross-sell.js` | 搭配推荐 → 读 `_cfg.crossSell` + `_cfg.categories` |
| agent-5 | `breadcrumb.js` | 分类 slug → 读 `_cfg.categories` |

### Phase 2: 数据化改造 — P1 文件

| Agent | 文件 | 改造内容 |
|-------|------|---------|
| agent-6 | `lang-registry.js` | 语言列表 → 读 `_cfg.i18n.languages` |
| agent-7 | `image-assets.js` | 图片映射 → 读 `_cfg.images` |
| agent-8 | `router.js` + `spa-router.js` | 路由 → 读 `_cfg.routes` |
| agent-9 | `profit-calculator.js` | 薪资数据 → 读 `_cfg.roi.salaries` |

### Phase 3: 清理与优化

| 任务 | 说明 |
|------|------|
| `init.js` 清理 | IoT pulse + GEO hero 改为功能开关控制 |
| `index.html` 配置化 | 域名/SEO meta/品牌名 → 从 config 动态注入 |
| i18n 精简 | 移除业务专用 key，建立 base subset |
| 删除冗余 docs | 清理 KitchenYuKoLi 专用文档 |

### Phase 4: 项目文档

| 文档 | 说明 |
|------|------|
| `README.md` | 框架介绍、快速开始、站点搭建指南 |
| `AGENTS.md` | AI Agent 开发规范（适配通用框架） |
| `docs/ARCHITECTURE.md` | 更新架构图，标注配置化节点 |
| `docs/QUICK-START.md` | 新站点搭建 Checklist |

---

## 六、验收标准

1. **零硬编码**: 所有 JS 文件中不含厨具/品牌专属文案
2. **配置驱动**: 替换 `site.config.js` 即可生成新站点
3. **功能完整**: ROI 计算器、案例系统、询价系统正常工作
4. **三屏正常**: PC/Tablet/Mobile 布局无回归
5. **多语言正常**: 25 语言切换无回归
6. **Git 整洁**: 提交历史清晰，push 到 GitHub

---

## 七、风险与依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| zhipu API 配额（5/17 重置） | 子 agent 任务可能 429 | 用 fallback 模型或分批执行 |
| HTML 模板中硬编码 | 仅改 JS 不够，HTML 也要改 | Phase 3 统一处理 |
| Tailwind 品牌色硬编码 | `primary: #ec5b13` 写死 | CSS 变量方案（后续） |
