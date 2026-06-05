# JJC-020 v2.0: BrewYuKoLi 全局时序问题根因分析 + 彻底修复方案

> 分析日期: 2026-06-05 | 版本: v2.0 | 状态: 待交叉评审
>
> 本版本基于 v1.0-draft 补充以下深度审计：
> - Git 热点文件分析与框架级根因诊断
> - SWUP / SPA 路由框架深度审计
> - 137 处 innerHTML 安全审计
> - 62× DOMContentLoaded + 108× setTimeout 时序补丁分析

---

## 目录

1. [全项目时序审计](#1-全项目时序审计)
2. [根因分析（框架级）](#2-根因分析框架级)
3. [Git 热点文件交叉分析](#3-git-热点文件交叉分析)
4. [路由架构审计摘要](#4-路由架构审计摘要)
5. [安全审计摘要](#5-安全审计摘要)
6. [彻底修复方案](#6-彻底修复方案)
7. [实施路线图与工时重估](#7-实施路线图与工时重估)
8. [风险与备选方案](#8-风险与备选方案)

---

## 1. 全项目时序审计

### 1.1 项目 JS 规模概览

| 指标 | 数值 |
|------|------|
| 根目录 JS 文件（src/assets/js/） | **33 个**独立文件 |
| UI 组件文件（src/assets/js/ui/） | **27 个**独立文件 |
| 手动合并 bundle | **4 个**（i18n-bundle.js、ui-bundle.js、nav-bundle.js、dropdown-bundle.js） |
| 总计 JS 逻辑行数 | **~25,000+ 行** |
| HTML 页面数 | **91 个**（3 屏 × 30+ 路由） |
| 构建方式 | **Webpack 仅打包 index.js**，其余手工 concat |

### 1.2 全局时序依赖图（核心致命问题）

```
加载顺序（按 index.html <script defer> 排列）：
┌──────────────────────────────────────────────────────────────────────┐
│ 1. site.config.js           ← 所有模块依赖（无依赖）                 │
│ 2. utils/dom-utils.js       ← 基础工具（无依赖）                     │
│ 3. device-utils.js          ← 设备检测（依赖 site.config）           │
│ 4. swup-bundle.umd.js       ← SPA 引擎（含 auto-init）              │
│ 5. i18n-bundle.js           ← 翻译系统 ← 💥 关键时序瓶颈            │
│ 6. dropdown-bundle.js       ← Dropdown 组件（依赖 SITE_CONFIG）     │
│ 7. nav-bundle.js            ← 导航系统 ← 💥 依赖 translations       │
│ 8. ui-bundle.js             ← UI 组件合集 ← 💥 依赖 translations    │
│ 9. contacts.js              ← 联系信息                               │
│ 10. product-grid.js         ← 产品网格                               │
│ 11. product-detail.js       ← 产品详情 ← 💥 依赖 translations       │
│ 12. home-core-products.js   ← 首页产品                              │
│ 13. case-grid.js            ← 案例网格                              │
│ 14. [内联] product-data-table ← 172 SKU 数据（等待 API 刷新）       │
└──────────────────────────────────────────────────────────────────────┘
```

**⚠️ 核心问题**：每个 bundle 都是一个手工 concat 的大型 IIFE，内部包含多个模块，
这些内部模块的初始化时序全部依赖于 `window.translationManager` 和 `window.t()` 的可用性。

### 1.3 时序问题严重程度分级

#### 🔴 **P0 级（阻塞级）- 3 处**

| # | 问题 | 位置 | 影响面 |
|---|------|------|--------|
| 1 | breadcrumb.js `window.t()` 无 null guard | breadcrumb.js:32-34 | SPA 首次切换 → 面包屑空白 |
| 2 | page-init.js `window.translationManager.translate` 无 null guard | page-init.js:22 | 所有页面首次加载 → 翻译缺失 |
| 3 | ui-bundle 内模块交叉依赖（nav → i18n → SPA → DOM） | ui-bundle.js 各 IIFE | SPA 导航时随机性白屏 |

#### 🟡 **P1 级（严重）- 7 处**

| # | 问题 | 位置 | 影响面 |
|---|------|------|--------|
| 4 | spa-router.js `loadRoute()` 中 `scriptsPromise` 完成前 spa:load 可能不触发 | spa-router.js:790 | 页面脚本加载时序竞态 |
| 5 | translations.js `initialize()` 是异步的，但读取 `window.t()` 时同步 | 全部文件 | 首次加载时翻译不可用 |
| 6 | i18n-bundle.js 内 lang-registry + translations 硬拼接，无模块边界 | i18n-bundle.js:1-1106 | 无法单独测试或加载 |
| 7 | product-data-table.js 内联在 index.html 最后，但 `tag()`/`getProduct()` 不被 import | index.html:92+ | 其他 JS 引用数据文件无保障 |
| 8 | `polyglot.js` 未全局注入，translations.js 依赖 fetch 下载 JSON | translations.js:270+ | 翻译 JSON 加载是网络异步 |
| 9 | 6 处独立的 `DOMContentLoaded` → 读取 `window.SITE_CONFIG` 无先后顺序保证 | 多处 | 随机性 config 读取失败 |
| 10 | page-init.js 中 `_t()` 定义为 IIFE 顶级，引用 `window.translationManager` | page-init.js:6 | 任何使用 `_t()` 的地方都有时序风险 |

#### 🟢 **P2 级（中等）- 5 处**

（同 v1.0，保持不变）

---

## 2. 根因分析（框架级）

### 2.1 核心根因：无模块系统的 IIFE 拼接反模式

```
                   🎯 核心根因
               ┌─────────────────────┐
               │ 无模块系统           │
               │ (IIFE 手卷拼接)      │
               └──────────┬──────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ 无依赖    │   │ 全局      │   │ 无法     │
    │ 管理     │   │ 命名       │   │ tree    │
    │          │   │ 空间污染   │   │ shake   │
    └──────────┘   └──────────┘   └──────────┘
          │               │               │
          ▼               ▼               ▼
    ┌──────────────────────────────────────────┐
    │ 时序问题 = 必然产物                        │
    │ 每次新增模块都是靠"先加载"而非"声明依赖"    │
    └──────────────────────────────────────────┘
```

### 2.2 🔑 **v2.0 新增发现: 框架选型层面的"半成品"问题**

> **补丁代码根源公式**: 框架半迁移 × 自建轮子 = 持续维护地狱

#### 发现 1: Webpack 只用了 10% 能力

| 方面 | 现状 | 正确做法 |
|------|------|---------|
| 打包范围 | 仅 index.js 空壳 | 全部 JS 通过 ESM import |
| Tree Shaking | 无（手动 concat） | Webpack 自动 |
| 代码分割 | 无 | 自动 |
| ESM 支持 | 无 | 天然 |

**根本原因**: 项目从 KitchenYuKoLi fork，CSS 成功迁移到了 Webpack + PostCSS，但 JS 一直停留在 IIFE concat 阶段。配置中 15 行的 skip list 巧妙绕过了所有独立 JS 文件，让它们原样复制到 dist。

#### 发现 2: SWUP vs spa-router.js 的"双路由器"困境

```
当前运行时态:
  index.html → 加载 swup-bundle.umd.js（auto-init）→ ✅ SWUP 在运行
  index.html → ❌ spa-router.js 未被加载
  UI 模块代码 → ❌ window.SpaRouter.* 引用 → 🧟 幽灵调用
  
结果：两个路由器都没有正确工作
```

**历史轨迹**: 经历了 3 次路由器方案变更（无路由器 → 自建 spa-router → SWUP），每次半成品。

#### 发现 3: 自建 i18n 系统是时序问题的最核心根因

| 统计 | 数值 |
|------|------|
| translations.js | 859 行（自建 TranslationManager 类） |
| i18n-bundle.js | 1106 行（拼接产物） |
| lang-registry.js | 114 行 |
| Polyglot.js | ❌ 未使用（被依赖但未安装） |
| i18next | ❌ 未使用 |

**核心矛盾**: `window.t()` 看起来是同步函数，但实际实现依赖异步 JSON fetch。系统被设计为"看起来同步但实际上是异步"。

### 2.3 框架选型诊断总结表

| 框架/工具 | 评估 | 帮还是坑 | 当前建议 |
|-----------|------|---------|---------|
| **Webpack** | JS 部分未接入 | 👎 **严重拖累** | ESM 迁移（阶段三） |
| **SWUP** | 部署但不完整 | 👎 **拖累** | 正式配置化（阶段四） |
| **spa-router.js** | 代码存活但未运行 | 👎 **拖累** | 废弃或正式启用 |
| **自建 i18n** | 架构矛盾 | 🔴 **核心根因** | 模块化（阶段二） |
| **Tailwind CSS** | 配置正确 | 👍 帮助 | 维持 |
| **Lefthook/lint** | 完善 | 👍 帮助 | 维持 |

### 2.4 技术债积累路径

```
2026-05-13 Phase 0 原型       fork 自 KitchenYuKoLi — 同步 IIFE，按加载顺序工作 ✅
2026-05-14 Phase 1 配置化     引入 site.config.js — 开始接触全局状态依赖 ⚠️
2026-05-25 Phase 2 SPA 引入   加入 SPA 能力（先自建，后 SWUP）— 两次换方案 ⚠️
2026-06-02 Phase 3 i18n 异步化 translations.js 异步 fetch — 时序问题爆发 🔴
2026-06-05 Phase 4 打补丁期   每出现一个 bug 加 setTimeout/spa:ready/DOMContentLoaded 🧟
                              现在: 62× DOMContentLoaded + 108× setTimeout
                              其中 ~60% 是时序补丁
```

---

## 3. Git 热点文件交叉分析

### 3.1 JS 文件修改频次 Top 10

| 排名 | 文件 | 修改次数 | 核心发现 |
|------|------|---------|---------|
| 1 | swup-init.js | **66** | 🧟 已删除 — 路由器方案反复的证据 |
| 2 | ui/navigator.js | **47** | 高频修改组件 |
| 3 | site.config.js | **43** | 配置变更频繁 |
| 4 | product-grid.js | **41** | 渲染核心，含 15+ 次时序/翻译修复 |
| 5 | product-detail.js | **40** | PDP 渲染，与 product-grid 同步修改模式 |
| 6-8 | slide-menu, spa-router, case-grid | **31-33** | 导航+路由器+案例 |
| 9 | breadcrumb.js | **29** | 已重构（JJC-019） |
| 10 | contacts.js | **25** | 联系人页面 |

### 3.2 确认的"改 A 坏 B"循环

| 循环 | 涉及文件 | 追因 |
|------|---------|------|
| ① 时序多米诺 | breadcrumb.js ↔ translations.js ↔ product-grid.js | i18n 异步化后全局时序 |
| ② 路由器反复 | spa-router.js ↔ swup-init.js ↔ page-init.js | 路由器方案 3 次变更 |
| ③ 页面渲染 | product-grid.js ↔ product-detail.js | 共用 product-data-table 格式 |

### 3.3 修改原因分布（量化分析）

基于 549 笔 Git 提交的分类：

| 原因类型 | 估计占比 | 绝对数 |
|---------|---------|--------|
| 功能迭代（feat/add/feature） | ~30% | ~165 笔 |
| 修复型（fix/bugfix） | ~30% | ~165 笔 |
| 时序相关修复（估计） | ~20% | ~110 笔 |
| 重构/清理 | ~9% | ~48 笔 |
| 配置/工具 | ~11% | ~61 笔 |

**结论**: 时序相关修复占 ~20% 的总提交，如果加上修复型中隐含的时序问题，**近 1/3 的提交是在"修已经坏掉的东西"**。

详细分析见 [git-hotspot-analysis.md](./git-hotspot-analysis.md)。

---

## 4. 路由架构审计摘要

### 4.1 SWUP 实际运行状态

> **最终确认: SWUP 在运行，但 spa-router 的幽灵 API 调用在无声地失败。**

| 检查项 | 结论 |
|--------|------|
| index.html 加载 SWUP? | ✅ 是（swup-bundle.umd.js defer） |
| SWUP auto-init? | ✅ 是（bundle 末尾自动调用） |
| swup-init.js? | ❌ 已删除 |
| spa-router.js 被加载? | ❌ 否（但被复制到 dist） |
| 8 个 UI 模块引用 window.SpaRouter? | ⚠️ 是（幽灵调用） |
| `__swupEnabled` | ✅ 设置，gate 工作 |

### 4.2 spa-router.js 设计缺陷

| 问题 | 严重度 |
|------|--------|
| fetch 不检查 response.ok | 🔴 P0 |
| 无统一的加载生命周期 | 🔴 P0 |
| popstate 硬编码 500ms | 🟡 P1 |
| PDP 异步加载竞态 | 🟡 P1 |
| click 拦截遗漏动态路由 | 🟡 P1 |

详细分析见 [swup-router-audit.md](./swup-router-audit.md)。

---

## 5. 安全审计摘要

### 5.1 innerHTML 评估

**137 处 innerHTML → 无立即 XSS 风险（数据源可控）**

但以下值得关注：
- spa-router.js:683 — fetch 内容直接 innerHTML（应在加载前 sanitize）
- ~60% 的 innerHTML 是硬编码模板字符串（安全但重构后应替换为 createElement）

### 5.2 62× DOMContentLoaded 分类

| 类型 | 数量 | 处理 |
|------|------|------|
| 必要（依赖 DOM） | ~20 | 保留，统一管理 |
| 时序补丁 | ~25 | ✅ 可替换为 whenReady |
| 冗余包装 | ~10 | ✅ 安全删除 |
| SPA 不兼容 | ~7 | ✅ 改为 spa:load |

### 5.3 108× setTimeout 分类

| 类型 | 数量 | 处理 |
|------|------|------|
| 必要（动画等） | ~15 | 保留 |
| 时序补丁（~60%） | ~58 | ✅ 可替换为 Promise |
| 未清除 | ~3 | ✅ 修复 |
| 其他 | ~32 | 保留或优化 |

详细分析见 [security-audit.md](./security-audit.md)。

---

## 6. 彻底修复方案

### 6.1 修复哲学

```
┌──────────────────────────────────────────────────────────────┐
│  ✅ 原则                                                       │
│  1. 不中断在线业务                                             │
│  2. 每次修改都是净改进                                         │
│  3. 从最痛的地方开始                                           │
│  4. 每个阶段交付后，时序问题不可逆减少                           │
│  5. 🆕 框架问题框框架层面解决，不绕路打补丁                      │
│  6. 🆕 不再自建已有成熟库的功能                                  │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 阶段零（新增）：路由架构统一决策 — 1 天

**目标**: 结束 SWUP / spa-router 双轨状态

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| T0.1 SWUP 正式配置化 | 0.5d | 创建 swup-init.js（配置+插件），移除 bundle 内 auto-init |
| T0.2 清理 spa-router 引用 | 0.5d | 删除 spa-router.js 或标记为废弃；统一 window.SpaRouter 调用 |

### 6.3 阶段一（P0）：时序应急加固 — 2 天

（同 v1.0，不变）
- T1.1 全局 null-safe 存取器 (0.5d)
- T1.2 修复所有 `window.t()` 无 guard 调用 (0.5d)
- T1.3 修复 spa-router `scriptsPromise` 竞态 (0.5d) — 注意：此处为 spa-router 留下但阶段零可能废弃它
- T1.4 统一 spa:load 阶段化 (0.5d)

**更新**: 如果阶段零废弃 spa-router，则 T1.3 实际不存在 → 调整为 SWUP event 绑定

### 6.4 阶段二（P1）：i18n 系统模块化 — 3 天

（同 v1.0，调整）
- T2.1 提取 i18n 内核为独立 ESM 模块 (1d)
- T2.2 替换所有 `_t()` 辅助函数 (1d)
- T2.3 翻译异步时序抽象 whenReady (1d)

**补充**: 评估是否用 i18next 替换自建引擎（~2d 额外工作量，非强制）

### 6.5 阶段三（P1）：Webpack ESM 渐进迁移 — 6 天

（从 v1.0 的 5 天调整为 6 天，因更清晰的数据支撑了复杂度）

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| T3.1 Webpack 多入口配置 | 1d | 核心模块独立 entry |
| T3.2 建立 lib/ 模块目录 | 1d | 迁移核心工具 |
| T3.3 breadcrumb 模块化拆分 | 1d | 复用 JJC-019 |
| T3.4 ui-bundle 拆分为独立 ESM | 2d | 2775 行大拆分 |
| T3.5 CSS-in-JS 模板重构 | 1d | 模板字符串 → CSS 类 |

### 6.6 阶段四（P1）：SPA 路由器正式化 — 3 天

（从 v1.0 的 4 天调整为 3 天）

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| T4.1 正式化 SWUP | 1d | 配置+init+事件迁移 |
| T4.2 废弃 spa-router.js | 0.5d | 删除/archive |
| T4.3 统一 SWUP 事件绑定 | 1.5d | 迁移 20+ 模块 |

### 6.7 阶段五（P2）：测试覆盖 — 3 天

（不变）

---

## 7. 实施路线图与工时重估

### 7.1 总工时重估

| v1.0 | v2.0 | 变化原因 |
|------|------|---------|
| 17 天 | **18 天** | +1 天（阶段零路由决策） |

### 7.2 时间线

```
Week 1          Week 2          Week 3          Week 4
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ 阶段零+一   │ │   阶段二    │ │   阶段三    │ │   阶段四+五 │
│ 路由决策    │ │  i18n 模块化│ │  ESM 迁移   │ │  Router    │
│ + P0 应急  │ │   (3d)     │ │   (6d)     │ │  + 测试    │
│   (3d)     │ │            │ │            │ │   (6d)     │
├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤
│ T0.1 0.5d  │ │ T2.1 1d    │ │ T3.1 1d    │ │ T4.1 1d    │
│ T0.2 0.5d  │ │ T2.2 1d    │ │ T3.2 1d    │ │ T4.2 0.5d  │
│ T1.1 0.5d  │ │ T2.3 1d    │ │ T3.3 1d    │ │ T4.3 1.5d  │
│ T1.2 0.5d  │ │            │ │ T3.4 2d    │ │ T5.1-3 3d   │
│ T1.3 0.5d  │ │            │ │ T3.5 1d    │ │            │
│ T1.4 0.5d  │ │            │ │            │ │            │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

里程碑:
M0 (Day 1):  路由决策完成 — SWUP 正式化 / spa-router 废弃
M1 (Day 3):  消除 P0 时序问题 — 系统不再因加载顺序崩溃
M2 (Day 6):  i18n 系统 Promise-based — 翻译不再导致白屏
M3 (Day 12): 关键模块 ESM 化 — breadcrumb 完成模块化
M4 (Day 18): SWUP 统一 + 时序测试覆盖 — 修复完成
```

### 7.3 优先级矩阵

| 阶段 | 子任务 | 预估 | 优先级 | 依赖 |
|------|--------|------|--------|------|
| 零 | T0.1 SWUP 正式配置化 | 0.5d | **P0** | 无 |
| 零 | T0.2 清理 spa-router 引用 | 0.5d | **P0** | T0.1 |
| 一 | T1.1 全局安全存取器 | 0.5d | **P0** | 无 |
| 一 | T1.2 修复 `window.t()` 调用 | 0.5d | **P0** | 无 |
| 一 | T1.3 时序修复 (SWUP 方式) | 0.5d | **P0** | T0.1 |
| 一 | T1.4 spa:load 阶段化 | 0.5d | **P0** | T1.1 |
| 二 | T2.1 i18n 内核提取 | 1d | **P1** | T1.1 |
| 二 | T2.2 统一 `_t()` 注入 | 1d | P1 | T2.1 |
| 二 | T2.3 when-ready 抽象 | 1d | P1 | T1.1 |
| 三 | T3.1 Webpack 多入口 | 1d | P1 | T2.1 |
| 三 | T3.2 lib/ 模块目录 | 1d | P1 | T3.1 |
| 三 | T3.3 breadcrumb 模块化 | 1d | P1 | T3.2 |
| 三 | T3.4 ui-bundle 拆分 | 2d | P1 | T3.2 |
| 三 | T3.5 CSS-in-JS 重构 | 1d | P2 | T3.3 |
| 四 | T4.1 SWUP 正式化 | 1d | P1 | T2.1 |
| 四 | T4.2 废弃 spa-router.js | 0.5d | P1 | T4.1 |
| 四 | T4.3 统一 SWUP 事件绑定 | 1.5d | P1 | T4.1 |
| 五 | T5.1-3 时序测试 | 3d | P1 | T1.3, T2.3 |

### 7.4 可选/延后项

| 子任务 | 预估 | 优先级 | 理由 |
|--------|------|--------|------|
| 用 i18next 替换自建 i18n | 2d | P3 | 当前模块化已足够 |
| CSP strict-dynamic 迁移 | 5-7d | P3 | 需要 ESM 化完成后 |
| 全部 137 处 innerHTML → createElement | 3d | P3 | 安全风险低 |
| SWUP 迁移到 SvelteKit/Astro | 10-15d | P4 | 当前项目规模下过度工程 |

---

## 8. 风险与备选方案

（同 v1.0 基础上增加:）

### v2.0 新增风险

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 废弃 spa-router 导致未发现的依赖崩溃 | 中 | 高 | 用阶段零的 0.5d "引用清理" 逐步移除，非一次性删除 |
| 团队抵抗 ESM 迁移 | 高 | 中 | 提供迁移指南 + pair programming |
| 安全审计发现没有真 XSS 漏洞，团队认为不紧急 | 中 | 低 | 合理，阶段五后做 |
| SWUP 事件迁移（spa:load → content:replace）导致回归 | 中 | 高 | 分两步：先支持下兼容，再统一 |

### 备选方案

| 场景 | 方案 |
|------|------|
| 阶段零后发现 SWUP 不适合 | 回退到 spa-router 并修复所有缺陷（+3d） |
| 阶段二发现自建 i18n 无法模块化 | 直接用 i18next 替换（+2d，但净改进） |
| 阶段三 ESM 迁移引起兼容性问题 | 保留 IIFE 入口 + ESM 双出口 |
| 老板觉得 18 天太长 | 简化：阶段零+一+二（6 天），阶段三+四+五延后 |

### "不做"的代价（更新版）

如果什么都不做，预期 60 天内：

1. `window.t()` 时序 bug **翻倍**（从 ~10 到 ~20+）
2. 每次新页面类型加入需要 **5+ 轮时序调试**（因为路由器方案不明确）
3. 更糟的情况: 如果 SWUP 需要升级 → `__swupEnabled` 行为改变 → spa-router 和 SWUP 的共存逻辑崩溃
4. LeFthook + lint 无法阻止时序 bug（这是架构问题，不是代码质量问题）

---

## 附录 A: 关键依赖关系矩阵

（同 v1.0）

---

## 附录 B: v1.0 → v2.0 变更记录

| 章节 | 变更 |
|------|------|
| 根因分析 §2 | 新增框架级根因诊断、Webpack 半迁移分析、SWUP 运行时态确定 |
| Git 分析 §3 | 新增 549 笔提交的全量分析、修改原因分布、改 A 坏 B 循环确认 |
| 路由审计 §4 | 新增 SWUP vs spa-router 实际运行状态确认 |
| 安全审计 §5 | 新增 137 处 innerHTML 分类、108× setTimeout 分类 |
| 修复方案 §6 | 新增阶段零"路由统一决策"、修复哲学增加 2 条新原则 |
| 工时 §7 | 17 天 → 18 天 |
