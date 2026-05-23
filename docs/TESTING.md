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
- 测试 `fixtures` 置于 `tests/fixtures/` 目录

### E2E 选择器策略

| 优先级 | 选择器 | 示例 |
|--------|-------|------|
| 🥇 | `data-testid` | `[data-testid="product-card"]` |
| 🥇 | `data-component` | `navigator[data-component="navigator"]` |
| 🥈 | `id` | `#spa-content` |
| 🥉 | `aria-label` | `button[aria-label="close"]` |
| ❌ 禁止 | CSS class | 可能因样式重构而变化 |

### E2E 测试步骤规范

```javascript
// 每个测试用例的推荐结构:
test('describe what is being tested', async ({ page }) => {
  // Arrange: 导航到页面
  await page.goto('/home/');

  // Act: 执行交互（等待 SWUP 导航完成）
  await page.click('text=Products');
  await page.waitForSelector('#spa-content');
  await page.waitForTimeout(800); // 等待骨架屏过渡完成

  // Assert: 验证内容
  await expect(page.locator('h1')).toContainText('Products');
});
```

**SWUP 导航等待**: 由于 SWUP 使用异步内容替换，建议在点击导航链接后添加 `waitForTimeout(900)` 或监听 `spa:load` 事件（骨架过渡 350ms + 内容渐入延迟 350ms + 缓冲 100ms = 900ms）。

```javascript
// 通用 SWUP 导航等待函数
async function waitForSwupNavigation(page) {
  await page.waitForSelector('#skeleton-overlay[hidden]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(900);
}
```

### Smoke 测试覆盖清单

每个页面上线前必须通过以下 smoke 检查：

- [ ] PC viewport 下页面加载无 JS 报错
- [ ] Mobile viewport 下页面加载正常
- [ ] navigator 可见且 active 状态正确
- [ ] footer 可见且 active 状态正确
- [ ] 所有链接可点击（无 404）
- [ ] 骨架屏在内容加载后隐藏
- [ ] 页面标题和 meta description 正确

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
