# JJC-018 遗留问题排查与修复方案

## 分析结论

基于代码审查（build-ssg.js, spa-router.js, server.js, device-utils.js, navigator.js, trust-bar.js, slide-menu.js, cross-sell.js, styles.css），得出以下分析：

---

## P0 问题（必须修）

### #1 PC navigator 不显示
**根因分析**：navigator.js 的 `mountNavigator()` 在 DOMContentLoaded 时执行，替换 `<navigator>` 占位符为 `<header>`。spa-router.js 的 `mountHeader()` 检查到已有 `<header>` 就跳过重建。问题是：spa-router.js 的 routes 表中 `/` 和 `/home/` 映射到 `/pages/home/index.html`（不是 index-pc.html）。虽然 `getDevicePage()` 会转换成设备特定路径，但 spa-router 提取内容时使用 `extractContent()` 提取 `<main>` 内部 HTML，如果 SSG 生成的页面中 navigator 已被移除（因它是外层 shell），则提取内容不包含 navigator。初次加载时 navigator.js 已工作，但 SPA 导航后无法重新挂载。

**子任务**：
- Task 1.1: spa-router.js routes 表 `/` 和 `/home/` 改为 `/pages/home/index-pc.html`（让 getDevicePage 处理正确的设备后缀）
- Task 1.2: spa-router.js `mountHeader()` 增加重试机制：如果 header 存在但内部 nav 为空（dropdown 模块未加载导致 fallback span），重新调用 mountNavigator()
- Task 1.3: build-ssg.js 生成的 SPA shell (dist/index.html) 确认 navigator.js 脚本在 body 末尾注入，确保 mountNavigator 在 DOM 就绪后执行

**预估工时**：1.5h

### #2 PC trust-bar 重复 + 宽度不撑开
**根因分析**：
1. **重复问题**：trust-bar.js 使用 `setTimeout(inject, 0)` 延迟注入。`nav-bundle.js` 和 `ui-bundle.js` 都包含 trust-bar.js，两者加载后都执行 `safeInject()` → `setTimeout(inject, 0)`。两个 setTimeout 回调在同一微任务批次中执行，都检查 `document.getElementById("trust-bar")` 时尚未被创建，导致创建两个 trust-bar。尽管有 `if (document.getElementById("trust-bar")) return;` 守卫，但两个回调同时在队列中且都尚未执行 inject()，产生竞态。
2. **宽度问题**：CSS 中 `.trust-bar__track--static` 使用 `justify-content: space-evenly`，但 PC 容器 `max-width: var(--section-max-width, 1280px)`。在 ≥1280px 屏幕上，bar 宽度只有 1280px 而不是全屏宽度。且 1024-1279px 范围 JS 判定为滚动动画但 CSS 已切换为 flex 布局，导致断裂。

**子任务**：
- Task 2.1: trust-bar.js 去重：`safeInject()` 使用 `setTimeout` 前先标记 `window.__trustBarInjectQueued = true` 避免重复排队
- Task 2.2: CSS 修复 PC trust-bar 宽度：去掉 max-width 限制或用 `width: 100%` 配合内部 `max-width` 居中
- Task 2.3: 统一 JS 与 CSS 断点：trust-bar.js 的 isPC 检测改为 `window.innerWidth >= 1024`（与 CSS 一致）

**预估工时**：1h

### #3 菜单黑框
**根因分析**：`navigator[data-component="navigator"]` 在 dark 模式下有 `background: rgba(34, 22, 16, 0.8)`（styles.css:547）。在 SSR 渲染后、mountNavigator 执行前的间隙，占位符 `<navigator>` 以 dark 背景色可见，造成黑框闪烁。特别是当页面有大量 JS 需要加载时，这个间隙可能持续数百毫秒。

**子任务**：
- Task 3.1: 将 `<navigator>` 占位符的 dark 背景色设为跟随 Tailwind 的透明色过渡（或用 `rgba(0,0,0,0)` 避免闪烁）
- Task 3.2: 在 `<head>` 中添加内联样式 `navigator[data-component="navigator"] { background: transparent; }` 覆盖 dark 模式下的深色背景

**预估工时**：0.5h

### #4 PC 2560px 显示 Tablet 布局
**根因分析**：`server.js` 使用 `getDeviceTypeFromUA()` 做服务端设备检测，通过 User-Agent 判断后返回对应设备页面（`index-tablet.html` / `index-mobile.html` / `index-pc.html`）。当桌面 2560px 用户的 UA 被误判（如 Chrome DevTools 的 Device Emulation 残留、iPad Safari "请求桌面网站"），服务端返回 tablet HTML，其 CSS 基于 768-1279px 设计，在 2560px 屏幕上布局错乱。

**子任务**：
- Task 4.1: server.js `getDeviceTypeFromUA()` 增加白名单：已知桌面 Browser UA（Chrome/Firefox/Edge/Safari 桌面版）直接返回 'pc'
- Task 4.2: spa-router.js `init()` 中在 SPA shell 加载后立即覆盖服务端误判，用 `DeviceUtils.getDeviceType()` 检查并强制刷新路由

**预估工时**：1h

---

## P1 问题（中优先级）

### #5 spa-router.js 路由表
**根因分析**：
1. routes 表中 `/` 和 `/home/` 指向 `/pages/home/index.html`（不是 `index-pc.html`）
2. 缺少 `/about/`, `/contact/`, `/privacy/`, `/terms/`, `/thank-you/`, `/cases/detail/` 等路由的显式条目（依赖 convention fallback）
3. convention fallback 硬编码为 `index-pc.html`，不经过 `getDevicePage()` 转换

**子任务**：
- Task 5.1: routes 表 `/` → `/pages/home/index-pc.html`, `/home/` → `/pages/home/index-pc.html`
- Task 5.2: 补全缺失路由：`/about/`, `/contact/`, `/privacy/`, `/terms/`, `/thank-you/` 
- Task 5.3: convention fallback 改为使用 `getDevicePage()` 生成设备特定路径

**预估工时**：0.5h

### #6 /products/all/ cross-sell 不渲染
**根因分析**：cross-sell.js 从 `_cfg.crossSell` 读取数据，但 site.config.js 中没有 `crossSell` 配置项。cross-sell.js 的 fallback 数据逻辑是：如果 `_cfg.crossSell.map` 有值则用配置数据，否则用 `_fallbackCrossSell`。因为 site.config.js 没有 crossSell 配置，fallback 生效。但 cross-sell.js 在 spa-router.js 中通过 `loadPageScripts()` 动态加载，如果 SPA 导航后脚本加载时序出错（cross-sell.js 在 DOM 内容被 `container.innerHTML = content` 替换前被加载），找不到 `#cross-sell-container` 就不会渲染。

**子任务**：
- Task 6.1: 确认 cross-sell.js 中 `init()` 函数在 SPA 导航后能被调用（spa:load 事件触发）
- Task 6.2: cross-sell.js 增加延迟重试机制（200ms 后重新查找 #cross-sell-container）
- Task 6.3: 在 product-grid.js 渲染完成后触发 cross-sell 重新初始化

**预估工时**：0.5h

### #7 首次访问语言检测效果确认
**已修复**：commit `6e64e7e1` 已提交。translations.js 的 `detectBrowserLanguage()` 已支持 25 种语言。仅需验证。

**子任务**：
- Task 7.1: 构建后本地验证语言自动检测效果
- Task 7.2: 确认 translations.js 中 `detectBrowserLanguage()` 在所有页面入口被调用

**预估工时**：0.3h

---

## P2 问题（低优先级）

### #8 i18n 待翻译 key
非代码修复，需汇总新 key 列表翻译。暂不派发研发部。
**预估工时**：手工翻译，约 1h

### #9 架构组 knowledge_entries
非代码任务，通知总办处理即可。

---

## 修复优先级 & 依赖关系

```
P0-1 navigator ─→ P0-3 黑框（独立，可并行）
P0-2 trust-bar ─→ P0-4 2560px（独立，可并行）
P0-4 2560px ─→ P1-5 路由表（依赖路由表修正）

修复顺序：
Phase 1（可并行）：P0-1, P0-2, P0-3
Phase 2（P0-1+P0-4 前置完成后）：P0-4, P1-5, P1-6
Phase 3：P1-7 验证
```

## 构建验证要求
每个子任务修完后必须单独跑 `npm run build`，构建通过后方可提交。
所有任务完成后再次全量构建验证。
