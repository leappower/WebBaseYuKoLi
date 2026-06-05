# 面包屑重构方案 v1.1

> 基于 28 次提交代码分析 + 三模型交叉评审 | 2026-06-05

---

## 🔬 多模型交叉评审摘要

| 模型 | 发现问题数 | 采纳 | 关键问题 |
|------|-----------|------|---------|
| **deepseek-v4-pro** | 17 条 | 4/4 严重已处理 | MutationObserver 替代方案不可行、ui-bundle 手工合并隐患、PDP 异步品类检测遗漏、公共 API 兼容未分析 |
| **Qwen3-Coder-30B** | 12 条 | 3/3 严重已处理 | MutationObserver 不适合 SPA 场景、数据层签名漏异步参数、ui-bundle 手动合并风险 |
| **GLM-5.1** | 11 条 | 4/4 严重已处理 | 异步 i18n 时序策略缺失、SSG 加载路径遗漏、风险评估不足 |

### 已处理的关键修正

1. **MutationObserver → 保留 SWUP 事件体系** — 三个模型一致反对使用 MutationObserver（SPA 场景下不可靠），改为保留 `spa:load` + 添加 `whenReady()` Promise 队列
2. **ui-bundle.js 手工合并风险** — 增加 `scripts/concat-breadcrumb.sh` 构建脚本，自动按依赖顺序合并三个文件，不再手动操作
3. **PDP 异步品类检测** — 数据层采用两步解析：先返回部分 segments，异步数据就绪后触发补全
4. **CSS 风格统一** — 不使用语义类，改用 `classList.add()` 批量添加 Tailwind 原子类，与全站风格一致
5. **公共 API 清单** — 明确 `window.Breadcrumb` 保留全部当前 API 签名
6. **异步渲染时序策略** — 新增 `Breadcrumb.whenReady()` + Promise.all，设计完整时序策略

---

## 一、重构目标

| 目标 | 度量标准 |
|------|---------|
| **职责分离** | breadcrumb.js 只协调，不处理数据/渲染 |
| **可测试** | 核心函数可独立测试（不依赖 DOM、不依赖 SPA 事件） |
| **零残留内联样式** | 所有 CSS 原子类通过 `classList.add()` 批量添加 |
| **API 向后兼容** | `window.Breadcrumb` 暴露的所有 API 签名不变 |
| **无时序 Hack** | 用 Promise 队列 + SWUP 事件 + 异步就绪检测替代 setTimeout 链 |

---

## 二、目标架构

```
src/assets/js/
├── breadcrumb-data.js    (新)   — 数据层：路由检测 + 面包屑数据模型（纯函数）
├── breadcrumb-render.js  (新)   — 渲染层：纯函数，数据对象 → DOM 元素（createElement）
└── breadcrumb.js         (重构) — 入口层：事件绑定 + 生命周期管理 + API 暴露

scripts/
└── concat-breadcrumb.sh  (新)   — 自动按依赖顺序合并三文件，输出给 ui-bundle.js 使用
```

### 数据层 (breadcrumb-data.js) — ~180 行

```javascript
// 纯函数，不依赖 window/DOM
BreadcrumbData.detect(pathname, categories, options) → { type, segments, refSlug }
  // options.pdpCategoryFallback — PDP 品类未就绪时的 fallback
  // 返回 segments 数组（按 Home > Category > SubCategory > Page 顺序）

BreadcrumbData.resolveLabel(label, language) → string
  // 处理 string / {en, zh-CN} / i18n key 三种格式

BreadcrumbData.getSiblings(type, slug, categories) → {label, href, active}[]
  // 同类目的同级页面列表

BreadcrumbData.getGoBackTarget(segments, history) → { href, label }
  // goBack 逻辑：优先面包屑路径上一级，否则 history.back()
```

### 渲染层 (breadcrumb-render.js) — ~250 行

```javascript
// 纯 DOM API，不使用 innerHTML
BreadcrumbRender.buildDesktopBreadcrumb(segments) → HTMLElement
  // 用 classList.add('pt-4', 'pb-0', ...) 批量添加 Tailwind 原子类

BreadcrumbRender.buildMobileBackBar(segments, options) → HTMLElement
  // Mobile 返回栏

BreadcrumbRender.buildSiblings(siblings) → HTMLElement
  // 兄弟导航

BreadcrumbRender.clearContainer(container) → void
  // 清空容器后按顺序 append
```

### 入口层 (breadcrumb.js) — ~220 行

```javascript
// 只负责协调
- 依赖：breadcrumb-data.js → breadcrumb-render.js → breadcrumb.js
- 生命周期管理：
  * init(): 根据 DOM 状态 + SPA 事件 + TranslationManager 就绪情况触发渲染
  * SPA 切换: spa:load 事件 → refresh()
  * 语言切换: languageChanged 事件 → refresh()
  * PDP 异步品类: product-data-ready → updateCurrent() 部分重渲染
- 暴露的公共 API 保持不变：
  window.Breadcrumb = {
    refresh,       // 全量重新渲染
    goBack,        // 返回上一级
    updateCurrent, // 更新当前项（case-detail 动态标题/PDP 品类补全）
    CATEGORY_KEY_TO_SLUG,  // 品类映射表
  }
```

### 异步渲染时序策略（新增 — 三模型重点批评）

```
时序流程:
1. DOMContentLoaded / spa:load → 触发 Breadcrumb.init()
2. init() 内部:
   a. 检查 window.SITE_CONFIG 是否就绪 → 否: 等待
   b. 检查 window.t / TranslationManager 是否就绪 → 否: 等待
   c. 两个条件同时满足 → 执行 detect() → build()
3. 异步补全:
   a. PDP 品类未就绪 → render "产品中心 / CF-001"
   b. product-data-ready 事件 → 补全为 "产品中心 / 咖啡系列 / CF-001"
4. 语言切换:
   a. languageChanged 事件 → B.readcrumb.refresh()
5. Promise 队列:
   const ready = Promise.all([configReady, i18nReady, domReady])
   ready.then(() => render())
```

---

## 三、具体重构步骤

### Step 1: 创建 breadcrumb-data.js（纯数据层）

**文件**: `src/assets/js/breadcrumb-data.js` (~180 行)

- 提取 `detectPage()` 核心逻辑为纯函数
- 处理 8 种页面类型 + products/all 特殊逻辑
- 两步解析 PDP：先部分 segments，品类数据就绪后补全
- i18n 标签解析：string / {en,zh-CN} / i18n key 三种格式
- `goBack` 导航逻辑归属数据层

**关键改进**：
- 接受 `options.pdpCategoryFallback` 参数
- segments 支持任意深度路径
- 覆盖 `/products/all/` 场景

### Step 2: 创建 breadcrumb-render.js（渲染层）

**文件**: `src/assets/js/breadcrumb-render.js` (~250 行)

- 使用 `document.createElement()` 替代 innerHTML 拼接
- 通过 `classList.add()` 批量添加 Tailwind 原子类（保持全站风格一致）
- 覆盖 PC 面包屑、Mobile 返回栏、兄弟导航

**关键改进**：
- 无 CSS 样式类（坚守 Tailwind 原子类惯例）
- `data-no-swup` 属性自动添加
- `aria-label="Breadcrumb"` 等无障碍属性

### Step 3: 重构 breadcrumb.js（入口层）

**文件**: `src/assets/js/breadcrumb.js` (~220 行)

- 依赖 `breadcrumb-data.js` + `breadcrumb-render.js`
- 保留 SWUP 事件体系（`spa:load`），不引入 MutationObserver
- 添加 `whenReady()` 异步就绪 Promise 队列
- 暴露 `window.Breadcrumb` 5 个公共 API，签名不变

### Step 4: 添加构建脚本 & 更新 ui-bundle.js

**新增**: `scripts/concat-breadcrumb.sh`

```bash
#!/bin/bash
# 自动按依赖顺序合并三模块，输出面包屑 bundle
# breadcrumb-data.js → breadcrumb-render.js → breadcrumb.js
cat src/assets/js/breadcrumb-data.js \
    src/assets/js/breadcrumb-render.js \
    src/assets/js/breadcrumb.js > /tmp/breadcrumb-bundle.js
```

**修改**: `src/assets/js/ui-bundle.js`

- 用 `/tmp/breadcrumb-bundle.js` 的内容替换旧 breadcrumb.js 代码块（~Lines 1747-2355）
- 运行 `build.sh dev` 验证无构建警告

### Step 5: 添加单元测试

**文件**: `tests/unit/breadcrumb-data.test.js` (~120 行)

| 测试类别 | 测试用例 |
|---------|---------|
| 路由检测 | 8 种页面类型各 1 个用例 + 未知路径 + 根路径 |
| 数据模型 | segments 顺序正确，无重复，无空值 |
| i18n 解析 | 中文环境、英文环境、key 缺失回退、object 标签 |
| 异步 PDP | 品类就绪前、品类就绪后 |
| 边界 | 畸形 URL、尾部斜杠、中文 URL |

**文件**: `tests/unit/breadcrumb-render.test.js` (~80 行)

| 测试类别 | 测试用例 |
|---------|---------|
| DOM 结构 | nav > ol > li pattern |
| 属性 | data-no-swup、aria-label |
| 无 innerHTML | 检查 render 结果不含 innerHTML 调用 |
| Mobile/PC 切换 | 返回按钮 vs 完整面包屑 |

**处理旧测试**: `tests/unit/product-detail.test.js` 中 breadcrumb 检查行（44-47）移除或更新

### Step 6: 清理遗留问题

- 清理 `__DEVELOPMENT__` 调试日志
- 全站搜索 `pdp-breadcrumb` 等旧 id 残留
- 确认 `product-detail.js` 中无面包屑 IIFE 残留
- 确认 `case-detail.js` 中 `window.Breadcrumb.refresh()` 调用兼容

### Step 7: E2E 测试

**文件**: `tests/e2e/breadcrumb.spec.js` (~160 行, Playwright)

| 场景 | 验证点 |
|------|--------|
| /products/all/ | 面包屑：产品中心 / 全部产品 |
| /products/coffee/ | 面包屑：产品中心 / 咖啡系列 |
| PDP 页面（有品类） | 面包屑：产品中心 / 咖啡系列 / CF-001 |
| PDP 页面（品类异步加载） | 先显示 产品中心/CF-001 → 加载后补全 |
| /cases/detail/xxx | 面包屑：案例研究 / 文章标题 |
| SPA 导航切换 | products → pdp → cases → home，面包屑正确 |
| 语言切换 en ↔ zh-CN | 面包屑标签正确翻译 |
| Mobile <768px | 显示返回按钮，无面包屑 |
| PC ≥768px | 显示完整面包屑路径 |
| 浏览器前进/后退 | bfcache 场景下面包屑正确 |
| 无障碍 | breadcrumb-current 指向最后一项 |
| SEO | data-no-swup 属性存在 |

---

## 四、文件清单

### 新增文件
| 文件 | 行数 | 说明 |
|------|------|------|
| `src/assets/js/breadcrumb-data.js` | ~180 | 纯数据层 |
| `src/assets/js/breadcrumb-render.js` | ~250 | 渲染层（createElement） |
| `scripts/concat-breadcrumb.sh` | ~20 | 构建合并脚本 |
| `tests/unit/breadcrumb-data.test.js` | ~120 | 数据层测试 |
| `tests/unit/breadcrumb-render.test.js` | ~80 | 渲染层测试 |
| `tests/e2e/breadcrumb.spec.js` | ~160 | E2E 场景测试 |

### 修改文件
| 文件 | 改动 | 说明 |
|------|------|------|
| `src/assets/js/breadcrumb.js` | 630→~220 行 | 大幅精简 |
| `src/assets/js/ui-bundle.js` | 替换 ~600 行 | 旧代码块→新 bundle 引用 |
| `tests/unit/product-detail.test.js` | 删除 ~4 行 | 旧 breadcrumb 检查行 |
| `build.sh` | 新增 ~3 行 | 构建前调用 concat-breadcrumb.sh |

### 不改文件
- 所有 HTML 页面（91 个） — 容器 `#breadcrumb-container` 已存在
- `src/assets/css/styles.css` — 不使用 CSS 类，坚守 Tailwind 原子类

---

## 五、预估工时（v1.1 修正版）

| 步骤 | v1.0 预估 | 修正后预估 | 原因 |
|------|----------|-----------|------|
| Step 1: breadcrumb-data.js | 1.5h | **2.5h** | 8 种页面路由 + 异步 PDP + i18n 三种格式 + goBack 逻辑 |
| Step 2: breadcrumb-render.js | 2h | **3h** | createElement 比内联字符串更慢，三种组件 + Tailwind classList |
| Step 3: 入口层重构 | 1h | **2h** | whenReady Promise 队列 + 保留 SWUP + 5 个 API 兼容 |
| Step 4: 构建脚本 + ui-bundle | 0.5h (Step 6) | **1.5h** | 新增 concat 脚本 + 验证 ui-bundle 替换后 91 页正常 |
| Step 5: 单元测试 | 1.5h (Step 5) | **2h** | 200 行测试 + 旧测试清理 |
| Step 6: 清理遗留问题 | — | **1h** | 新增：__DEVELOPMENT__ 日志 + 旧 id 残留 + API 兼容确认 |
| Step 7: E2E 测试 | 1.5h (Step 5) | **2h** | 12 场景 + WebKit 兼容 + bfcache |
| **合计** | **8.5h** | **14h (~2 天)** | |

### 验证清单

- [ ] `npm test` 所有面包屑单元测试通过
- [ ] `npx playwright test breadcrumb` E2E 测试通过（含 WebKit）
- [ ] `scripts/concat-breadcrumb.sh` 成功合并三模块
- [ ] `build.sh dev` 无构建警告
- [ ] SPA 页面切换 4 场景手动验证
- [ ] 语言切换 en/zh-CN 手动验证
- [ ] Mobile / Tablet / PC 三屏手动验证
- [ ] 旧 API 调用（refresh/goBack/updateCurrent）兼容
- [ ] 已知 bug（srcset 引号嵌套）排查是否需额外修复
- [ ] 无 `__DEVELOPMENT__` 调试日志残留

---

## 六、风险与备选

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| **ui-bundle 替换后页面白屏** | 中 | 💀 致命 | 先替换 ui-bundle → 验证首页 3 屏 → 再替换剩余 88 页；保留旧 bundle 备份 |
| **SPA 时序回归** | 中 | 高 | E2E 覆盖 spa:load + languageChanged + product-data-ready 组合 |
| **iOS Safari bfcache 不触发 spa:load** | 低 | 中 | E2E 增加 pageshow 事件兜底 |
| **微信内置浏览器兼容** | 低 | 中 | 验证 Translate 基础功能，低优先级 |
| **PDP 品类异步补全闪跳** | 中 | 低 | 先渲染无品类面包屑 → 异步补全时使用 CSS transition |

---

## 七、派发信息

- **需求**: 面包屑分析 + 重构（v1.1）
- **分析报告**: `docs/analysis/breadcrumb-analysis.md`
- **重构方案**: `docs/design/breadcrumb-refactor.md`（本文件 v1.1）
- **执行部门**: **研发部**（dev agent）
- **分支**: `dev-refactor-breadcrumb`
- **预估工时**: 2 天
- **优先度**: P1（非阻塞但已 28 次修改，建议本周完成）
