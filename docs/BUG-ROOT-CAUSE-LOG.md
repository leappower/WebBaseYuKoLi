# Bug Root Cause Log

> **Purpose**: Track every P0/P1 bug's root cause, fix, and prevention strategy.
> **Format**: Newest first.
> **Update**: Add entry for each confirmed scaffold-level bug.

---

## 2026-05-17: SPA extractContent — regex literal 双重转义

**Commit**: `c218575`
**Type**: P0 — Scaffold Architecture
**Module**: `src/assets/js/spa-router.js`

### Symptom
Regex fallback `[\\s\\S]` 在 regex literal `/pattern/` 中匹配的是字面字符 `\s\S`（四个字符），不是"所有字符"。中文字符页面的 SPA 内容永远无法提取。

### Root Cause
写过成 `new RegExp("[\\s\\S]")` 的字符串转义思路，但在 `/pattern/` 字面量中 `\\s` 就是字面的反斜杠+s，不是空白字符类。

### Fix
弃用 regex fallback，改用 `indexOf("<main")` + `lastIndexOf("</main>")` 的字符串截断方式。

### Prevention
- DEV-STANDARDS.md §10.8 新增正则陷阱章节
- `test/regex-patterns.js` 正则回归测试
- Regex literal 中禁止双重转义

---

## 2026-05-17: Section spacing collapse 过度

**Commit**: `c218575`
**Type**: P0 — Scaffold CSS
**Module**: `src/assets/css/styles.css`

### Symptom
所有相邻 section 被 `main > section + section { margin-top: -3.5rem }` 吞噬间距，Trust Bar / Why BRAND_PROJECT 视觉重叠。

### Root Cause
通用 collapse 规则过于激进，没有覆盖以下场景：
- hero-overlap 之后不应再 collapse
- hero-banner（固定高度）之后不应 collapse
- 交替背景 section 之间需要更大间距
- CTA/彩色背景 section 之后不应 collapse

### Fix
从 -3.5rem/0 改为 **-1.5rem**（移动端）/ **-2rem**（桌面端），分别覆盖所有边界场景。

### Prevention
- DEV-STANDARDS.md §4.6 新增 CSS Section Spacing 规范
- 明确 `py-* + margin-top` 的计算公式
- 新加 section 时必须指定是"同背景"还是"交替背景"

---

## 2026-05-17: SPA content extraction — fetch 内容截断 (htmlLen=7668)

**Commit**: `13cf660`
**Type**: P0 — 未查明
**Module**: `src/assets/js/spa-router.js`

### Symptom
fetch `/products/tea/index-pc.html` 返回 7668 字节（文件实际 9728），`</main>` 在 8111 位置，内容永远无法提取。

### Investigation
- curl 能获取完整 9671 字节（Content-Length: 9671）
- 服务端未设置响应体截断
- 所有产品子页面均受影响（文件 > 8KB）

### Fix
加 `cache: 'no-store'`、响应头日志、content-length 对比。根因仍未彻底查明。

### Prevention
- SPA debug mode 在 init 时对比响应长度 vs 期望长度
- 超出阈值时告警
- 考虑改用 `response.clone().arrayBuffer()` 避免 text() 解析问题

---

## 2026-05-17: tailwind 品牌色被覆盖

**Commit**: `cd80d74`
**Type**: P1 — Scaffold Build
**Module**: `tailwind.config.js` + `src/assets/css/styles.css`

### Symptom
`--color-primary: #2E7D32` 被 `tailwind.css` 中的 `--color-primary: #2E7D32`（旧项目）覆盖。所有品牌色显示为橙色。

### Root Cause
`styles.css` 先加载 → CSS 变量写入 → `tailwind.css` 后加载 → 同名 CSS 变量覆盖。`tailwind.config.js` 中的 primary 值为旧 BRAND_PROJECT 项目的 `#2E7D32`，未更新。

### Fix
将 `tailwind.config.js` 所有品牌色调为 `#2E7D32`，重新运行 `npm run build:css`。

### Prevention
- BUILD.md 新增 CSS 变量优先级说明
- 品牌色单数据源原则
- `tailwind.config.js` 的颜色值应与 `styles.css` 的 `--color-primary` 一致

---

## 2026-05-15: product-grid _cfgCats ReferenceError

**Commit**: `230c3dd`
**Type**: P1 — Scaffold Config Bridge
**Module**: `src/assets/js/product-grid.js`

### Symptom
site.config.js 的 `categories` 结构变更后，product-grid 引用 `_cfg.categories` 时 `_cfg` 有值但字段结构不兼容 → `_cfgCats` undefined → 白屏。

### Root Cause
Config bridge 模式没有字段级依赖追踪。product-grid 是唯一知道 `categories` 字段格式的 consumer。改了 config 没改 product-grid 就会崩。

### Fix
在 product-grid 中添加 `_cfgCats` 防御性判断 + 空数组 fallback。

### Prevention
- SITE-CONFIG.md 新增依赖追踪表：列出 `categories` 被哪些 JS 引用
- 改 config schema 前必须 grep 所有引用方
- DEV-STANDARDS.md 新增 config 变更检查清单

---

## 2026-05-15: nav dropdown 点击不导航

**Commit**: `30d69cd`
**Type**: P1 — Scaffold Nav
**Module**: `src/assets/js/ui/navigator.js`

### Symptom
applications/support 渲染为 dropdown 菜单，但所有子项点击后 URL 不变（子页面不存在）。

### Root Cause
Nav 组件只要有 `children` 数组就渲染 dropdown，不管 `children[n].href` 是否存在对应页面。

### Fix
删除 applications/support 的 `children` 数组，改为直接链接。

### Prevention
- SITE-CONFIG.md 新增 nav 配置校验规则
- `scripts/validate-config.js` 检查所有 href 是否存在对应页面
- Nav 组件应添加 dead link 运行时告警

---

## 2026-05-15: SPA init race condition

**Commit**: `2848524`
**Type**: P1 — Scaffold Router
**Module**: `src/assets/js/spa-router.js`

### Symptom
初始化时 `init()` 调用 `loadRoute()` 不带 `navVersion`，用户快速导航后，init fetch 完成时覆盖用户的最新导航结果。

### Root Cause
SPA Router 的初始化流程和用户导航流程共享同一 async 通道，没有锁或版本机制。

### Fix
在 `init()` 中传入 `initVersion` 作为 `navVersion`，让 race protection 生效。

### Prevention
- ARCHITECTURE.md 中说明 SPA 初始化流程的 race condition 防护机制
- 所有 `loadRoute()` 调用必须有 `navVersion` 参数

---

## 2026-05-15: hero/overview CSS 重叠

**Commit**: `c775e19` `264f2be`
**Type**: P1 — Scaffold CSS
**Module**: `src/assets/css/styles.css`

### Symptom
hero-banner 固定高度 `h-[500px]`，下方 section 的 `margin-top: -3.5rem` 把 Overview 内容拉入 hero 区域。

### Root Cause
Hero 有 3 种模式（hero-overlap/hero-banner/section-passthrough），通用 collapse 规则只考虑了 overlap 模式。

### Fix
添加特异性规则：`.hero-banner + section { margin-top: 0 }`（不折叠）。

### Prevention
- DEV-STANDARDS.md 新增 hero 类型说明
- 新增 section 时必须考虑前序 section 的 type

---

## 2026-05-15: Lefthook pre-push sh 不兼容

**Commits**: `7d831d7` `ae057a1`
**Type**: P2 — Scaffold Build
**Module**: `.lefthook.yml` + `scripts/githooks/pre-push`

### Symptom
`process substitution` (`<()` ) 在 POSIX sh 中不可用，部分 CI 环境使用 sh 而不是 bash。

### Fix
移除 process substitution，改用临时文件或管道。

### Prevention
- 所有 hook 脚本在 sh 和 bash 下都需测试
- BUILD.md 标注 hook 的最低 shell 要求

---

## 2026-05-15: tailwind.css 提交到 git

**Commit**: `f3c61a2`
**Type**: P2 — Scaffold Build
**Module**: `.gitignore` + `dist/`

### Symptom
git merge 导致 `src/assets/css/tailwind.css` 冲突（构建产物被同时编辑）。

### Root Cause
构建产物 `tailwind.css` 和 `dist/` 被提交到 git，而不是在 CI 中生成。

### Fix
解决 merge conflict，重新生成 tailwind.css。

### Prevention
- 构建产物（tailwind.css, dist/）应加入 `.gitignore`
- 但当前项目结构以 `src/` 为根，tailwind.css 是开发依赖（被 HTML 引用），不能直接 gitignore
- 备选方案：将 tailwind 输出到 `dist/` 而非 `src/`
