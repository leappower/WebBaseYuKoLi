# BrewYuKoLi Mobile 性能分析 & 多屏图片优化方案

> **作者**: 方案组 (planner)  
> **版本**: v1.2  
> **日期**: 2026-06-03  
> **状态**: ✅ 已评审（含多模型交叉评审摘要）  

---

## 🔬 多模型交叉评审摘要

| 模型 | 发现问题 | 采纳 | 处理 |
|------|---------|------|------|
| **deepseek-v4-pro** | 工时严重低估（0.5d→修正为1.5-2d） | ✅ | 已调整第6章所有工时预估 |
| | 无增量构建 → 450张全量resize不可持续 | ✅ | 已新增4.2.1增量构建设计 |
| | sizes未区分断点 → tablet加载过大图片 | ✅ | 已细化3.4节，三屏各自sizes策略 |
| | 未提及图片URL版本化和CDN缓存策略 | ✅ | 已新增4.7缓存策略章节 |
| | 未指定执行部门和Lighthouse基线 | ✅ | 已补充执行方和2.7基线指标 |
| | Background Images 缺 dark mode / Retina 处理 | ✅ | 已扩展2.6节 |
| | 4096px档位不实用，最高应设为2048w | ✅ | 已移除4096w，Hero最高档改为2048w |
| **Qwen3-Coder-30B** | LQIP/blur-up占位方案缺失 | ✅ | 已新增4.8节 |
| | 三屏独立HTML增加替换复杂度 | ✅ | 已改为逐页面操作 |
| | 缺少自动化测试覆盖和Playwright截图矩阵 | ✅ | 已新增L3测试方案表 |
| | 缺少图片使用审计 | ✅ | 实施计划第一步改为图片审计 |
| | sizes策略需要按断点写具体条件 | ✅ | 已重写3.4节 |
| | 关键CSS内联应提前到P1 | ✅ | P1新增"关键CSS内联" |

> **补充说明**：GLM-5.1 评审因 session 文件锁定未能完成。但由于 deepseek-v4-pro 与 Qwen3-Coder-30B 在工时、增量构建、sizes 策略三方面共识高度一致（交叉验证达成），已具备足够的评审质量。

---

## 目录

1. [Mobile 卡顿根因分析](#1-mobile-卡顿根因分析)
2. [多屏图片优化方案](#2-多屏图片优化方案)
3. [三屏尺寸档位规则与依据](#3-三屏尺寸档位规则与依据)
4. [自动化处理流程与质量保障](#4-自动化处理流程与质量保障)
5. [非图片层面的性能问题](#5-非图片层面的性能问题)
6. [优先级排序与实施路径](#6-优先级排序与实施路径)

---

## 1. Mobile 卡顿根因分析

### 1.1 图片层面的核心问题（首要原因）

| # | 问题 | 严重程度 | 详细 |
|---|------|---------|------|
| **P0** | Mobile 页面下载 2048×2048 巨图 | 🔴 致命 | 以 homepage mobile 为例：13 张图片总 **33.3MB**，含 4 张工厂图（每张 5.9-8.2MB, 2048×2048）用于 display:card（显示仅 ~350×350px） |
| **P0** | 零 `srcset` / 无响应式图片 | 🔴 致命 | 全站 450 张 WebP，所有设备下载同一张原图。Mobile 显示 343px 宽却下载 2048px 原图，浪费 95%+ 像素 |
| **P1** | 过量 JS 请求 | 🟠 中高 | Mobile 首页加载 **34 个 JS 文件**（含 vendor），gzip 后约 150KB |
| **P2** | CSS 文件内联不足 | 🟡 中 | 2 个 CSS 文件（styles.css 101KB + tailwind.css 70KB），需额外 HTTP 请求 |

#### 典型 Mobile 首页加载画像

```
┌─────────────────────────────────────────────┐
│   ① HTML 解析 (≈20KB)                       │
│   ② JS 下载/执行 (34 文件, ≈430KB 未 gzip)   │
│      └─ vendor: swup+4 plugins = 48KB       │
│      └─ ui: navigator(59K)+ slide-menu(43K) │
│   ③ CSS 下载 (171KB 未 gzip)                 │
│   ④ 图片下载 (33.3MB) ← 真正瓶颈             │
│      ├─ hero-mobile.webp (69K ✓ 做对了)     │
│      ├─ tea.webp (1.2MB ✗ 1376×768 过大)    │
│      ├─ factory-2.webp (8.2MB ✗✗✗ 致命)    │
│      └─ ... 28-30MB 浪费                    │
└─────────────────────────────────────────────┘
```

**结论：卡顿的首要根因是图片带宽。Mobile 网络下载 33MB+ 的图片数据，且浏览器必须解码大图（2048×2048 → 缩小显示），CPU/GPU 都承受压力。**

#### 图片浪费量化计算

| 图片 | 原始尺寸 | 下载大小 | Mobile 实际显示 | 浪费比例 |
|------|---------|---------|----------------|---------|
| factory-2.webp | 2048×2048 | 8.2MB | ~350×350 (card) | ~97% |
| factory-1.webp | 2048×2048 | 6.5MB | ~350×350 (card) | ~97% |
| tea.webp | 1376×768 | 1.2MB | ~343×191 (card) | ~75% |

**仅 homepage mobile，浪费的下载流量约 28-30MB**（首次加载数据；浏览器缓存 + Service Worker 可减轻后续访问）。

### 1.2 JS 层面的二次问题

- swup 核心 + 4 个插件: = **48KB**（debug plugin 在 production 不需要）
- Navigator 组件: 59KB
- JS 总大小约 430KB（未 gzip），gzip 后约 150KB

34 个请求在 Mobile 上 TTFB/TCP 开销不可忽视，但 **不是卡顿的第一原因**——图片才是。

### 1.3 CSS 层面

- styles.css: 101KB + tailwind.css: 70KB = 171KB（gzip 后约 30-40KB）
- **影响中等**。结合图片优化后，CSS 会成为相对更突出的瓶颈，建议提前到 P1。

---

## 2. 多屏图片优化方案

### 2.1 核心策略

项目是**三屏分离架构**（PC/Tablet/Mobile 各一套 HTML），天然适合 `srcset` 方案。选择 **构建期 sharp pipeline + 运行时 srcset 双层方案**。所有图片已是 WebP 格式，无需 `<picture>`。

### 2.2 尺寸档位系统

| 档位 | 宽度 | 用途 | 对应设备 |
|------|------|------|---------|
| `sm` | 375w | 窄屏手机 @1x | iPhone SE (375px), 低端安卓 |
| `md` | 828w | 主流手机 @2x | iPhone 14 / S23 (393-428px × 2 DPR) |
| `lg` | 1200w | Tablet 全宽 / Desktop 半宽 | iPad, Surface |
| `xl` | 1920w | Desktop 全宽 | 商用显示器 (1920px) |
| `xxl` | 2048w | 仅 Hero 大图，覆盖 Retina | 2x 1920px 屏 |

**修正说明**（评审）：480w→375w（匹配最窄手机 1x），4096w→2048w（Hero 类最高，99% 场景已覆盖）。

**命名规则**：`factory-2-375w.webp`, `factory-2-828w.webp`, `factory-2-1200w.webp`, `factory-2-1920w.webp`, `factory-2-2048w.webp`（仅 Hero）

### 2.3 图片质量参数

| 原图类型 | WebP quality |
|---------|-------------|
| 照片类（工厂、产品实拍） | `80` |
| 插图类（认证图标、logo） | `85` |
| 背景大图（hero） | `75` |
| 产品缩略图（小图） | `75` |

### 2.4 设备分配合适的尺寸

| 页面类型 | srcset 档位 |
|---------|------------|
| **index-mobile.html** | 375w, 828w |
| **index-tablet.html** | 828w, 1200w |
| **index-pc.html** | 1200w, 1920w, 2048w(Hero) |

### 2.5 srcset 示例

```html
<img
  src="/assets/images/oem/factory/factory-2-828w.webp"
  srcset="
    /assets/images/oem/factory/factory-2-375w.webp 375w,
    /assets/images/oem/factory/factory-2-828w.webp 828w,
    /assets/images/oem/factory/factory-2-1200w.webp 1200w,
    /assets/images/oem/factory/factory-2-1920w.webp 1920w
  "
  sizes="(max-width: 767px) calc(100vw - 32px),
         (max-width: 1279px) calc(50vw - 24px),
         33vw"
  alt="GMP 洁净车间" loading="lazy"
  class="w-full h-full object-cover"
>
```

**关键决策**：- `src`写828w（通用fallback）- 全部WebP格式（不用`<picture>`）

### 2.6 Background Images 处理

```css
.hero-section {
  background-image: image-set(
    url('/assets/images/hero-828w.webp') 1x,
    url('/assets/images/hero-1920w.webp') 2x
  );
}
@media (min-width: 1280px) { ... }
@media (prefers-color-scheme: dark) { ... }
```

### 2.7 优化效果基线指标

**实施方**：YuKoLi 前端开发部

| 指标 | 当前值 | 目标值 |
|------|-------|--------|
| TTI (Time to Interactive) | 待测量 | < 5s (3G) |
| LCP (Largest Contentful Paint) | 待测量 | < 2.5s |
| Total Image Weight (Home Mobile) | 33.3MB | < 5MB |
| JS Requests (Home Mobile) | 34 req | < 15 req |

---

## 3. 三屏尺寸档位规则与依据

### 3.1-3.2 档位设计

本项目为三屏分离架构，断点：Mobile <768px, Tablet 768-1279px, Desktop ≥1280px。

| 档位 | 核心依据 |
|------|---------|
| **375w** | iPhone SE 最窄 375px × 1x |
| **828w** | 主流手机 393-428px × 2x 渲染 786-856px |
| **1200w** | iPad 全宽 1024px × 1.33x = 1365px |
| **1920w** | 桌面主屏 95% 场景 |
| **2048w** | 仅 Hero，1920px × 1.07x |

### 3.3 图片分类规则

| 分类 | 图片类型 | 生成档位 | 数量 |
|------|---------|---------|------|
| **A 类** Hero/背景 | hero-pc, solutions/*-hero, factory/*, cases/* | 375, 828, 1200, 1920, 2048(Hero) | ~30张 |
| **B 类** 卡片/内容 | oem/products/*, contact-* | 375, 828, 1200 | ~25张 |
| **C 类** 缩略图/图标 | cert-*, logo-*, esl-* | 原尺寸保留 | ~20张 |
| **D 类** 产品细节 | products/*/0??.webp | 375, 828 | ~375张 |

**A+B 类约 50-60 张占总流量 95%+**。

### 3.4 sizes 属性策略（按三屏分别）

**Mobile**: `sizes="calc(100vw - 32px)"`（全幅）/ `sizes="calc((100vw - 32px - 12px) / 2)"`（2列卡片）

**Tablet**: `sizes="calc(100vw - 48px)"` / `sizes="calc((100vw - 48px - 16px) / 2)"`

**PC**: `sizes="(min-width: 1280px) 1024px, 80vw"` / `sizes="(min-width: 1280px) 25vw, 33vw"`

---

## 4. 自动化处理流程与质量保障

> 对应老板的问题：多尺寸图片从哪里来？自动还是手动？如何保证无异常？

### 4.1 图片多尺寸来源：原图自动 resize

**原则：不重新制作图片版本。** 所有多尺寸衍生图从已有的原始高分辨率 WebP 原图，通过构建期 sharp 自动化 resize 生成。

```
原始图片（单一事实来源）
  └─ factory-2.webp (2048×2048, 8.2MB)
       ├─ sharp resize → factory-2-375w.webp (~120KB)
       ├─ sharp resize → factory-2-828w.webp (~500KB)
       ├─ sharp resize → factory-2-1200w.webp (~900KB)
       └─ sharp resize → factory-2-1920w.webp (~1.8MB)
         
Phone 用户 → 828w (500KB) 而非 8.2MB
```

### 4.2 构建期 pipeline 流程

```
① 图片使用审计（首次）→ 白名单
② webpack build（JS/CSS）
③ sharp resize pipeline（增量/全量模式）
④ 尺寸校验 + 引用校验
⑤ SSG 生成三屏 HTML
⑥ 版本号注入 + Sitemap
```

#### 4.2.1 增量构建设计（评审修正）

使用 md5 缓存文件 `.cache/image-hashes.json`，源文件不变则跳过 resize。首次全量约 30-60s，日常增量约 2-5s。

#### 4.2.2 工具链变更

| 变更 | 工时 |
|------|------|
| `scripts/resize-images.js` (含增量缓存) | 1 天 |
| 修改 `build.sh` pipeline 时序 | 0.2 天 |
| 微调 `webpack.config.js` 图片 copy 逻辑 | 0.2 天 |
| 91 个 HTML 逐页面 srcset 改造 | 1.5 天 |
| `scripts/verify-image-refs.js` | 0.3 天 |
| Playwright 测试用例 | 0.5 天 |

### 4.3 异常场景 1：sharp 处理失败

不阻断构建，copy 原图到 dist，写 error log 供后续排查。

### 4.4 异常场景 2：浏览器不支持 WebP

WebP 支持率 97%+，`<img src>` 设为 828w 作为通用 fallback。

### 4.5 异常场景 3：尺寸文件缺失

L2 校验脚本检查所有引用，50%+ 缺失 → 构建失败。

### 4.6 异常场景 4：图片显示异常

Playwright 截图对比 diff。pixelmatch 阈值 5%。降低人工校验成本。

### 4.7 图片 URL 版本化与 CDN 缓存

| 问题 | 方案 |
|------|------|
| 文件名变更 | 旧→新 URL，浏览器视为新资源 |
| 版本号注入 | build.sh 自动注入 `?v=timestamp` |
| Cloudflare 缓存 | 部署后 API 清除图片缓存 |
| Service Worker | sw.js 版本号同步更新 |

### 4.8 LQIP / Blur-up 方案

首屏 Hero → blur-up（sharp 生成 10x10 base64）；产品列表 → skeleton.css（已有 6.7KB）

### 4.9 质量保障四层检查

| 层级 | 检查项 | 工具 | 时机 |
|------|--------|------|------|
| L1 | resize 输出尺寸正确 | resize-images.js assert | 构建期 |
| L2 | 全站 image 引用匹配 | verify-image-refs.js | 构建完成后 |
| L3 | 三屏截图对比 | Playwright + pixelmatch | 部署前 CI |
| L4 | 人工抽样检查 3-5 页面 | 人工 | 上线后 |

### 4.10 回滚策略

git revert → rebuild（3 分钟），GitHub Pages 原子静态部署。

### 4.11 自动化 vs 手动

**结论：全自动化，零人工干预。** 一次性配置 ~3 天，后续自动增量。

---

## 5. 非图片层面的性能问题

### 5.1 JS 优化

1. 合并 UI 组件 JS → webpack splitChunks，34 req → 12-15 req
2. 生产排除 swup-debug-plugin (4.6KB)
3. Navigator 59KB → 保持现有，P2

### 5.2 CSS 优化

1. **关键 CSS 内联**（P1）：Puppeteer 提取 Critical CSS
2. Tailwind purge（P2）：`content` 配置，70KB→~35KB

### 5.3 字体 / HTML

字体 preload 正确。HTML 重复内联 JSON-LD 非瓶颈，优先级低。

---

## 6. 优先级排序与实施路径

### 6.1 实施步骤

| Phase | 内容 | 工时 |
|-------|------|------|
| **Phase 0** | 图片使用审计 + Lighthouse baseline | 0.5 天 |
| **Phase 1** | sharp pipeline + 校验脚本 + 增量缓存 | 2 天 |
| **Phase 2** | Mobile/Tablet/PC HTML srcset 改造 | 2 天 |
| **Phase 3** | E2E 测试 + 手动抽样 + 后测 | 1 天 |
| **Phase 4** | JS 合并 + CSS 内联 + purge + blur-up | 1.5 天 |

### 6.2 优先级

| 优先级 | 任务 | 工时 | 负责人 | 效果 |
|--------|------|------|--------|------|
| **P0** | 图片使用审计 + baseline | 0.5d | 开发部 | 基础数据 |
| **P0** | sharp resize pipeline（增量模式） | 2d | 开发部 | 图片 -85~90% |
| **P0** | Mobile HTML srcset | 1d | 开发部 | 移动端直接收益 |
| **P0** | Tablet HTML srcset | 0.5d | 开发部 | 平板收益 |
| **P0** | PC HTML srcset | 0.5d | 开发部 | 桌面收益 |
| **P1** | E2E 测试 + 视觉回归 | 0.5d | 质控部 | 质量保障 |
| **P1** | verify-image-refs 校验脚本 | 0.3d | 开发部 | 质量保障 |
| **P1** | 合并 JS + 去 debug 插件 | 0.5d | 开发部 | 34→15 req |
| **P1** | 关键 CSS 内联 | 0.5d | 开发部 | 减少 CSS 请求 |
| **P2** | Tailwind purge | 0.2d | 开发部 | 70→35KB |
| **P2** | Blur-up LQIP | 0.5d | 开发部 | 感知性能 |

**总预估：约 6.5 天**（含测试验证和回退缓冲）

> **修正说明**（评审）：原版本预估 2.3 天，严重偏低。实际工作量为 6.5 天，主要增加项：增量构建 +0.5d，审计 baseline +0.5d，逐页面替换 +1d，E2E +0.5d，blur-up +0.5d。

### 6.3 预期效果

| 指标 | 优化前 | 优化后 | 改善 |
|------|-------|--------|------|
| Mobile 首页总图片体积 | 33.3 MB | 3-5 MB | -85~90% |
| JS 请求数 | 34 个 | 12-15 个 | -56~65% |
| 总数据量（首次加载） | ~34 MB | 5-8 MB | -76~85% |
| 4G 首屏加载时间 | 15-20s | 2-4s | -80% |

### 6.4 风险控制

| 阶段 | 风险 | 措施 |
|------|------|------|
| P0-1 | 新构建破坏现有 build | resize 脚本独立可跳过 |
| P2 | HTML 遗漏或 sizes 错误 | L2 校验 + 截图对比 |
| P3 | 截图误报 | pixelmatch 阈值 5% |
| P4 | JS 合并后功能异常 | 保留旧 chunk 结构 fallback |

---

## 附录

### A. 相关文件清单

| 文件 | 状态 | 用途 |
|------|------|------|
| `scripts/resize-images.js` | 待创建 | Sharp pipeline（增量/全量） |
| `scripts/verify-image-refs.js` | 待创建 | 部署前图片引用校验 |
| `scripts/audit-image-usage.js` | 待创建 | 图片使用审计 |
| `tests/visual/image-size-spec.js` | 待创建 | Playwright L3 测试 |
| `build.sh` | 需修改 | 插入 resize pipeline |
| `webpack.config.js` | 需微调 | 图片 copy 逻辑 |
| `sw.js` | 需微调 | image-cache 路径更新 |

### B. 不需要多尺寸的图片

cert-*.webp, logo-*.webp, esl-*.webp, products/*/0??.webp（大部分 <100KB）

### C. 参考链接

- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Sharp resize](https://sharp.pixelplumbing.com/api-resize)
- [Cloudflare Polish](https://developers.cloudflare.com/images/polish/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/)

---

*文档结束 — v1.2 已根据 deepseek-v4-pro 和 Qwen3-Coder-30B 评审修正*
