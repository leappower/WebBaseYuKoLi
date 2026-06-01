# KitchenYuKoLi → BrewYuKoLi 精华适配记录

BrewYuKoLi 脱胎于 KitchenYuKoLi，但 fork 时只拿了旧版本代码，
Kitchen 后续的大量修复和架构改进没有同步过来。
本文档记录哪些 Kitchen 精华已适配、哪些不需要适配、哪些待适配。

## 已适配 ✅

### 1. SSG 自动路由发现 (build-ssg.js)
- **Kitchen 模式**: `discoverRoutes()` 递归扫描 `src/pages/*/`，exclude 机制
- **Brew 适配**: 完整移植 Kitchen 的 `discoverRoutes()`，替代原来硬编码的 `CORE_ROUTES` + `CASE_DETAIL_SLUGS` 列表
- **适配差异**: 无，直接可用
- **Commit**: `2dc9b77d`

### 2. PDP Section 结构 (product-detail.js)
- **Kitchen 模式**: Hero section + Specs section + CTA section 三段式
- **Brew 适配**: 同样拆分为 3 个语义 `<section>`，配色/间距适配 Brew 的设计系统
- **适配差异**: 
  - Kitchen 用 `fullwidth-bg` + `section-content` CSS 类；Brew 用 `max-w-7xl mx-auto px-4`
  - Kitchen hero 图片用 `aspect-[4/3] lg:aspect-[3/2] object-contain`（产品图是白底抠图）
  - Brew hero 图片用 `h-[220px] md:h-[400px] lg:h-[600px] object-cover`（产品图是实拍图）
- **Commit**: `2dc9b77d`

### 3. 面包屑 i18n label 解析
- **Kitchen 模式**: `catInfo.label` → Kitchen 也有 `[object Object]` bug（未修复）
- **Brew 适配**: 添加 `resolveLabel()` 函数，Kitchen 可以回迁这个修复
- **适配差异**: Brew 不需要 Kitchen 的 `CATEGORY_NAME_TO_SLUG`（中文名→slug）映射，
  因为 Brew 的 `product.category` 直接就是 URL slug（如 `"coffee"`）
- **Commit**: `2dc9b77d`

### 4. Cases 页面 JS 加载 (cases 三端 HTML)
- **Kitchen 模式**: cases HTML 中直接引用 `case-grid.js`
- **Brew 适配**: 三端 HTML 加 `<script defer src="case-grid.js">`
- **适配差异**: 无
- **Commit**: `2eb2e320`

## 不需要适配 — 架构差异 ⚡

### CATEGORY_NAME_TO_SLUG / MODEL_TO_SLUG
- **Kitchen 需要**: 因为 Kitchen 的 `product.category` 是中文名（如"翻炒系列"），
  需要映射到 URL slug（`stirfry`）。`MODEL_TO_SLUG` 防止 API 数据覆盖后回查失效。
- **Brew 不需要**: Brew 的 `product.category` 直接就是 URL slug（如 `"coffee"`），
  面包屑查找链路: `product.category` → `slugMap["nav_products_" + catKey]` → `PRODUCT_SLUGS[slug]`
- **原因**: 两个项目的数据源不同（Kitchen 依赖 API 实时数据，Brew 用纯静态数据表）

### reloadPageScripts (spa-router.js)
- **Kitchen 用它**: 因为 Kitchen 不用 ScriptsPlugin，自己在 `content:replace` 后解析新页面 script 并注入
- **Brew 不需要**: Brew 用 ScriptsPlugin `optin:true` + `fetch:request` hook 映射设备页面
  - **前提**: 每个页面 HTML 必须包含所需的 `<script>` 标签（这就是 cases 问题的根因）
- **权衡**: Kitchen 方案更优雅（不需要 `data-swup-reload-script`），但 Brew 当前方案也可行

### 图片命名规范 (model.webp)
- **Kitchen**: 统一用 `model.webp`，删除了所有兼容替换逻辑
- **Brew**: 已统一用 `category/NNN.webp` 模式（如 `coffee/001.webp`），不需要迁移

## 待适配 📋

### 1. SPA 脚本热重载机制
- **Kitchen 价值**: `content:replace` 后自动注入新页面特有的 JS，不需要每个 script 加 `data-swup-reload-script`
- **Brew 现状**: 依赖 optin 模式，新增页面容易忘记加属性
- **建议**: 适配 Kitchen 的 `reloadPageScripts` 模式，或者至少在 `content:replace` hook 中加入
  全局 JS 重执行逻辑（排除已加载的 + SPA shell 全局脚本）

### 2. Navigator 重挂载保护
- **Kitchen**: `content:replace` 后检测 navigator placeholder 是否为空，自动 `Navigator.mount()`
- **Brew**: navigator 用 `data-swup-persist="nav"` 保护，应该不会被替换
- **建议**: 检查 Brew 是否有相同保护，如果有则不需要适配

### 3. build-ssg.js 正则转义
- **Kitchen 修复**: commit `4bf67a2` — 第 800 行正则转义错误导致 SyntaxError
- **Brew**: 需要检查是否有同样的正则构造模式

### 4. product-detail.js SPA 触发保护
- **Kitchen 修复**: commit `6ab36a6` — 防止在非产品页被错误触发渲染
- **Brew**: 需要检查 `spa:load` / `spa:ready` 监听中的路径判断是否足够严格

## 架构对比总结

| 维度 | KitchenYuKoLi | BrewYuKoLi |
|------|---------------|------------|
| 产品数据 | CMS API 实时 + 本地 fallback | 纯静态 product-data-table.js |
| category 类型 | 中文名（"翻炒系列"） | 英文 slug（"coffee"） |
| SPA 脚本管理 | 自定义 reloadPageScripts | ScriptsPlugin optin:true |
| 路由发现 | discoverRoutes() 递归 | discoverRoutes() 递归（已适配） |
| 图片样式 | object-contain（白底抠图） | object-cover（实拍图） |
| SSG ROUTES | 自动发现 | 自动发现（已适配） |
