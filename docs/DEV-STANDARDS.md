# DEV-STANDARDS.md — Brand Scaffold 开发规范 v2.0

> **生效日期**：2026-05-13
> **适用范围**：所有开发人员、AI Agent、自动化工具
> **强制级别**：🔴 必须 / 🟡 推荐 / ⚪ 建议

---

## 目录

1. [Git 工作流与分支管理](#1-git-工作流与分支管理)
2. [代码提交管控](#2-代码提交管控)
3. [配置读取规范](#3-配置读取规范)
4. [代码质量规范](#4-代码质量规范)
5. [性能规范](#5-性能规范)
6. [文件结构规范](#6-文件结构规范)
7. [构建与部署规范](#7-构建与部署规范)
8. [代码审查清单](#8-代码审查清单)
9. [危险操作清单](#9-危险操作清单)
10. [代码搜索与批量替换规范](#10-代码搜索与批量替换规范) ⭐ **最高优先级**
11. [调试与问题定位指南](#11-调试与问题定位指南)

> **第4章新增必读：** [4.8 三屏一致性](##48-三屏一致性) · [4.9 根因修复原则](#49-根因修复原则) · [4.10 调试与问题定位方法](#410-调试与问题定位方法)

---

## 1. Git 工作流与分支管理

### 1.1 分支体系 🔴

```
master (生产，受保护)
  │
  ├── feat/xxx    (功能开发)
  ├── fix/xxx     (Bug 修复)
  ├── refactor/xxx (重构)
  └── chore/xxx   (工具/配置)
```

| 分支 | 用途 | 保护级别 | Push 规则 |
|------|------|---------|-----------|
| `master` | 生产代码 | 🔴 最高 | 禁止直推，必须通过 PR 合并 |
| `feat/*` | 新功能开发 | 🟡 中 | 禁止 force push |
| `fix/*` | Bug 修复 | 🟡 中 | 禁止 force push |
| `refactor/*` | 代码重构 | 🟡 中 | 禁止 force push |
| `chore/*` | 构建/配置/工具 | ⚪ 低 | 允许直推 |

### 1.2 分支命名规则 🔴

```
feat/roi-new-countries        ← 功能
fix/navigator-mobile-close    ← 修复
refactor/cross-sell-config    ← 重构
chore/update-lint-rules       ← 工具
```

**禁止**：
- ❌ `test`、`tmp`、`wip`、`backup`、`old-*` 等临时分支名
- ❌ 包含中文或特殊字符的分支名
- ❌ 单词分支名（如 `feature`、`dev`），必须带描述

### 1.3 分支生命周期 🔴

```
创建分支 → 开发 → 本地测试 → 创建 PR → Code Review → 合并 → 删除分支
```

- 合并后**必须删除**功能分支（GitHub Settings → Auto delete branch）
- 超过 7 天未更新的功能分支将被**自动标记为过期**
- master 分支**永远保持可部署状态**

### 1.4 多人协作冲突预防

- **同一个模块不要超过 2 人同时改**（通过 Issue/任务分配协调）
- 每天至少 sync 一次 master 到功能分支：`git fetch origin && git rebase origin/master`
- 大范围重构（涉及 >10 文件）必须先创建 Issue 讨论方案，获批准后再开发
- 合并前必须 rebase（不要用 merge 产生不必要的 merge commit）

### 1.5 紧急修复流程

```
master (生产出 bug)
  │
  ├── 创建 fix/critical-xxx
  │     │
  │     └── 修复 → 测试 → PR → 直接合并 master
  │
  └── 合并后立即 cherry-pick 到其他活跃分支
```

---

## 2. 代码提交管控

### 2.1 Commit 格式 🔴

```
<type>(<scope>): <简短描述，不超过 50 字符>

<可选详细说明，解释 why 而非 what>

<footer>
  Refs: #issue-number
  Co-authored-by: name <email>
```

**Type（必填）**：

| Type | 含义 | 版本影响 |
|------|------|---------|
| `feat` | 新功能 | MINOR 版本+1 |
| `fix` | Bug 修复 | PATCH 版本+1 |
| `refactor` | 重构（不改功能） | 无 |
| `perf` | 性能优化 | PATCH 版本+1 |
| `style` | 代码格式（不影响逻辑） | 无 |
| `docs` | 文档 | 无 |
| `chore` | 构建/工具/配置 | 无 |
| `ci` | CI/CD | 无 |
| `revert` | 回滚 | 视情况 |

**Scope（必填）**：`config`, `nav`, `roi`, `i18n`, `products`, `cases`, `contacts`, `build`, `css`, `html`, `lint`

**示例**：
```
feat(roi): add 10 new countries to salary table

Refs: #42

fix(navigator): mobile menu not closing after link click
Root cause: touchstart handler was not removed on route change.
```

### 2.2 Commit 禁止项 🔴

| 禁止 | 原因 |
|------|------|
| ❌ `git commit -m "."` | 空消息 |
| ❌ `git commit -m "fix"` | 无 scope |
| ❌ `git commit -m "WIP"` / `"temp"` / `"asdf"` | 无意义 |
| ❌ 超过 100 行的 diff 在一个 commit | 必须拆分 |
| ❌ `git commit --amend` 修改已推送的 commit | 破坏历史 |
| ❌ 包含 console.log 的提交 | 调试代码 |
| ❌ 包含密码/token/密钥的提交 | 安全 |

### 2.3 Pre-commit Hook 🔴

每次 `git commit` 自动执行，**失败则阻止提交**：

| 检查项 | 说明 | 可跳过 |
|--------|------|--------|
| JS 语法 | `node -c` 所有修改的 `.js` | ❌ |
| JSON 格式 | 所有修改的 `.json` | ❌ |
| 大文件 | 单文件 >50MB | ❌ |
| 品牌泄露 | `#2E7D32` / `"BRAND_PROJECT"` / 硬编码联系方式 | ❌ |
| console.log | 未 guard 的 console | 🟡 |
| 编码 | 非 UTF-8 文件 | ❌ |

### 2.4 Pre-push Hook 🔴

每次 `git push` 自动执行，**失败则阻止推送**：

| 检查项 | 说明 |
|--------|------|
| 分支保护 | 禁止直接 push 到 master（必须 PR） |
| 语法全量 | 所有 JS 文件 `node -c` |
| Lint 检查 | `node scripts/lint-code.js` |
| 构建验证 | `npm run build` 必须成功 |

### 2.5 Commit Message Hook 🟡

自动规范化 commit message：

- 首行不超过 72 字符
- 强制 `<type>(<scope>)` 格式
- 自动添加变更文件统计

---

## 3. 配置读取规范

### 3.1 标准 Config Bridge 🔴

所有需要读取配置的 JS 文件**必须**在 IIFE 顶部声明：

```javascript
;(function () {
  'use strict';

  // ── Config Bridge (MANDATORY) ──
  var _cfg    = window.SITE_CONFIG || window._cfg || {};
  var _brand  = _cfg.brand  || {};
  var _theme  = _cfg.theme  || {};
  var _colors = _theme.colors || {};
  var _primary = _colors.primary || "#2E7D32";

  // ── Config-driven values (MANDATORY) ──
  var BRAND_NAME = _brand.name || "BRAND_PROJECT";

  // ... module code
})();
```

### 3.2 Config Bridge 规则 🔴

| 规则 | 说明 |
|------|------|
| 只声明一次 | `_cfg` 在文件顶部声明一次，后续复用 |
| 严格顺序 | 声明顺序：`_cfg → _brand → _theme → _colors → _primary` |
| 必须有 fallback | 每个读取必须有 `|| defaultValue` |
| 禁止深层访问 | `var x = _cfg.brand || {}` ✅ / `var x = _cfg.brand.name` ❌ |

### 3.3 联系方式三级 Fallback 🔴

```javascript
// 优先级：site.config → window.Contacts → 硬编码默认值
var waNumber = (window.Contacts && window.Contacts.whatsapp)
  || _cfg.contacts.whatsapp
  || "86CONTACT_PHONE";
```

### 3.4 品牌色使用 🔴

```javascript
// ✅ JS 拼接 CSS/HTML 字符串时：
var style = 'color:' + _primary + ';';

// ✅ 直接设置 DOM 属性时：
element.style.color = _primary;

// ❌ 常见 BUG——把拼接语法当字面量赋值：
element.style.color = "' + _primary + '";  // 这会设置字面量 "' + _primary + '"
```

### 3.5 社交链接 🔴

所有外部链接（社交媒体、邮箱、电话）必须从 `site.config.js` 的 `contacts.social` 读取，**禁止硬编码 URL**。

---

## 4. 代码质量规范

### 4.1 ES5 兼容 🔴

| 禁止 | 原因 | 替代 |
|------|------|------|
| `let`, `const` | 目标浏览器不支持 | `var` |
| `=>` 箭头函数 | 同上 | `function () {}` |
| `` `${}` `` 模板字符串 | 同上 | 字符串拼接 `' + var + '` |
| 解构赋值 `{ a, b } = obj` | 同上 | `var a = obj.a; var b = obj.b;` |
| `Promise` | 部分旧设备不支持 | 回调函数 |
| `Array.includes()` | 同上 | `Array.indexOf() !== -1` |
| `Object.assign()` | 同上 | 手动 copy |
| `class` | 同上 | 构造函数 + prototype |

### 4.2 IIFE 模式 🔴

每个文件必须是独立的 IIFE：

```javascript
;(function () {
  'use strict';
  // ...
})();
```

- 前缀分号 `;(function` 防止前一个文件的未闭合括号导致问题
- **必须包含** `'use strict';`
- 禁止全局作用域的 `var` 声明

### 4.3 错误处理 🔴

**必须用 try/catch 的场景**：
- `JSON.parse()` — 10 处当前缺少，必须补上
- `fetch()` / `XMLHttpRequest` — 9 处缺少 catch
- `localStorage` / `sessionStorage` 操作
- `new Function()` / `eval()`（本项目已无 eval）
- DOM 操作中访问可能不存在的元素

```javascript
// ✅ 最小范围 try/catch
try {
  var data = JSON.parse(str);
} catch (e) {
  console.warn("[ModuleName] JSON parse failed:", e);
  return fallbackValue;
}

// ❌ 静默吞错
try { JSON.parse(str); } catch (e) {}

// ❌ 整个 IIFE 包在 try/catch（掩盖具体错误位置）
try {
  // 500 行代码...
} catch (e) { console.error(e); }
```

### 4.4 innerHTML 安全 🔴

当前 79 处 innerHTML 赋值需逐步审查。

**高风险模式**（必须消除）：
```javascript
// ❌ 用户输入直接拼接
element.innerHTML = '<div>' + userInput + '</div>';

// ❌ URL 参数直接拼接
element.innerHTML = '<a href="' + location.search + '">link</a>';
```

**安全模式**：
```javascript
// ✅ 纯文本
element.textContent = userInput;

// ✅ 系统生成内容（无用户输入）
element.innerHTML = '<div class="card">' + title + '</div>';

// ✅ HTML 转义后再拼接
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}
element.innerHTML = '<div>' + escapeHtml(userInput) + '</div>';
```

### 4.5 事件监听器 🔴

当前 262 处 addEventListener vs 13 处 removeEventListener。

**规则**：
- 绑定事件必须用命名函数（不匿名）
- SPA 路由切换时必须清理监听器
- 同一元素/事件不要重复绑定（用 `{ once: true }` 或检查是否已绑定）

### 4.6 Magic Numbers 🟡

```javascript
// ✅ 命名常量
var ANIMATION_DURATION = 300;
var DEBOUNCE_DELAY = 150;
var TABLET_BREAKPOINT = 768;
var MOBILE_BREAKPOINT = 640;

// ❌ 裸数字
setTimeout(fn, 300);
if (window.innerWidth > 768) { ... }
```

### 4.7 'use strict' 🔴

所有 JS 文件**必须**包含 `'use strict';`（当前 4 个文件缺少）。

### 4.8 三屏一致性 🔴

本项目面向 PC（≥1024px）、Tablet（768-1023px）、Mobile（<768px）三个屏幕尺寸。**任何代码修改都必须考虑三端影响**。

**强制规则：**

| 规则 | 说明 |
|------|------|
| 修改必验三屏 | 修改任何 JS/CSS/HTML 后，必须检查 PC、Tablet、Mobile 三端表现 |
| 不能只改一端 | 修复 Mobile 的 bug 时，确认 PC 和 Tablet 没有回归 |
| 共享模块影响面 | 修改 `common.js`、`utils.js`、`translations.js` 等共享模块时，必须验证所有页面 |
| 响应式断点一致 | 新增样式必须覆盖三个断点，不能只写一个 `min-width` |
| 事件适配 | 触摸事件（Mobile）和鼠标事件（PC/Tablet）都要处理 |

**三屏验证方法：**

```
1. 浏览器 DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. 依次切换三个断点验证：
   - PC: 1440px / 1280px / 1024px

### 4.9 CSS Section Spacing 🔴

Section 间距由 `main > section + section { margin-top }` 控制。
修改前必须理解以下规则：

**计算方式**：相邻 section 的 `padding-top + padding-bottom` 之和 − `margin-top` collapse。
例如两个 `py-12` section = `(3rem + 3rem) − 1.5rem = 4.5rem` 净间距。

**场景矩阵**（更新于 2026-05-17, commit c218575）：

| 场景 | 移动端 | 桌面端 | 说明 |
|------|--------|--------|------|
| 普通 section 之间 | `-1.5rem` | `-2rem` | 默认 collapse |
| hero-overlap 之后 | `0` | `0` | hero 已处理间距 |
| hero-banner 之后 | `0` | `0` | 固定高度，防止重叠 |
| CTA/彩色背景之后 | `0` | `0` | 视觉上需要明确分隔 |
| 交替背景之间 | 同默认 | 同默认 | 不再单独减 collapse |

**规则**：
1. 新增 section 时必须指定它是什么类型（同背景/交替背景/CTA）
2. 不要修改默认 collapse 值（-1.5rem/-2rem），改用特异性覆盖
3. 新增 hero banner section 时必须添加 `.hero-banner` class

### 4.10 Hero Type Architecture 🔴

项目有 3 种 Hero 模式，每种有独立的 CSS 规则：

**hero-overlap**：首页用，与 navbar 重叠，`margin-top: calc(var(--nav-height) * -1)`
**hero-banner**：产品子页面用，固定高度 `h-[500px]`，无重叠
**section-passthrough**：内容型页面，无特殊处理

**规则**：
1. 新增页面时必须声明 hero 类型 class
2. hero-banner 后必须加 `+ section { margin-top: 0 }`（已在 styles.css 中）
3. 修改 hero 高度时要同步调整后续 section 的 collapse 行为
   - Tablet: 768px / 900px
   - Mobile: 375px / 414px
3. 刷新页面，检查布局、交互、功能是否正常
4. 如有语言切换，三端都要验证切换效果
```

### 4.9 根因修复原则 🔴

**禁止打补丁式修复。** 每个问题必须找到根本原因，从根源解决。

#### 禁止的补丁模式 🔴

| 补丁模式 | 为什么禁止 | 正确做法 |
|----------|-----------|---------|
| `setTimeout(fn, 300)` 掩盖时序问题 | 时序依赖不稳定，设备性能差异导致时好时坏 | 找到事件/数据就绪的触发点，用回调或事件监听 |
| `display: none` 隐藏问题元素 | 元素仍然存在，占用内存，可能影响其他逻辑 | 找到元素错误渲染/定位的原因，修复布局或数据 |
| `try/catch` 吞掉错误不处理 | 错误被静默掩盖，问题潜伏到线上 | 在 catch 中正确处理（降级、重试、上报） |
| `!important` 覆盖样式 | 破坏样式优先级，后续维护困难 | 找到样式被覆盖的原因，调整选择器权重 |
| 硬编码尺寸/位置 | 不适配不同屏幕和内容长度 | 使用相对单位（%、rem）、Flexbox、Grid |
| 复制粘贴代码修复 | 不理解原因，引入新 bug | 理解数据流和执行路径后再修复 |

#### 修复前必须回答的问题 🔴

每次修复前，先回答以下问题：

```
1. 这个问题的触发条件是什么？（哪个页面、什么操作、什么数据）
2. 数据流经过哪些模块？（数据从哪来、在哪处理、在哪渲染）
3. 问题出现在数据流的哪个环节？（数据源？清洗？渲染？）
4. 为什么会出错？（而不是「加个判断跳过」）
5. 修复后会影响哪些其他模块/页面？
```

#### 修复流程 🔴

```
1. 复现问题 → 明确触发条件
2. 定位相关文件和模块
3. 插入调试日志（见 4.10）追踪数据流
4. 找到第一个出错点（不是表面症状，是根因）
5. 从根因修复
6. 删除调试日志
7. 三屏验证（见 4.8）
8. lint + 语法检查通过后提交
```

### 4.10 调试与问题定位方法 🔴

#### 4.10.1 调试日志规范 🔴

**必须遵守的日志级别：**

| 级别 | 用途 | 生产环境 | 示例 |
|------|------|----------|------|
| `console.error` | 运行时异常、必须关注的问题 | ✅ 保留 | 网络失败、JSON 解析错误 |
| `console.warn` | 非致命问题、降级处理 | ✅ 保留 | 翻译加载失败、缓存失效 |
| `console.log` / `console.debug` | 开发调试信息 | ❌ 必须守卫 | 渲染路径、数据结构 |
| `console.info` | 一般性信息 | ❌ 必须守卫 | 初始化完成 |

**日志守卫格式：**

```javascript
// ✅ 标准守卫
if (__DEVELOPMENT__) console.log("[ModuleName] rendering:", data);

// ✅ 带前缀（便于 grep 定位）
if (__DEVELOPMENT__) console.log("[ProductGrid] doRender called with", count, "items");

// ❌ 无守卫的 log — pre-commit hook 会拦截
console.log("rendering products", data);

// ❌ 用 warn/error 代替 log 守卫
console.warn("[ProductGrid] doRender called");  // 这不是警告，是调试信息
```

**前缀命名规范：** `[ModuleName]` 大驼峰，与文件名一致。

```javascript
// 文件: profit-calculator.js
if (__DEVELOPMENT__) console.log("[ProfitCalc] recommendProducts called");

// 文件: spa-router.js
if (__DEVELOPMENT__) console.log("[SPARouter] navigating to", path);

// 文件: translations.js
if (__DEVELOPMENT__) console.log("[i18n] setLanguage:", lang);
```

**临时调试日志**（排查问题时插入，修复后必须删除）：

```javascript
// 标记 TODO:DEBUG 方便搜索清理
if (__DEVELOPMENT__) console.log("[ProductDetail] TODO:DEBUG spec data:", JSON.stringify(specs));
```

清理时搜索：`grep -rn "TODO:DEBUG" src/assets/js/`

#### 4.10.2 定位问题的标准方法 🔴

**Step 1: 确定影响范围**

```
- 哪个页面？哪个屏幕尺寸（PC/Tablet/Mobile）？
- 是首次加载就出问题，还是某个操作后触发？
- 三端都有问题，还是特定端？
```

**Step 2: 浏览器控制台诊断**

```
1. F12 → Console：查看 error / warn 报错
2. F12 → Network：检查请求是否成功（翻译文件、产品数据）
3. F12 → Elements：检查 DOM 结构和 CSS 是否正确
4. F12 → Application → localStorage：检查翻译缓存、用户语言设置
```

**Step 3: 插入调试日志追踪数据流**

```javascript
// 追踪数据是否到达 — 在函数入口
function renderProducts(products) {
  if (__DEVELOPMENT__) console.log("[ProductGrid] renderProducts input:", products ? products.length : 'null');
  // ...
}

// 追踪分支走向 — 在条件判断处
if (products && products.length > 0) {
  if (__DEVELOPMENT__) console.log("[ProductGrid] branch: has products");
} else {
  if (__DEVELOPMENT__) console.log("[ProductGrid] branch: empty products");
}

// 追踪异步结果 — 在 callback 处
fetch('/api/data').then(function(res) {
  if (__DEVELOPMENT__) console.log("[Module] fetch status:", res.status);
  return res.json();
}).catch(function(err) {
  console.error("[Module] fetch failed:", err);  // error 不需要守卫
});
```

**Step 4: DOM 状态检查**

```javascript
// 检查元素是否存在
var el = document.getElementById('product-grid');
if (__DEVELOPMENT__) console.log("[ProductGrid] container el:", el ? 'found' : 'NOT FOUND');

// 检查子元素数量
if (__DEVELOPMENT__) console.log("[ProductGrid] children count:", el ? el.children.length : 'N/A');

// 检查 CSS 类
if (__DEVELOPMENT__) console.log("[ProductGrid] container classes:", el ? el.className : 'N/A');
```

**Step 5: 事件绑定验证**

```javascript
// 确认事件是否触发
button.addEventListener('click', function(e) {
  if (__DEVELOPMENT__) console.log('[FilterBar] click fired, target:', e.target);
});
```

#### 4.10.3 常用诊断命令

```bash
# JS 语法检查（最快排查语法错误）
node -c src/assets/js/文件名.js

# 批量语法检查
find src/assets/js -name "*.js" ! -path "*/vendor/*" -exec node -c {} \;

# JSON 格式检查
node -e "JSON.parse(require('fs').readFileSync('文件.json','utf8')); console.log('OK')"

# 搜索未守卫的 console.log
grep -rn "console\.log" src/assets/js/*.js | grep -v vendor | grep -v __DEVELOPMENT__

# 搜索调试残留
grep -rn "TODO:DEBUG" src/assets/js/

# 检查 HTML 中是否引用了不存在的 JS 文件
for f in $(grep -roh 'src="[^"]*\.js' dist/ | sed 's/src="//'); do [ ! -f "dist/$f" ] && echo "MISSING: $f"; done
```

---

## 5. 性能规范

### 5.1 DOM 操作 🟡

| 规则 | 说明 |
|------|------|
| DocumentFragment | 批量插入 DOM 时必须使用 |
| 读写分离 | 先读取所有值，再统一写入 |
| classList | 代替 className 字符串拼接 |
| 事件委托 | 超过 3 个同类元素必须用委托 |

### 5.2 资源加载 🟡

| 规则 | 说明 |
|------|------|
| `loading="lazy"` | 所有非首屏图片 |
| `preload` | 关键 CSS/字体 |
| 禁止同步脚本 | 全部用 `defer` 或 `async` |
| 大文件 CDN | >50MB 文件禁入 Git |

### 5.3 CSS 性能 🟡

| 规则 | 说明 |
|------|------|
| 禁止滥用 `!important` | 当前 5 处（仅第三方覆盖允许） |
| 动画属性 | 优先 `transform` + `opacity` |
| 选择器深度 | 不超过 4 层 |
| 避免通配符 | 禁止 `*` 在生产 CSS 中 |

---

## 6. 文件结构规范

### 6.1 命名 🔴

遵循 [Google Developer Documentation Style Guide — Filenames](https://developers.google.com/style/filenames)。

**核心原则：**

1. **全小写** — 跨平台兼容，查找更高效
2. **连字符分隔** — `-` 而非 `_`（搜索引擎将 `-` 视为空格，`_` 不会）
3. **仅 ASCII 字符** — 禁止中文、特殊符号、重音字符
4. **语义化** — 描述文件内容，不使用随机 ID 或时间戳
5. **禁止泛型名** — 如 `document1.html`、`image1.png`

**例外：** 如果目录内已有既定的 `_` 风格，且难以全局修改，可保持一致性使用 `_`。

| 类型 | 格式 | 示例 |
|------|------|------|
| JS | `kebab-case.js` | `profit-calculator.js` |
| CSS | `kebab-case.css` | `performance-optimized.css` |
| HTML | `index-{device}.html` | `index-pc.html`, `index-mobile.html` |
| 配置 | `kebab-case.config.js` | `site.config.js` |
| 文档 | `UPPER-CASE.md` | `DEV-STANDARDS.md` |
| 图片（通用） | `{module}-{描述}.{ext}` | `about-hero.webp`, `dishwasher-front.webp` |
| 图片（产品系列） | `{系列}-{序号}.{ext}` | `coffee-001.webp`, `gut-012.webp` |
| 图片（产品 SKU） | `{product-model}.{ext}` | `esl-gb80.webp`, `esl-gq90.webp` |
| 图片（场景/分类） | `{模块}-{场景}-{描述}.{ext}` | `canteen-pain-1.webp`, `factory-gallery-1.webp` |
| 视频 | `{模块}-{描述}.{ext}` | `product-showcase.mp4` |
| SVG | `{模块}-{描述}.svg` | `world-map.svg` |
| Favicon/OG | `{用途}.{ext}` | `og-home.webp`, `favicon.webp` |

**产品图片路径约定：**
```
/assets/images/products/{category}/{seq}.webp
# 例：/assets/images/products/coffee/001.webp
```

**违规示例：**

| ❌ 违规 | 问题 | ✅ 修正 |
|--------|------|--------|
| `canteen-推荐.webp` | 含中文 | `canteen-recommended.webp` |
| `factory_gallery_1.webp` | 用下划线 | `factory-gallery-1.webp` |
| `1776770021777-859b3w.webp` | 随机 ID 无语义 | `product-001.webp` |
| `b1rac_1.webp` | 无意义编码 | 移入子目录命名 |

### 6.2 模块结构 🔴

```javascript
/**
 * module-name.js — 一句话描述
 *
 * 详细说明...
 *
 * Depends on:
 *   site.config.js → window.SITE_CONFIG
 *   contacts.js    → window.Contacts
 *
 * Exports:
 *   window.ModuleName
 */
;(function () {
  'use strict';

  // ── Config Bridge ──
  var _cfg = window.SITE_CONFIG || window._cfg || {};

  // ── Constants ──
  var TIMEOUT_MS = 300;

  // ── State ──
  var isActive = false;

  // ── Helpers ──
  function sanitize(str) { ... }

  // ── Core Logic ──
  function init() { ... }

  // ── DOM Ready ──
  document.addEventListener('DOMContentLoaded', init);

  // ── Exports ──
  window.ModuleName = { init: init };
})();
```

### 6.3 脚本加载顺序 🔴

```
1. site.config.js              ← 必须最先（config 数据）
2. device-utils.js              ← 设备检测
3. common.js                    ← 通用工具
4. lang-registry.js             ← 语言注册
5. translations.js              ← 翻译引擎
6. ui/*.js                      ← UI 组件
7. page-*.js                    ← 页面逻辑
8. init.js                      ← 最后（依赖所有模块）
```

---

## 7. 构建与部署规范

### 7.1 构建命令

```bash
npm run build           # 主构建（build.sh → dist/）
npm run build:dev       # 开发构建（webpack + SSG）
npm run build:production # 生产构建（minify + SSG）
npm run dev             # 开发服务器
npm run lint            # ESLint
npm run lint:all        # ESLint + Stylelint + HTMLHint
node scripts/lint-code.js  # 自定义项目 lint（5 项检查）
```

### 7.2 构建产物验证 🟡

构建完成后必须验证：

```bash
# 1. site.config.js 是否在 dist/
ls -la dist/site.config.js

# 2. 所有 HTML 是否引用 site.config.js
grep -rl 'site.config.js' dist/ | wc -l

# 3. 无 JS 语法错误
find dist -name '*.js' -exec node -c {} \;

# 4. 总文件数合理
ls dist/ | wc -l  # 预期 ~509
```

### 7.3 版本管理 🟡

- 构建脚本自动添加 `?v=YYYYMMDDHHMM` 缓存破坏
- 手动发布时更新 `package.json` 的 `version`
- 版本号遵循 SemVer：`MAJOR.MINOR.PATCH`

---

## 8. 代码审查清单

### 8.1 基础检查 🔴

| # | 检查项 | 工具/方法 |
|---|--------|----------|
| 1 | JS 语法无错误 | `node -c` / pre-commit hook |
| 2 | JSON 格式正确 | `node -e "JSON.parse()"` |
| 3 | HTML 标签闭合 | lint-code.js |
| 4 | 无 console.log 泄露 | grep / lint-code.js |
| 5 | 文件编码 UTF-8 | `file` 命令 |
| 6 | `'use strict'` 存在 | grep |

### 8.2 架构检查 🔴

| # | 检查项 | 说明 |
|---|--------|------|
| 7 | Config Bridge | 新文件是否有标准 _cfg 声明 |
| 8 | Fallback 链 | 联系方式/品牌名是否有三级 fallback |
| 9 | 全局变量冲突 | window.* 是否与其他模块冲突 |
| 10 | 加载顺序 | 新依赖是否在依赖它之前加载 |

### 8.3 安全检查 🔴

| # | 检查项 | 说明 |
|---|--------|------|
| 11 | innerHTML XSS | 是否拼接了用户输入/URL 参数 |
| 12 | 敏感信息 | 是否有 API key / password / token |
| 13 | 外部链接 | 社交链接是否从 config 读取 |
| 14 | eval / Function | 是否有动态代码执行 |

### 8.4 性能检查 🟡

| # | 检查项 | 说明 |
|---|--------|------|
| 15 | 事件委托 | 列表是否用了事件委托 |
| 16 | 内存泄漏 | 是否有未清理的 addEventListener |
| 17 | 大文件 | 是否有 >50MB 文件 |
| 18 | 图片懒加载 | 非首屏图片是否 `loading="lazy"` |

---

## 9. 危险操作清单 🔴

以下操作**被 Git Hooks 自动拦截**，手动执行也**需要团队确认**：

| 危险操作 | 风险等级 | Hook 拦截 | 处理方式 |
|----------|---------|-----------|---------|
| `git push --force` master | 🔴 P0 | ✅ pre-push | 禁止，任何情况都不允许 |
| `git push` 到 master | 🔴 P0 | ✅ pre-push | 必须通过 PR |
| `git reset --hard` | 🔴 P1 | ❌ | 需确认无未提交修改 |
| `git branch -D master` | 🔴 P0 | ❌ | 禁止 |
| 提交 >50MB 文件 | 🔴 P1 | ✅ pre-commit | 用 CDN/LFS |
| 提交 .env / secret | 🔴 P0 | ✅ pre-commit | 用 .gitignore |
| 删除 site.config.js | 🔴 P1 | ❌ | 核心配置文件 |
| 修改 .gitignore 放宽规则 | 🟡 P2 | ❌ | 需 Review |
| `npm publish` | 🔴 P0 | ❌ | 需团队 +1 |
| 修改 pre-push hook | 🔴 P0 | ❌ | 需团队 +2 |

### 紧急回滚

如果线上出了严重问题需要紧急回滚：

```bash
# 1. 找到上一个正常 commit
git log --oneline -5

# 2. 回退（创建 revert commit，不改历史）
git revert <commit-hash>
git push origin master  # pre-push 会检查

# 3. 如果需要删除已推送的 commit（极端情况）
git push origin master --force-with-lease  # 比 --force 安全
# ⚠️ 必须先通知所有开发者
```

---

## 10. 代码搜索与批量替换规范

> **本章节是最高优先级的技术规范。** 批量替换是引入 bug 的第一大来源，
> 远超功能开发本身的错误率。所有开发者（含 AI Agent）必须严格遵守。

### 10.1 搜索规范 🔴

#### 10.1.1 搜索工具选择

| 场景 | 推荐工具 | 命令 | 说明 |
|------|---------|------|------|
| 精确字面量搜索 | `grep -rn` | `grep -rn '#2E7D32' src/` | 不解析正则，最安全 |
| 正则模式搜索 | `grep -rPn` | `grep -rPn '(let\|const)\s+\w+' src/` | 需注意正则转义 |
| 跨文件大范围搜索 | `rg` (ripgrep) | `rg '#2E7D32' src/` | 比 grep 快 10x，默认忽略 .gitignore |
| 交互式搜索 | VS Code `Ctrl+Shift+F` | — | 可预览上下文，推荐确认类搜索 |
| 语义搜索（模糊） | AI Agent | 自然语言描述 | 仅用于探索，**不可用于批量替换决策** |

#### 10.1.2 搜索必做步骤 🔴

每次搜索必须执行 **三步确认**：

```bash
# 第 1 步：搜索（只看，不碰）
grep -rn '#2E7D32' src/assets/js/

# 第 2 步：确认命中范围
# 问自己：
#   - 有多少处命中？预期是多少？
#   - 命中是否都在预期文件中？
#   - 有没有意外命中（如注释、字符串字面量、文档）？

# 第 3 步：确认排除范围
# 问自己：
#   - vendor/ 目录是否被误包含？
#   - 注释中是否有同名内容需要保留？
#   - fallback 值（|| '#2E7D32'）是否应被跳过？
```

#### 10.1.3 搜索结果分类

搜索到的每一处命中必须归类后才能决定是否替换：

| 类别 | 标记 | 处理方式 |
|------|------|---------|
| **定义处** | DEF | 替换为变量名 |
| **使用处（非 fallback）** | USE | 替换为变量引用 |
| **Fallback 默认值** | FB | **保留**（`\|\| "#2E7D32"`） |
| **注释/文档** | DOC | 更新注释文本或保留 |
| **vendor/第三方** | VENDOR | **不碰** |
| **字符串字面量/正则** | LIT | 逐个评估，不能批量 |

### 10.2 替换工具选择与风险 🔴

#### 10.2.1 工具对比

| 工具 | 精确度 | 转义风险 | 批量安全 | 推荐场景 |
|------|--------|---------|---------|---------|
| **`edit` (OpenClaw)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **首选**。精确文本匹配，无需处理转义 |
| **VS Code 查找替换** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 手动逐文件确认 |
| **Python `str.replace()`** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **推荐**。跨平台，纯文本替换无转义问题 |
| **Python `re.sub()`** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | **推荐**。正则替换，跨平台一致，用原始字符串 `r''` 防转义 |
| **`sd`（Rust CLI）** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 如果项目已安装，语法最简洁 |
| **Node.js `replace-in-file`** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 已用 Node.js 的项目可选 |
| **`sed -i`** | ⭐⭐ | ⭐⭐ | ⭐⭐ | ❌ **项目禁止。** macOS/Linux sed 行为不一致，--符号转义极易出错 |
| **`awk`** | ⭐⭐ | ⭐⭐ | ⭐⭐ | 仅简单文本，复杂正则不推荐 |
| **AI Agent 批量替换** | ⭐ | ⭐ | ⭐ | **禁止**。成功率 <50%，必须逐文件操作 |

### 10.3 build.sh 文件替换规范 🔴

`build.sh` 中所有文件内容替换操作**必须**使用 `python3`，禁止使用 `sed -i`。

**标准模板：**

```bash
# 纯文本替换 (str.replace)
python3 -c "
import os
DOMAIN = 'https://brew.brand-project.com'
for r, d, fs in os.walk('dist'):
    for f in fs:
        fp = os.path.join(r, f)
        with open(fp) as fh: c = fh.read()
        nc = c.replace('%DOMAIN%', DOMAIN)
        if nc != c:
            with open(fp, 'w') as fh: fh.write(nc)
"

# 正则替换 (re.sub)
python3 -c "
import os, re
for r, d, fs in os.walk('dist'):
    for f in fs:
        fp = os.path.join(r, f)
        with open(fp) as fh: c = fh.read()
        nc = re.sub(r'\\?v=[a-zA-Z0-9._-]*', '?v=' + VERSION, c)
        if nc != c:
            with open(fp, 'w') as fh: fh.write(nc)
"
```

**规则：**
| 规则 | 说明 |
|------|------|
| 使用原始字符串 `r'...'` 或 `r"..."` 避免反斜杠转义 | `r'\?v=...'` 优于 `'\\\\?v=...'` |
| 用 `.replace()` 做纯文本替换 | 比正则更快，无需转义 |
| 用 `re.sub()` 做正则替换 | 需确保正则跨平台一致 |
| 跳过不匹配的文件 | `if nc != c: with open(fp, 'w')` — 只写有变化的文件 |
| 禁止 `sed -i` | macOS/ Linux sed 的 `-i` 参数语法不同 |

**build.sh 现有 python3 替换场景：**
| 场景 | 方式 | 说明 |
|------|------|------|
| i18n 缓存版本刷新 | `re.sub()` | 替换 `I18N_CACHE_V` 数字 |
| %DOMAIN% 占位符 | `.replace()` | 纯文本替换，所有 HTML |
| sw.js 版本号注入 | `re.sub()` | 替换 `SW_VERSION` 字符串 |
| 资源版本号 (v=...) | `re.sub()` | 所有 HTML/CSS 的 `?v=...` 参数 |

#### 10.2.2 各工具的致命陷阱

**❌ Python `.replace()` — 引号嵌套地狱**

```python
# 看似简单，实际有 3 层引号嵌套：Python 外层 → 替换字符串内 → JS 代码内
content = content.replace(
    'var x = "#2E7D32"',       # 这里的 " 是 Python 转义
    'var x = "' + _primary + '"'  # 这里的 " 在 JS 中被解析成字面量
)
# 结果：JS 文件中出现  var x = "' + _primary + '"   而不是变量拼接！
```

**❌ `sed` — 正则特殊字符灾难**

```bash
# 搜索 #2E7D32
sed -i 's/#2E7D32/_primary/g' file.js

# 搜索 (window.SITE_CONFIG || window._cfg)  — 管号、方括号全是正则元字符！
sed -i 's/(window.SITE_CONFIG || window._cfg)/(window.SITE_CONFIG)/g' file.js
# 结果：括号被当作捕获组，匹配行为完全不可预测
```

**❌ AI Agent 批量替换 — 黑箱操作**

```
# AI 对复杂文件（>100 行、多层嵌套、模板字符串）的修改失败率 >50%
# 原因：
#   1. 上下文窗口截断，看不到完整文件
#   2. 引号/转义在生成时被二次转义
#   3. 多处替换时互相干扰
#   4. 不验证替换结果
```

### 10.3 替换操作标准流程 🔴

#### 10.3.1 单文件单处替换（低风险）

```bash
# 场景：一个文件中修改一处值

# 1. 确认位置
grep -n '目标字符串' src/assets/js/target.js
# 输出: 42:  var color = "#2E7D32";

# 2. 查看上下文（前后 3 行）
sed -n '39,45p' src/assets/js/target.js

# 3. 用 edit 精确替换（匹配包含上下文，确保唯一）
# oldText 必须包含足够的上下文使其在文件中唯一
```

#### 10.3.2 同一文件多处替换（中风险）

```bash
# 场景：一个文件中 5 处 #2E7D32 需要替换为 _primary

# 1. 搜索并列出所有命中（带行号和上下文）
grep -n -B2 -A2 '#2E7D32' src/assets/js/target.js

# 2. 逐个分类：哪些该替换、哪些是 fallback、哪些是注释

# 3. 每次只替换 1 处，包含上下文确保唯一匹配
# 4. 替换后立即验证：node -c src/assets/js/target.js

# ❌ 禁止：一次 sed 替换所有命中
# ❌ 禁止：让 AI Agent 一次性改所有处
```

#### 10.3.3 跨文件批量替换（高风险）🔴

```
标准流程（任何批量替换都必须执行）

┌─────────────────────────────────────────────┐
│ 第 1 步：范围评估                            │
│   grep -rn 'pattern' src/ > /tmp/hits.txt   │
│   wc -l /tmp/hits.txt                       │
│   # 预期命中数 vs 实际命中数？                 │
│   # 如果差距 >20%，停止，重新分析              │
├─────────────────────────────────────────────┤
│ 第 2 步：分类标记                            │
│   逐行检查 hits.txt，标记每一处：             │
│   [DEF] [USE] [FB] [DOC] [VENDOR] [LIT]     │
├─────────────────────────────────────────────┤
│ 第 3 步：排除清单                            │
│   明确列出「不替换」的文件和行号               │
│   vendor/*.js — 全部跳过                      │
│   注释行 — 全部跳过                          │
│   fallback 行 (||) — 全部跳过                 │
├─────────────────────────────────────────────┤
│ 第 4 步：逐文件替换                          │
│   每个文件独立处理：                          │
│   a) 读取完整文件内容                         │
│   b) 确认替换目标（精确匹配，含上下文）         │
│   c) 执行替换                                │
│   d) node -c 验证语法                        │
│   e) git diff 确认改动正确                    │
├─────────────────────────────────────────────┤
│ 第 5 步：全量验证                            │
│   node -c 所有修改的 JS 文件                  │
│   node scripts/lint-code.js                  │
│   bash build.sh && echo 'BUILD OK'           │
├─────────────────────────────────────────────┤
│ 第 6 步：提交                                │
│   git add -A && git commit -m "refactor(xxx)"│
└─────────────────────────────────────────────┘
```

### 10.4 转义字符处理规则 🔴

这是最容易被忽视也最容易出 bug 的地方。

#### 10.4.1 引号嵌套层数 🔴

每次替换操作前，**必须数清楚当前有几层引号嵌套**：

```
层级 0: Shell 命令
层级 1: 外层代码字符串 (Python/JS/Node)
层级 2: 内层代码字符串 (JS 模板/HTML 属性)
层级 3: 嵌套字符串 (CSS 字符串/JSON 值)
```

**经验法则**：
- **0-1 层**：安全，直接替换
- **2 层**：需要小心，用转义或换引号类型（`'` ↔ `"`）
- **3 层及以上**：**禁止用字符串替换工具**，必须用 `edit`（精确文本匹配）

#### 10.4.2 正则特殊字符清单

以下字符在正则表达式中有特殊含义，**在 `sed` / `grep -P` 中必须转义**：

```
.  *  +  ?  ^  $  {  }  [  ]  (  )  |  \
```

**在 `grep` 字面量搜索中不需要转义**（`grep -F` 或不带 `-E`/`-P`）：

```bash
# ✅ 安全：字面量搜索，不解析正则
grep -F '#2E7D32' src/  # 或 rg --fixed-strings

# ❌ 危险：括号被当作捕获组
grep 'window.SITE_CONFIG || window._cfg' src/
# 应该用：
grep -F 'window.SITE_CONFIG || window._cfg' src/
```

#### 10.4.3 替换中的反向引用陷阱

```bash
# ❌ sed 中 & 和 
 是特殊字符
sed 's/foo/bar & baz/g'  # & 被替换为匹配到的 "foo"！

# ❌ \1 在替换中是反向引用
echo 'abc123' | sed 's/([a-z]+)/\1_\n/g'  # \1 = "abc"

# ✅ 如果需要字面量 & 或 \，用 \\ 转义
sed 's/foo/bar \& baz/g'
sed 's/foo/bar \\1/g'
```

#### 10.4.4 JSON/JS 文件中的特殊字符

```bash
# 搜索包含引号的字符串（最常见坑）

# ❌ 错误：外层引号和搜索内容引号冲突
grep "'use strict'" src/  # 外层双引号，内层单引号 — 这里恰好OK

grep '"use strict"' src/  # 外层单引号，内层双引号 — 这里也OK

# 但如果搜索内容同时包含两种引号：
grep 'var x = "' + y + '"' src/  # ❌ 单引号在中间被截断！
# 应该用：
grep -F "var x = '" src/   # 只搜索前半段
# 或者：
rg 'var x = "'\''\+ y \+"'  # 用单引号拼接转义

# ✅ 最安全：用文件中实际出现的字符串匹配，不带任何外壳引号
# 使用 rg --fixed-strings 或 edit 工具的精确匹配
```

#### 10.4.5 转义检查清单

每次替换操作前，逐项确认：

| # | 检查项 | 确认 |
|---|--------|------|
| 1 | 搜索字符串是否包含正则元字符？ | 是 → 用 `-F` 或转义 |
| 2 | 当前有几层引号嵌套？ | ≤1 层安全，≥2 层需精确匹配工具 |
| 3 | 替换结果中引号是否正确？ | 预览替换后内容 |
| 4 | 反斜杠 `\` 是否被二次转义？ | Python 中 `\\\\` 才是 JS 的 `\` |
| 5 | JSON 文件中的转义是否保留？ | `\n` → `\\n`（在 JSON 字符串值中） |
| 6 | 替换后 `node -c` 是否通过？ | **必须执行** |

### 10.5 推荐的第三方库/工具

#### 10.5.1 搜索工具

| 工具 | 安装 | 优势 |
|------|------|------|
| **ripgrep (rg)** | `brew install ripgrep` | 快、尊重 .gitignore、支持 fixed-strings |
| **fd** | `brew install fd` | 比 `find` 快，配合 rg 使用 |
| **fzf** | `brew install fzf` | 模糊搜索，快速定位文件 |

#### 10.5.2 替换工具

| 工具 | 适用场景 | 安装 |
|------|---------|------|
| **sd** | `sed` 的安全替代，自动处理正则转义 | `brew install sd` |
| **OpenClaw `edit`** | 精确文本替换，零转义风险 | 内置 |
| **OpenClaw `write`** | 整文件重写，适合大范围重构 | 内置 |

#### 10.5.3 验证工具

| 工具 | 用途 | 命令 |
|------|------|------|
| `node -c` | JS 语法验证 | `node -c file.js` |
| `jq` | JSON 格式验证 | `cat file.json \| jq .` |
| `tidy` | HTML 格式验证 | `tidy -q -e file.html` |
| `diff` | 改动确认 | `git diff --color` |

### 10.6 AI Agent 替换规则 🔴

> 本规则同时约束人类开发者和 AI Agent。

#### 10.6.1 AI Agent 替换限制

| 限制 | 说明 |
|------|------|
| 单次替换上限 | **1 个文件 1 处**。每次 edit 调用只改一处 |
| 复杂文件阈值 | **>200 行**的文件，必须用 `edit`（精确匹配）而非 `write`（重写） |
| 多文件操作 | 每次最多同时处理 **3 个文件**，每个文件独立验证 |
| 正则替换 | **禁止**。AI Agent 不得使用 `sed` 正则替换 |
| Python 替换 | **禁止**操作 JS/JSON/HTML 文件（引号转义风险太高） |
| 批量操作 | **禁止**。不得用循环一次性修改 >5 个文件 |

#### 10.6.2 AI Agent 推荐工作流

```
对于涉及 N 个文件的批量替换任务：

1. 先搜索确认命中范围（grep）
2. 分类：哪些该改、哪些不该改
3. 逐文件操作：
   a. 读取目标行 + 上下文
   b. 构造精确的 oldText（含上下文，确保唯一）
   c. 调用 edit 工具
   d. 读取修改后的行确认正确
   e. node -c 验证语法
4. 每完成 3-5 个文件后，暂停并做一次全量 lint
5. 全部完成后，运行 build 验证
6. 提交
```

#### 10.6.3 人类开发者补充规则

| 规则 | 说明 |
|------|------|
| VS Code 替换 | 使用 `Ctrl+H`，打开正则开关前先预览全部命中 |
| sed 替换 | **只用 `sed` 处理纯 ASCII、无引号、无正则元字符的简单替换** |
| 大规模重构 | 超过 10 个文件的替换，先创建 feat 分支，完成后提交 PR |
| 回滚准备 | 批量替换前 `git stash` 或创建备份分支 |

### 10.7 常见替换 Bug 案例库

以下案例来自本项目实际经历，**必须牢记**：

#### 案例 1：Python 字符串替换破坏 JS 引号嵌套

```python
# ❌ 错误
content = content.replace(
    'badge.style.color = "#2E7D32"',
    'badge.style.color = "' + _primary + '"'
)
# 结果：badge.style.color = "' + _primary + '"  （字面量！变量未生效）

# ✅ 正确：用 edit 工具精确匹配整行
# oldText: 'badge.style.color = "#2E7D32";'
# newText: 'badge.style.color = _primary;'
```

#### 案例 2：sed 正则破坏 JSON 转义

```bash
# ❌ 错误
echo '{"key": "line1\nline2"}' | sed 's/line1/line1_2/g'
# 结果：字符串中的 \n 被保留，但其他 JSON 转义可能被破坏

# ✅ 正确：用 jq 处理 JSON
echo '{"key": "line1"}' | jq '.key = "line1_2"'
```

#### 案例 3：批量替换遗漏 fallback 上下文

```javascript
// 原始代码
var _primary = (_theme.colors || {}).primary || "#2E7D32";

// ❌ 错误：把 fallback 也替换了
// 替换 #2E7D32 → _primary
var _primary = (_theme.colors || {}).primary || "_primary"; // 死循环！

// ✅ 正确：跳过 fallback 行
// 搜索时排除 || "#2E7D32" 模式
```

#### 案例 4：正则中的单引号导致 JS 语法错误

```javascript
// 原始文件中的正则（双引号包裹）
var re = /'use strict'/;  // 匹配单引号

// ❌ Python 写入时把 ' 转义了
content = content.replace("/'use strict'/", "/'use strict'\'/");
// 结果：JS 语法错误（多余的 \'）

// ✅ 正确：用 edit 工具，精确匹配，不碰引号层
```

#### 案例 5：console.log 中 `!` 取反被吞掉

```javascript
// lint-code.js 中的检查逻辑
// ❌ 写入时 ! 被遗漏
if (/'use strict'/.test(content)) {
  error(f, 0, "Missing 'use strict'");  // 反了！有 strict 反而报错
}

// ✅ 正确
if (!/'use strict'/.test(content) && !/"use strict"/.test(content)) {
  error(f, 0, "Missing 'use strict'");
}
```

### 10.8 正则表达式陷阱 🔴

**⚠️ 最重要的规则：在 regex literal `/pattern/` 中，`\\` 是字面反斜杠，不是转义。**

```javascript
// ❌ 错误：期望匹配所有字符
var re = /[\\s\\S]*/;
// 实际：匹配 \\s\\S 四个字面字符（反斜杠+s+反斜杠+S）

// ✅ 正确
var re = /[\s\S]*/;
// 或用非正则方式
var content = html.substring(html.indexOf('<main'), html.lastIndexOf('</main>'));
```

**陷阱清单**：

| # | 陷阱 | 错误写法 | 正确写法 |
|---|------|----------|----------|
| 1 | 字面量中双重转义 | `/[\\d]+/` | `/[\d]+/` |
| 2 | 字符串构造函数双重转义 | `new RegExp("[\\\\s\\\\S]")` | `new RegExp("[\\s\\S]")` |
| 3 | 反向引用误解 | `/(\w+)\s\1/` | 同上（\1 是反向引用，语法正确） |
| 4 | 捕获组 + 嵌套单引号 | `/'(.+)'/` | `/'([^']+)'/`（避免贪婪） |
| 5 | `new RegExp` 字符串变量注入 | `new RegExp("^/products/" + slug + "$")` | `new RegExp("^/products/" + escapeRegex(slug) + "$")` |

**最佳实践**：
1. 能用 `indexOf/lastIndexOf` 解决的问题，不用正则
2. regex literal 中永远不写 `\\`（除非真的需要匹配字面反斜杠）
3. `new RegExp` 的字符串参数中用 `\\` 代表 regex 的 `\`
4. 复杂正则先用 `test/regex-patterns.js` 验证
5. 所有正则添加注释说明匹配意图

---

## 11. 补充参考

> 核心内容已整合到第 4 章代码质量规范，此处保留快速查找索引。
>
> - 三屏一致性 → [4.8 三屏一致性](#48-三屏一致性)
> - 根因修复原则 → [4.9 根因修复原则](#49-根因修复原则)
> - 调试日志规范 → [4.10 调试与问题定位方法](#410-调试与问题定位方法)

### 11.1 定位相关文件的快速方法

**HTML 模板**（页面结构问题）：
```
页面路径 → src/pages/{section}/{page}/index-{device}.html
示例：src/pages/products/all/index-pc.html
```

**JS 模块**（交互/逻辑问题）：
```
通过页面加载的脚本找到 JS 模块：
grep -n "script.*src" src/pages/products/all/index-pc.html

通过功能关键词搜索：
grep -rn "关键词" src/assets/js/*.js | grep -v vendor
```

**CSS**（样式问题）：
```
grep -rn "\.类名" src/assets/css/
```

### 11.2 诊断命令速查

```bash
# JS 语法检查
node -c src/assets/js/文件名.js
find src/assets/js -name "*.js" ! -path "*/vendor/*" -exec node -c {} \;

# JSON 格式检查
node -e "JSON.parse(require('fs').readFileSync('文件.json','utf8')); console.log('OK')"

# 搜索调试残留
grep -rn "TODO:DEBUG" src/assets/js/
grep -rn "console\.log" src/assets/js/*.js | grep -v vendor | grep -v __DEVELOPMENT__

# 事件监听器平衡检查
echo "add: $(grep -rc 'addEventListener' src/assets/js/*.js | grep -v vendor | awk -F: '{s+=$NF}END{print s}')"
echo "remove: $(grep -rc 'removeEventListener' src/assets/js/*.js | grep -v vendor | awk -F: '{s+=$NF}END{print s}')"

# innerHTML 使用检查
grep -rn '\.innerHTML\s*=' src/assets/js/*.js | grep -v vendor

# 项目 Lint
node scripts/lint-code.js
```

### 11.3 AI Agent 调试约束

1. **先读后改** — 读取目标文件，理解上下文后再修改
2. **单文件单处** — 每次只改一个文件的一处问题
3. **改完验证** — `node -c` 验证语法
4. **不改编译产物** — 禁止修改 `dist/` 目录
5. **三屏同步** — 修改 JS/CSS 时确认三端 HTML 都受影响
## 12. 正则表达式使用规范 🔴

> 正则表达式是项目中最容易引入隐匿 bug 的技术之一。本规范约束所有 JS 文件（不含 vendor 和测试文件）中的正则使用。

### 12.1 正则的四种使用方式及选择优先级

| 优先级 | 方式 | 适用场景 | 风险等级 |
|--------|------|---------|---------|
| 🥇 | `String.prototype.includes()` / `startsWith()` / `endsWith()` | 固定字符串匹配 | 无风险 |
| 🥇 | `String.prototype.indexOf()` / `lastIndexOf()` | 子串位置查找 | 无风险 |
| 🥈 | 字面量正则 `/pattern/flags` | 已知固定模式 | 低（见 §12.2） |
| ❌ 谨慎 | `new RegExp(pattern)` 动态构造 | 模式中包含变量 | 🔴 高（见 §12.3） |

**黄金规则**: 能用 `includes()` 解决的，绝不用正则。能用字面量 `/pattern/` 解决的，绝不用 `new RegExp()`。

```javascript
// ✅ 正确: includes 匹配固定子串
if (url.includes('/products/')) { ... }

// ❌ 错误: 用正则做 includes 能做的事
if (/\/products\//.test(url)) { ... }

// ✅ 正确: 字面量正则
if (/^\/products\/coffee\/$/.test(path)) { ... }

// ❌ 错误: 固定模式用 new RegExp
if (new RegExp("^/products/coffee/$").test(path)) { ... }
```

### 12.2 字面量正则编写规范 🔴

#### 12.2.1 优先用 test() 而不是 match()

```javascript
// ✅ 正确: 只检查存在性用 test
if (/^\/products\//.test(path)) { ... }

// ❌ 错误: match 创建了不需要的数组
if (path.match(/^\/products\//)) { ... }
```

#### 12.2.2 捕获组只在你确实需要提取内容时使用

```javascript
// ✅ 正确: 需要提取内容时用捕获组
var m = path.match(/^\/products\/([^/]+)\/$/);
if (m) { var slug = m[1]; }

// ❌ 错误: 不需要捕获时用 ()，产生无意义的分组
if (/^\/products\/([^/]+)\/$/.test(path)) { ... }
// ✅ 正确: 非捕获组 (?:...) 或不分组
if (/^\/products\/[^/]+\/$/.test(path)) { ... }
```

#### 12.2.3 转义规则

| 字符 | 字面量中 | 字符串中（new RegExp） | 说明 |
|------|---------|----------------------|------|
| `/` | `\/` | 不需要转义 | 字面量的分隔符需要转义 |
| `.` | `\.` | `\\.` | 匹配字面量点号 |
| 空格 | 直接写 | 直接写 | 多余空格会变成模式的一部分 |
| `\\` | `\\\\` | `\\\\` | 匹配反斜杠本身 |

#### 12.2.4 必须使用 ^ 和 $ 锚定

```javascript
// ✅ 正确: 明确起始和结束
if (/^\/products\/coffee\/$/.test(path)) { ... }

// ❌ 错误: 无锚定，/abc/ 在 "/xxx/abc/xxx" 中也会匹配
if (/\/products\/coffee\//.test(path)) { ... }
// 这条会匹配 /products/coffee/ 但也可能匹配 /something/products/coffee/extra
```

### 12.3 new RegExp() 动态构造规则 🔴

`new RegExp()` 是项目中 Bug 最多的正则写法。当前项目的 7 处使用中至少 3 处有潜在风险。

#### 12.3.1 必须对变量中的特殊字符做转义

**问题**: 当 `new RegExp()` 的字符串中有用户输入或配置数据时，特殊字符会被当作正则语法解析。

```javascript
// ❌ 危险: categorySlug 可能包含 "(" 或 "+" 等正则字符
var slug = "coffee(2026)";  // 用户输入或配置数据
var re = new RegExp("^/products/" + slug + "/$");
// 实际正则: /^/products/coffee(2026)/$/  → (2026) 被当作捕获组！

// ✅ 安全: 先对变量的正则特殊字符做转义
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var slug = escapeRegex("coffee(2026)");
var re = new RegExp("^/products/" + slug + "/$");
```

**项目中需转义的正则特殊字符**:

```
. * + ? ^ $ { } ( ) | [ ] \
```

这 14 个字符在任何 `new RegExp()` 中如果来自变量源，必须先调用 `escapeRegex()`。

#### 12.3.2 禁止直接拼接用户输入

```javascript
// ❌ 绝对禁止: 直接拼接用户输入
var re = new RegExp("^" + userInput + "$");

// ✅ 安全: 转义后再拼
var re = new RegExp("^" + escapeRegex(userInput) + "$");

// ✅ 更推荐: 用 includes() 替代
if (str.includes(userInput)) { ... }
```

#### 12.3.3 当前项目中的问题代码

以下 `new RegExp()` 调用包含动态变量，需立即修复：

```javascript
// src/assets/js/breadcrumb.js:98
new RegExp("^/products/(" + PRODUCT_SLUG_PATTERN + ")$")
// 问题: PRODUCT_SLUG_PATTERN 是用 '|' 拼接的 slug 列表
//      'coffee|tea|meal' 等，slug 来自配置，应确保不含正则字符
// 缓解: slug 来自 SITE_CONFIG，可控，风险低但仍是隐患

// src/assets/js/breadcrumb.js:142
new RegExp("^/applications/(" + APP_SLUG_PATTERN + ")$")
// 同上

// src/assets/js/breadcrumb.js:155
new RegExp("^/support/(" + SUPPORT_SLUG_PATTERN + ")$")
// 同上

// src/assets/js/ui/custom-select.js:373
cls.replace(/^(sm:|md:|lg:|xl:|dark:|focus:|hover:|active:)+/, "")
// 问题: 无 ^ 和 $，在字符串中间也可能匹配
// 风险: 低（匹配特定前缀，误匹配概率低）
```

#### 12.3.4 动态正则的替代方案

| 场景 | 正则方案 | 更安全的替代 |
|------|---------|-------------|
| 检查路径前缀 | `new RegExp("^" + prefix)` | `path.startsWith(prefix)` |
| 检查路径后缀 | `new RegExp(suffix + "$")` | `path.endsWith(suffix)` |
| 按分隔符分割 | `str.split(/[,，]/)` | 如果固定分隔符，直接用字符串 |
| 替换固定字符串 | `str.replace(/old/g, "new")` | 如果 old 不含正则字符，用 `str.replaceAll("old", "new")`（ES2021，本项目需要 ES5 兼容时用 `split().join()`） |

### 12.4 常见正则 Bug 场景

#### 场景 1：`.` 号未转义（最常见的 Bug）

```javascript
var version = "1.0.5";
// ❌ 错误: . 匹配任意字符
if (/1.0.5/.test(version)) { ... }  // 永远 true（1+任意字符+0+任意字符+5）
// ✅ 正确: 转义 .
if (/1\.0\.5/.test(version)) { ... }
```

#### 场景 2：`/` 未转义

```javascript
// ✅ 字面量中 / 需要转义
if (/\/products\//.test(path)) { ... }

// ✅ 但可以用 indexOf 更简单
if (path.indexOf("/products/") !== -1) { ... }
```

#### 场景 3：缺少锚点导致意外匹配

```javascript
// ❌ 错误: 想匹配 "/products/" 开头的路径
if (/\/products\/coffee/.test("/blog/products/coffee")) { ... }  // true!

// ✅ 正确: 加锚点
if (/^\/products\/coffee/.test("/blog/products/coffee")) { ... }  // false
```

#### 场景 4：全局匹配 g 标志的陷阱

```javascript
// ❌ 错误: 同一 regex 对象多次调用 test()
var re = /foo/g;
console.log(re.test("foo"));  // true
console.log(re.test("foo"));  // false ← lastIndex 没重置

// ✅ 正确: 不用 g 标志，或每次新建 RegExp 对象
var re = /foo/;
console.log(re.test("foo"));  // true
console.log(re.test("foo"));  // true
```

### 12.5 正则审查清单（代码评审时必须检查）

| 检查项 | 说明 |
|--------|------|
| 🟢 能用 `includes`/`startsWith`/`endsWith` 吗？ | 固定字符串匹配优先用字符串方法 |
| 🟢 字面量 `/pattern/` 是否带 `^` 和 `$` 锚点？ | 没有锚点的正则很可能匹配到意外的内容 |
| 🟢 捕获组 `()` 是否确实需要提取内容？ | 不需要则用非捕获组 `(?:...)` 或去掉括号 |
| 🟢 `new RegExp()` 中的变量是否调用了 `escapeRegex()`？ | 动态构造必须转义 14 个特殊字符 |
| 🟢 是否有 `g` 标志且重复使用了同一个 RegExp 对象？ | `g` 标志的 `test()` 有 lastIndex 状态 |
| 🟢 `.` 号有没有被错误地当作字面量点号？ | `.` 未转义时匹配任意字符 |
| 🟢 `split()` 中的参数是否真的是正则而非固定字符串？ | `split(/[,，]/)` 和 `split(",")` 语义不同 |

---

## 13. 修改历史/他人代码的前置分析规范 🔴

> **原则：不了解就修改，是引入 Bug 的第一来源。所有对他人代码或历史代码的修改，必须先完成前置分析。**

### 13.1 必须回答的 5 个问题

在修改任何不是你亲手写的、或超过 30 天前写的代码之前，**必须先回答以下 5 个问题**。任一问题答不上来 → 先分析，不改。

```text
① 这段代码在干什么？
   └─ 必须能用自己的话说清楚，而不是复制代码注释

② 谁依赖这段代码？
   └─ 哪些其他函数/模块调用了它？改了会影响到什么地方？

③ 当前有没有 Bug？
   └─ 如果没有 Bug，为什么要改？如果有 Bug，根因是这段代码本身
      还是调用方的问题？

④ 改动的最小范围是什么？
   └─ 只改 1 行就能解决问题吗？还是需要重构整个函数？

⑤ 怎么验证改动不影响现有功能？
   └─ 测试方法是什么？有没有 E2E/lint/build 可以跑？
```

### 13.2 前置分析步骤 🔴

```bash
# [STEP 1] 找到调用链: 这个函数/模块被谁调用了？
grep -rn "函数名\|模块导出名" src/ --include="*.js" --include="*.html" | grep -v vendor | grep -v node_modules

# [STEP 2] 找到数据流: 数据从哪里来、到哪里去？
#   例如: 修改 product-grid.js 的 renderProducts() →
#   谁调用了 renderProducts？→ 它的入参怎么生成的？→ 渲染结果谁消费？

# [STEP 3] 找到历史变更: 这段代码上一次被改是什么时候？为什么改？
git log -5 --oneline -- <文件路径>
git log -p --follow -S "要改的具体内容" -- <文件路径> | head -100
#   -S 可以搜索某段代码的变更历史

# [STEP 4] 确认边界条件:
#   - 有没有空值/未定义的可能性？
#   - 有没有数组越界？
#   - 有没有类型假设（假设参数是 string 但实际可能是 null）？

# [STEP 5] 写测试或验证方案:
#   描述改完后你准备怎么验证
```

### 13.3 禁止做的事

| 禁止 | 原因 |
|------|------|
| **看到看不懂的代码直接加 try/catch 包住** | 掩盖了根因，下次出 Bug 时更难排查 |
| **看到看不懂的代码直接加 if (!x) return** | 跳过执行路径但不理解为什么，可能漏掉关键逻辑 |
| **把长函数拆成小函数但不理解原逻辑** | 重构出的新函数可能有同样的 Bug 只是被分散了 |
| **复制粘贴相似代码
 | **复制粘贴相似代码而不理解差异** | 粘贴的代码和原代码之间的细微差异可能就是 Bug |
| **假设别人写的代码一定有 Bug** | 先假设别人的代码是正确的，你的理解可能是错的 |
| **不运行测试就提交** | 减少一次测试可能节省 2 分钟，但引入的 Bug 可能要花 2 小时排查 |

### 13.4 修改历史代码的决策树

```text
遇到一段需要修改的历史代码
    │
    ├── ① 这段代码你写过吗？
    │     ├─ 是 → 你了解它，可以改
    │     └─ 否 → 必须先执行 §13.2 的前置分析
    │
    ├── ② 代码有测试覆盖吗？
    │     ├─ 有 → 改完跑测试，看有没有 break
    │     └─ 无 → 先加测试再改（否则你不知道改坏了什么）
    │
    ├── ③ 你能用 1 句话说明它做了什么吗？
    │     ├─ 能 → 进去看具体实现
    │     └─ 不能 → 先读代码，弄懂为止
    │
    ├── ④ 改完后怎么验证？
    │     ├─ 有 E2E → 跑 E2E
    │     ├─ 可手动测 → 描述手动测试步骤
    │     └─ 无法验证 → 先写测试再改
    │
    └── ⑤ 改动影响了多少个文件？
          ├─ 1-2 个 → 直接改
          └─ 3+ 个 → 拆分为多个 commit，逐层推进
```

### 13.5 子 Agent 修改他人代码的额外约束

子 Agent 修改他人/历史代码时，在任务描述中**必须额外包含以下字段**：

```text
### 前置分析要求（本节为修改他人/历史代码时必填）

- 🎯 调用链确认: 执行 `grep -rn "函数名" src/ --include="*.js"` 列出所有调用方
- 🎯 数据流确认: 数据从哪里来、经过什么处理、最终到哪里去
- 🎯 历史变更: `git log -5 -- <文件路径>` 了解最近修改
- 🎯 不可触碰的代码: 修改范围边界，禁止越界
- 🎯 验证方法: 改完后如何确认原有功能不受影响

🔴 如果无法完成以上分析 → 不修改，报告给主 agent
🔴 禁止在分析完成前直接改代码
```

### 13.6 被修改代码的原作者不在时的处理原则

| 场景 | 处理方式 |
|------|---------|
| 原作者在团队中 | 改之前先和原作者确认改动意图 |
| 原作者不在（离职/开源代码） | 先用 `git blame` 找到最后修改者，看 commit message 有没有说明 |
| git blame 也没有说明 | 用 `git log -p --follow` 看完整变更历史 |
| 历史已经不可追溯 | 按最小改动原则：只改目标行，不加新逻辑，不改结构 |

**最小改动原则**：
```text
修改历史代码时，你的改动行数应该等于或少于你理解了的行数。
不理解的行 = 保持不动 = 不引入新风险。
```

---

## 14. 跨仓库同步与冲突合并规范 🔴

> **原则：当从上游仓库同步代码时，冲突合并不是你赢我输的博弈，而是分析两边的改动意图后做正确的融合。**

### 14.1 冲突来源的三种情况

| 情况 | 描述 | 错误做法 | 正确做法 |
|------|------|---------|---------|
| **A: 上游重写，本地无改动** | 上游完整重构了文件，本地该文件无任何自定义改动 | 逐行 merge | 直接用上游版本 (`git checkout --theirs`) |
| **B: 本地有改动，上游也有改动** | 两边都修改了同一文件的不同部分 | 直接 `--theirs` 或 `--ours` | **深入分析两边改动，人工融合** |
| **C: 本地重写，上游有增量改进** | 像本次 R1+R2 一样，我们完整重写了 `build.sh`，但远程也有两个有价值的增量提交 | 用 `--theirs` 丢掉远程改进 | **提取远程的改动片段，合并进我们的重写版本** |

### 14.2 冲突合并决策流程 🔴

```text
遇到冲突
    │
    ├─ ① 先看远程改了什么
    │     git log <upstream-ref>..<local-ref> --oneline -- <conflicted-file>
    │     git show <each-remote-commit> -- <conflicted-file>
    │
    ├─ ② 分类冲突类型（见 §14.1 三种情况）
    │
    ├─ ③ 按情况处理
    │   ├─ 情况 A → 用 theirs  ✅
    │   ├─ 情况 B → 人工对比两边 diff，逐块决定
    │   └─ 情况 C → 提取远程片段，融入本地版本（见 §14.3）
    │
    └─ ④ 验证
          - 文件语法正确？（node -c / tidy / jq）
          - 两边的改动意图都保留了？
          - 构建通过？
```

### 14.3 情况 C 处理流程（最常见也是最容易出错的）🔴

**本次 R1+R2 同步就是典型案例**：我们对 `build.sh` 做了完整重写，
但 rebase 时发现远程也有两个独立提交修改了 `build.sh`。

```text
我们的改动: build.sh 从 98 行重写为 154 行
远程的改动:
  - commit 94340a8: cp src/assets/js/site.config.js → cp src/site.config.js (路径修正)
  - commit 94340a8: 新增 %DOMAIN% → https://brew.brand-project.com 占位符替换步骤

处理步骤:

1. git rebase origin/dev  → 检测到冲突

2. 先不要直接 --theirs 或 --ours

3. 查看远程改了什么:
   git show 94340a8 -- build.sh
   → 发现两个有价值的改动

4. 查看我们的版本是否有这些:
   grep 'site.config.js\|%DOMAIN%' build.sh
   → 发现缺失（我们用了 src/assets/js/ 路径，且没有 %DOMAIN% 步骤）

5. 决定：用我们重写的版本为基础 + 手动合并远程的两处改进
   → 编辑 build.sh，补上 site.config 路径修正和 %DOMAIN% 步骤

6. 提交合并结果
```

### 14.4 禁止的合并行为 🔴

| 禁止 | 原因 |
|------|------|
| **不查看远程改动就直接 `--theirs`** | 丢失远程有价值改动 |
| **不查看远程改动就直接 `--ours`** | 丢失上游修复 |
| **不 `git show` 就合并** | 不知道远程到底改了什么 |
| **合并后不验证就推送** | 语法错误、逻辑错误可能被引入 |
| **把冲突文件当成"选一个版本就行"** | 两边可能都有需要保留的内容 |

### 14.5 跨仓库同步的标准命令序列 🔴

```bash
# === 第 1 步：拉取最新 ===
git fetch origin

# === 第 2 步：查看差异 ===
# 本地领先远程多少
git log --oneline <branch> ^origin/<branch>
# 远程领先本地多少
git log --oneline origin/<branch> ^<branch>

# === 第 3 步：查看远程提交改了哪些文件 ===
for h in $(git log --oneline origin/<branch> ^<branch> --format='%H'); do
  echo "=== $h ==="
  git show --stat $h | head -10
  echo
done

# === 第 4 步：如果有冲突风险的文件，先看远程改了什么 ===
git log origin/<branch> ^<branch> --oneline -- <file>
git show <commit> -- <file>

# === 第 5 步：执行 rebase/merge ===
git rebase origin/<branch>
# 或 git merge origin/<branch>

# === 第 6 步：如有冲突，按 §14.2 流程处理 ===

# === 第 7 步：验证 ===
node -c <changed-file>  # JS 语法
bash build.sh           # 构建通过
git diff --stat         # 确认改动范围

# === 第 8 步：推送 ===
git push origin <branch>
```

### 14.6 教训：本次 R1+R2 的复盘

| 时间线 | 做了什么 | 问题 |
|--------|---------|------|
| 11:02 | 在 dev 上提交 R1+R2 | ✅ |
| 11:03 | cherry-pick 到 chef-v1.0，推送成功 | ✅ |
| 11:05 | dev rebase 到 origin/dev，遇冲突 | — |
| 11:05 | **直接用 `--theirs` 解决冲突** | ❌ 丢失远程 `site.config 路径修正` 和 `%DOMAIN%` |
| 11:12 | 远程改动被覆盖后推送 | ❌ 错误已进入远程 |
| 11:15 | **事后分析发现丢失，手动补回** | ⚠️ 如果没复查就会留下 bug |

**正确做法**：在 rebase 冲突时，先 `git show` 看远程改了什么，
确认是"我们可以安全覆盖"还是"有价值需要保留"，再做决定。
本案例中正确的处理是情况 C：用我们的重写版本 + 手动合并远程两处改进。
