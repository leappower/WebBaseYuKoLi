方案初稿后必须检查（新增自检项用 🆕 标记）：

- [ ] spa-router fetch 路径在 dist/ 下是否真实存在
- [ ] 是否在所有 HTML 中注入了 `window.BASE_PATH`
- [ ] fetch 调用是否在 `file://` 下有 CORS 保护
- [ ] 🆕 三种静态部署场景是否都验证过
- [ ] 🆕 i18n JSON fetch 失败时是否有展示 fallback
- [ ] 🆕 CDN 缓存策略是否考虑过（cache-control, ETag, 文件名 hash）
- [ ] 🆕 image-manifest.json 等硬编码路径是否支持子路径
- [ ] 🆕 `loadPageScripts()` 中所有硬编码 `/assets/js/` 路径已 BASE_PATH 化
- [ ] 🆕 `_initCategorySlugs()` 动态路由也需处理（不仅是硬编码 routes 表）
- [ ] 🆕 server.js 中无反向依赖 `/pages/` 前缀的逻辑

---

## 🔬 多模型交叉评审摘要（v2.2 — 静态部署补充）

| 模型 | 发现问题 | 采纳 | 处理 |
|------|---------|------|------|
| **deepseek-v4-pro** | **19 条**，其中 8 严重 | ✅ 6 采纳、2 解释 | 详见 §9.9 |
| **Qwen3-Coder-30B** | **15 条**，其中 7 严重 | ✅ 6 采纳、1 解释 | 详见 §9.9 |
| **GLM-5.1** | **14 条**，其中 6 严重 | ✅ 5 采纳、1 解释 | 详见 §9.9 |

### 9.9 评审反馈处理记录

#### 采纳的修正

| 来源 | 问题 | 修正 |
|------|------|------|
| All three | `loadPageScripts()` 中硬编码 `/assets/js/...` 路径在子路径部署下 404 | **新增 T0.6 (0.5d)**: spa-router 动态脚本路径 BASE_PATH 化 |
| DeepSeek + Qwen | T0.4 spa-router 路径修正 1d 不够（23 条路由 + 6+ 动态路由 + convention fallback + 测试），应 2-2.5d | **T0.4 工时: 1d → 2d**；公约 fallback（第 564 行）也需修正 |
| GLM + DeepSeek | `_initCategorySlugs` 动态注册的 6+ redirect 路由也含 `/pages/` 前缀 | **T0.4 覆盖范围扩展**：包括动态注册路由 |
| Qwen + DeepSeek | `file://` 降级方案仅"显示提示"不够 → 需提供可执行指导 + 避免异步闪变 | **T0.5 扩展**: file:// 检测后注入降级 banner + 翻译同步 fallback 而非异步回退 |
| Qwen | T3.1 `[BASE_PATH]` 占位符号非 webpack 原生语法，应为 `__webpack_public_path__` | **T3.1 修正**: 改为 `process.env.BASE_PATH ? '/' + process.env.BASE_PATH : '/'` 构建时注入或 `__webpack_public_path__` 运行时注入 |
| GLM + DeepSeek | BASE_PATH HTML 路径（构建时替换）与 JS 路径（运行时读取）存在双源不一致风险 | **T0.5 机制统一**: 构建时在 HTML 中注入 `<script>window.BASE_PATH` 和 patchHtmlPaths 双保险，构建脚本校验两路径一致 |
| All three | T5d 静态部署 E2E 1d 不够（三种场景 + Playwright 编写 + CI 集成 → 2-3d） | **T5d 工时: 1d → 2d**，仅包含 Playwright 脚本编写 + npx serve 场景验证；子路径和 file:// 场景延至阶段验收人工验证 |
| All three | 翻译 JSON 内联 171KB 严重影响 bundle 大小，应只内联常用键 | **T1.5 明确**: 内联 60 个高频 UI 键（导航/页脚/按钮/错误信息）≈ 6-8KB gzip，非全量 |
| GLM | 子路径部署下 hreflang alternate link 需要修正 | **T0.5 扩展**: `patchHtmlPaths()` 增加 href alternate 路径替换 |
| GLM | site.config.js 中的 logo 路径是硬编码根路径 | **T2.4 扩展**: site.config.js 的 logo/assets 路径改为 BASE_PATH 感知 |
| DeepSeek | Service Worker 在静态部署下策略未定义 | **T0.1 扩展**: 静态部署下 SW 注册策略（预缓存 vs 不注册）明确 |
| DeepSeek | `patchHtmlPaths()` 未覆盖 `/sw.js`、内部链接 `href="/"` | **T0.5 扩展**: patchHtmlPaths 覆盖 sw.js 注册路径 + 静态 HTML 内部链接 |

#### 不采纳/解释

| 来源 | 问题 | 不采纳原因 |
|------|------|------------|
| DeepSeek | production server 下 spa-router 的 `/pages/` fetch 也是 404 | ❌ 测试验证: server.js 的 `resolvePage()` 使用文件系统查找，`dist/` 中文件确实在 `/home/index-pc.html` 下，但 server.js 有 SPA fallback (`dist/index.html`)，生产环境实际上由 SSG 直链首次加载 + SPA 后续 fetch 的正确路径是 server.js 自行处理 — **实际在生产环境中 server.js 是多余的**，静态部署才是目标 |
| Qwen | CDN 场景需要 Cloudflare Pages / S3 配套 _headers 配置 | ❌ 超范围: 等实际部署时由 devops 配合配置，非前端方案需要定义的内容 |
| GLM | 阿里云 OSS 404 规则兼容性 | ❌ 超范围: 项目已知部署目标是 GitHub Pages + Cloudflare Pages，不在阿里云 |
| Qwen | 翻译 JSON cache 策略需要 CDN cache-control 头配置 | ❌ 见上（CDN 配置超出前端方案范围） |
| DeepSeek | production server 其实不可用（引入混淆） | ❌ 项目已明确走纯静态 SSG 部署，不考虑 server.js 场景 |

### 9.10 v2.2 终版工时变更

| 阶段 | v2.1 | v2.2 调整后 | 说明 |
|------|------|-------------|------|
| 零 | 2d | **4d** (+2d) | T0.4 1→2d，新增 T0.6 0.5d，T0.1/0.5 扩展 |
| 一 | 2.25d | **3d** (+0.75d) | T1.5 明确内联量，T1.4 策略调整 |
| 二 | 3d | **3.25d** (+0.25d) | T2.4 扩展 site.config.js 路径 |
| 三 | 8d | **8.5d** (+0.5d) | T3.1 publicPath 修正 |
| 四 | 1.5d | **1.5d** (不变) | — |
| 五 | 3.5d | **4.5d** (+1d) | T5d 1→2d |
| **总计** | **~22d** | **~27d** (+5d) | 评审反馈修正后工时重估 |

> **注**：+5d 是对 3.5d 原始估算的修正（根据 3 模型一致意见，多个子任务工时被低估）。

### 9.11 简化版 v2.2s (~14d) — 仅静态部署 P0 修复

如果 27d 太激进，可精简为仅修复 P0 静态部署阻塞问题：

| 子任务 | 工时 | 说明 |
|--------|------|------|
| T0.4 spa-router 路径修正（含 convention fallback + slugs）| 2d | 🚨 P0 |
| T0.5 BASE_PATH 注入（含 file:// 降级）| 0.5d | 🚨 P0 |
| T0.6 spa-router 动态脚本路径 BASE_PATH 化 | 0.5d | 🚨 P0 |
| T1.5 翻译 JSON fetch fallback | 0.5d | 🚨 P0 |
| 验证: 三种静态部署场景 | 0.5d | |
| **总计** | **~4d** | 纯静态阻塞修复 |

> 原方案 22d 的时序修复/ESM 迁移等按原计划执行，不受影响。
