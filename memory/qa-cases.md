# 质控案例记录

## 案件: 全站图片 srcset 验收 (2026-06-03)

### 结论: ❌ 不通过

### 发现问题

#### 1. [严重] 静态 HTML 的 srcset URL 全部指向原图 — `scripts/add-srcset.py` 第63行 `build_srcset()` 函数错误
- **问题**: `build_srcset()` 没有将文件路径改为带尺寸后缀的版本。所有静态 HTML 中生成的 srcset 都引用相同文件：
  - 例如: `srcset="/assets/images/oem/products/coffee.webp 1200w, /assets/images/oem/products/coffee.webp 1920w"`
  - 应该为: `srcset="/assets/images/oem/products/coffee-1200w.webp 1200w, /assets/images/oem/products/coffee-1920w.webp 1920w"`
- **影响范围**: 全部69个修改的静态HTML文件
- **严重程度**: 严重 — srcset 功能无实际价值，浏览器在不同宽度下始终返回同一文件
- **根因**: `build_srcset()` (scripts/add-srcset.py:60-65) 只用 `base_src` 拼接，没有使用 `-{width}w.webp` 后缀

#### 2. [严重] `product-detail.js` 完全无 srcset 支持
- **位置**: `src/assets/js/product-detail.js` 第456-471行（mediaHtml 生成）
- **问题**: PDP 页面的产品主图生成代码中完全没有 srcset/sizes 属性
- **影响**: 产品详情页（PDP）所有图片都不支持响应式，客户端始终下载全尺寸原图
- **严重程度**: 严重 — 核心页面缺少关键功能

#### 3. [中等] `product-grid.js` 中 gallery pagination 代码被意外删除
- **位置**: `src/assets/js/product-grid.js` 第728-743行
- **问题**: `renderGalleryPagination()` 中变量声明和初始化被删除（`prevBtn`、`nav`），但后续代码仍引用这些变量，会导致运行时 ReferenceError
- **影响**: gallery 分页功能完全失效
- **严重程度**: 中等 — 非核心功能但会报错

#### 4. [轻微] 产品目录缺少高分辨率图片
- **详情**: `src/assets/images/products/` 下各尺寸覆盖：
  - 375w: 219/219 (100%) ✅
  - 828w: 107/219 (49%) ⚠️
  - 1200w: 6/219 (3%) ❌
  - 1920w: 0/219 ❌
  - 2048w: 0/219 ❌
- **影响**: PC 端 renderer 引用的 `-1200w.webp` 和 `-1920w.webp` 基本不存在，浏览器会 fallback 到 `src` 属性

#### 5. [轻微] `home-core-products.js` 中图片未使用 CMS `_imageUrl` 路径
- **位置**: `src/assets/js/home-core-products.js` 第160, 222, 280行
- **问题**: 使用 `p.image` 而不是 `p._imageUrl` 或 `_imageUrl`，srcset 替换 `.webp` → `-{width}w.webp` 时可能与实际文件路径不匹配

### ✅ 通过的部分
- `product-grid.js`: 三屏 renderer 都在`.webp` 替换为 `-{width}w.webp` 是正确的
- 图片文件生成: 449张图片中有375w (449/449) 全部生成，828w (303/449) 覆盖率良好
- `main.js` 中 `data-srcset` → `srcset` 懒加载处理机制正确
- Server 可正常启动，页面渲染无白屏

### 修复建议
1. **`scripts/add-srcset.py`**: 修改 `build_srcset()` 函数，在 URL 中插入 `-{width}w` 后缀
2. **`scripts/add-srcset-mobile.py`**: 同样修复 srcset URL 生成
3. **`src/assets/js/product-detail.js`**: 在 mediaHtml 的 `<img>` 标签中增加 `srcset` 和 `sizes` 属性
4. **`src/assets/js/product-grid.js`**: 恢复删除的 `prevBtn` 和 `nav` 变量声明
5. **运行 `node scripts/resize-images.js`** 生成缺失的高分辨率图片
