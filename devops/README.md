# BrewYuKoLi 开发环境配置

本目录包含 BrewYuKoLi 项目的开发环境标准化配置，支持 Caddy + HTTPS + 热更新。

## 🚀 快速开始

### 开发环境

```bash
# 克隆项目
cd /Users/chee/Projects/BrewYuKoLi

# 启动开发服务器
cd devops
docker-compose up --build brew-dev

# 或直接使用 Caddy
caddy run --config Caddyfile
```

### 生产环境

```bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml up --build

# 或使用预构建的 Docker 镜像
docker run -d -p 8080:8080 yukoli-tech:latest
```

## 📋 环境配置

### 开发服务器
- **HTTP**: http://localhost:3099
- **HTTPS**: https://localhost:3443
- **健康检查**: http://localhost:3099/health

### 端口配置
- `3099`: 开发服务器 HTTP 端口
- `3443`: 开发服务器 HTTPS 端口
- `8080`: 生产服务器端口

## 🔧 配置文件

### Caddyfile
- 自动 HTTPS 支持 (自签名证书)
- 开发环境热更新
- 静态资源缓存策略

### docker-compose.yml
- 开发环境: brew-dev + Caddy 代理
- 生产环境: nginx + 优化的静态文件服务

### Nginx 配置
- Gzip 压缩
- 静态资源缓存
- 安全头部配置
- 健康检查端点

## 🔍 Agent 代码修改约束

### ✅ 允许修改的文件
- `src/assets/js/` - JavaScript 模块
- `src/pages/` - HTML 模板
- `src/assets/css/` - 样式文件
- `src/assets/lang/` - 翻译文件
- `site.config.js` - 配置文件
- `docs/` - 文档文件

### ❌ 禁止修改的文件
- `dist/` - 构建产物 (由脚本自动生成)
- `node_modules/` - 依赖包
- `webpack.config.js` - 构建配置
- `babel.config.js` - 转译配置
- `Dockerfile` - 镜像构建配置
- `package.json` - 项目配置

### 🛠️ Agent 操作规范

1. **代码修改范围**: 仅限于源代码目录
2. **构建**: 使用 `npm run build` 脚本
3. **提交**: 遵循 `type(scope): description` 格式
4. **测试**: 运行 `npm test` 验证
5. **安全**: 通过 `npm run lint` 检查

## 🔐 HTTPS 配置

### 开发环境
- 自动生成自签名证书
- 支持 HTTP/2
- 开发头部优化

### 生产环境
- Let's Encrypt 证书
- HSTS 头部
- 严格安全策略

## 🔄 热更新支持

### 文件监控
- `fswatch` 监控 `src/` 目录变化
- 自动触发重新构建
- 实时刷新浏览器

### 开发服务器
- Express 开发模式
- 热重载支持
- 错误友好提示

## 📊 监控日志

### 日志位置
- 开发服务器: `./devops/logs/server.log`
- 文件监控: `./devops/logs/watch.log`
- Caddy 日志: `/var/log/caddy/brew-dev.log`

### 健康检查
```bash
curl http://localhost:3099/health
```

## 🔧 环境变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `NODE_ENV` | `development` | 环境模式 |
| `PORT` | `3099` | HTTP 端口 |
| `SSL_PORT` | `3443` | HTTPS 端口 |
| `ENABLE_SSL` | `true` | 启用 HTTPS |
| `API_SERVER` | `https://127.0.0.1:8000` | API 服务器地址 |

## 🚨 故障排除

### 常见问题
1. **端口占用**: 使用 `lsof -ti:3099 | xargs kill -9` 清理
2. **证书问题**: 删除 `~/.local/share/caddy` 重新生成
3. **权限问题**: 确保脚本有执行权限

### 重启服务
```bash
# 停止所有服务
docker-compose down

# 重新启动
docker-compose up --build
```

## 📚 相关文档

- [DEV-STANDARDS.md](../docs/DEV-STANDARDS.md) - 开发规范
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - 系统架构
- [I18N.md](../docs/I18N.md) - 多语言系统