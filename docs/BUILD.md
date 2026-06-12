# 构建与部署指南

## 日常开发

### 推荐开发命令

```bash
# 标准启动（自动运行 prestart: init-dev.js 初始化开发环境）
npm start
```

> **`npm start` 是日常开发的首选命令**，它会先执行 `scripts/init-dev.js`（检查产品数据表是否存在），再启动 webpack-dev-server。

**其他开发场景：**

```bash
# 产品数据有更新时（确认数据表为最新再启动）
npm run dev:webpack

# 跳过 prestart 直接启动 webpack（产品数据已是最新时）
npm run dev:fast

# 启动 Express 服务端（需要调试服务端逻辑时）
npm run dev
```

**开发服务器说明：**
- 地址：http://localhost:3000
- 支持 HMR（热模块替换），修改 CSS/JS 即时生效
- 语言文件：优先读 `dist/assets/lang/`，其次 `src/assets/lang/`
- 图片文件：优先读 `dist/images/`，其次 `src/assets/images/`
- webpack 入口：`src/index.js`（ESM，副作用导入 `src/assets/js/` 所有模块）
- 默认首页（`/`）：`dist/index.html` → 响应式入口，自动重定向到对应屏幕版本

**Express 静态服务（server.js）：**
```bash
# 本地直接访问（端口 3099，无 base path）
PORT=3099 node server.js
# http://localhost:3099/home/

# 带 base path（通过 Caddy 反代时用 BASE_PATH 指定）
PORT=3000 BASE_PATH=/brew node server.js
# 通过 Caddy 反代后访问：https://192.168.3.181:3443/home/
```

| 端口 | 用途 | 协议 | 访问地址 |
|------|------|------|------|
| 3000 | Webpack Dev Server (HMR) | HTTP | http://localhost:3000 |
| 3099 | Express 静态服务 (默认) | HTTP | http://localhost:3099 |
| 3000 | Express 静态服务 (Brew 专用) | HTTP | http://localhost:3000 |
| 3443 | Caddy HTTPS 反代 → 3000 | HTTPS | https://192.168.3.181:3443/home/ |

---

### 代码质量检查

提交前**必须**通过 lint，推送前**必须**通过 lint + test（详见 [RELEASE.md](./RELEASE.md)）。

```bash
# 同时检查 JS + CSS（日常使用这一条）
npm run lint:all

# 只检查 JS
npm run lint

# 只检查 CSS
npm run lint:css

# 自动修复可修复的问题
npm run lint:all:fix

# 运行单元测试
npm test

# 带覆盖率报告
npm run test:coverage
```

---

### 产品数据

产品数据表（`src/assets/js/product-data-table.js`）为手动维护。如需更新，编辑该文件即可。

> 详见 [PRODUCT_DATA.md](./PRODUCT_DATA.md)

---

## 打包构建

### 日常测试 vs 正式发布

| | 日常测试 | 正式发布 |
|---|---|---|
| **文件名** | `bundle.js` / `styles.css`（固定） | `bundle.[hash].js` / `styles.[hash].css` |
| **SW 缓存同步** | ✅ 文件名不变，不会错配 | ✅ hash 变化触发浏览器缓存更新 |
| **适用场景** | 本地功能验证、UI 调试 | 生产部署、release 发布 |

> **关键区别**：生产构建每次 hash 会变，`sw.js` 里的文件名也需要同步更新（由 `release.js` 自动完成）。
> 日常测试时如果用生产命令，每次打包会产生新 hash，`sw.js` 未同步更新会导致 Service Worker 仍然缓存旧文件，出现"代码改了但浏览器看不到"的问题。

---

### 推荐打包命令

**日常测试（代码改动，快速验证）：**

```bash
# 标准：重新生成语言包 + 无 hash 打包（推荐日常使用）
npm run build:dev

# 极速：跳过语言包生成，只重新打包 JS/CSS（翻译文件无变化时）
npm run build:dev:pack
```

输出到 `dist/`，文件名固定（`bundle.js` / `styles.css`），不带 hash，不触发 sw.js 缓存错配。

---

**日常迭代（代码改动，产品数据/图片无变化）：**

```bash
npm run build:pack
```

跳过图片下载，从图片压缩开始，最快完成打包。适合只改了前端代码的场景。

---

**发布前完整验证（推荐）：**

```bash
npm run build:production
```

完整流程：图片下载 → 图片压缩 → webpack 打包 → 产物验证。

---

### 所有构建命令一览

| 命令 | Hash | 图片下载 | 验证 | 适用场景 |
|------|:---:|:---:|:---:|------|
| `build:dev:pack` | ❌ | ❌ | ❌ | **日常测试，极速，仅重打包 JS/CSS** |
| `build:dev` | ❌ | ❌ | ❌ | ❌ | **日常测试，含语言包生成** |
| `build` / `build:fast` | ✅ | ✅ | ❌ | 仅代码改动，图片可能有更新 |
| `build:static` | ✅ | ✅ | ✅ | 同上，带产物验证 |
| `build:pack` | ✅ | ❌ | ✅ | 图片已是最新，纯代码打包（正式发布前最快） |
| `build:production` | ✅ | ✅ | ✅ | **正式发布前推荐** |

---

### 构建产物结构

```
dist/
├── index.html                       # 注入了 bundle/css 路径的 HTML
├── bundle.js                        # 日常测试产物（无 hash）
├── bundle.[contenthash:8].js        # 正式发布产物（带 hash）
├── styles.css                       # 日常测试产物（无 hash）
├── styles.[contenthash:8].css       # 正式发布产物（带 hash）
├── sw.js                            # Service Worker
├── factory-tour.mp4                 # 工厂视频（如存在）
├── images/
│   ├── esl_gb60_1.webp              # 产品图（WebP，snake_case 命名）
│   ├── hero_main.webp
│   └── ...                          # 全部 ~126 张图片
└── assets/
    └── lang/
        ├── languages.json           # 语言列表
        ├── zh-CN-ui.json            # 中文 UI 翻译
        ├── zh-CN-product.json       # 中文产品翻译
        ├── en-ui.json
        ├── en-product.json
        └── ...                      # 其余 23 种语言，每种 2 个文件
```

**重要：** 正式发布产物的 `contenthash` 保证每次代码变更后浏览器自动破除缓存，无需手动清缓存。日常测试产物文件名固定，不会触发 sw.js 版本错配。

---

### 构建常见问题

**Q：webpack 报找不到 `product-data-table.js`**

确认 `src/assets/js/product-data-table.js` 文件存在。

**Q：构建时图片压缩报错**

```bash
# 重建图片缓存
npm run init:cache:force
```

**Q：翻译文件 404 / 语言切换无效**

确认 `dist/assets/lang/` 下存在对应语言的 `-ui.json` 和 `-product.json` 文件：
```bash
ls dist/assets/lang/ | grep zh-CN
# 应输出：zh-CN-ui.json  zh-CN-product.json
```

如果不存在，手动执行翻译文件复制：
```bash
node scripts/copy-translations.js && node scripts/build-i18n.js
```

---

## 静态部署

### dist/ 目录说明

生产构建产物完全静态（无服务端逻辑），可直接托管到任何静态服务：
- Nginx
- CDN（Cloudflare Pages、Vercel、Netlify 等）
- 对象存储（OSS、S3 + CloudFront）

### Nginx 配置要点

```nginx
server {
    root /path/to/dist;
    index index.html;

    # 静态资源长缓存（带 contenthash 的文件永不过期）
    location ~* \.(js|css|webp|mp4)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 语言文件短缓存（内容可能更新）
    location /assets/lang/ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # SPA 路由支持（如有）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 验证静态构建

```bash
# 构建后验证产物完整性
node scripts/verify-static-build.js
```

验证内容：
- HTML 中 bundle/css 引用是否存在对应文件
- 所有语言文件是否齐全（ui + product）
- 图片目录是否非空

---

## Docker

### 构建与运行

```bash
# 构建镜像
npm run docker:build
# 等同于：docker build -t brand-project .

# 运行容器（端口 3000）
npm run docker:run
# 等同于：docker run -p 3000:3000 brand-project
```

### Dockerfile 说明

项目根目录的 `Dockerfile` 基于 Node.js 镜像，复制 `dist/` 产物并用 Express 服务端提供服务。

> **注意：** Docker 镜像打包的是当前 `dist/` 目录内容。确保在 `docker:build` 前已执行过构建命令。

推荐流程：
```bash
npm run build:production   # 先构建
npm run docker:build       # 再打镜像
npm run docker:run         # 本地验证
```

---

## 版本发布

发布使用专门的 `release.js` 脚本，自动化处理版本号递增、打包、推送全流程。

详见 [RELEASE.md](./RELEASE.md)。
