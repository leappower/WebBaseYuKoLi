# 贡献指南

感谢你对 BRAND_PROJECT 的关注！以下是参与开发的快速指引。

## 开发环境

- Node.js ≥ 16
- npm ≥ 8
- `git clone` → `npm install`（自动安装 Git Hooks）

## 工作流程

1. **创建分支**：`feat/xxx` / `fix/xxx` / `refactor/xxx` / `chore/xxx`
2. 开发 + 本地验证
3. 提交（pre-commit hook 自动检查）
4. 推送（pre-push hook 自动检查）
5. 创建 PR

## 代码规范

所有规范统一在 [DEV-STANDARDS.md](./DEV-STANDARDS.md)，包括：

- Git 工作流与分支管理
- 代码提交格式 `type(scope): description`
- ES5 兼容 + IIFE 模式
- 三屏一致性要求（PC / Tablet / Mobile）
- 根因修复原则（禁止打补丁式修复）
- 调试日志规范
- 代码搜索与批量替换规范
- 代码审查清单（18 项）

## 质量检查

```bash
npm run lint:all   # JS + CSS + HTML 检查
npm test           # 单元测试
npm run test:e2e   # E2E 测试
```

> `pre-commit` 和 `pre-push` hook 会自动执行部分检查。

## 新增语言

见 [I18N.md#新增语言](./I18N.md#新增语言)

## 报告 Bug

请提供以下信息以便快速定位：

1. **复现步骤**
2. **期望行为**
3. **实际行为**
4. **浏览器信息**（名称 + 版本）
5. **屏幕尺寸**（PC / Tablet / Mobile）

## 许可证

MIT License
