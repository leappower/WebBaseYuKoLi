# ARCHITECTURE.md — 项目架构 v2.2 (BrewYuKoLi)

> **最后更新**：2026-05-23
> **当前架构**：SWUP SPA + SSG 三屏分离 + 骨架屏 CSS 过渡
> **分支**：feat/swup-replace-spa-v2 → dev

---

## 目录

1. [整体架构概览](#1-整体架构概览)
2. [请求处理流程](#2-请求处理流程)
3. [前端运行时架构](#3-前端运行时架构)
4. [SWUP SPA 路由系统](#4-swup-spa-路由系统)
5. [SSG 三屏构建系统](#5-ssg-三屏构建系统)
6. [骨架屏过渡系统](#6-骨架屏过渡系统)
7. [JS 模块完整索引](#7-js-模块完整索引)
8. [数据流](#8-数据流)
9. [构建与部署](#9-构建与部署)
10. [产品分类与路由映射](#10-产品分类与路由映射)

---

## 1. 整体架构概览

```
                    请求进入
                       │
              ┌────────▼────────┐
              │   server.js     │  Express (Node.js)
              │   端口 3099     │  HTTPS 端口可配
              │   dist/ 静态    │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    直接请求        首次访问       CDN/GitHub Pages
    /home/          /              静态部署
    返回 SSG      返回 index.html
    index-pc.html  SPA Shell
          │            │
          │       ┌────▼────┐
          │       │ SWUP 启用│
          │       │ 检测容器 │
          │       │ 状态     │
          │       └────┬────┘
          │         ┌──┴──┐
          │    容器空│      │容器有内容
          │         │      │(SSG模式)
          │    swup.│      │
          │    navigate│   │hideSkeleton()
          │    → fetch │   │→ 内容fadeIn
          │    当前路由│   │
          │         └──┘  │
          │               │
          └───────┬───────┘
                  │
            SWUP 接管导航
            客户端 SPA 路由
            每次导航→ fetch
            device-specific SSG
```

### 核心设计决策

| 决策 | 原因 |
|------|------|
| **SSG 预渲染 + SWUP SPA 路由** | SEO 友好 + 零刷新导航体验 |
| **三屏分离 (PC/Tablet/Mobile)** | 每种设备独立 HTML 布局 |
| **SWUP v4.9.0** 替代手工 SpaRouter | 消除 ~1000 行 DIY 代码 |
| **SSG 作为 SWUP 数据源** | 导航时 fetch 设备特定 SSG HTML |
| **骨架屏 CSS 过渡** | `opacity` transition 代替 `display:none` |

---

## 2. 请求处理流程

### 2.1 server.js 路由解析

```
请求 /home/
  │
  ├─ path.join(dist, '/home/')           → 不存在（目录）
  ├─ path.join(dist, 'pages', '/home/')  → 不存在（目录）
  ├─ 尝试 index.html 变体:
  │   ├─ dist/pages/home/index.html       → 不存在
  │   ├─ dist/pages/home/index-pc.html    → 存在 ✅ 返回
  │   └─ dist/pages/home-pc.html          → 回退
  └─ 都不存在 → 返回 dist/index.html (SPA Shell)
```

### 2.2 三种运行模式

```
模式 1: SPA Shell (从 / 访问)
  → index.html #spa-content 为空
  → SWUP enable hook → swup.navigate("/home/")
  → fetch /home/index-pc.html → 填充 → hideSkeleton()

模式 2: SSG 预渲染 (直接访问 /home/)
  → 返回完整 HTML（含 navigator, footer, 内容）
  → SWUP enable hook 检测容器有内容 → hideSkeleton()

模式 3: 静态部署 (GitHub Pages / CDN)
  → 同模式 2，直接 serve dist/
```

---

## 3. 前端运行时架构

### 3.1 脚本加载顺序

```
阶段 1: Vendor 库（先于业务模块）
  ├─ device-utils.js         → 设备检测
  ├─ swup.umd.js             → SWUP 核心 v4.9.0
  ├─ swup-head-plugin.umd.js
  ├─ swup-scroll-plugin.umd.js
  ├─ swup-scripts-plugin.umd.js
  ├─ swup-debug-plugin.umd.js
  └─ swup-init.js            → SWUP 初始化 + SpaRouter 兼容层

阶段 2: 国际化 + UI 组件
  ├─ lang-registry.js, translations.js
  ├─ translations-dropdown-template.js
  ├─ dropdown-styles.js, dropdown-base.js
  ├─ products-dropdown.js, applications-dropdown.js
  ├─ support-dropdown.js, about-dropdown.js
  ├─ nav-dropdown.js, navigator.js
  ├─ slide-menu.js, search-engine.js
  ├─ footer.js, floating-actions.js
  └─ contacts.js

阶段 3: 业务模块
  ├─ product-grid.js, product-detail.js
  ├─ home-core-products.js, currency.js
  └─ page-init.js（spa:load 监听 + 页面 wiring）

阶段 4: 产品数据
  └─ product-data-table.js（内联脚本，ETag/缓存）
```

### 3.2 模块分类

```
核心引擎层
  ├─ swup-init.js           SWUP 初始化、路由映射、骨架屏控制
  ├─ spa-router.js          旧版 SPA 路由器 (保留不加载)
  ├─ device-utils.js        设备检测、断点匹配
  └─ translations.js        国际化引擎

UI 组件层 (15+ 文件)
  ├─ navigator.js           PC/Tablet 顶部导航
  ├─ footer.js              页脚
  ├─ floating-actions.js    Mobile FAB
  ├─ slide-menu.js          移动端侧滑菜单
  ├─ search-engine.js       站内搜索
  └─ ...下拉菜单组件

业务模块层 (10+ 文件)
  ├─ product-grid.js        产品网格
  ├─ product-detail.js      产品详情
  ├─ home-core-products.js  首页核心产品
  ├─ case-grid.js           案例网格
  ├─ page-init.js           页面 wiring + spa:load 监听
  └─ product-data-table.js  产品数据表
```

---

## 4. SWUP SPA 路由系统

### 4.1 SWUP Hooks 流转

```
enable        → 首次启动: 空容器→navigate 或 hideSkeleton
visit:start   → showSkeleton() + 清除 .swup-fade-in
fetch:request → routeToFetchUrl() 改写 fetch URL
content:replace → hideSkeleton() + runPageInitByRoute() + updateActiveState()
page:view     → dispatchEvent("spa:load") 兼容事件
visit:end     → __spaNavigating = false
```

### 4.2 设备感知 URL 映射

```
用户看到的 URL         SWUP fetch 的 URL (PC)
─────────────────────  ──────────────────────────
/ /home/               /home/index-pc.html
/products/             /products/index-pc.html
/products/coffee/      /products/coffee/index-pc.html
/products/<model>/     /products/detail/index-pc.html
/solutions/oem/        /solutions/oem/index-pc.html
/manufacturing/        /manufacturing/index-pc.html
/compliance/           /compliance/index-pc.html
/cases/                /cases/index-pc.html
/resources/catalog/    /resources/catalog/index-pc.html
/news/detail/          /news/detail-pc.html (flat-file)

设备后缀:
  PC     (w >= 1280): index-pc.html
  Tablet (768-1279):  index-tablet.html
  Mobile (w < 768):   index-mobile.html
```

### 4.3 SpaRouter 兼容层

```javascript
window.SpaRouter = {
  navigate: function(path) { swup.navigate(url); },
  replace:  function(path) { swup.navigate(url, { history: "replace" }); },
  getCurrentPath: function() { /* 从 location.pathname 解析 */ },
};
```

---

## 5. SSG 三屏构建系统

### 5.1 页面层级

```
src/pages/
├── home/                 (三屏: index-pc/mobile/tablet.html)
├── products/
│   ├── all/ (三屏)
│   ├── coffee/ (三屏)
│   ├── tea/, meal/, beauty/, weight/, gut/, lifestyle/, legacy/ (三屏)
│   └── detail/ (三屏 + index.html)
├── solutions/
│   ├── oem/ (三屏)
│   ├── odm/ (三屏)
│   ├── obm/ (三屏)
│   ├── rd/ (三屏)
│   └── packaging/ (三屏)
├── manufacturing/ (三屏)
├── compliance/ (三屏)
├── cases/ (三屏)
├── resources/
│   ├── catalog/ (三屏)
│   ├── videos/ (三屏)
│   └── whitepapers/ (三屏)
├── support/ (三屏)
├── about/, contact/, landing/, thank-you/ (三屏)
└── applications/ (三屏)
```

总计: 88 个 SSG HTML 文件

### 5.2 build.sh 构建流程

```
npm run build
  ├─ site.config.js → dist/
  ├─ src/pages/**/*.html → dist/pages/
  ├─ src/assets/js/ → dist/assets/js/ (含 vendor/)
  ├─ src/assets/css/ → dist/assets/css/
  ├─ src/assets/lang/ → dist/assets/lang/
  ├─ src/assets/images/ → dist/assets/images/ (增量)
  ├─ src/index.html → dist/index.html
  ├─ 版本戳: ?v=OLD → ?v=TIMESTAMP
  └─ sitemap.xml (47 URLs)
```

---

## 6. 骨架屏过渡系统

### 6.1 CSS transition 方案

```css
#skeleton-overlay {
  opacity: 1;
  transition: opacity 350ms ease-out;
}
#skeleton-overlay[hidden] {
  opacity: 0;
  pointer-events: none;
}
#spa-content {
  opacity: 0;
  transition: opacity 350ms ease-in;
}
#spa-content.swup-fade-in {
  opacity: 1;
}
```

### 6.2 过渡时序

```
0ms     → skeleton fadeOut 开始 (opacity 1→0, 350ms)
350ms   → skeleton 不可见
350ms+  → content fadeIn (opacity 0→1)
700ms   → 过渡完成
```

---

## 7. JS 模块完整索引

| 文件 | 作用 | 依赖 |
|------|------|------|
| `swup-init.js` | SWUP 初始化 + 路由 + 骨架屏 | Swup + plugins |
| `spa-router.js` | 旧版 SPA 路由器（保留不加载）| 无 |
| `device-utils.js` | 设备检测 | 无 |
| `translations.js` | 国际化引擎 | 无 |
| `navigator.js` | PC/Tablet 导航 | SITE_CONFIG |
| `footer.js` | 页脚 | SITE_CONFIG |
| `page-init.js` | 页面 wiring + spa:load 监听 | 无 |
| `product-grid.js` | 产品网格 | 外部 API |
| `product-detail.js` | 产品详情 | 外部 API |
| `home-core-products.js` | 首页核心产品 | 无 |

---

## 8. 数据流

### 8.1 配置 → 渲染

```
site.config.js → window.SITE_CONFIG → 所有模块读取
  ├─ brand.* → navigator, footer, meta
  ├─ nav.items → navigator 菜单渲染
  ├─ contacts.* → footer, floating-actions
  ├─ categories.products → 产品分类 (spa-router, swup-init)
  └─ seo.* → <meta> 标签
```

### 8.2 SWUP 导航数据流

```
点击链接 → SWUP intercept → routeToFetchUrl(path)
  → fetch device-specific SSG HTML
  → 解析: HeadPlugin 更新 <head>
         #spa-content 内容替换
         persist: navigator, footer
         ScriptsPlugin: data-swup-reload-script
  → content:replace → runPageInitByRoute() → dispatchSpaLoad()
```

---

## 9. 构建与部署

### 9.1 开发命令

```bash
npm run dev              # nodemon server.js (端口 3099)
npm run build            # ./build.sh
npm run watch            # fswatch src/ → ./build.sh
npm run test:e2e         # Playwright
```

### 9.2 部署

| 目标 | 配置 |
|------|------|
| Node.js Server | server.js 端口 3099 |
| GitHub Pages | dist/ 静态 serve |
| HTTPS | SSL_PORT 环境变量 |

---

## 10. 产品分类与路由映射

### 10.1 产品分类（健康产品线）

```
categories.products (site.config.js):
  all       → 全部产品
  coffee    → 咖啡系列
  tea       → 茶饮系列
  meal      → 代餐系列
  beauty    → 胶原养颜
  weight    → 体重管理
  gut       → 肠道健康
  lifestyle → 功能冲饮
  legacy    → 经典冲饮
```

### 10.2 路由映射

```
/products/<slug>/  → /products/<slug>/index-{device}.html
/<slug>/           → /products/<slug>/index-{device}.html (redirect)
/products/<model>/ → /products/detail/index-{device}.html (PDP)
```

---

## 附录: 目录结构

```
BrewYuKoLi/
├── src/
│   ├── index.html                     ← SPA Shell
│   ├── pages/                         ← 88 SSG 页面
│   │   ├── home/, products/, solutions/
│   │   ├── manufacturing/, compliance/
│   │   ├── cases/, resources/, support/
│   │   └── about/, contact/, landing/, thank-you/
│   └── assets/
│       ├── js/
│       │   ├── swup-init.js           ← SWUP 初始化
│       │   ├── spa-router.js          ← 旧版 SPA Router (保留)
│       │   ├── page-init.js, translations.js
│       │   ├── product-grid.js, product-detail.js
│       │   ├── ui/ (navigator, footer, ...)
│       │   └── vendor/ (swup + plugins)
│       ├── css/ (styles, skeleton, tailwind)
│       └── lang/ (i18n JSON)
├── dist/                              ← 构建产物
├── docs/                              ← 项目文档
│   ├── ARCHITECTURE.md
│   ├── DEV-STANDARDS.md
│   ├── MULTI-AGENT-OPERATIONS.md
│   ├── TESTING.md
│   └── ...
├── tests/e2e/
│   ├── smoke.spec.js
│   └── swup-navigation.spec.js
└── scripts/
    ├── build.sh
    └── lint-code.js
```
