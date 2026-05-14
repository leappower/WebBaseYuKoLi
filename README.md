# BrewYuKoLi — B 端官网脚手架

> 基于 `site.config.js` 配置驱动的多语言响应式 B 端官网框架。换一套配置，即可生成全新站点。

**当前实例：** BrewYuKoLi — YuKoLi 品牌商用 brewing/beverage 设备官网

## 快速开始

```bash
git clone https://github.com/leappower/BrewYuKoLi.git
cd BrewYuKoLi
npm install && npm run dev
```

编辑 `site.config.js`，刷新即生效。无需框架，无需编译前端。

## 核心特性

- **配置驱动** — `site.config.js` 一个文件控制全站（品牌信息、导航、产品、SEO、社交链接等）
- **纯静态多页面** — HTML + IIFE JS（ES5）+ CSS 变量 + Tailwind CDN，零构建前端依赖
- **25 种语言** — 内置翻译系统，按需异步加载，优雅降级
- **三屏适配** — PC / Tablet / Mobile 响应式布局
- **RTL 支持** — 阿拉伯语、希伯来语自动切换布局方向
- **构建工具链** — `build.sh`（主构建）、webpack（辅助打包）、`build-ssg.js`（静态生成）
- **Node.js ≥ 16，npm ≥ 8**

## 目录结构

```
BrewYuKoLi/
├── site.config.js          # 🎯 全站配置（改这个）
├── build.sh                # 主构建脚本
├── build-ssg.js            # 静态站点生成
├── webpack.config.js       # 辅助打包
├── index.html              # 入口页面
├── assets/                 # 静态资源
│   ├── js/                 # 业务脚本（IIFE）
│   ├── css/                # 样式文件
│   └── images/             # 图片资源
├── data/                   # 产品与内容数据
└── docs/                   # 开发文档
```

## 文档

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系统架构 |
| [BUILD.md](docs/BUILD.md) | 构建与部署 |
| [DEV-STANDARDS.md](docs/DEV-STANDARDS.md) | 开发规范（10 章节） |
| [I18N.md](docs/I18N.md) | 多语言系统 |
| [PRODUCT_DATA.md](docs/PRODUCT_DATA.md) | 产品数据结构 |
| [IMAGES.md](docs/IMAGES.md) | 图片管理规范 |
| [RELEASE.md](docs/RELEASE.md) | 发布流程 |
| [SECURITY.md](docs/SECURITY.md) | 安全策略 |
| [SITE-CONFIG.md](docs/SITE-CONFIG.md) | 配置说明 |

## 许可证

MIT © [YuKoLi Technology](https://www.yukoli.com)
