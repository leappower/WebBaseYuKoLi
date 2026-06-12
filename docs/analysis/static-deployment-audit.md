# 静态部署兼容性审计报告

> 关联方案: JJC-020 v2.2 | 审计日期: 2026-06-05  
> 审计范围: spa-router.js, translations.js, swup-bundle.umd.js, build-ssg.js, webpack.config.js, image-assets.js  
> 部署场景: GitHub Pages / Cloudflare Pages / S3 静态托管 / 本地 `file://` / 子路径部署

---

## 🔴 严重问题（必须修复）

### S1. spa-router.js fetch 路径错误（SPA 导航 404）

**问题**  
`spa-router.js:575-581` — 路由解析后 fetch 的路径为 `/pages/home/index-pc.html`，但 SSG 构建输出已将 `/pages/` 前缀剥离，实际文件在 `/home/index-pc.html`。

**影响范围**  
23 条硬编码路由 + 动态 PDP 路由均受影响。生产服务器 `server.js` 有 SPA fallback 能正确处理，但**纯静态部署**下所有 fetch 请求都会 404。

**代码位置**  
```
spa-router.js routes: { "/home/": "/pages/home/index-pc.html", ... }
spa-router.js:564: pagePath = "/pages" + clean + "/index-pc.html";
spa-router.js:592: fetch(devicePath, { cache: "no-store" })
```

**修复方案**  
spa-router 的 `routes` 表和 fallback 生成逻辑需移除 `/pages/` 前缀，改为直接路径。或者统一由 `resolvePagePath()` 函数注入 `/pages/` 以兼容 build 输出。

**三种场景验证结果**  
| 场景 | 结果 | 说明 |
|------|------|------|
| `npx serve` (本地静态) | ❌ 404 | 无 SPA fallback，fetch `/pages/home/index-pc.html` 不存在 |
| GitHub Pages | ❌ 404 或触发 404.html 重定向循环 | 同上 |
| `file://` | ❌ CORS 阻断 + 路径不对 | fetch 在 `file://` 被阻止 |

---

### S2. i18n JSON fetch 在子路径部署下可能全丢失

**问题**  
`translations.js:142-144` — 翻译 JSON 路径拼接使用 `window.BASE_PATH`。但这需要 JS 在 HTML 中显式设置 `<script>window.BASE_PATH="/brew/"</script>`。当前构建未自动注入 BASE_PATH 到 dist 输出。

**影响范围**  
25 种语言的翻译文件全部丢失。导航/页脚/etc. 所有 `data-i18n` 内容不翻译。

**代码位置**  
```
translations.js:142: var u = window.BASE_PATH || "";
translations.js:144: fetch(u + "/assets/lang/" + t + "-ui.json", { cache: a ? "no-store" : "default" })
```

**修复方案**  
`build-ssg.js` 中的 `patchHtmlPaths()` 已能替换 `%BASE_PATH%` 占位符，但 HTML 和 JS 中需要注入 `<script>window.BASE_PATH="..."</script>`。需在 `build.sh` 或 SSG 中注入 BASE_PATH script tag。

**三种场景验证结果**  
| 场景 | 结果 | 说明 |
|------|------|------|
| `npx serve` (根路径) | ✅ 正常 | BASE_PATH=""，路径正确 |
| GitHub Pages 子路径 | ❌ 翻译丢失 | BASE_PATH 未设置 |
| `file://` | ❌ CORS 阻断 + 不可用 | fetch 被 file:// 策略阻止 |

---

### S3. spa-router fetch + innerHTML 注入 404 页面未检测

**问题**  
`spa-router.js:592-597` — fetch 后仅通过 `response.ok` 判断，但静态部署下 404 的 HTML 页面（如 `404.html` 的 SPA 重定向逻辑）会被当作有效内容注入 `#spa-content`。后续无 SPA fallback 时，404.html 可能包含 JS 重定向导致循环。

**代码位置**  
```
spa-router.js:592: fetch(devicePath, { cache: "no-store" })
  .then(function (response) {
    if (!response.ok) throw new Error("HTTP " + response.status);  // ← 仅检查 HTTP status
    ...
  })
```

**问题本质**  
静态服务器返回 `index.html` 作为 fallback（如 GitHub Pages 的 404.html 重定向），HTTP 200 + 实际内容是 SPA shell 而非目标页面 → 注入错误内容。

**修复方案**  
在 renderContent 前检测 HTML 内容特征（如是否包含 `<navigator data-component="navigator">` 等 SPA shell 标记），检测到非目标页面时静默跳过。

---

### S4. fetch cache: "no-store" 与 CDN 缓存策略冲突

**问题**  
`spa-router.js:592` 使用 `{ cache: "no-store" }` 强制绕过浏览器缓存，但在 CDN 层面（Cloudflare Pages / S3 + CloudFront）该选项无法控制 CDN 缓存。CDN 可能返回过时内容。

**代码位置**  
```
spa-router.js:592: fetch(devicePath, { cache: "no-store" })
translations.js:144: cache: a ? "no-store" : "default"
```

**影响**  
- 开发环境：正常工作（`no-store` 防止旧代码缓存）  
- 静态部署：`no-store` 只在浏览器层生效，CDN 边缘节点仍可能返回旧响应  
- 性能影响：每次 SPA 导航都绕过了 HTTP 缓存，增加回源请求

**修复方案**  
SPA fetch 使用 `{ cache: "no-cache" }`（校验缓存）+ 构建时在 HTML URL 上追加版本号 hash。翻译 JSON 使用 `{ cache: "default" }` + 构建版本化文件名。

---

### S5. `file://` 完全不可用：fetch + CORS + localStorage

**问题**  
`file://` 协议下：
1. `fetch()` 被 CORS 策略完全阻止（`file://` origin 为 `null`，不满足同源策略）  
2. `localStorage` 在部分浏览器（Firefox）中不可用  
3. Service Worker 在 `file://` 下无法注册

**代码位置**  
全局 — 所有使用 `fetch()`、`localStorage`、`navigator.serviceWorker` 的位置均受影响。

**影响范围**  
| 功能 | file:// 状态 |
|------|-------------|
| SPA 导航 (fetch) | ❌ blocked by CORS |
| i18n 翻译 (fetch JSON) | ❌ blocked by CORS |
| localStorage 翻译缓存 | ⚠️ 部分浏览器不可用 |
| SW cache | ❌ 不能注册 |
| image-manifest.json | ❌ blocked by CORS |

**修复方案**  
识别 `file://` → 降级模式：内联最小翻译集（zh-CN/en）、不执行 fetch、显示静态内容 + 提示用户使用 HTTP 服务器访问。

---

## 🟡 中等问题

### M1. 构建产物 hash 策略缺失

**问题**  
`webpack.config.js:103` 中 `output.filename` 仅在 production 模式下启用 contenthash。但静态部署（尤其是 CDN）没有 hash 的文件名意味着**缓存失效问题**。

**代码位置**  
```
webpack.config.js:103: filename: isProduction ? 'bundle.[contenthash:8].js' : 'bundle.js',
```

**影响**  
- bundle.js 更新后，CDN 仍提供旧版本  
- 虽然 `build.sh` Step 11 会注入 `?v=timestamp`，但这仅作用于 HTML/CSS 中的引用，不对 copy 的 JS 文件生效  
- 翻译 JSON 文件没有版本化路径

**修复方案**  
- 所有 build copy 的静态资源使用 build 时间戳作为 query string（当前已部分实现）  
- i18n JSON 应在文件层面增加版本化（如 `en-ui.v12345.json`）或确保 `Cache-Control` 头部正确

---

### M2. image-manifest.json fetch 路径无 BASE_PATH 支持

**问题**  
`image-assets.js:84` — `fetch("/images/image-manifest.json")` 硬编码根路径，未使用 BASE_PATH。

**代码位置**  
```
image-assets.js:84: return fetch("/images/image-manifest.json")
```

**影响**  
子路径部署（如 `brew.brand-project.com/brew/`）下 image 清单 fetch 失败 → 图片列表无法加载。

**修复方案**  
改为 `fetch((window.BASE_PATH || "") + "/images/image-manifest.json")`

---

### M3. SWUP preload 在静态部署无语义

**问题**  
`swup-bundle.umd.js` 使用 `fetch(url, options)` 进行 preload，默认选项依赖 HTTP server 的 `Link: rel=preload` 响应头。静态部署下没有此响应头，preload 无效但也不报错。

**影响**  
CDN/静态部署下 preload 退化（无额外副作用），但可能产生不必要的 fetch 开销。

**修复方案**  
在 SWUP init 时检测静态环境（`window.__STATIC_DEPLOYMENT__`），禁用 preload 或使用 `<link rel="preload">` 方式。

---

### M4. navigator/mega-menu/slide-menu BASE_PATH 引用但未统一注入

**问题**  
`navigator.js:306`, `mega-menu.js:159`, `slide-menu.js:524` 等位置使用 `window.BASE_PATH`，但该变量只在运行时由外部 script 设置。如果在 JS 加载时 BASE_PATH 尚未设置，路径取空字符串导致链接中断。

**影响**  
所有使用 BASE_PATH 拼接的导航链接、script 动态加载在子路径部署下可能中断。

**修复方案**  
在所有页面 HTML 模板中注入 BASE_PATH 定义（`<script>window.BASE_PATH = "/brew/"</script>`），在 `site.config.js` 或构建脚本中统一配置。

---

## 🟢 观察项

### W1. 内联翻译 fallback 缺失

当前 `translations.js` 在 JSON fetch 失败时降级到英文，但没有内联 fallback（JSON embedded 在 JS bundle 中）。25 种语言的文件大小总计不大（~2KB/语言），可以考虑将 zh-CN 和 en 内联到 bundle 作为最低保证。

**建议**  
阶段二（i18n 模块化）后在 i18n bundle 中内联 zh-CN + en 基础翻译集。

---

### W2. 404.html SPA 重定向逻辑在子路径部署下需要调整

`build-ssg.js` 生成了 `dist/404.html` 用于 GitHub Pages 的 SPA 回退。当前逻辑需要验证子路径部署下路径拼接是否正确。

**建议**  
版本化 404.html（在 SSG 构建中注入 BASE_PATH）。

---

## 📋 静态部署验证矩阵（阶段验收标准）

自 v2.2 起，每个阶段交付后必须验证以下 3 种场景：

| 验证场景 | 命令/方法 | 通过标准 |
|----------|-----------|---------|
| **本地静态部署** | `npm run build && npx serve dist/ -l 5000` | SPA 导航正常、翻译正常、图片正常、导航链接可点击 |
| **子路径部署** | `npm run build && npx serve dist/ -l 5000` (或配置 base path `BREW_PATH=/brew/`) | 所有资源路径正确、fetch 路径正确 |
| **文件协议** | 在 Finder/文件管理器中打开 `dist/index.html` | 页面不崩溃、`file://` 降级逻辑生效、显示提示信息 |

### 新增阶段验证子任务

```
T{phase}.verify-{env}: 在每个阶段各子任务完成后，对三种静态部署场景做回归验证
  工作量: 0.25d/阶段
  验证清单:
    - npx serve dist/ → curl localhost:5000/home/ 返回 200（非 SPA shell）
    - 浏览器打开子路径 → 资源不报 404
    - 翻译 JSON 可用（25 种语言 fetch ✅）
    - SPA 导航 fetch 不报 404
    - image-manifest.json fetch 正常
    - BASE_PATH 设置时所有路径正确
```

---

## 🔄 方案 v2.2 新增/修改总结

### 新增子任务

| ID | 任务 | 工作量 | 阶段 | 说明 |
|----|------|--------|------|------|
| T0.4 | spa-router 路径修正：移除 `/pages/` 前缀 | 1d | 零 | 修复静态部署下 fetch 404 |
| T0.5 | build.sh + SSG 注入 BASE_PATH script tag | 0.5d | 零 | 各部署场景统一 BASE_PATH |
| T1.5 | 翻译 JSON fetch 失败 fallback：内联 zh-CN/en | 0.5d | 一 | 保障翻译降级 |
| T2.4 | i18n 模块化后新增 BASE_PATH 感知 | 0.25d | 二 | 确保模块化后翻译路径可配置 |
| T3.7 | image-manifest.json BASE_PATH 修复 | 0.25d | 三 | 图片清单支持子路径 |
| T5d | 静态部署 E2E 测试 | 1d | 五 | Playwright 覆盖三种静态部署场景 |

### 修改子任务

| ID | 变更 | 原因 |
|----|------|------|
| T0.1 | SWUP 配置化 + 静态部署兼容检测 | 增加 `window.__STATIC_DEPLOYMENT__` 检测，禁用 preload |
| T1.4 | 翻译 JSON 预加载 → 策略改为 cache-first + 版本化 URL | 兼容 CDN 缓存策略 |
| T3.1 | Webpack publicPath 支持 `[BASE_PATH]` 占位符 | 子路径部署正确引用 chunk |

### 工时变更

| 版本 | 总工时 | 变化 |
|------|--------|------|
| v2.1 | 22 天 | 基线 |
| **v2.2** | **~25.5 天** | +3.5 天（静态部署修复 + 验证） |

---

## 🔧 实现优先级

```
P0（阻塞静态部署）:
  S1 spa-router fetch 路径          → T0.4
  S2 i18n JSON BASE_PATH            → T0.5 + T2.4
  S3 404 内容检测                    → T0.4（一并修复）

P1（影响体验）:
  S4 cache:no-store 冲突             → T1.4 修改
  M1 构建产物 hash/CDN 缓存          → T3.1
  M2 image-manifest BASE_PATH       → T3.7

P2（降级保障）:
  S5 file:// 降级模式                → T0.5（file:// 检测）
  M3 SWUP preload 静态检测           → T0.1
  M4 navigator BASE_PATH 统一注入    → T0.5

P3（长期优化）:
  W1 内联翻译 fallback               → T1.5
  W2 404.html 子路径适配             → T0.5
  静态部署 E2E 测试                  → T5d
```

---

## 🔄 评审反馈补充（2026-06-05 — 多模型交叉评审后追加）

以下问题在审计初稿中遗漏，经 deepseek-v4-pro、Qwen3-Coder-30B、GLM-5.1 独立评审发现：

### S6. spa-router `loadPageScripts()` 中硬编码脚本路径（P0 — 新增）

**位置**: `spa-router.js:727-773`  
**问题**: `loadPageScripts()` 硬编码 10+ 处 `scripts.push({ src: "/assets/js/..." })` 路径，在子路径部署下 404。  
**例**:  
```js
scripts.push({ src: "/assets/js/product-grid.js", ... });
scripts.push({ src: "/assets/js/product-detail.js", ... });
```
**修复**: 所有动态注入的 script src 需拼接 `window.BASE_PATH`。

### S7. Convention fallback 未覆盖（P0 — 新增）

**位置**: `spa-router.js:564`  
**问题**: `pagePath = "/pages" + clean + "/index-pc.html"` 对所有不在 routes 表中的路径都适用，T0.4 仅修 routes 表不修此处则遗漏。  
**修复**: 同步修改 fallback 拼接逻辑。

### S8. Dynamic category redirect 路由遗漏（P0 — 新增）

**位置**: `spa-router.js:89-97`  
**问题**: `_initCategorySlugs()` 自动注册 6+ 条 redirect 路由（如 `/beauty/` → `/pages/products/beauty/index-pc.html`），带 `/pages/` 前缀。  
**修复**: 修改动态路由注册路径。

### S9. patchHtmlPaths 覆盖不全（P0 — 新增）

**位置**: `build-ssg.js:306-312`  
**问题**: 当前只替换 `["']/(assets/|images/|fonts/)`，未覆盖 `/sw.js`、`href="/"`、`href="/home/"` 等内部链接。  
**修复**: 增加 sw.js 注册路径 + 静态 HTML 内部链接的 BASE_PATH 替换。

### M5. SW 策略在静态部署下未定义（P2 — 新增）

**问题**: sw.js 在静态部署下的预缓存策略未定义。GitHub Pages CDN + SW 的缓存行为需要明确。  
**建议**: 静态部署下 SW 应做 pre-cache（offline fallback）或干脆不注册。
