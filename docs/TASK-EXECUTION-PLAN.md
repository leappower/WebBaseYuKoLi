# BrewYuKoLi P5-P6 全量任务执行计划

> 创建时间：2026-05-17 21:57 CST
> 分支：dev @ f87c77d
> 目标：10 项任务 → 全部完成 → 合并 → QA 验证

---

## Wave 1 — 独立任务并行（6 个子 agent）

所有任务改不同文件/目录，无冲突风险。

### Task 1: Cross-Seller 数据源按页面类型过滤
- **Agent**: A
- **分支**: `dev-p5-cross-sell`
- **文件**: `src/assets/js/cross-sell.js` (424行)
- **目标**: 读取当前 URL 路径，按页面类型（solutions/products/manufacturing）过滤 cross-sell 数据
  - `/solutions/oem/` → 推荐配套服务（R&D、Packaging、Quality）
  - `/products/coffee/` → 推荐互补产品 + 服务（Private Label、Custom Packaging）
  - `/products/detail/` → 推荐同类其他产品
- **约束**: ES5, IIFE 模式, 不引入新依赖

### Task 2: Whitepapers 表单拦截 + CTA 文案统一
- **Agent**: B
- **分支**: `dev-p5-whitepapers-cta`
- **文件**:
  - `src/pages/resources/whitepapers/index-pc.html`
  - `src/pages/resources/whitepapers/index-tablet.html`
  - `src/pages/resources/whitepapers/index-mobile.html`
  - `src/pages/resources/whitepapers/lead-form.js` (新建)
- **目标**:
  - PDF 下载前弹出 Name+Company+Email 表单（内联 modal，不用 alert/prompt）
  - 提交后显示 thank-you 并触发下载
  - 检查所有 Solutions L2 页面的主 CTA 按钮，统一为"Request Quote"或"申请报价"
- **约束**: 表单为纯前端（无后端），localStorage 记录已提交用户

### Task 3: OEM/ODM/OBM 差异化文案
- **Agent**: C
- **分支**: `dev-p5-solutions-diff`
- **文件**:
  - `src/pages/solutions/oem/index-pc.html` (+ tablet, mobile)
  - `src/pages/solutions/odm/index-pc.html` (+ tablet, mobile)
  - `src/pages/solutions/obm/index-pc.html` (+ tablet, mobile)
- **目标**:
  - OEM: 强调"来料加工、配方保密、批量生产" → CTA: "Request OEM Quote"
  - ODM: 强调"配方研发、私标品牌、一站式" → CTA: "Start Private Label"
  - OBM: 强调"自有品牌、全链路支持、市场运营" → CTA: "Build Your Brand"
  - 每页添加一个 3 列对比表（IP 归属 / MOQ / 配方控制 / 交期 / 品牌支持）
- **约束**: 保持 3 屏布局一致，只改文案内容

### Task 4: Product Spec Download 按钮
- **Agent**: D
- **分支**: `dev-p5-spec-download`
- **文件**:
  - `src/pages/products/detail/index-pc.html`
  - `src/pages/products/detail/index-tablet.html`
  - `src/pages/products/detail/index-mobile.html`
  - `src/pages/products/detail/index.html`
- **目标**:
  - 在产品详情页添加 "Download Specification Sheet" 按钮
  - 样式：品牌色实心按钮，与现有 CTA 风格一致
  - href 指向 `#spec-download` 或 `mailto:info@yukoli.com?subject=Spec Request - [Product Name]`
- **约束**: 不修改产品数据结构，不添加新 JS 文件

### Task 5: 认证徽章全局化 + Anchor scroll offset
- **Agent**: E
- **分支**: `dev-p5-trust-scroll`
- **文件**:
  - `src/assets/js/ui/footer.js` (241行) — 添加 trust bar 到 footer
  - `src/assets/css/styles.css` — 添加 `scroll-margin-top` 和 trust-bar 样式
- **目标**:
  - Footer 添加 trust bar（ISO / GMP / Halal / FDA 徽章图片 + 文字）
  - 所有带 `id` 的 section 添加 `scroll-margin-top: 80px` 解决 header 遮挡
  - Trust bar 使用品牌色 #2E7D32 背景
- **约束**: 不修改 footer.js 的 bottom-tab 逻辑

### Task 6: GA4 数据分析接入
- **Agent**: F
- **分支**: `dev-p5-ga4`
- **文件**:
  - `src/site.config.js` — 添加 GA4 tracking ID 配置项
  - `src/pages/home/index-pc.html` — 注入 GA4 script
  - `src/assets/js/analytics.js` (新建) — 转化事件追踪
- **目标**:
  - GA4 gtag.js 注入（所有页面通过 build 自动注入 index-pc.html）
  - 自定义事件：quote_click, sample_click, whatsapp_click, catalog_download
  - CTA 按钮绑定事件（通过 data-ga-event 属性）
- **约束**: 不硬编码 GA4 ID，从 SITE_CONFIG.analytics.ga4Id 读取

---

## Wave 2 — 依赖 Wave 1 的任务（2 个子 agent）

### Task 7: P5 L2 页面对齐验证 + E2E 测试
- **Agent**: G
- **分支**: `dev-p6-e2e`
- **文件**: `tests/e2e/` 目录
- **目标**:
  - 扩展 `smoke.spec.js`：验证首页加载、导航链接、404 处理
  - 新建 `solutions.spec.js`：OEM/ODM/OBM 页面文案差异验证、CTA 按钮存在性
  - 新建 `products.spec.js`：Product detail spec download 按钮验证
  - 新建 `contact.spec.js`：表单字段存在性、WhatsApp 深链接验证
- **依赖**: Wave 1 全部合并
- **约束**: Playwright 已配置，baseURL = localhost:3000

### Task 8: Lead 采集表单（全局）
- **Agent**: H
- **分支**: `dev-p6-lead-form`
- **文件**:
  - `src/pages/resources/catalog/index-pc.html` (+ tablet, mobile)
  - `src/assets/js/lead-form.js` (新建，如果 Task 2 没创建的话)
- **目标**:
  - Catalog PDF 下载前也加表单拦截
  - 统一 Task 2 创建的表单组件
- **依赖**: Task 2 完成

---

## Wave 3 — 最终验证（主 agent 执行）

### Task 9: Lighthouse 审计
- **执行者**: 主 agent
- **目标**: 跑 Performance / SEO / Accessibility / Best Practices
- **Target**: Performance > 80, SEO > 90

### Task 10: P6 QA 最终验证 + 合并推送
- **执行者**: 主 agent
- **目标**:
  - `npm run build` 通过
  - 所有 JS 文件语法检查
  - 无 console.log 残留
  - 品牌色 #2E7D32 一致
  - WhatsApp 号码一致
  - 合并所有 Wave 1-2 分支到 dev
  - 推送 GitHub
  - 输出最终报告

---

## 分支规划

| Agent | 分支名 | 冲突风险 | Worktree |
|-------|--------|---------|----------|
| A | `dev-p5-cross-sell` | 无 | BrewYuKoLi-a |
| B | `dev-p5-whitepapers-cta` | 无 | BrewYuKoLi-b |
| C | `dev-p5-solutions-diff` | 无 | BrewYuKoLi-c |
| D | `dev-p5-spec-download` | 无 | BrewYuKoLi-d |
| E | `dev-p5-trust-scroll` | ⚠️ styles.css | BrewYuKoLi-e |
| F | `dev-p5-ga4` | ⚠️ site.config.js | BrewYuKoLi-f |

> Task E 改 styles.css，Task F 改 site.config.js + HTML → 无直接冲突
> 所有 task 改不同 JS 文件/目录 → 安全并行

## 定时汇报

- **10 分钟一次进度检查** (cron)
- **Wave 1 完成后立即合并** → 触发 Wave 2
- **全部完成后** → Lighthouse + QA → 最终报告
