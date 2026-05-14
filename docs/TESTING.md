# 测试策略

## 测试分层

| 层级 | 工具 | 职责 |
|------|------|------|
| 单元测试 | Jest | 工具函数、数据处理、翻译逻辑 |
| E2E 测试 | Playwright | 页面导航、语言切换、表单提交、三屏适配 |
| 构建验证 | build.sh | 构建后检查产物完整性（HTML/CSS/JS 输出） |

## 环境配置

- **Jest**: jest 30.3.0 + babel-jest + @testing-library/dom + jest-environment-jsdom
- **Playwright**: @playwright/test ^1.59.1，配置见 `playwright.config.js`
  - 浏览器：chromium + Mobile Chrome（可选 iPad）
  - baseURL: `http://localhost:3000`
- **pre-push hook**: 自动运行 `npm run test:ci`

## 运行命令

```bash
npm test                # Jest 单元测试
npm run test:e2e        # Playwright（无头）
npm run test:e2e:headed # Playwright（有头，调试用）
npm run test:coverage   # Jest + 覆盖率报告
npm run test:ci         # CI 模式（pre-push 使用）
```

## E2E 测试规范

- 每个测试用例**必须覆盖 PC 和 Mobile 两个 viewport**
- 新页面功能上线前**必须添加 smoke 测试**
- 关键交互元素使用 `data-testid` 标记，便于选择器稳定
- 测试文件命名：`<feature>.spec.js`

## 单元测试示例

```js
import { describe, it, expect } from '@jest/globals';
import { getLocalizedPath } from '../src/i18n/utils';

describe('getLocalizedPath', () => {
  it('returns prefixed path for non-default language', () => {
    expect(getLocalizedPath('/products', 'zh')).toBe('/zh/products');
  });

  it('returns original path for default language', () => {
    expect(getLocalizedPath('/products', 'en')).toBe('/products');
  });
});
```

## 测试目录结构

```
tests/
├── e2e/
│   ├── smoke.spec.js
│   └── navigator-dropdown.spec.js
└── unit/          ← 待建立
    ├── utils/
    └── i18n/
```

## 优先级策略

| 优先级 | 范围 | 说明 |
|--------|------|------|
| **P0** | E2E smoke | 核心页面能正常加载、无 JS 错误 |
| **P1** | 组件交互 | 导航跳转、语言切换、表单提交流程 |
| **P2** | 单元测试 | 工具函数、数据处理、i18n 逻辑 |
| **P3** | 视觉回归 | 截图对比（后续引入） |

## CI 集成

GitHub Actions workflow 待建立，建议：
- PR 触发：`npm run test:ci` + `npm run test:e2e`
- main 分支：完整测试 + 覆盖率上报
