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
