# BrewYuKoLi 全站页面审计结论

> 审计时间：2026-05-17 21:40 CST
> 模型评估：Gemini 3.1 Pro + Grok 4.2 双模型共识
> 项目：PHASE 5 — L2 页面内容和 UI 对齐

---

## 总体评估

| 维度 | 评级 | 说明 |
|------|------|------|
| 布局结构 | ✅ Good | 模板一致性良好，anchor IDs 齐全 |
| 内容深度 | ⚠️ Needs Work | Solutions 差异化弱，Resources 可能有 placeholder |
| UI 组件 | ⚠️ Needs Work | Cross-Seller 数据源未对齐，breadcrumb 存在但需确认 |
| CTA 对齐 | ⚠️ Needs Work | 按钮文案不统一，缺少 spec download 入口 |
| 响应式 | ✅ Good | 三屏结构完整 |
| 多语言 | ✅ Good | P4 已补全 i18n keys |

---

## 各页面家族审计结论

### 1. Solutions (OEM/ODM/OBM/R&D/Packaging)
**优先级：P1**

| 问题 | 严重度 | 修复建议 |
|------|--------|---------|
| OEM/ODM/OBM 文案差异化不足 | ⚠️ | 添加"How we differ"对比表（IP归属/MOQ/配方控制权） |
| Hero banner 高度 520px 偏大 | ⚠️ | 压缩到 420px 使 CTA 以上可见 |
| Cross-Seller 显示无关产品（如在 OEM 页显示美容产品） | ❌ | `cross-sell.js` 应按页面类型过滤数据源 |
| 主 CTA 文案"Contact Us" 应改为"Request Quote" | ⚠️ | 统一到 `site.config.js` 中配置 |
| WhatsApp 深链接在 tablet/mobile 缺失 | ❌ | 补充 tablet/mobile 的 WhatsApp 链接 |
| 缺少"Process Timeline"可视化和"Request Factory Tour" CTA | ⚠️ | Solutions L2 需要增加制造能力可视化元素 |

### 2. Products (All / Coffee / Tea / Meal / Beauty / Weight / Gut / Lifestyle / Legacy)
**优先级：P0**

| 问题 | 严重度 | 修复建议 |
|------|--------|---------|
| 产品页偏 B2C 风格（只强调口味） | ⚠️ | 增加 White Label / Private Label 机会描述 |
| Cross-Seller 显示"相似产品"而非"互补服务" | ❌ | Coffee 页应推荐 Custom Packaging + Halal Certification |
| 缺少"Download Specification Sheet"按钮 | ❌ | `product-detail` 模板增加规格表下载按钮 |
| 缺少 COA/Certificate of Analysis 链接 | ⚠️ | 增加 COA 下载或在线查看入口 |

### 3. Manufacturing / Compliance（锚点页面）
**优先级：P1**

| 问题 | 严重度 | 修复建议 |
|------|--------|---------|
| 锚点结构正确 (#bases/#quality/#smart/#supplychain/#certs/#halal/#coa) | ✅ | 无需修改 |
| Trust signals 只在 `/compliance/` 页面内 | ⚠️ | 认证徽章应全局 visible（footer 或 trust bar） |
| tablet/mobile 锚点跳转可能被 header 遮挡 | ⚠️ | 添加 scroll-margin-top 或 offset fix |
| "Request Sample"CTA 在 #quality 和 #certs 区域不突出 | ⚠️ | 在信任信号附近增加 CTA |

### 4. Resources (Catalog / Videos / Whitepapers)
**优先级：P2**

| 问题 | 严重度 | 修复建议 |
|------|--------|---------|
| Whitepapers 可能只有 3 个占位 title | ❌ | 替换为真实 PDF 名称，确认文件存在 |
| 无 lead-gen 表单拦截 → 泄露线索 | ❌ | PDF 下载前增加 Name+Company+Email 表单 |
| Video Library 缺少时长/语言标签/观看数 | ⚠️ | 增加 meta 数据展示 |
| Catalog PDF 路径需确认 | ⚠️ | `site.config.js` 检查 catalog_url 指向 |

### 5. Contact
**优先级：P0**

| 问题 | 严重度 | 修复建议 |
|------|--------|---------|
| 表单结构正确（Quote/Samples/Visit/Network） | ✅ | 无需修改 |
| WhatsApp/samples/visit CTA 可见性需确认 | ✅ | P4 已统一号码 |

---

## 实施优先级

| 优先级 | 问题 | 涉及文件 | 预计耗时 |
|--------|------|---------|---------|
| **P0-1** | Cross-Seller 数据源对齐 | `cross-sell.js`, `site.config.js` | 30min |
| **P0-2** | Whitepapers 表单拦截 | `/resources/whitepapers/*.html` | 20min |
| **P0-3** | Solutions CTA 文案统一 | `site.config.js`, Solutions L2 模板 | 15min |
| **P1-1** | OEM/ODM/OBM 差异化文案 | `/solutions/oem/odm/obm/*.html` | 45min |
| **P1-2** | Product spec download 按钮 | `product-detail.js/html` | 20min |
| **P1-3** | 认证徽章全局化 | `footer.js`, `trust-bar.js` | 15min |
| **P2-1** | Video Library meta | `/resources/videos/*.html` | 10min |
| **P2-2** | Hero 高度压缩 | Solutions L2 CSS | 10min |

---

## 共识结论

Gemini + Grok 在以下 4 点达成一致：

1. ✅ **Cross-Seller 不可用** → 需要按页面类型过滤数据（P0）
2. ✅ **Resources 页缺少 form gate** → 线索流失（P0）
3. ✅ **OEM/ODM/OBM 差异化不足** → 影响 B2B 买家判断（P1）
4. ✅ **CTA 文案不统一** → Contact Us vs Request Quote（P1）
