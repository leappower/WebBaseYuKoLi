# site.config.js 配置指南

## 概述

`site.config.js` 是 BRAND_PROJECT 项目的**唯一站点配置入口**。所有品牌、SEO、导航、联系渠道、多语言、主题、功能开关等配置集中在此文件。

## 加载方式

1. **SSG 构建页面**：`build-ssg.js` 自动在 `<head>` 中注入 `<script src="/site.config.js">`
2. **SPA 入口**：`src/index.html` 在最早期加载
3. **运行时访问**：`window.SITE_CONFIG` 或 `window._cfg`

所有 JS 模块通过以下模式读取配置：

```javascript
var _cfg = window.SITE_CONFIG || window._cfg || {};
var _brand = _cfg.brand || {};
var _primary = ((_cfg.theme || {}).colors || {}).primary || "#2E7D32";
```

## 配置结构

| 字段 | 说明 | 典型修改场景 |
|------|------|-------------|
| `brand` | 品牌名、slogan、logo、域名 | 更换品牌 |
| `seo` | meta title/description/og | SEO 优化 |
| `contacts` | WhatsApp/邮箱/地址/社交 | 更换联系方式 |
| `nav` | 顶部导航菜单 + CTA | 增减页面 |
| `footer` | 底部导航栏 | 调整底部入口 |
| `categories` | 产品/场景/支持分类体系 | 增减分类 |
| `routes` | 路由映射 | 更改 URL |
| `roi` | ROI 计算器数据 | 新增国家/调整系数 |
| `cases` | 客户案例数据 | 新增案例 |
| `crossSell` | 搭配推荐数据 | 调整推荐逻辑 |
| `images` | 图片路径 | 更换图片 |
| `i18n` | 多语言配置 | 增减语言 |
| `theme` | 设计令牌 | 更换品牌色/字体 |
| `features` | 功能开关 | 启用/关闭功能 |

## 搭建新站

1. 复制整个项目
2. 修改 `site.config.js` 中的 `brand`、`seo`、`contacts`
3. 调整 `theme.colors.primary` 为新品牌色
4. 更新 `nav` / `footer` / `categories` 菜单
5. 替换图片资源

## 字段依赖追踪

**⚠️ 修改 config 任何字段前，务必检查哪些 JS 模块引用了它。**

### Config → JS 反向依赖表

| Config 字段 | 引用的 JS 模块 | 修改影响 |
|-------------|---------------|----------|
| `brand` | `site.config.js` 自身、`page-init.js`、`init.js` | 品牌名/域名变更 |
| `seo` | `page-init.js`、所有 HTML 模板 | 搜索引擎展示 |
| `contacts` | `translations.js`、`floating-actions.js`、所有 HTML（WhatsApp/邮箱） | 联系方式失效 |
| `nav` | `navigator.js`、`slide-menu.js`、`mega-menu.js`、`footer.js`、`nav-footer.js` | 导航死链接、dropdown 不显示 |
| `footer` | `footer.js`、`nav-footer.js` | 底部入口失效 |
| `categories` | **`product-grid.js`**（最脆弱）、`case-grid.js`、`breadcrumb.js` | 产品列表白屏 _cfgCats 崩溃 |
| `routes` | `spa-router.js`、`breadcrumb.js` | 路由 404 |
| `i18n` | `lang-registry.js`、`translations.js`、`breadcrumb.js` | 语言选择器 |
| `theme` | `page-init.js`（CSS 变量）、`init.js` | 品牌色错误 |
| `features` | 各功能模块 | 功能启用/关闭 |

### 修改 config 的前置检查

1. **搜索所有引用**：`grep -rn '"categories"\|cfg\.categories' src/assets/js/*.js`
2. **检查 schema 兼容性**：字段名、结构、类型能否被现有 consumer 处理
3. **重建触发模块**：改了 categories → 必须重启 product-grid 页面
4. **nav href 存在性验证**：`scripts/validate-config.js`（待建）

## nav 配置校验规则

Nav 的 `children` 数组的每个 `href` 必须对应一个真实存在的页面：

```javascript
// ✅ 正确：children 指向存在页面
children: [
  { id: "coffee", label: {...}, href: "/products/coffee/" }
]

// ❌ 错误：children 指向不存在的页面 → 渲染为 dropdown 但点击无反应
children: [
  { id: "spare-parts", label: {...}, href: "/support/spare-parts/" }  // 该页面不存在
]
```

**校验方法**：
```bash
# 检查 nav 中所有 href 对应的页面是否存在
for href in $(grep -o '"href": *"[^"]*"' site.config.js | grep -o '"[^"]*"$'); do
  path=$(echo $href | tr -d '"')
  # 检查 src/pages 下是否存在
  if ! ls src/pages${path}index*.html 2>/dev/null | head -1 > /dev/null; then
    echo "MISSING: $path"
  fi
done
```

## 注意事項

- 修改 `site.config.js` 后需要重新构建（`npm run build`）
- 所有模块都有 fallback 默认值，`site.config.js` 未加载时仍可正常运行
- 默认品牌色已改为 `#2E7D32`（森林绿），`#2E7D32` 为旧项目遗留，不再使用
