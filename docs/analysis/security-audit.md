# 安全审计补充报告

> 审计日期: 2026-06-05 | 覆盖: 137 处 innerHTML + 动态脚本注入 + CSP + 时序补丁分析

---

## 1. innerHTML 注入风险评估

### 1.1 全量统计

| 层级 | innerHTML 数量 | 说明 |
|------|---------------|------|
| 全部 .js (不含 vendor) | **137 处** | 主要在渲染函数中 |
| spa-router.js | 8 处 | 最危险 |
| product-grid.js | 16 处 | 最多，全部在渲染函数 |
| nav-bundle.js | 13 处 | 导航渲染 |
| ui-bundle.js | ~14 处 | UI 组件渲染 |
| breadcrumb-render.js | ~5 处 | 面包屑渲染 |
| 其余文件 | ~50 处 | 各类组件 |

### 1.2 风险分级

#### 🔴 严重风险 (0 处)

经过逐行审计，**所有 innerHTML 赋值中使用的数据都来自内部来源**：

- spa-router.js:683 — `container.innerHTML = content`，`content` 来自 `fetch()` 返回的 SSG HTML
  - **风险**: 虽然 content 来自同源 SSG 文件，但如果 CDN 被污染或中间人攻击，则 XSS 可能
  - **缓解**: `{ cache: "no-store" }` 策略会每次从服务器获取，如果 HTTPS 被破坏则无保护
  - **建议**: 即使同源来源，也建议通过 `DOMPurify.sanitize(content)` 增加深度防御

- spa-router.js:240-246 — `main.innerHTML / mains[0].innerHTML`，来自 DOMParser 解析结果
  - **风险**: 低（解析的是自己 fetch 的同源 HTML）
  - **建议**: 仍建议 sanitize，因为同源 HTML 可能包含动态嵌入的用户内容

#### 🟡 中等风险 (3 处) — 潜在的用户数据处理

| # | 位置 | 内容来源 | 风险 |
|---|------|---------|------|
| 1 | spa-router.js:683 | fetch 返回的 HTML | 如果 CDN 被污染 |
| 2 | product-grid.js:976 | 产品数据中的渲染结果 | 产品数据如果来自 CMS 则可能含 XSS |
| 3 | nav-bundle.js:1281 | this.trigger.innerHTML | dropdown trigger 内容可能含翻译文本 |

#### 🟢 低风险 (其余 134 处)

- 全部使用硬编码模板字符串（如 `'<div class="bg-white">...</div>'`）
- 或者使用 `window.t()` 翻译后的文本（翻译 JSON 文件可控）
- 翻译键值对在构建时生成，用户无法直接控制

### 1.3 安全问题不在于 XSS，在于架构

**核心问题**: innerHTML 本身不危险（数据源可控），但 innerHTML 导致的问题不限于安全：

| 问题 | 影响 | 安全？ |
|------|------|--------|
| innerHTML 覆盖事件监听 | SPA 导航后组件状态丢失 | ❌ 功能性 |
| innerHTML 清除 DOM 引用 | 插件引用失效 | ❌ 功能性 |
| innerHTML 性能 | 字符串解析 > 模板 DOM | ❌ 性能 |
| XSS（数据源被污染） | 理论上可行 | ⚠️ 防卫性 |

---

## 2. 动态 Script 注入分析

### 2.1 loadScript() 当前实现

```javascript
function loadScript(s) {
  return new Promise(function (resolve) {
    var el = document.createElement("script");
    el.id = s.id;
    el.src = s.src;
    el.onload = function () { resolve(); };
    el.onerror = function () {
      console.warn("[SPA] Failed to load script:", s.src);
      resolve(); // 即使失败也继续
    };
    document.body.appendChild(el);
  });
}
```

### 2.2 CSP 兼容性问题

**当前 CSP 配置** (server.js:62):
```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "maps.googleapis.com", "cdn.jsdelivr.net"],
scriptSrcAttr: ["'unsafe-inline'"],
```

**分析**:
1. `'unsafe-inline'` 是必须的（因为所有 bundle 都是 IIFE + 内联脚本）
2. `createElement("script")` + `appendChild` 在 CSP `'unsafe-inline'` 下可以工作
3. 但如果有 `strict-dynamic` CSP，这种注入方式会**失效**

### 2.3 如果要支持 CSP strict-dynamic

**当前状态**: 无法使用 `strict-dynamic`

**需要的变更（按复杂度排序）**:

| 步骤 | 变更 | 影响范围 |
|------|------|---------|
| 1. 去除 `'unsafe-inline'` | 所有 IIFE 需要改为外部文件 | 全部 33+27 文件 |
| 2. 入口脚本加入 nonce | index.html 的 `<script>` 需要 nonce | index.html + server.js |
| 3. `loadScript()` 传递 nonce | `el.nonce = _nonce` | spa-router.js |
| 4. 所有 bundle concat 改为 ESM | `import()` 天然支持 strict-dynamic | webpack 配置 |

**预估**: 这是一个 5-7 天的改造，优先级 P3。

**建议**: 当前阶段不要实施 CSP strict-dynamic。等 ESM 迁移完成后再做。

---

## 3. 50 个 DOMContentLoaded + 58 个 setTimeout 分类审计

### 3.1 精确统计

| 类别 | JS 文件中出现次数 | 唯一文件数 |
|------|-------------------|-----------|
| `DOMContentLoaded` | **62** 处 | 37 个文件 |
| `setTimeout` | **108** 处 | 36 个文件 |

### 3.2 DOMContentLoaded 分类

| 类型 | 估计数量 | 可删除？ | 替代方案 |
|------|---------|---------|---------|
| **必要**（依赖 DOM 就绪） | ~20 | ❌ | 保留，但应统一管理 |
| **时序补丁**（延迟执行等某全局变量可用） | ~25 | ✅ | `whenReady` Promise |
| **冗余**（IIFE 内已经自动执行，又包了一次） | ~10 | ✅ | 直接删除 |
| **SPA 不兼容**（只在首次加载有效，SPA 导航时不触发） | ~7 | ✅ | 改用 spa:load 或 MutationObserver |

**例子 — 可以安全删除的**:
```javascript
// breadcrumb.js — 包在 DOMContentLoaded 内，但自身已经在 defer 脚本中
document.addEventListener("DOMContentLoaded", function() {
  initBreadcrumb();  // ← 外层已经调用了 initBreadcrumb
});
```

### 3.3 setTimeout 分类

| 类型 | 估计数量 | 可删除？ | 替代方案 |
|------|---------|---------|---------|
| **必要延迟**（如动画、轮播间隔） | ~15 | ❌ | 保留 |
| **时序补丁**（`setTimeout(fn, 500)` 等某变量可用） | ~35 | ✅ | `whenReady.i18n()` Promise |
| **安全网**（超时 fallback） | ~5 | ⚠️ 保留但可优化 | 增加但延长超时时间（2s→5s）|
| **未清除**（SPA 导航时旧 timeout 未 clear） | ~3 | ✅ | 保存 timer id，在 spa:beforeunload 清除 |

### 3.4 "时序补丁"的具体位置

典型的时序补丁模式：

```javascript
// 模式 1: 硬编码延迟 (最常见的)
setTimeout(function() {
  var t = window.translationManager;
  if (t && t.translate) { /* ... */ }
}, 500);

// 模式 2: 双重检查 (repeated retry)
function retryLoad() {
  if (window.t) {
    doWork();
  } else {
    setTimeout(retryLoad, 200);  // 轮询
  }
}

// 模式 3: 混合 (DOMContentLoaded + setTimeout)
document.addEventListener("DOMContentLoaded", function() {
  setTimeout(function() {
    window.translationManager.translate();
  }, 300);
});
```

**这些占 setTimeout 总量的 ~60%**，是时序问题的直接证据。

---

## 4. 建议的解决方案

### 4.1 DOMPurify / Sanitization

```bash
# 新增依赖（可选，后续阶段）
npm install dompurify

# 或者 copy 一个 ~6KB 的迷你 sanitizer
# src/assets/js/lib/sanitize.js
```

### 4.2 innerHTML → createElement 迁移路线

| 阶段 | 范围 | 工作量 | 效果 |
|------|------|--------|------|
| 1. 低风险先做 | 硬编码模板（无变量插值） | ~30 处 / 0.5 天 | 有限（安全性无改善，但可维护性提升） |
| 2. 关键路径 | spa-router.js fetch 内容 | 1 处 / 0.5 天 | 增强安全性（加 sanitize） |
| 3. 全部 | 所有 137 处 | ~3 天 | 最大安全收益 |

**建议**: 先做第 1 步和第 2 步，第 3 步延后到 ESM 迁移后。

### 4.3 动态脚本改 import()

```javascript
// 当前（CSP 不友好）:
var el = document.createElement("script");
el.src = "/assets/js/product-grid.js";
document.body.appendChild(el);

// 改造后（CSP 友好）:
await import("/assets/js/product-grid.js");
// 或者包装为 module:
await import(/* webpackChunkName: "product-grid" */ "./product-grid.js");
```

**依赖**: 需要 ESM 化完成。当前 IIFE 文件无法被 `import()` 直接使用（没有 export）。

### 4.4 统一初始化生命周期

```javascript
// 统一方案: 一个入口管理所有初始化
// src/assets/js/boot.js
import { i18nReady } from './lib/when-ready.js';
import { initRouter } from './spa-engine.js';
import { initBreadcrumb } from './breadcrumb-init.js';

async function boot() {
  await i18nReady();     // 翻译系统就绪
  initRouter();          // 路由器就绪
  initBreadcrumb();      // 面包屑渲染
  // ...
  document.dispatchEvent(new Event('app:ready'));  // 统一就绪事件
}

boot();
```
