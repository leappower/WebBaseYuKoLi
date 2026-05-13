# DEV-STANDARDS.md — 开发规范

## 1. 配置读取规范

### 1.1 必须使用标准 config bridge

所有需要读取站点配置的 JS 文件**必须**在 IIFE 顶部声明 config bridge：

```javascript
(function () {
  'use strict';

  // ── Config Bridge (REQUIRED) ──
  var _cfg    = window.SITE_CONFIG || window._cfg || {};
  var _brand  = _cfg.brand  || {};
  var _theme  = _cfg.theme  || {};
  var _colors = _theme.colors || {};
  var _primary = _colors.primary || "#ec5b13";

  // ... rest of module
})();
```

### 1.2 禁止直接访问 config 子属性

❌ 错误：
```javascript
var name = (window.SITE_CONFIG || window._cfg || {}).brand || {};
```

✅ 正确（只声明一次，后续复用）：
```javascript
var _cfg = window.SITE_CONFIG || window._cfg || {};
var _brand = _cfg.brand || {};
```

### 1.3 联系方式三级 fallback

```javascript
// 优先级：site.config → window.Contacts → 硬编码默认值
var waNumber = (window.Contacts && window.Contacts.whatsapp)
  || _cfg.contacts.whatsapp
  || "8613163756465";
```

### 1.4 品牌色使用

```javascript
// JS 中动态生成 CSS/HTML 时：
var style = 'color:' + _primary + ';';

// 直接设置 DOM 属性时：
element.style.color = _primary;  // NOT: "' + _primary + '"
```

⚠️ **常见错误**：字符串拼接和直接赋值混淆。

---

## 2. 代码质量规范

### 2.1 变量声明

- 所有变量必须用 `var` 声明（项目兼容 ES5）
- 禁止使用 `let`、`const`、箭头函数、模板字符串、解构赋值
- 全局变量用 `window.*` 命名空间挂载

### 2.2 错误处理

- **关键路径必须有 try/catch**：DOM 操作、网络请求、JSON 解析
- 最小 try/catch 覆盖范围（不要把整个 IIFE 包在 try/catch 里）
- catch 中不要静默吞错——至少 `console.warn("[ModuleName]", err)`

```javascript
// ✅ 正确
try {
  var data = JSON.parse(str);
} catch (e) {
  console.warn("[MyModule] JSON parse failed:", e);
  return fallback;
}

// ❌ 错误（静默吞错）
try {
  var data = JSON.parse(str);
} catch (e) {}
```

### 2.3 innerHTML 安全

- **禁止拼接用户输入到 innerHTML**
- 外部数据（URL 参数、API 响应）必须经过转义
- 优先使用 `textContent`、`createElement`、`classList`

```javascript
// ✅ 安全
element.textContent = userInput;

// ❌ 危险
element.innerHTML = '<div>' + userInput + '</div>';
```

### 2.4 事件监听器

- **避免匿名函数**：用命名函数便于 `removeEventListener`
- SPA 路由切换时必须清理不再需要的监听器
- 同一事件不要重复绑定

```javascript
// ✅ 可清理
function handleClick(e) { ... }
element.addEventListener('click', handleClick);
// 后续：
element.removeEventListener('click', handleClick);

// ❌ 无法清理
element.addEventListener('click', function (e) { ... });
```

### 2.5 DOMContentLoaded

- 每个文件最多绑定一个 `DOMContentLoaded` 监听器
- 如果需要多个独立初始化逻辑，用一个统一 handler 分发

### 2.6 Magic Numbers

- **禁止裸数字**，必须用命名常量
- 动画时长、超时时间、断点值都要命名

```javascript
// ✅ 正确
var ANIMATION_DURATION = 300;
var DEBOUNCE_DELAY = 150;
var TABLET_BREAKPOINT = 768;

// ❌ 错误
setTimeout(fn, 300);
if (window.innerWidth > 768) { ... }
```

---

## 3. 性能规范

### 3.1 DOM 操作

- 批量操作使用 `DocumentFragment`
- 避免在循环中读写 DOM（读写分离）
- 使用 `classList` 代替 `className` 字符串拼接

### 3.2 事件委托

- **同类元素超过 3 个时必须用事件委托**
- 不要给列表中每个 item 单独绑定事件

```javascript
// ✅ 事件委托
list.addEventListener('click', function (e) {
  var item = e.target.closest('[data-item-id]');
  if (!item) return;
  var id = item.dataset.itemId;
  handleItemClick(id);
});

// ❌ 逐个绑定
items.forEach(function (item) {
  item.addEventListener('click', function () { ... });
});
```

### 3.3 图片和资源

- 图片用 `loading="lazy"`
- 大文件（>50MB）禁止直接提交 Git，使用 CDN 或 Git LFS
- 视频文件 `*.mp4/*.mov/*.avi/*.mkv` 已在 .gitignore 中屏蔽

### 3.4 CSS 性能

- **禁止滥用 `!important`**——仅在覆盖第三方库时使用
- 动画属性优先使用 `transform` 和 `opacity`
- 避免通配符选择器 `*`

---

## 4. 文件结构规范

### 4.1 命名

- JS 文件：`kebab-case.js`（如 `profit-calculator.js`）
- CSS 文件：`kebab-case.css`
- HTML 模板：`index-pc.html`、`index-mobile.html`、`index-tablet.html`

### 4.2 模块结构

每个 JS 文件遵循统一结构：

```javascript
/**
 * module-name.js — 一句话描述
 *
 * 详细说明...
 *
 * Depends on: (加载顺序)
 *   config.js    → window.SITE_CONFIG
 *   contacts.js  → window.Contacts
 *
 * Exports:
 *   window.ModuleName.method()
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
  window.ModuleName = { init: init, ... };
})();
```

### 4.3 加载顺序

HTML 中的 `<script>` 标签遵循严格顺序：

1. `site.config.js` — **最先加载**
2. 工具函数（device-utils, common）
3. 数据层（lang-registry, translations, roi-data）
4. UI 组件（navigator, footer, dropdowns）
5. 页面逻辑（page-interactions, init）

---

## 5. Git 规范

### 5.1 Commit 格式

```
<type>(<scope>): <简短描述>

<可选详细说明>
```

**Type**：
- `feat` — 新功能
- `fix` — 修复 bug
- `refactor` — 重构（不改功能）
- `chore` — 构建/工具/配置
- `docs` — 文档
- `style` — 代码风格（不影响逻辑）
- `perf` — 性能优化

**Scope**（可选）：`config`, `nav`, `roi`, `i18n`, `products`, `build`...

**示例**：
```
feat(roi): add 10 new countries to salary table
fix(navigator): mobile menu not closing after link click
refactor(cases): read case data from site.config
```

### 5.2 分支策略

- `master` — 生产分支，受 pre-push hook 保护
- `dev` — 开发分支（如需要）
- 功能分支：`feat/xxx`、`fix/xxx`

### 5.3 禁止提交

- `*.mp4`, `*.mov`, `*.avi`, `*.mkv`（已在 .gitignore）
- `>50MB` 的任何文件
- `node_modules/`, `dist/`, `.env`
- 包含 API key / secret 的文件
- `console.log`（必须删除或用 `__DEVELOPMENT__` guard）

---

## 6. 编译/构建规范

### 6.1 构建命令

```bash
npm run build    # 完整构建 → dist/
npm run dev      # 开发服务器
npm run lint     # 代码检查（如配置）
```

### 6.2 Pre-push 检查

项目配置了 `pre-push` Git Hook，包含：
1. 语法检查（`node -c` 对所有 JS）
2. ESLint（如配置）
3. HTMLHint（如配置）
4. Stylelint（如配置）

**如需跳过检查**（紧急情况）：
```bash
git push --no-verify   # ⚠️ 不推荐
```

### 6.3 构建前检查清单

在 `npm run build` 前必须确认：

- [ ] `node -c` 所有修改的 JS 文件通过
- [ ] 无 `console.log` 泄露
- [ ] `site.config.js` 语法正确（`node -c site.config.js`）
- [ ] `.gitignore` 已更新（如有新大文件类型）
- [ ] 翻译 JSON 格式正确（`node -e "JSON.parse(require('fs').readFileSync('path'))"`)

### 6.4 版本管理

- 构建脚本自动在 JS 引用中添加 `?v=YYYYMMDDHHMM` 缓存破坏参数
- 不要手动修改版本号
- 发布重大更新时更新 `package.json` 中的 `version`

---

## 7. 代码审查要点

审查 PR/MR 时重点检查：

| 检查项 | 说明 |
|--------|------|
| **Config bridge** | 是否正确声明 `_cfg` 并从 config 读取 |
| **Fallback 链** | 是否有三级 fallback（config → window → 硬编码） |
| **innerHTML** | 是否有 XSS 风险的字符串拼接 |
| **事件监听** | 是否可清理，有无内存泄漏风险 |
| **try/catch** | 关键路径是否有错误处理 |
| **品牌硬编码** | 是否有新的 `#ec5b13` / `"YuKoLi"` / 邮箱 / WhatsApp |
| **Magic numbers** | 是否有未命名的裸数字 |
| **CSS !important** | 是否滥用 |
| **文件大小** | 是否有大文件违反 .gitignore 规则 |
