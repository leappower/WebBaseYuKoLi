# DATA-FLOW.md — 数据流详解

> **最后更新**：2026-05-23
> **目的**：追踪数据从源头到渲染的完整路径

---

## 1. 数据流全景图

```
构建时 (build.sh)
  site.config.js    → SSG HTML 内联注入
  src/pages/*.html  → dist/pages/*/index-*.html
  src/assets/js/*   → dist/assets/js/* (含 vendor/)
  src/assets/lang/* → dist/assets/lang/*

运行时 (浏览器)
  dist/index.html (SPA Shell)
    ├─ site.config.js → window.SITE_CONFIG
    ├─ swup.umd.js → window.Swup
    ├─ swup-init.js → new Swup() + SpaRouter 兼容层
    ├─ navigator (data-swup-persist) → navigator.js render
    ├─ footer (data-swup-persist) → footer.js render
    └─ #spa-content (SWUP 管理) → fetch SSG HTML → 内容填充
```

---

## 2. 配置数据流

```
site.config.js → window.SITE_CONFIG
  ├─ 消费模块:
  │   ├─ navigator.js      → 导航菜单渲染
  │   ├─ footer.js         → 页脚内容
  │   ├─ swup-init.js      → 产品分类路由映射
  │   ├─ page-init.js      → 页面 wiring
  │   ├─ product-grid.js   → 产品列表 URL
  │   └─ translations.js   → 品牌名翻译
  └─ SSG HTML 内联注入:
      <script> window.SITE_CONFIG = { ... }; </script>
```

---

## 3. 页面渲染数据流

### SSG 模式 (直接访问 /home/)

```
浏览器 → server.js → dist/pages/home/index-pc.html
  → 完整 HTML (navigator + #spa-content + footer)
  → 脚本执行:
      swup.umd.js → window.Swup
      swup-init.js → initSwup()
        → enable: 容器有内容 → hideSkeleton()
      navigator.js → 读取 SITE_CONFIG.nav.items → 渲染
      page-init.js → spa:load 绑好 wiring
```

### SPA Shell 模式 (从 / 访问)

```
浏览器 → server.js → dist/index.html
  → #spa-content 为空
  → swup-init.js → enable: 容器为空
    → swup.navigate("/home/")
    → routeToFetchUrl → /home/index-pc.html
    → fetch → content:replace → hideSkeleton()
```

---

## 4. 国际化数据流

```
src/assets/lang/
  ├─ en.json, zh-CN.json, th.json, vi.json, ...

translations.js
  → fetch /assets/lang/<lang>.json
  → 遍历 [data-i18n] → el.textContent = translations[key]

spa:load 事件 → translations.js 重新翻译新内容
```

---

## 5. SWUP 导航数据流

```
用户点击链接
  → SWUP intercept
  → visit:start → showSkeleton()
  → fetch:request → routeToFetchUrl(path)
      /products/coffee/ → /products/coffee/index-pc.html
  → fetch SSG HTML
  → content:replace
      → hideSkeleton()
      → runPageInitByRoute()
      → updateActiveState()
  → page:view → dispatchEvent("spa:load")
  → visit:end → __spaNavigating = false
```

---

## 6. 产品数据流

```
外部 JSON API (SITE_CONFIG 中配置)
  → product-grid.js
    → fetch(API_URL)
    → 分类筛选 (all/coffee/tea/...)
    → 搜索过滤
    → 渲染 DOM

product-data-table.js
  → 静态初始数据 (内联 <script>)
  → ETag API 刷新
  → localStorage 缓存 (版本键控)
```

---

## 7. 事件数据流

| 事件 | 触发 | 监听模块 |
|------|------|---------|
| `spa:load` | SWUP page:view | page-init.js, 15+ 模块 |
| `DOMContentLoaded` | 浏览器 | swup-init.js |
| `resize` | 浏览器 | device-utils.js |

---

## 8. 调用链追踪

```bash
# 修改 routeToFetchUrl() 前必查:
grep -rn "routeToFetchUrl" src/assets/js/ --include="*.js"
# → swup-init.js:fetch:request replace hook → SWUP 每次导航

# 修改 hideSkeleton() 前必查:
grep -rn "hideSkeleton\|showSkeleton" src/assets/js/swup-init.js
# → enable, visit:start, content:replace hooks

# 修改产品分类前必查:
grep -rn "all\|coffee\|tea\|meal\|beauty\|weight\|gut\|lifestyle\|legacy" src/assets/js/swup-init.js
# → routeToFetchUrl + runPageInitByRoute
```
