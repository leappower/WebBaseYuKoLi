# Timing Fix Checklist (T1.0)

> JJC-020 Phase 1 — 跨模块引用扫描结果
> Generated: 2026-06-05

## 1. `window.t(` 调用 — 无 null guard

以下调用直接使用 `window.t(key)` 而无 `typeof window.t === 'function'` 检查，
若 `window.t` 未初始化（时序问题）会抛出 `TypeError`。

| # | 文件 | 行号 | 代码 | 优先级 |
|---|------|------|------|--------|
| 1 | `breadcrumb.js` | 42 | `var result = window.t(key);` | P0 |
| 2 | `cross-sell.js` | 48 | `var result = window.t(key);` | P0 |
| 3 | `product-detail.js` | 594 | `var translated = window.t(key);` | P0 |
| 4 | `product-detail.js` | 636 | `var translated = window.t(cat);` | P0 |
| 5 | `product-grid.js` | 59 | `window.t("products_compare_max_reached")` | P0 |
| 6 | `ui-bundle.js` | 2475 | `var result = window.t(key);` | P0 |

**总计: 6 处**

## 2. `window.SITE_CONFIG` 引用 — 无 null guard

以下调用直接使用 `window.SITE_CONFIG.xxx` 而缺少 `|| {}` 或 `&&` 检查。

大部分文件已使用 `window.SITE_CONFIG || window._cfg || {}` 模式（安全）。
潜在风险点：

| # | 文件 | 行号 | 代码 | 说明 |
|---|------|------|------|------|
| 1 | `page-init.js` | 194 | `(window.SITE_CONFIG || {}).brandName` | 安全（有 fallback）但可统一使用 `__safe.config()` |
| 2 | `product-detail.js` | 16 | `var _pdCfg = window.SITE_CONFIG || {};` | 安全 |

**主要模式已有保护，无需紧急修复**

## 3. `window.translationManager` 引用

绝大部分调用已使用 `typeof window.translationManager === ...` 或 `&&` 短路守卫。无高危裸调。

## 4. `window.TranslationManager` 引用

| # | 文件 | 行号 | 代码 | 优先级 |
|---|------|------|------|--------|
| 1 | `product-detail.js` | 757 | `if (window.TranslationManager) { new window.TranslationManager()...` | P1（已有 guard 但建议使用 `__safe.get`） |

## 5. `window.CommonUtils` 引用

| # | 文件 | 行号 | 代码 | 状态 |
|---|------|------|------|------|
| 1 | `main.js` | 192-193 | `window.CommonUtils && typeof window.CommonUtils.ready === "function"` | ✅ 安全 |
| 2 | `nav-bundle.js` | 4776 | `(window.CommonUtils && window.CommonUtils.tr)` | ✅ 安全 |
| 3 | `page-init.js` | 367-368 | `window.CommonUtils && typeof window.CommonUtils.ready === "function"` | ✅ 安全 |
| 4 | `page-interactions.js` | 252-253 | 同上 | ✅ 安全 |
| 5 | `ui-bundle.js` | 44-45 | `window.CommonUtils && typeof window.CommonUtils.tr` | ✅ 安全 |
| 6 | `ui/slide-menu.js` | 1154 | `(window.CommonUtils && window.CommonUtils.tr)` | ✅ 安全 |
| 7 | `ui/smart-popup.js` | 190-191 | 同上 | ✅ 安全 |
| 8 | `ui/search-engine.js` | 44-45 | 同上 | ✅ 安全 |

## 6. `window.AppUtils` 引用

| 文件 | 行号 | 状态 |
|------|------|------|
| `ui-bundle.js` | 9 | 注释引用 |
| `utils.js` | 9, 117 | 定义处 |
| `ui/search-engine.js` | 9 | 注释引用 |

**无运行时裸调风险**

## 7. `window.LANG_REGISTRY` 引用

绝大部分已有 `typeof` 或 `&&` guard。无高危裸调。

## 8. `window.Contacts` 引用

绝大部分已有 `&&` guard。无高危裸调。

## 9. `window.__swupEnabled` 引用

| 文件 | 行号 | 状态 |
|------|------|------|
| `spa-router.js` | 881 | `if (window.__swupEnabled) return;` — 安全（布尔 check） |
| `swup-init.js` | 7 | 注释引用 |

---

## 结论

### P0（需优先修复）
6 处 `window.t(key)` 直接调用无 null guard：

- `breadcrumb.js:42`
- `cross-sell.js:48`
- `product-detail.js:594`, `636`
- `product-grid.js:59`
- `ui-bundle.js:2475`

### 修复方案
由 T1.2 替换这些裸调用为 `window.__safe.t(key)`，确保时序安全。
