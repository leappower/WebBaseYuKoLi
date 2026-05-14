# BrewYuKoLi Agent 操作约束规范

## 🎯 Agent 操作范围定义

### ✅ 允许操作的文件和目录

**源代码目录 (可修改):**
- `src/assets/js/` - JavaScript 业务逻辑模块
- `src/pages/` - HTML 模板文件
- `src/assets/css/` - 样式文件
- `src/assets/lang/` - 多语言翻译文件
- `site.config.js` - 全局配置文件
- `docs/` - 项目文档

**脚本和工具 (可修改):**
- `scripts/` - 构建和部署脚本
- `devops/` - 开发环境配置
- `package.json` - 项目依赖和脚本配置

### ❌ 禁止操作的文件和目录

**构建产物 (禁止修改):**
- `dist/` - 构建生成的文件
- `build/` - 构建中间文件

**依赖和环境 (禁止修改):**
- `node_modules/` - 第三方依赖包
- `.env` - 环境变量文件
- `webpack.config.js` - Webpack 构建配置
- `babel.config.js` - Babel 转译配置

**系统配置 (禁止修改):**
- `Dockerfile` - Docker 镜像构建配置
- `docker-compose.yml` - Docker 服务编排
- `.git/` - Git 版本控制
- `.github/` - GitHub Actions 配置

**生产环境文件 (禁止修改):**
- 服务器配置文件
- 数据库文件
- 日志文件

## 🔧 Agent 修改操作规范

### 1. 代码修改约束

**JavaScript 模块修改:**
- 只能修改 `src/assets/js/` 下的文件
- 必须保持 ES5 兼容性
- 遵循 IIFE 模式
- 使用 `var` 声明变量
- 遵循项目编码规范

**HTML 模板修改:**
- 只能修改 `src/pages/` 下的文件
- 保持响应式结构完整性
- 使用 `site.config.js` 配置
- 避免 innerXSS 安全风险

**样式文件修改:**
- 只能修改 `src/assets/css/` 下的文件
- 使用 CSS 变量管理品牌色
- 保持 Tailwind 一致性

### 2. 构建和部署操作

**允许的构建操作:**
```bash
# 构建项目
npm run build
npm run build:dev
npm run build:production

# CSS 构建
npm run build:css

# 文件监控
npm run watch
```

**禁止的操作:**
```bash
# 禁止直接修改构建产物
echo "test" >> dist/index.html

# 禁止修改依赖包
cd node_modules && npm install something

# 禁止修改构建配置
# webpack.config.js 不可修改
```

### 3. 测试和验证

**必须执行的检查:**
```bash
# 语法检查
node -c src/assets/js/*.js

# Lint 检查
npm run lint

# 构建验证
npm run build

# 健康检查
curl http://localhost:3099/health
```

**安全检查:**
```bash
# XSS 安全检查
npm run lint:security

# 内存泄漏检查
npm run lint:memory
```

## 🚨 操作限制和权限

### 1. 系统权限

**禁止的系统操作:**
- 修改系统文件 (`/etc`, `/usr`, `/bin`)
- 创建/删除系统服务
- 修改网络配置
- 安装全局软件包

**允许的系统操作:**
- 本地文件读写
- 进程管理 (停止/启动开发服务器)
- 端口检查和清理
- 日志文件管理

### 2. 网络操作

**允许的网络操作:**
- HTTP/HTTPS 请求
- API 调用
- 文件下载
- Git 操作

**禁止的网络操作:**
- 端口扫描
- 外部服务攻击
- 敏感数据传输
- 未授权的远程连接

### 3. 数据操作

**允许的数据操作:**
- 读取和修改项目文件
- 配置文件管理
- 翻译文件更新
- 缓存文件清理

**禁止的数据操作:**
- 访问数据库
- 修改生产环境数据
- 备份/恢复系统
- 数据导出/导入

## 🔍 Agent 操作监控和审计

### 1. 操作日志

**记录的操作:**
- 文件修改
- 构建操作
- 测试执行
- 错误处理
- 系统命令

**监控内容:**
- 操作时间戳
- 操作类型
- 文件路径
- 操作结果
- 错误信息

### 2. 合规检查

**实时监控:**
- 文件访问权限
- 操作范围限制
- 安全策略执行
- 性能指标

**定期审计:**
- 操作日志分析
- 权限状态检查
- 安全漏洞扫描
- 性能评估

## 📋 操作流程和审批

### 1. 标准操作流程

**开发任务:**
1. 创建功能分支
2. 修改源代码
3. 执行测试和构建
4. 提交代码
5. 创建 PR

**修复任务:**
1. 定位问题
2. 分析原因
3. 应用修复
4. 验证效果
5. 提交修复

### 2. 特殊操作审批

**需要审批的操作:**
- 删除文件
- 修改核心配置
- 更新依赖
- 生产环境修改

**审批流程:**
1. 提交申请
2. 技术评审
3. 安全评估
4. 部署测试
5. 最终审批

## 🛡️ 安全策略和防护

### 1. 数据安全

**数据保护:**
- 敏感数据加密
- 访问控制
- 审计日志
- 备份策略

**风险评估:**
- 权限最小化
- 操作审计
- 异常检测
- 威胁防护

### 2. 系统安全

**环境隔离:**
- 开发/测试/生产分离
- 网络访问控制
- 资源限制
- 安全策略

**安全加固:**
- 最小权限原则
- 定期安全扫描
- 漏洞修复
- 应急响应

## 📚 相关文档

- [DEV-STANDARDS.md](../docs/DEV-STANDARDS.md) - 开发规范
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - 系统架构
- [I18N.md](../docs/I18N.md) - 多语言系统
- [SECURITY.md](../docs/SECURITY.md) - 安全规范