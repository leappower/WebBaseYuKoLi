# 快速开始

> 新开发者 5 分钟上手 BrewYuKoLi 项目。

## 环境准备

```bash
# 要求：Node.js ≥ 16, npm ≥ 8
git clone <repo-url> && cd BrewYuKoLi
npm install
```

## 启动开发

```bash
npm start        # webpack dev server → http://localhost:3000
```

打开浏览器访问 `http://localhost:3000`，修改代码后页面自动刷新。

## 项目结构速览

```
BrewYuKoLi/
├── src/
│   ├── pages/           # 页面 HTML（按 section / device 组织）
│   ├── assets/
│   │   ├── js/          # JS 模块（IIFE，window.xxx）
│   │   ├── css/         # 样式（CSS 变量 + Tailwind CDN）
│   │   └── lang/        # 翻译 JSON（25 种语言）
│   └── index.html
├── site.config.js       # 唯一配置入口 — 品牌/SEO/导航/联系方式/功能开关
├── build.sh / webpack.config.js
└── dist/                # 构建产物（部署用）
```

## 构建与部署

```bash
npm run build    # → dist/
```

`dist/` 目录是纯静态文件，可直接部署到 Nginx、Vercel、Netlify 等任何静态托管服务。

## 关键文件说明

| 文件 | 说明 |
|------|------|
| `site.config.js` | 品牌、SEO、导航菜单、联系方式、功能开关 — 改配置即可影响全站 |
| `src/assets/js/product-data-table.js` | 产品数据（手动维护） |
| `src/assets/lang/*.json` | 翻译文件（手动维护，支持 25 种语言） |

## 开发规范速查

- **ES5 兼容**：`var`、`function`，禁止箭头函数 / 模板字符串 / `let` / `const`
- **IIFE 模式**：每个 JS 文件 `(function() { 'use strict'; ... })();`
- **三屏必验**：修改后必须检查 PC（≥1024px）、Tablet（768-1023px）、Mobile（<768px）
- **找根因**：禁止打补丁式修复，定位根本原因再改
- **Commit 格式**：`type(scope): description`（如 `feat(product): add filter UI`）
- 完整规范见 [DEV-STANDARDS.md](./DEV-STANDARDS.md)

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动开发服务器（localhost:3000） |
| `npm run build` | 生产构建 → dist/ |
| `npm run lint:all` | 全量代码检查 |
| `npm test` | 运行单元测试 |
| `npm run test:e2e` | 运行端到端测试 |

## 技术栈一览

- 纯静态多页面 HTML + IIFE JS（ES5）+ CSS 变量
- Tailwind CSS（CDN 引入）
- Webpack 构建
- 25 种语言 i18n 支持

---

有问题？查阅 [DEV-STANDARDS.md](./DEV-STANDARDS.md) 或联系项目维护者。
