# site.config.js 配置指南

## 概述

`site.config.js` 是 KitchenYuKoLi / BrewYuKoLi 项目的**唯一站点配置入口**。所有品牌、SEO、导航、联系渠道、ROI 数据、多语言、主题等配置集中在此文件。

## 加载方式

1. **SSG 构建页面**：`build-ssg.js` 自动在 `<head>` 中注入 `<script src="/site.config.js">`
2. **SPA 入口**：`src/index.html` 在最早期加载
3. **运行时访问**：`window.SITE_CONFIG` 或 `window._cfg`

所有 JS 模块通过以下模式读取配置：

```javascript
var _cfg = window.SITE_CONFIG || window._cfg || {};
var _brand = _cfg.brand || {};
var _primary = ((_cfg.theme || {}).colors || {}).primary || "#ec5b13";
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

## 功能开关

```javascript
features: {
  iotPulse: false,       // IoT 设备脉冲动画
  geoHero: false,        // 地理定位 Hero
  smartPopup: true,      // 智能弹窗
  profitCalculator: true, // ROI 计算器
  productCompare: true,  // 产品对比
  cases: true,           // 客户案例
  crossSell: true,       // 搭配推荐
  screenshot: true,      // 截图功能
  pdfExport: true,       // PDF 导出
  serviceMap: true,      // 服务地图
},
```

## 注意事项

- 修改 `site.config.js` 后需要重新构建（`npm run build`）
- `roi.salaries` 支持的货币已扩展到 25 国
- 所有模块都有 fallback 默认值，`site.config.js` 未加载时仍可正常运行
