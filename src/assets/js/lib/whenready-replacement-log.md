# T2.3 when-ready 替换清单

## 替换的 setTimeout 模式

| 文件 | 行号 | 原代码 | 替换后 | 说明 |
|------|------|--------|--------|------|
| `breadcrumb.js` | 96 | `setTimeout(function() { resolve(); }, 500)` | `__safe.whenReady(function() { return configReady() && i18nReady(); }, resolve, 500)` | 等待 config + i18n 就绪的兜底定时器 |
| `cross-sell.js` | 1126 | `setTimeout(function() { renderCrossSellForCurrentPage(); }, 50)` | `__safe.whenReady('#spa-content', function() { renderCrossSellForCurrentPage(); }, 300)` | 等待 SPA content 替换完成后渲染 |
| `case-grid.js` | 891 | `setTimeout(function() { init(variant); }, 50)` | `__safe.whenReady('#case-grid', function() { init(variant); }, 300)` | 等待 case-grid DOM 就绪后初始化 |

## 明确忽略的 setTimeout（保留原样）

| 分类 | 原因 | 涉及文件 |
|------|------|----------|
| 动画延迟 | toast/notification 的 fade in/out 是动画时序，非 DOM 就绪 | `contacts.js`, `product-grid.js`, `ui-bundle.js` |
| 防抖/节流 | resize/search 的 debounce timer 是性能优化，非 DOM 就绪 | `nav-bundle.js`, `ui-bundle.js`, `product-grid.js` |
| 超时兜底 | 骨架屏 5s 清除、翻译加载 5s 超时等是故障保护，非时序补丁 | `product-grid.js`, `spa-router.js`, `i18n-core.js` |
| 导航状态 | SPA 导航完成后的状态清除（500ms）是合理的导航保护 | `spa-router.js`, `page-init.js` |
| 滚动空闲 | 滚动结束后的延迟操作是交互体验，非 DOM 就绪 | `floating-actions.js`, `smart-popup.js` |
| 轮询/重试 | setTimeout(0) 的延迟执行是 microtask 调度，非时序补丁 | `home-core-products.js`, `swup-init.js` |
| 焦点/搜索 | 搜索输入 debounce 是输入优化，非 DOM 就绪 | `search-engine.js`, `slide-menu.js` |
