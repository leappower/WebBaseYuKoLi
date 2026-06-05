# SWUP / SPA 路由框架深度审计报告

> 审计日期: 2026-06-05 | 基于: spa-router.js (1051行) + swup-bundle.umd.js (2880行) + 所有相关 UI 模块

---

## 1. SWUP 引入状态（最终结论）

### 当前实际状态

```
┌──────────────────────────────────────────────────────────────┐
│ SWUP vendor bundle → ❓ 加载但未完全激活                       │
│ spa-router.js → 🧟 文件存在未被加载但代码被引用                │
│ 两者关系 → 互斥（通过 __swupEnabled gate 切换）               │
└──────────────────────────────────────────────────────────────┘
```

**确认的事实**:

| 检查项 | 结果 |
|--------|------|
| index.html 加载了 SWUP bundle | ✅ 是 (`swup-bundle.umd.js` defer) |
| index.html 加载了 spa-router.js | ❌ **否**（已替换为 SWUP） |
| SWUP 是否 auto-init | ✅ 是（bundle 末行的 `initSwup()` 自动调用） |
| swup-init.js 是否存在 | ❌ 已删除（被 SWUP bundle 内联的 auto-init 替代） |
| spa-router.js 是否被任何 HTML 引用 | ❌ 否（但 copy-webpack-plugin 复制到 dist） |
| UI 模块是否引用 `window.SpaRouter` | ✅ **是**（8 个模块有引用） |
| `__swupEnabled` 是否被设置 | ✅ SWUP bundle 在初始化后设置 `window.__swupEnabled = true` |

**结论: SWUP 在运行，但 spa-router 的幽灵 API 调用在无声地失败。**

许多模块调用 `window.SpaRouter.navigate()` 或 `window.SpaRouter.getCurrentPath()` 时，实际上是在调用**不存在的函数**。偶然工作是因为 SWUP 的 `history.pushState` 触发 `popstate` → spa-router.js 不在所以跳过 → 浏览器默认导航行为接管。

### 为什么 UI 组件中分散的 SpaRouter 引用没有引起崩溃？

搜索发现，实际调用模式有两种：

```javascript
// 模式 A: 条件检查（安全）
if (window.SpaRouter) { window.SpaRouter.navigate(...) }   // ✅ 安全

// 模式 B: 直接调用（危险）
window.SpaRouter.getCurrentPath()                          // 🚨 未定义
```

**分析结果**: 大多数调用使用了模式 A（条件检查），少数模式 B 的调用被 `try/catch` 或 `&&` 短路保护。这是偶然安全而非刻意设计。

---

## 2. 自建路由器 (spa-router.js) 深度审计

### 2.1 架构概览

spa-router.js (1051行) 的核心组成：

| 功能模块 | 行数 | 质量评估 |
|---------|------|---------|
| 路由表 + SLUG 生成 | 1-145 | 🟡 耦合了 SITE_CONFIG |
| 路径解析 + 设备检测 | 146-240 | 🟢 合理 |
| HTML 内容提取 (DOMParser + regex) | 241-340 | 🔴 双通道冗余 |
| 骨架屏显示/隐藏 | 341-435 | 🟡 过度工程 |
| Header/Footer 替换 | 436-520 | 🟡 可行但没必要 |
| 加载动画 | 521-545 | 🟢 简易 OK |
| loadRoute() 核心 | 546-770 | 🔴 复杂度高 |
| popstate 处理 | 755-810 | 🟡 缺少竞态保护 |
| init() + click 拦截 | 811-895 | 🔴 与 SWUP 冲突 |
| loadPageScripts() | 896-1031 | 🔴 静态脚本表 |
| auto-init | 1032-1051 | 🟢 合理 |

### 2.2 具体问题

#### P0: 路由匹配逻辑 — 遗漏风险

```javascript
// 问题: 路由表构建自 SITE_CONFIG，但 build 时 SITE_CONFIG 可能未加载
routes: {
  "/home/": "/pages/home/index-pc.html",
  "/products/": "/pages/products/index-pc.html",
  // ...
},
_initCategorySlugs: function () {
  var cats = (_cfg.categories || {}).products || [];
  var slugs = ["all"];
  for (var i = 0; i < cats.length; i++) {
    if (cats[i].slug) slugs.push(cats[i].slug);
  }
  this.PRODUCT_SLUG_PATTERN = slugs.length ? slugs.join("|") : "(?!x)x";
  // ...
}
```

- `_cfg` 是全局 `SITE_CONFIG` 的别名，但它是一个 IIFE 顶级变量
- 如果 `site.config.js` 加载延迟，`_cfg` 为 undefined → `_initCategorySlugs()` 崩溃
- `PRODUCT_SLUG_PATTERN` 的 fallback `(?!x)x`（永不匹配）是聪明的 hack，但也是个信号：说明开发者预期初始化可能失败

#### P0: loadRoute() 的 fetch + innerHTML 链路 — 失败处理盲区

```javascript
loadRoute: function (routePath, navVersion) {
  // ...
  fetch(devicePath, { cache: "no-store" })
    .then(function (response) {
      // 没有检查 response.ok
      return response.text();
    })
    .then(function (html) {
      // 没有检查 html 是否有效
      var content = _self.extractContent(html);
      _self.renderContent(content, pagePath);
      // ...
    });
}
```

**关键发现**:
1. `response.ok` **没有检查**：404/500 响应会静默进入 `.then()` 处理链
2. `html` 可能为空字符串 → `extractContent()` 返回空 → `renderContent("")` → `container.innerHTML = ""` → 白屏
3. `renderContent()` 内 `scriptsPromise` 和 spa:load 的时序关系：如果 fetch 慢，`scriptsPromise` 晚于 `spa:load` → 页面脚本未执行

#### P1: PDP 异步品类加载竞态条件

**问题**: `loadPageScripts()` 使用静态路径匹配表，PDP 路由是动态的：

```javascript
if (/^\/products\/[a-z]+\/[A-Za-z0-9_-]+\/$/.test(path)) {
  scripts.push({ src: "/assets/js/product-detail.js", id: "spa-product-detail" });
}
```

当用户快速点击多个产品链接：
1. 导航到 /products/coffee/BT-001/ → 开始加载 product-detail.js
2. 立即导航到 /products/tea/TE-001/ → 新的 fetch 开始
3. 两组脚本可能同时在加载 → 状态冲突
4. `navVersion` 机制存在但只在日志层面使用，没有实际 cancel

#### P1: popstate 处理缺少竞态保护

```javascript
onPopState: function (_event) {
  window.__spaNavigating = true;
  var path = this.getCurrentPath();
  this.loadRoute(path, this._navVersion);
  var _self = this;
  setTimeout(function () {
    window.__spaNavigating = false;
  }, 500);  // 硬编码 500ms
}
```

- 500ms 硬编码 timeout → 如果 SPA 加载超过 500ms，`__spaNavigating` 被提前清除
- 没有处理连续 popstate（用户快速点击返回）
- `_navVersion` 递增但新启动的 loadRoute 不中止旧的在进行的 fetch

#### P2: 导航拦截 (click handler) 遗漏

```javascript
// 只拦截已知路由
if (this.routes[redirectTo] || this.routes[href]) {
  event.preventDefault();
  this.navigate(href);
}
```

- **动态路由遗漏**: 通过 `CATEGORY_SLUGS` 生成的 slug 不会被 `this.routes` 包含 → 直接浏览器导航
- **外部链接误判**: `if (href.startsWith("http")) return` — 但如果项目部署在子路径下，root-relative 链接 `/products/` 会被正确处理，但 `https://brew.yukoli.com/products/` 会触发全页刷新

### 2.3 SWUP 共存问题

**当前架构: 两个路由器共享同一个 click handler**

```javascript
document.addEventListener("click", function (event) {
  if (window.__swupEnabled) return;  // ← 把控制权交给 SWUP
  // ...spa-router 的原生拦截逻辑
}, true);
```

**问题**:
1. SWUP 的 click 拦截和 spa-router 的 click 拦截都是 capture phase → 谁先运行取决于加载顺序
2. 如果 SWUP 未加载完成 → `__swupEnabled` 为 false → spa-router 尝试拦截 → 但 spa-router 也没加载 → 结果：没人处理 SPA 导航
3. 如果两者都加载 → SWUP 处理导航，但模块仍调用 `SpaRouter.navigate()`（不存在）→ SWUP 不响应 → 浏览器全页刷新

---

## 3. 框架层 vs 应用层问题区分

### 框架自身缺陷（spa-router.js）

| 缺陷 | 位置 | 严重度 |
|------|------|--------|
| 无统一的加载生命周期 | 全部 | 🔴 根本性 |
| fetch 结果无验证 | loadRoute() | 🟡 |
| 时序依赖靠加载顺序不靠声明 | 初始化代码 | 🔴 根本性 |
| 事件系统弱（无阶段化） | spa:load | 🟡 |
| 无加载取消机制 | loadRoute() | 🔴 |

### 应用层误用

| 误用 | 影响 | 示例 |
|------|------|------|
| 模块直接调用 `window.SpaRouter.*` | 与 SWUP 共存时不可用 | about-dropdown.js:143 |
| 未统一使用 `spa:load` 事件 | 部分用 `DOMContentLoaded`，部分用 `spa:load` | init.js:123 vs nav-bundle.js |
| 未使用 SPA 的生命周期钩子 | 页面脚本可能在 DOM 还未更新时运行 | page-init.js |
| 多个模块重复监听同事件无协调 | 执行顺序不确定 | 6 处 spa:load 监听 |

### 修复建议

**方案 A（推荐）: 正式化 SWUP + 删除 spa-router.js 残留**

1. 删除 spa-router.js（无 HTML 引用它）
2. 统一所有 `window.SpaRouter.*` 调用为 SWUP API
3. 用 SWUP 的 `content:replace` 事件替换 `spa:load`
4. 建立 swup-init.js（配置+插件管理）重新作为入口

**方案 B: 回退到自建路由器**

1. 从 index.html 移除 SWUP bundle
2. 在 index.html 显式加载 spa-router.js
3. 修复所有已知缺陷（fetch 检查、popstate 竞态、点击拦截遗漏）
4. 方案 A 的长期成本更低，推荐

---

## 4. 行业对比

### 类似项目（SSG + SPA 增强）的常见做法

| 方案 | 适用场景 | 采用率 | 本项目的做法 | 偏差 |
|------|---------|-------|------------|------|
| SWUP + SSG | 静态站点 SPA 增强 | ●●●●● | 部分采用 | 缺少正式配置入口 |
| Barba.js | 页面过渡 | ●●●○○ | 未采用 | — |
| Turbolinks/Hotwire | Rails 风格 SPA | ●●●●○ | 未采用 | — |
| MPA + 渐进增强 | 纯 SSG 无 SPA | ●●●●○ | 未采用 | 本应是选择之一 |
| 自建路由器 | 极少（团队大才选） | ●●○○○ | 选了这条路 | ❌ 决策偏离 |

### 当前架构在业界的水平

| 维度 | 评价 |
|------|------|
| 路由功能 | **低于行业标准** — 与 2018 年的 swup/barba 早期版本相当 |
| 事件体系 | **自建轮子** — `spa:load` 是非标准事件 |
| 代码质量 | **中下** — 注释丰富但架构混乱 |
| 迁移能力 | **差** — 全局引用紧密耦合 |

### 建议

1. **短期**: 通过配置正式化 SWUP（1 天），删除 spa-router.js 残留引用
2. **中期**: 统一所有模块的生命周期绑定到 SWUP 标准事件
3. **长期**: 如果项目 JS 规模继续增长，考虑 SvelteKit / Astro 等完整框架
