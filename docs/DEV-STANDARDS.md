# DEV-STANDARDS.md — KitchenYuKoLi / BrewYuKoLi 开发规范 v2.0

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
| 品牌泄露 | `#ec5b13` / `"YuKoLi"` / 硬编码联系方式 | ❌ |
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
  var _primary = _colors.primary || "#ec5b13";

  // ── Config-driven values (MANDATORY) ──
  var BRAND_NAME = _brand.name || "YuKoLi";

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
  || "8613163756465";
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

| 类型 | 格式 | 示例 |
|------|------|------|
| JS | `kebab-case.js` | `profit-calculator.js` |
| CSS | `kebab-case.css` | `performance-optimized.css` |
| HTML | `index-{device}.html` | `index-pc.html`, `index-mobile.html` |
| 配置 | `kebab-case.config.js` | `site.config.js` |
| 文档 | `UPPER-CASE.md` | `DEV-STANDARDS.md` |

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
| 精确字面量搜索 | `grep -rn` | `grep -rn '#ec5b13' src/` | 不解析正则，最安全 |
| 正则模式搜索 | `grep -rPn` | `grep -rPn '(let\|const)\s+\w+' src/` | 需注意正则转义 |
| 跨文件大范围搜索 | `rg` (ripgrep) | `rg '#ec5b13' src/` | 比 grep 快 10x，默认忽略 .gitignore |
| 交互式搜索 | VS Code `Ctrl+Shift+F` | — | 可预览上下文，推荐确认类搜索 |
| 语义搜索（模糊） | AI Agent | 自然语言描述 | 仅用于探索，**不可用于批量替换决策** |

#### 10.1.2 搜索必做步骤 🔴

每次搜索必须执行 **三步确认**：

```bash
# 第 1 步：搜索（只看，不碰）
grep -rn '#ec5b13' src/assets/js/

# 第 2 步：确认命中范围
# 问自己：
#   - 有多少处命中？预期是多少？
#   - 命中是否都在预期文件中？
#   - 有没有意外命中（如注释、字符串字面量、文档）？

# 第 3 步：确认排除范围
# 问自己：
#   - vendor/ 目录是否被误包含？
#   - 注释中是否有同名内容需要保留？
#   - fallback 值（|| '#ec5b13'）是否应被跳过？
```

#### 10.1.3 搜索结果分类

搜索到的每一处命中必须归类后才能决定是否替换：

| 类别 | 标记 | 处理方式 |
|------|------|---------|
| **定义处** | DEF | 替换为变量名 |
| **使用处（非 fallback）** | USE | 替换为变量引用 |
| **Fallback 默认值** | FB | **保留**（`\|\| "#ec5b13"`） |
| **注释/文档** | DOC | 更新注释文本或保留 |
| **vendor/第三方** | VENDOR | **不碰** |
| **字符串字面量/正则** | LIT | 逐个评估，不能批量 |

### 10.2 替换工具选择与风险 🔴

#### 10.2.1 工具对比

| 工具 | 精确度 | 转义风险 | 批量安全 | 推荐场景 |
|------|--------|---------|---------|---------|
| **`edit` (OpenClaw)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **首选**。精确文本匹配，无需处理转义 |
| **VS Code 查找替换** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 手动逐文件确认 |
| **`sed -i`** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | 仅简单纯 ASCII 替换 |
| **Python `.replace()`** | ⭐⭐ | ⭐ | ⭐ | **高风险**。引号嵌套、转义字符极易出错 |
| **`sed` 正则替换** | ⭐⭐ | ⭐ | ⭐⭐ | **极高风险**。正则特殊字符灾难 |
| **Node.js `String.replace()`** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | 中等风险，比 Python 好 | 
| **AI Agent 批量替换** | ⭐ | ⭐ | ⭐ | **禁止**。成功率 <50%，必须逐文件操作 |

#### 10.2.2 各工具的致命陷阱

**❌ Python `.replace()` — 引号嵌套地狱**

```python
# 看似简单，实际有 3 层引号嵌套：Python 外层 → 替换字符串内 → JS 代码内
content = content.replace(
    'var x = "#ec5b13"',       # 这里的 " 是 Python 转义
    'var x = "' + _primary + '"'  # 这里的 " 在 JS 中被解析成字面量
)
# 结果：JS 文件中出现  var x = "' + _primary + '"   而不是变量拼接！
```

**❌ `sed` — 正则特殊字符灾难**

```bash
# 搜索 #ec5b13
sed -i 's/#ec5b13/_primary/g' file.js

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
# 输出: 42:  var color = "#ec5b13";

# 2. 查看上下文（前后 3 行）
sed -n '39,45p' src/assets/js/target.js

# 3. 用 edit 精确替换（匹配包含上下文，确保唯一）
# oldText 必须包含足够的上下文使其在文件中唯一
```

#### 10.3.2 同一文件多处替换（中风险）

```bash
# 场景：一个文件中 5 处 #ec5b13 需要替换为 _primary

# 1. 搜索并列出所有命中（带行号和上下文）
grep -n -B2 -A2 '#ec5b13' src/assets/js/target.js

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
grep -F '#ec5b13' src/  # 或 rg --fixed-strings

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
    'badge.style.color = "#ec5b13"',
    'badge.style.color = "' + _primary + '"'
)
# 结果：badge.style.color = "' + _primary + '"  （字面量！变量未生效）

# ✅ 正确：用 edit 工具精确匹配整行
# oldText: 'badge.style.color = "#ec5b13";'
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
var _primary = (_theme.colors || {}).primary || "#ec5b13";

// ❌ 错误：把 fallback 也替换了
// 替换 #ec5b13 → _primary
var _primary = (_theme.colors || {}).primary || "_primary"; // 死循环！

// ✅ 正确：跳过 fallback 行
// 搜索时排除 || "#ec5b13" 模式
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
