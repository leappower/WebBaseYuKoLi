# ENV-SETUP.md — 环境搭建指南 (BRAND_PROJECT)

> **最后更新**：2026-05-23
> **分支**：feat/swup-replace-spa-v2 → dev

---

## 1. 前置要求

| 工具 | 版本要求 | 用途 |
|------|---------|------|
| Node.js | >= 18.x | 运行 server.js、构建脚本 |
| npm | >= 9.x | 包管理 |
| git | >= 2.30 | 版本控制 |
| Playwright (可选) | latest | E2E 测试 |

```bash
node --version   # >= v18.0.0
npm --version    # >= 9.0.0
```

---

## 2. 初次克隆

```bash
git clone git@github.com:leappower/BRAND_PROJECT.git
cd BRAND_PROJECT

# 切换到 dev 分支
git checkout dev
git pull origin dev

# 安装依赖 + git hooks
npm install

# 构建
npm run build
# → Build complete: 849 files in dist/

# 启动开发服务器
npm run dev
# → http://localhost:3099
```

---

## 3. 日常开发

```bash
npm run dev              # 开发服务器 (端口 3099)
npm run watch            # 文件变更自动构建
npm run build            # 手动构建
npm run build:production # 生产构建 (含 webpack)

npm run test:e2e         # Playwright E2E
npm run lint:all         # 全部代码检查
```

### 修改页面

```bash
vim src/pages/home/index-pc.html
vim src/pages/home/index-mobile.html
vim src/pages/home/index-tablet.html
npm run build
# 刷新 http://localhost:3099/home/
```

### 修改 JS

```bash
vim src/assets/js/product-grid.js
npm run build
```

### 修改 SWUP 路由

```bash
vim src/assets/js/swup-init.js    # SWUP 初始化和路由映射
npm run build
npm run test:e2e                  # 验证 SPA 导航
```

---

## 4. 常见问题

### Q: 端口 3099 被占用

```bash
lsof -i :3099          # 找到进程
kill -9 <PID>
npm run dev
```

### Q: 构建后浏览器看不到改动

```bash
ls -la dist/pages/home/index-pc.html | grep "$(date +%Y)"
# 硬刷新: Cmd+Shift+R
```

### Q: SWUP 导航不工作

```bash
# 检查: 浏览器 Console
console.log(window.Swup);  // 应为 object
console.log(window.SpaRouter);  // 应有 navigate/replace 方法

# 检查: DevTools Network
# 确认 swup.umd.js 在 swup-init.js 之前加载
```

### Q: 骨架屏一直不消失

```bash
# 检查 skeleton.css 是否为 opacity transition 方案
# DevTools → Elements → #skeleton-overlay[hidden] → opacity:0

# 手动强制隐藏
document.getElementById('skeleton-overlay').setAttribute('hidden', '');
```

---

## 5. 目录速查

| 要改什么 | 改哪里 |
|---------|-------|
| 页面内容 | `src/pages/<页面名>/index-{pc,mobile,tablet}.html` |
| 全局配置 | `src/assets/js/site.config.js` |
| 导航菜单 | `src/assets/js/ui/navigator.js` |
| SWUP 路由 | `src/assets/js/swup-init.js` |
| 样式 | `src/assets/css/styles.css` |
| 骨架屏 | `src/assets/css/skeleton.css` |
| 国际化 | `src/assets/lang/<语言>.json` |
| E2E 测试 | `tests/e2e/*.spec.js` |

```text
src/pages/           ← 88 个 SSG 页面
src/assets/js/       ← JS 源文件
src/assets/css/      ← CSS 源文件
src/assets/js/vendor/ ← SWUP + plugins
dist/                ← 构建产物（不要手动编辑）
docs/                ← 项目文档
tests/e2e/           ← E2E 测试
scripts/             ← 构建/检查脚本
```
