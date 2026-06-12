# Git 热点文件分析与框架级根因诊断

> 分析日期: 2026-06-05 | 数据源: origin/dev 全量 549 笔提交

---

## 1. JS 文件修改频次 Top 20

| 排名 | 文件 | 修改次数 | 文件大小 | 属性 |
|------|------|---------|---------|------|
| 1 | `swup-init.js` | **66** | — (已删除) | 🧟 已移除的冗余文件 |
| 2 | `ui/navigator.js` | **47** | 1,726 行 | 🟡 高频修改 |
| 3 | `site.config.js` | **43** (src + root) | 828 行 | 🟡 配置变更 |
| 4 | `product-grid.js` | **41** | 1,394 行 | 🔴 渲染核心 |
| 5 | `product-detail.js` | **40** | 767 行 | 🔴 PDP 核心 |
| 6 | `ui/slide-menu.js` | **33** | 1,316 行 | 🟡 导航组件 |
| 7 | `spa-router.js` | **31** | 1,051 行 | 🔴 路由器 (实际未运行) |
| 8 | `case-grid.js` | **31** | 897 行 | 🟡 案例渲染 |
| 9 | `breadcrumb.js` | **29** | ~630 行 | 🔴 已重构 |
| 10 | `contacts.js` | **25** | — | 🟢 低频 |
| 11 | `ui/search-engine.js` | **21** | 754 行 | 🟡 搜索组件 |
| 12 | `translations.js` | **20** | 859 行 | 🔴 i18n 核心 |
| 13 | `page-init.js` | **19** | 19 行 | 🟢 已精简 |
| 14 | `ui/smart-popup.js` | **19** | 1,094 行 | 🟡 弹窗组件 |
| 15 | `ui/products-dropdown.js` | **19** | — | 🟢 |
| 16 | `ui/footer.js` | **19** | — | 🟢 |
| 17 | `product-builder.js` | **19** | 768 行 | 🟢 |
| 18 | `cross-sell.js` | **15** | 1,130 行 | 🟡 |
| 19 | `case-detail.js` | **15** | 1,598 行 | 🟡 |
| 20 | `home-core-products.js` | **14** | — | 🟢 |

> **注意**: nav-bundle.js 和 ui-bundle.js 仅 1-4 次提交，因为它们是晚近期手动合并产物。其内部包含的原独立文件（如 navigator.js、slide-menu.js、search-engine.js 等）才是真正的修改热点。

---

## 2. 重复修改模式分析

### 2.1 "改了 A 坏 B" 的循环证据

通过 Git 历史分析和代码交叉引用，**确认存在以下循环依赖**：

```
循环 1: breadcrumb.js ↔ translations.js ↔ product-grid.js
  - breadcrumb.js: 29 次修改，大多涉及 window.t() 的时序修复
  - translations.js: 20 次修改，同步→异步迁移 + 多次加载策略调整
  - product-grid.js: 41 次修改，其中 15+ 次是翻译/渲染时序相关
  
循环 2: spa-router.js ↔ swup-init.js ↔ page-init.js
  - swup-init.js: 66 次修改（最多！），经历了:
    创建 → 多次修复 → 最终被删除（但 index.html 中 SWUP 标签仍保留）
  - spa-router.js: 31 次修改，从主路由器→SWUP共存→实际上未加载但仍被引用
  - page-init.js: 19 次修改，从核心工具→边缘模块
  
循环 3: product-grid.js ↔ product-detail.js ↔ product-data-table.js
  - product-grid.js 41 次, product-detail.js 40 次
  - 两者都依赖 product-data-table.js 的 172 SKU 数据
  - 数据格式变化需要两处同步修改 → 重复工作
```

### 2.2 修改原因分类

| 原因类型 | 估计占比 | 典型例子 |
|---------|---------|---------|
| **功能迭代** | ~35% | 新页面类型、新组件 |
| **时序问题修补** | ~30% | setTimeout、DOMContentLoaded、spa:load 事件重绑定 |
| **Bug 修复** | ~20% | 翻译缺失、白屏、竞态 |
| **i18n 适配** | ~10% | 翻译键变更、新增语言 |
| **构建工具调整** | ~5% | Webpack 配置、CSS 构建 |

**结论**: 近 **一半** 的修改是"修理型"而非"建设型"——不是因为要加功能而改，因为已有的东西不工作而改。

### 2.3 与面包屑分析对照

面包屑分析（28 次 commit）发现的"修了又坏"模式，**确实是全局问题的缩影**：

- breadcrumb.js 29 次修改 → 反映的是**全局 i18n 时序问题**
- spa-router.js 31 次修改 → 反映的是**路由架构的不稳定性**
- swup-init.js 66 次修改 → 反映的是**框架选型犹豫**（SPA 方案三次变更）

**更严峻的现实**: 面包屑只是冰山一角。product-grid.js 41 次、product-detail.js 40 次的修改频率揭示出了更深层的问题。

---

## 3. 框架级根因分析（核心！）

### 3.1 Tailwind CSS — 帮了项目

| 维度 | 评估 |
|------|------|
| Purge 配置 | **完善**。safelist 覆盖了所有动态类名模式（padding/margin/gap/动态颜色） |
| 原子类滥用 | 存在，但在 JS 模板字符串中使用原子类是 Tailwind 的标准做法 |
| 响应式断点 | **统一**，所有页面使用相同的断点（sm/md/lg/xl） |
| 构建 | PostCSS + Tailwind CLI 工作正常 |

**结论**: ✅ **Tailwind 不是问题来源**。它帮助了项目标准化样式。

### 3.2 PostCSS / Autoprefixer — 帮了项目

**结论**: ✅ 配置简洁正确，工作正常。

### 3.3 Webpack — ⚠️ 严重误用（框架级问题）

**发现的事实**:
```
┌─────────────────────────────────────────────────────────────┐
│ 现状: Webpack 只打包 index.js（空壳 1KB）                   │
│ 真正的 JS 逻辑全部通过 CopyWebpackPlugin 原样复制到 dist     │
│ 没有 ESM 构建、没有 tree shaking、没有代码分割               │
│ Webpack 30+ 个 loader/plugin → 只为 CSS 和 HTML 工作        │
│ 配置中 140 行的 skip list 巧妙绕过了所有 JS 文件            │
└─────────────────────────────────────────────────────────────┘
```

**根因**: 项目从遗留代码库 fork，继承了 IIFE + concat 模式。团队正确地将 CSS 迁移到了 Webpack + PostCSS，但 **JS 部分从未完成迁移**。

**影响**:
- 没有 ESM → 没有 import/export → 一切靠全局变量 → 时序问题必然
- 没有代码分割 → 用户每次加载所有 JS 文件（~25,000 行）
- 构建工具实际只用了 10% 的能力

**结论**: 🔴 **Webpack 的"半迁移"状态是项目时序问题的最大技术债**。工具本身没有错，但用错了。

### 3.4 Polyglot.js — ⚠️ 不存在

**发现**: Polyglot.js 在代码中被提及（translations.js 注释），但：
- `npm ls polyglot` 显示未安装
- 没有 `polyglot.js` vendor 文件
- translations.js 自建了完整的 i18n 引擎（`TranslationManager` 类，859 行）

**结论**: 🔴 **团队自建了完整 i18n 框架，而选择了不使用 Polyglot.js**。这是自行造轮子。

### 3.5 spa-router.js (自建路由器) — 🔴 严重问题（框架级）

**关键发现**:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠️ spa-router.js 其实根本没有在运行！                                │
│                                                                    │
│ 当前运行时状态:                                                     │
│ - index.html 中加载的是 SWUP bundle（swup-bundle.umd.js）           │
│ - SWUP auto-init() 在 bundle 末尾自动执行                            │
│ - SWUP 设置 __swupEnabled = true                                    │
│ - spa-router.js 被复制到 dist 但未被任何 HTML 引用                    │
│ - 但是! 多个 UI 模块（search-engine, about-dropdown, slide-menu）   │
│   仍然调用 window.SpaRouter.navigate() 等方法                        │
│ - 这些调用要么静默失败，要么依赖于 SWUP 的兼容性                     │
└──────────────────────────────────────────────────────────────────────┘
```

**历史轨迹**:
```
Phase 0: 纯 SSG（无路由器）
Phase 1: 自建 spa-router.js（手动编写的 1051 行路由器）
Phase 2: 引入 SWUP vendor bundle + swup-init.js（混用阶段）
Phase 3: 删除 swup-init.js，SWUP bundle 内嵌 auto-init
Phase 4: spa-router.js 无人维护但未被废弃
Phase 5: （当前）SWUP 运行 + 旧代码引用 spa-router API
```

**根本问题**: 这不是单个文件的问题，而是**路由架构决策反复**导致的：
- 项目经历了 **3 种路由方案**：无 → 自建 → SWUP
- 每次切换都没有完整迁移，留下了废弃代码
- swup-init.js 66 次修改 → 就是在过渡期反复调试两种路由器的共存
- 最终删除 swup-init.js 但 SWUP 的 auto-init 在 bundle 内，无人完全掌握

### 3.6 SWUP — ⚠️ 部分问题

| 维度 | 评估 |
|------|------|
| 是否被正确初始化 | ❓ SWUP vendor bundle 末尾的 `initSwup()` 自动触发 |
| 事件兼容性 | 模块使用 `spa:load` 事件（spa-router 时代），SWUP 使用 `content:replace` |
| 页面脚本加载 | SWUP 的 `loadScripts` 插件 vs spa-router 的 `loadPageScripts()` |
| 文档/配置 | 无 swup-config.js，无明确的 SWUP 初始化入口 |

**结论**: ⚠️ SWUP 是一个成熟框架，但项目**没有正确利用**。当前是 SWUP 运行 + spa-router 的幽灵引用并存。

### 3.7 i18n 系统 (自建 TranslationManager) — 🔴 框架级问题

| 维度 | 评估 |
|------|------|
| 代码量 | 859 行 translations.js + 1106 行 i18n-bundle.js + 114 行 lang-registry.js |
| 功能 | 完整的翻译引擎、语言检测、异步加载、缓存 |
| 依赖 | 无第三方 i18n 库（未使用 Polyglot.js / i18next） |
| 异步性 | translations.js `initialize()` 是 async，但调用方同步使用 `window.t()` |

**核心问题**: `window.t()` 的存在暗示它应该是同步的。但实际实现是异步的（fetch JSON）。

这不是一个小 bug，而是**架构矛盾**：系统被设计为"看起来同步但实际上是异步"。

**结论**: 🔴 **自建 i18n 系统是时序问题的最核心根因**。选择了自行实现而非使用成熟的 i18n 框架。

---

## 4. 框架选型诊断总结

| 框架/工具 | 评估 | 帮助还是拖累 | 建议 |
|-----------|------|-------------|------|
| Tailwind CSS | ✅ 配置正确 | 👍 帮助 | 维持现状 |
| PostCSS + Autoprefixer | ✅ 工作正常 | 👍 帮助 | 维持现状 |
| Webpack | ⚠️ 半迁移（JS 部分未接入） | 👎 **拖累** | ESM 迁移，见阶段三方案 |
| SWUP | ❓ 已部署但配置不完整 | 👎 **拖累** | 要么完整配置，要么回退到自建 |
| spa-router.js | 🧟 代码被引用但未运行 | 👎 **拖累** | 要么正式废弃，要么正式启用 |
| TranslationManager (自建 i18n) | 🔴 架构矛盾 | 👎 **严重拖累** | 考虑 import { t } from 'i18n-core' |
| product-data-table.js | ✅ 数据文件 | 👍 中性 | 格式稳定后可减少变化 |
| Lefthook / lint | ✅ 配置完善 | 👍 帮助 | 维持 |

### 核心结论

> **项目当前承受的~50% 时序问题根因不是代码 bug，而是框架选型的不一致性和迁移的半成品状态。**
> - 用了 Webpack 但没有用 ESM（选择了 IIFE 拼接）
> - 选择了 SWUP 但没有删除旧的路由器代码
> - 需要 i18n 但没有选成熟的库（自建了）
> - 每次都选了"自己造"而非"用好的"

### 框架级"Fix"建议

1. **不要换框架**（SWUP 是好的，Webpack 是好的，Tailwind 是好的）
2. **把半成品做完**：Webpack ESM 迁移、废弃 spa-router.js、正确配置 SWUP
3. **用简单、成熟、文档完善的库**：考虑 i18next 替换自建 i18n
