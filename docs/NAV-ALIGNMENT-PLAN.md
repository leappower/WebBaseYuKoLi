# BrewYuKoLi 导航对齐开发计划 v1.0

> 生成时间：2026-05-17 21:15 CST
> 方案来源：Gemini 3.1 Pro + Grok 4.2 + GPT 5.4 多模型共识
> 状态：✅ 多模型达成共识，待执行

---

## 一、最终方案（多模型共识）

### 1.1 统一 L1 导航（所有断点一致）

| # | ID | EN | ZH | 类型 | 子项数 |
|---|-----|----|-----|------|--------|
| 1 | `solutions` | Solutions | 解决方案 | Mega Dropdown | 5 |
| 2 | `products` | Products | 产品中心 | Mega Dropdown | 9 |
| 3 | `manufacturing` | Manufacturing | 制造实力 | 直接链接+锚点 | 4 |
| 4 | `compliance` | Compliance | 认证合规 | 直接链接+锚点 | 3 |
| 5 | `resources` | Resources | 资源中心 | Dropdown | 4 |
| 6 | `contact` | Contact Us | 联系我们 | 直接链接+锚点 | 4 |

**关键决策：**
- ❌ **删除 About L1** → 移入 Footer sitemap + Slide-menu 二级区域
- ❌ **删除 Home 导航项** → Logo 即是首页入口
- ✅ **保留 Resources** → B2B 信任构建必要（画册/案例/白皮书）
- ✅ **Solutions 为 L1** → B2B 买家最高意图入口

### 1.2 三屏导航分配

| 组件 | PC (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|------|-------------|-------------------|----------------|
| **navigator.js** | 6 L1 顶部导航+Dropdown | 6 L1 紧凑导航+Dropdown | ❌ 隐藏 |
| **slide-menu.js** | ❌ 隐藏 | ❌ 隐藏 | ✅ 6 L1 手风琴菜单 |
| **bottom-tab.js** | ❌ 隐藏 | ❌ 隐藏（或用5项） | ✅ 4项转换栏 |
| **footer.js** | ✅ 6栏站点地图 | ✅ 6栏站点地图 | ✅ 折叠站点地图 |

### 1.3 移动端底部栏设计（最高转化面）

**Mobile (<768px) — 4 项：**
```
[Menu]     [Solutions]     [INQUIRY]     [WhatsApp]
  ↕            ↕               ↕             ↕
自然区      自然区          自然区(居中)     伸展区
  ↓            ↓          绿色FAB凸起     #25D366
打开抽屉    →/solutions    →/contact/    wa.me/...
```

**Tablet (768-1023px) — 可选 5 项（如启用）：**
```
[Menu]  [Products]  [Manufacturing]  [INQUIRY]  [WhatsApp]
```

### 1.4 Slide-menu 结构

```
┌─────────────────────────────┐
│ [Logo]                [×]  │ ← 头部
├─────────────────────────────┤
│ Solutions                  │ ← L1 手风琴
│ └ OEM / ODM / OBM / R&D… │
│ Products                   │
│ └ Coffee / Tea / Meal…    │
│ Manufacturing              │
│ └ 四大基地 / 质控 / 智能工厂…│
│ Compliance                 │
│ └ 认证 / 清真 / COA       │
│ Resources                  │
│ └ 画册 / 白皮书 / 案例 / 视频 │
│ Contact Us                 │
│ └ 报价 / 样品 / 参观 / 网络 │
├─────────────────────────────┤
│ 关于 YuKoLi                │ ← 二级区域
│ 新闻 / 常见问题            │
├─────────────────────────────┤
│ ✉ 询盘  💬 WhatsApp       │ ← CTA 底部
├─────────────────────────────┤
│ 🌐 语言选择器               │
└─────────────────────────────┘
```

### 1.5 Footer 结构（3 屏）

**PC:**
```
┌─────────┬──────────┬──────────┬─────────┬─────────┬──────────┐
│SOLUTIONS│ PRODUCTS │MANUFACT. │COMPLIAN.│RESOURCES│ CONTACT  │
│ OEM     │ Coffee   │ 四大基地  │ 国际认证 │ 产品目录 │ 获取报价  │
│ ODM     │ Tea      │ 质控体系  │ 清真专线 │ 白皮书   │ 免费样品  │
│ OBM     │ Meal     │ 智能工厂 │ COA     │ 成功案例 │ 参观工厂  │
│ R&D     │ Beauty   │ 供应链   │         │ 视频中心 │ 销售网络  │
│ 包装    │ Weight   │          │         │         │          │
│         │ Gut      │          │         ├─────────┤ WhatsApp │
│         │ Lifestyle│          │         │ 关于YuKoLi│          │
│         │ Legacy   │          │         │ 新闻/FAQ│ 隐私条款  │
└─────────┴──────────┴──────────┴─────────┴─────────┴──────────┘
```

**Mobile: 折叠为手风琴或仅显示关键链接**

### 1.6 组件整合（3→1 底部栏）

| 操作 | 组件 | 说明 |
|------|------|------|
| ♻️ 重构 | `bottom-tab.js` | 改为 config 驱动，支持 mobile/tablet，统一图标系统 |
| 🗑️ 删除 | `footer.js` 中的底部导航逻辑 | 保留纯页脚功能 |
| 🗑️ 删除 | `nav-footer.js` | 完全移除 |
| ✅ 保留 | `navigator.js` | 清理 DEFAULT_NAV_ITEMS |
| ✅ 保留 | `slide-menu.js` | 清理 hardcoded fallback |

### 1.7 品牌色统一

- 所有 `#006064` fallback → `var(--color-primary)` → `#2E7D32`
- 单一 WhatsApp 号码：`8613924828214`

---

## 二、任务分解

### Phase 0: 准备工作（风险低，1 step）
- [ ] P0-1: GitHub 从 `dev` 创建 `feat/nav-alignment` 分支

### Phase 1: Config 标准化（风险低，1 step）
- [ ] P1-1: 更新 `site.config.js` 确认 nav.items + footer + contact + theme 完整

### Phase 2: 导航组件对齐（风险中，3 steps）
- [ ] P2-1: 重构 `navigator.js` — 删除 DEFAULT_NAV_ITEMS，纯 config 驱动
- [ ] P2-2: 重构 `slide-menu.js` — 删除 hardcoded fallback，纯 config 驱动
- [ ] P2-3: 新增 L2 导航 dropdown 模块（如果缺失：ApplicationsDropdown, SupportDropdown）

### Phase 3: 底部栏统一（风险高，3 steps）
- [ ] P3-1: 重构 `bottom-tab.js` — 从 config 读取，支持 mobile/tablet 切换
- [ ] P3-2: 删除 `footer.js` 中的底部导航逻辑
- [ ] P3-3: 删除 `nav-footer.js` + 清除 features.mobileFooterNav

### Phase 4: 全局清理（风险低，3 steps）
- [ ] P4-1: 品牌色审计（`#006064` → `#2E7D32`）
- [ ] P4-2: WhatsApp 号码统一（`8618565788184` → `8613924828214`）
- [ ] P4-3: i18n 补全（所有新 nav key 在 25 种语言中存在）

### Phase 5: L2 页面对齐（风险中，5 steps）
- [ ] P5-1: Solutions L2 页面统一布局（3 屏）
- [ ] P5-2: Manufacturing/Compliance 锚点页面统一
- [ ] P5-3: Resources L2 页面统一布局
- [ ] P5-4: CAT / Cross-Seller / Breadcrumb 对齐
- [ ] P5-5: 文案 + 图片统一

### Phase 6: QA + 合并（风险高，2 steps）
- [ ] P6-1: 三屏视觉 + 功能回归测试
- [ ] P6-2: 合并到 `dev` 分支

---

## 三、Schedule

| Phase | 预计耗时 | 依赖 | 子 agent |
|-------|---------|------|----------|
| P0 | 5min | 无 | agent-0 |
| P1 | 10min | P0 | agent-1 |
| P2 | 30min | P1 | agent-2 |
| P3 | 30min | P1 | agent-3 |
| P4 | 15min | P1 | agent-4 |
| P5 | 45min | P2 | agent-5 |
| P6 | 15min | 全部 | agent-6 |

---

## 四、Non-Negotiable Rules

1. **无组件可以本地定义自己的 nav items** — 全部从 `site.config.js` 读取
2. **无组件可以硬编码 WhatsApp 号码**
3. **无组件可以硬编码 CTA 语言文案**
4. **无组件可以硬编码品牌色（除 theme token 外）**
5. **只能有一个底部导航组件**
6. **About 是二级导航，不是 L1**
7. **Resources 必须保留在 L1**

---

## 五、Rollback 方案

- 每次改动前创建 `git stash`
- 每个 Phase 完成后运行 `npm run build && npm run test`
- 如 build 失败，`git checkout -- src/ && git checkout -- dist/site.config.js`
