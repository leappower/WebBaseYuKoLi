# 任务批次: 2026-05-23 冲调产品画册 V4 内容整合

> **创建时间**: 2026-05-23 19:12 CST
> **更新时间**: 2026-05-23 19:30 CST
> **基线分支**: dev  |  **状态**: analyzing
> **负责人**: Brew（主 Agent）
> **下次计划更新时间**: 评审通过后

---

## 1. 物料全景分析

### 1.1 画册 V4 物料清单

| 物料 | 路径 | 大小 | 说明 |
|------|------|:----:|------|
| **产品目录数据** | `catalog_v4/product_catalog_data.json` | 65KB | 133 个产品的结构化 JSON 数据 |
| **产品实拍图** | `catalog_v4/product_images/` | 133 files | 1:1 方形，1024×1024 高清，JPEG/PNG 混合 |
| **页面设计稿** | `catalog_v4/images/` | 44 files | 每页的 PNG 渲染预览 |
| **AI 生成提示词** | `catalog_v4/prompts/` | 44 files | 每页的 InDesign/AI 生成指令 |
| **多模型分析报告** | `catalog_v4/analysis_*.json` | 5 files | Claude/MiniMax/DeepSeek/Gemini 结构分析 |
| **Excel 数据源** | `catalog_v4/东南亚冲调产品线.xlsx` | 63MB | SE Asia 电商原始数据 |
| **PDF 画册** | `catalog_v4/YuKoLi_Catalog_V4_Print.pdf` | 18MB | 44 页印刷排版稿 |

### 1.2 产品数据字段分析

`product_catalog_data.json` 每个 SKU 包含 3 个字段：

| 字段 | 格式 | 用途 | 问题 |
|------|------|------|------|
| `name` | 自由文本 | 产品名称 | 混合多语言、含品牌名、含电商平台无关前缀 |
| `image` | `imageN.jpeg`/`imageN.png` | 引用图片文件名 | 133 张图片编号不连续，部分 JPEG 部分 PNG |
| `info_preview` | 非结构化文本 | Shopee 商品描述浓缩 | 字段格式不统一（中文/英文/泰文混合），含品牌/品类/特殊饮食/保质期/发货地等零散信息 |

**关键限制**：画册数据是电商平台抓取的，字段结构松散。无法直接用作 `product-data-table.js` 的结构化数据。需要**数据清洗 + 格式转换**。

---

## 2. 🔴 问题 1: 文件命名检查规范

> **当前现状**：DEV-STANDARDS.md §6.1 定义了 kebab-case 命名，但缺少"新物料入库时的文件命名检查流程"

### 2.1 新增物料入库规范（需写入 DEV-STANDARDS.md）

#### 新增 §6.4 物料入库命名检查 🔴

```
所有新增文件进入 src/ 前，必须执行以下命名检查：

JS 文件:
  ✅ kebab-case.js（如 product-gallery.js）
  ❌ camelCase.js、PascalCase.js、snake_case.js
  ❌ mixedCaseFile.js
  验证: echo "filename.js" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*\.js$'

图片文件（src/assets/images/）:
  ✅ {category}-{subcategory}-{sequence}.webp（如 coffee-3in1-01.webp）
  ✅ 通用/非产品图: {context}-{descriptor}.webp（如 factory-gallery-1.webp）
  ❌ image1.jpeg、image2.png、12345abc.webp
  ❌ 中文文件名、空格文件名
  验证: echo "filename.webp" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*\.(webp|png|jpg|jpeg)$'

JSON 数据文件:
  ✅ kebab-case.json（如 product-catalog.json）
  ❌ product_catalog_data.json（snake_case，画册原始数据）
  ❌ 中文命名
  验证: 同 JS 规则

HTML 页面文件:
  ✅ {section}/index-{device}.html（如 products/coffee/index-pc.html）
  规则已在 §6.1 中定义，无需新增

强制执行（脚本）:
  scripts/validate-file-names.js — 扫描 src/ 下所有新增文件
  在 pre-commit hook 中调用：检查新文件是否符合命名规范
  不符合的给出具体修改建议
```

### 2.2 本次入库必须执行的文件重命名

| 原始文件名 | 目标文件名 | 数量 |
|-----------|-----------|:----:|
| `product_catalog_data.json` | `product-catalog.json` | 1 |
| `image1.jpeg` ~ `image133.png` | `{category}-{subcategory}-{seq}.webp` | 133 |
| （新建 JS 文件） | 按 kebab-case | 2-4 个 |

---

## 3. 🔴 问题 2: 没有多语言分析

> **当前现状**：`site.config.js` 声明支持 25 种语言，但 `src/assets/lang/` 下**只有 4 个语言文件**（en/zh-CN/zh-TW/ja），且均为 `-ui.json`（纯 UI 翻译），**没有产品专用的 `-product.json` 翻译文件**。

### 3.1 现有翻译体系

| 维度 | 当前状态 | 画册需求 |
|------|---------|---------|
| 支持语言 | 25 种（声明） | 画册仅中英文双语 |
| 已实现语言 | 4 种（en/zh-CN/zh-TW/ja） | 4 种均可 |
| 翻译文件类型 | 仅 `-ui.json`（UI 界面翻译） | 需要产品名称/描述的翻译 |
| 产品翻译 key | 无 | 133 SKU × 25 语言 = 3325 个翻译条目 |
| 现有 `data-i18n` key | 约 933 个 | 全部是 UI/品牌/导航类 |

### 3.2 新增产品翻译需求

**方案选择**：

| 方案 | 说明 | 工作量 |
|------|------|:------:|
| **方案 A（激进）** | 133 SKU × 25 语言 = 3325 手动翻译 | 🔴 不可行 |
| **方案 B（推荐）** | 只翻译 UI 和分类名；SKU 名称用英文（统一）+ 本地市场名（可选） | 🟡 可行 |
| **方案 C（最小）** | 仅 en + zh-CN 翻译，其他语言 fallback 到 en | 🟢 推荐初始阶段 |

**推荐方案 C** — 理由：
- 画册本身只有中英双语
- 133 SKU 的产品名是电商真实名称（品牌名+产品名+规格），不需要翻译
- 页面结构/分类名/CTA 需要多语言（已有 4 个语言文件可用）
- 产品详情中的描述文案可以逐步扩展

**具体翻译 key 清单**：

```
需要新增的翻译 key（记入 en-ui.json / zh-CN-ui.json）:
  product_coffee_showcase_title
  product_coffee_gallery_title
  product_tea_showcase_title
  product_tea_gallery_title
  ...（每个产品线 × 5-8 个 key）
  gallery_page_label_1of4, gallery_page_label_2of4（翻页标签）
  spec_table_title（规格表标题）
  
不需要翻译的（直接引用源数据）:
  133 个 SKU 的名称（电商来源，保留原始语言）
  分类标签（coffee/tea/... 已有 nav_products_* 做翻译）
```

### 3.3 多语言文件扩展计划

```
Phase 1（本次）:   en-ui.json + zh-CN-ui.json   ← 补充产品相关 key（~50 条）
Phase 2（跟随）:   zh-TW-ui.json + ja-ui.json    ← 同步添加相同 key
Phase 3（远期）:   其他 21 个语言文件              ← 简单关键先，产品描述延后
```

---

## 4. 🔴 问题 3: 页面结构调整

> **当前现状**：所有产品线页面（8 个）**内容完全一样**——Hero + Overview + Capabilities + CTA。每个页面 161 行，8 个 sections，无任何实际产品展示。而画册是 Showcase + 1-4 Gallery + 规格表的完整结构。

### 4.1 画册页面流 → 网站页面流映射

**画册 V4（44页）**：
```
封面 → TOC → About(4页) → OEM服务(3页) → 总览(1页) →
  咖啡(6页: 分隔+Showcase+4Gallery) →
  茶饮(5页: 分隔+Showcase+3Gallery) →
  代餐(2页: 分隔+Showcase) →
  美容(3页: 分隔+Showcase+1Gallery) →
  体重(3页: 分隔+Showcase+1Gallery) →
  肠道(8页: 分隔+Showcase+4Gallery) →
  功能(3页: 分隔+Showcase+Legacy) →
  规格表(1页) → 全球网络(1页) → 联系(1页) → 封底
```

**现有网站（当前）**：
```
/products/                 → 8 线总览（纯分类导航）
/products/coffee/          → Hero + Overview + Capabilities + CTA
/products/tea/             → 同上结构
/products/meal/            → 同上结构
/products/beauty/          → 同上结构
/products/weight/          → 同上结构
/products/gut/             → 同上结构
/products/lifestyle/       → 同上结构
/products/legacy/          → 同上结构
/products/detail/          → 产品详情页
```

**目标网站结构（更新后）**：
```
/products/                 → 8 线总览（含 Showcase 引导区 + 导航网格）
/products/coffee/          → Showcase(概念展示) + Gallery(49SKU, 4页翻页) + CTA
/products/tea/             → Showcase + Gallery(33SKU, 3页翻页) + CTA
/products/meal/            → Showcase + CTA（无实拍SKU，画册同）
/products/beauty/          → Showcase + Gallery(1SKU, 单图) + CTA
/products/weight/          → Showcase + Gallery(9SKU, 1页3x3) + CTA
/products/gut/             → Showcase + Gallery(41SKU, 4页翻页) + CTA
/products/lifestyle/       → Showcase + CTA（无实拍SKU）
/products/legacy/          → Showcase + Legacy故事 + CTA
/products/detail/          → 产品详情页（可选增强）
/products/specs/           → 全规格表页（新增，画册P41等价）
```

### 4.2 页面结构差异明细（coffee 线为例）

| 区域 | 现有 | 画册 | 网站需要 |
|------|------|------|---------|
| Hero Banner | 通用 OEM 风格图 | SE Asia 产品实拍 | 画册风格 Hero（参考 AI prompt） |
| 分类说明 | Overview 一段话 | 4种产品类型（Classic/LowSugar/Functional/Premium） | ✅ Showcase 引导区 |
| 能力展示 | 4个能力卡片 | 无 | 保留但有简化 |
| 产品展示 | ❌ 无 | 49 SKU × 4页 4x3 grid | ✅ Gallery 组件（新增） |
| CTA | 静态 CTA | 每页底部 OEM 标识 | 保留 |

### 4.3 关键改动：Showcase + Gallery 双段结构

```
每个产品线的 PC/Tablet/Mobile 页面需要改为两段：

第一段: Showcase（概念展示区）
  与画册 Showcase 页等效
  展示该产品线的"能做哪些产品"（概念产品图 + 类型标签）
  数据来自 `site.config.js` 的 `categories` 配置（已有）
  视觉: 全幅 Hero + 类型卡片网格

第二段: Gallery（实拍产品展示区）[★ 新增]
  展示该产品线的实际 SKU 产品（电商实拍图）
  画册结构：
    - 4x3 grid（PC 优先，Tablet 3x4，Mobile 2x6 或 1x12）
    - 翻页控件（上一页/下一页/页码）
    - 每个产品块: 产品图 + 名称(2行) + 净重 + 市场标签
  数据源: product-data-table.js（需填充 133 SKU）
  组件: product-grid.js 扩展翻页功能
```

### 4.4 现有页面 HTML 需要修改的模板区域

每个产品线页面（PC/Tablet/Mobile 各 1，共 24 个文件）需要：

```
Hero 区域        → 修改 Hero 图片和文案（参考画册 AI prompt）
Overview 区域    → 扩展为 Showcase 区（含产品类型引导卡片）
Capabilities 区域 → 简化/保留可选
Gallery 区域     → [新增] 数据驱动的产品网格 + 翻页控件
CTA 区域         → 保留（位置可调整到底部）
```

---

## 5. 🔴 问题 4: 具体内容补充与完善清单

### 5.1 产品页面内容补充矩阵

| 产品线 | 现有 Hero | 现有展示 | 画册新增内容 | 页面需要补充 |
|--------|:---------:|:--------:|-------------|-------------|
| coffee | SEO照片 | 0 SKU | 49 SKU（4页gallery）+ 4种产品类型描述 | Hero 替换 + Showcase 引导 + Gallery 网格 |
| tea | SEO照片 | 0 SKU | 33 SKU（3页gallery）+ 珍珠奶茶/果茶/花草茶分类 | 同上 |
| meal | SEO照片 | 0 SKU | 0 SKU（无gallery，仅Showcase） | Hero 替换 + Showcase（保留原样简版） |
| beauty | SEO照片 | 0 SKU | 1 SKU（单图feature） | Hero 替换 + 单产品图展示 |
| weight | SEO照片 | 0 SKU | 9 SKU（1页gallery）+ 藕粉家族 | Hero 替换 + 1页3x3网格 |
| gut | SEO照片 | 0 SKU | 41 SKU（4页gallery）+ 胶原/蛋白/乳品/水解分类 | Hero 替换 + 最大 Gallery 网格 |
| lifestyle | SEO照片 | 0 SKU | 0 SKU（无gallery，仅Showcase + Legacy） | Hero 替换 + Showcase + Legacy片段 |
| legacy | SEO照片 | 0 SKU | 画册归入 lifestyle 上下文 | 保留原样，调整为生活方式子类 |

### 5.2 品牌/公司页面内容补充

| 页面 | 现有内容 | 画册对应页 | 需补充内容 |
|------|---------|:----------:|-----------|
| `/about/` | 公司介绍 | P03-P04 | 品牌故事/使命/愿景（画册文案参考） |
| `/manufacturing/` | 工厂信息 | P05 | 4大工厂基地详情 + 日产能 10万+ 数据 |
| `/compliance/` | 认证 | P06 | HACCP/FDA/SCA/ISO 22000/BRC 图标网格 |
| `/solutions/` | OEM/ODM描述 | P07-P09 | 服务层级对比表 + 合作流程时间线 |

### 5.3 新页面新增

| 新页面 | 路径 | 画册参照 | 说明 |
|--------|------|:--------:|------|
| 全产品规格表 | `/products/specs/` | P41 | 133 SKU 全量规格表，B2B 销售工具 |

---

## 6. 🔴 问题 5: 具体 Agent 操作计划

### 6.1 任务优先级与依赖关系

```
P0: 数据准备（无代码修改）
 ├── A0-1 产品数据格式转换
 └── A0-2 图片清洗 + 重命名

P1: 核心数据层（代码修改，串行）
 ├── B1-1 重命名 product-data-table.js 数据格式 ============ 串行（依赖 P0）
 ├── B1-2 更新 image-assets.js 图片路径映射 =============== 串行（依赖 P0）
 └── B1-3 扩展 product-grid.js 翻页功能 =================== 可并行

P2: 产品线页面更新（HTML，8 条线可并行）
 ├── C2-1 coffee 线 ========== Agent-A | 文件: products/coffee/index-{pc,tablet,mobile}.html
 ├── C2-2 tea 线 ============= Agent-A（或同 Agent 串行）
 ├── C2-3 meal 线 ============ Agent-B
 ├── C2-4 beauty 线 ========== Agent-B
 ├── C2-5 weight 线 ========== Agent-C
 ├── C2-6 gut 线 ============= Agent-C
 ├── C2-7 lifestyle 线 ======= Agent-D
 └── C2-8 legacy 线 ========== Agent-D

P3: 品牌页面更新（可并行）
 ├── D3-1 about 页 =========== Agent-E
 ├── D3-2 manufacturing 页 ==== Agent-E
 ├── D3-3 compliance 页 ======= Agent-F
 └── D3-4 solutions 页 ======== Agent-F

P4: 新功能 + 新页面（串行）
 ├── E4-1 Gallery 翻页组件开发 ============================ 先于 P2 的 HTML 更新
 ├── E4-2 翻译 key 补充 ================================== 可与 P2 并行
 └── E4-3 全规格表页面 =================================== 最后
```

### 6.2 每个子 Agent 的可执行任务卡片

<details>
<summary><b>A0-1: 产品数据格式转换</b> — 单人，无需子 Agent</summary>

```
## 任务：产品数据格式转换（P0）

### 工作环境
- 工作目录：/Users/chee/Projects/BrewYuKoLi

### 目标
将画册的 product_catalog_data.json（133 SKU）转换为 product-data-table.js 兼容格式

### 输入
/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json

### 输出
docs/plan/product-catalog-converted.json（中间文件，验收用）
src/assets/js/product-data-table.js（覆盖旧文件）

### 转换映射

现有格式 → 目标格式映射：
JSON.name               → target.name
JSON.image              → target.image（需映射为 WebP 路径）
JSON.info_preview       → 提取 brand/category/region 等结构化字段
  info_preview 结构(非标准):
    "品牌: XXXX"           → target.brand
    "特殊饮食: XXXX"       → target.diet（若有则加Halal等标签）
    "出货地: XX"           → target.region
    "保质期: XX 个月"      → target.shelfLife（数值）
    其他文本字段            → target.description（截取前100字）
  无结构化信息              → target.description = ""

target.category = 来自 JSON 所属的产品线 key（coffee/tea/...）
target.id = "{category}-{seq:03d}"（如 coffee-001）
target.model = "{类别前缀}-{seq:03d}"（如 CF-001/TE-001/...）
target.image = "/assets/images/products/{category}/{seq:03d}.webp"
target.specs = "提取规格或留空"
target.moq = 500（默认值）
target.tags = [category, "OEM", "ODM"]（自动生成）

### 验证
node -c src/assets/js/product-data-table.js   # 语法检查
grep -c "name:" src/assets/js/product-data-table.js  # 应该是 133 条
grep "COFFEE-001\|COFFEE-049" -> 应该有

### 🔴 红灯
1. 禁止手动改 JSON 源文件
2. 禁止改变现有 consumer 的接口（product-grid.js 调用的字段名不能变）
```
</details>

<details>
<summary><b>A0-2: 图片清洗 + 重命名</b> — 单人，无需子 Agent</summary>

```
## 任务：产品图片清洗与重命名（P0）

### 输入
/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_images/
  133 张图片（image1.jpeg ~ image133.png，编号与 JSON 中 image 字段对应）

### 输出
src/assets/images/products/{category}/{seq:03d}.webp

### 操作步骤
1. 创建目录结构
   mkdir -p src/assets/images/products/{coffee,tea,meal,beauty,weight,gut,lifestyle,legacy}

2. 根据 product_catalog_data.json 中每个 SKU 的所属产品线 → 映射到对应目录
   同时读取 image 字段（imageN.jpeg/png）找到源文件

3. 转换格式为 WebP:
   cwebp -q 80 source.jpeg -o src/assets/images/products/coffee/001.webp

4. 重命名规则：
   产品线-顺序号.webp（如 coffee-001.webp）
   → 简化: 直接用 001.webp、002.webp 放在对应产品线目录

### 验证（6 项必须全过）

```bash
# 1. 总数验证
ls src/assets/images/products/*/*.webp | wc -l   # 133

# 2. 每线数量验证
for d in coffee tea meal beauty weight gut lifestyle legacy; do
  n=$(ls src/assets/images/products/$d/*.webp 2>/dev/null | wc -l)
  echo "$d: $n"
done
# 预期: coffee 49, tea 33, meal 0, beauty 1, weight 9, gut 41, lifestyle 0, legacy 0

# 3. 单张大小 < 200KB
for f in src/assets/images/products/*/*.webp; do
  kb=$(stat -f%z "$f" | awk '{print int($1/1024)}')
  if [ $kb -gt 200 ]; then echo "超限: $f (${kb}KB)"; fi
done

# 4. 总大小 < 25MB
du -sh src/assets/images/products/

# 5. 格式验证（必须是 WebP）
file src/assets/images/products/coffee/001.webp 2>/dev/null | grep -q WebP || echo "非 WebP"

# 6. 分辨率（可选）
sips -g pixelWidth -g pixelHeight src/assets/images/products/coffee/001.webp 2>/dev/null
# 预期: 1024 x 1024
```

### 工具依赖
需要 cwebp: `brew install webp`（如未安装）
```
</details>

<details>
<summary><b>B1-1: product-data-table.js 数据更新</b></summary>

```
## 任务：更新 product-data-table.js 数据

### 工作环境
- 分支：feat/data-product-table

### 文件
src/assets/js/product-data-table.js

### 目标
将 A0-1 转换的 133 条产品数据写入 product-data-table.js

### 注意事项
当前文件只有 18 条产品数据（3条/线），需要
- 保留现有字段结构保持不变（id/model/name/category/image/specs/moq/tags）
- 仅替换数据数组内容（从 18 条 → 133 条）
- 不修改任何外部 API（window.PRODUCT_DATA_TABLE 保持不变）
- 删除旧的 legacy/lifestyle 示例数据（画册中为 0 SKU，保留空数组）

### 验证
node -c src/assets/js/product-data-table.js
grep -c "name:" src/assets/js/product-data-table.js  # 133
```
</details>

<details>
<summary><b>B1-3: product-grid.js 翻页扩展</b></summary>

```
## 任务：扩展 product-grid.js 支持 Gallery 翻页模式

### 文件
src/assets/js/product-grid.js

### 目标
在现有 grid 渲染逻辑基础上，增加分页/翻页功能

### 新增功能
① 分页状态管理：
   _currentPage（当前页码，从0开始）
   _pageSize（每页12条，PC 4x3；Tablet 9条，3x3；Mobile 6条，2x3）
   getCategoryPageCount() → 返回总页数

② 翻页控件渲染：
   <div class="gallery-pagination">
     <button class="prev">←</button>
     <span class="page-indicator">1 / 4</span>
     <button class="next">→</button>
   </div>

③ 翻页事件绑定（事件委托）：
   gallery-pagination click → 切换 _currentPage → 重新渲染

④ 通过 data-gallery="true" 属性触发翻页模式
   默认为 false（保持现有 grid 行为不变）

### 不改变
- 现有 product-grid.js 的所有已有函数签名
- 筛选/搜索逻辑保持不变
- window.ProductGrid 的接口不变

### 验证
npm run build:dev（构建通过）
在产品页面预览，确认翻页控件出现且可交互

### 限制
- 子 Agent 只写 JS，不改 HTML
- 只能在 product-grid.js 范围内改动
```
</details>

<details>
<summary><b>C2-1: coffee 线页面更新</b></summary>

```
## 任务：更新咖啡冲调线页面内容

### 文件（3 个）
src/pages/products/coffee/index-pc.html
src/pages/products/coffee/index-tablet.html
src/pages/products/coffee/index-mobile.html

### 现有内容（各 161 行，8 sections）
Hero Banner → Overview → Capabilities(4 cards) → CTA

### 需要改为（参考画册 P11-P16 + 画册 AI prompt）
Hero Banner  → 替换为画册风格的咖啡场景 Hero（深色 overlay + 产品类型标签）
Showcase 区  → 增加 4 种产品类型引导卡（Classic 3in1 / Low Sugar / Functional / Premium Single-Origin）
Gallery 区   → [新增] <div id="product-grid" data-gallery="true" data-category="coffee"></div>
Capabilities → 精简为 2 个卡片
CTA 区       → 保留底部

### 关键：三屏同步修改
PC (index-pc.html):    4x3 gallery grid + 完整的 Showcase 视觉
Tablet (index-tablet): 3x3 gallery grid + 简化的 Showcase
Mobile (index-mobile): 2x3 gallery grid + 极简 Showcase

### 验证
node -c 检查无语法（HTML 无语法概念，检查标签闭合）
```
</details>

### 6.3 任务执行时序（建议分 3 轮）

**轮次 1（P0 + B1-1，串行，~2 小时）**：
```
主 Agent:
  A0-1 数据格式转换 → A0-2 图片清洗
  完成后派发 B1-1（product-data-table.js 数据更新）
```

**轮次 2（B1-2 + B1-3 + 翻译，可并行，~2 小时）**：
```
子 Agent 并发:
  Agent-A: B1-2 更新 image-assets.js
  Agent-B: B1-3 扩展 product-grid.js 翻页
  主 Agent: 补充翻译 key
```

**轮次 3（P2 + P3，8 Agent 并发，~3 小时）**：
```
子 Agent 并发:
  Agent-A: C2-1 coffee + C2-2 tea
  Agent-B: C2-3 meal + C2-4 beauty
  Agent-C: C2-5 weight + C2-6 gut
  Agent-D: C2-7 lifestyle + C2-8 legacy
  Agent-E: D3-1 about + D3-2 manufacturing
  Agent-F: D3-3 compliance + D3-4 solutions

（每个 Agent 最多 2 条线，每条线 3 个文件）
```

---

## 7. 风险评估（完整版）

| 风险 | 概率 | 影响 | 缓解 |
|------|:----:|:----:|------|
| 133 张图入 Git 体积过大（原始 60MB） | 🔴 高 | 🟡 中 | WebP q80 压缩后预估 ~15-20MB；现有 BrewYuKoLi 产品图仅 24-47KB/张，新图需达到同等水平 |
| 原始图片 100 张 PNG + 33 张 JPEG 混合 | 🟡 中 | 🟡 中 | 统一转为 WebP，删除原始文件 |
| WebP 压缩后图片质量不可接受（q80 已够，1.15bpp） | 🟢 低 | 🟡 中 | q80 条件下 PSNR 46.5dB，视觉无感知损失 |
| 项目残留厨房设备图（applications/ 57MB + products/ 17MB） | 🟡 中 | 🟢 低 | 这不是本次任务的目标，属于历史清理，另行安排 |
| `info_preview` 数据质量低 | 🔴 高 | 🔴 高 | 只提取品牌/区域/饮食标签，不依赖描述文本 |
| product-data-table.js 格式冲突 | 🟡 中 | 🔴 高 | P0-1 做格式验证映射，不改 consumer 接口 |
| 8 Agent 同时改 HTML 冲突 | 🔴 高 | 🟡 中 | 每个 Agent 分配独立产品线（不同文件），无重叠 |
| 三屏一致性检验 | 🟡 中 | 🔴 高 | 每个 Agent 改完后必须三屏验证 |
| Gallery 翻页交互复杂度 | 🟡 中 | 🟡 中 | 最小可行：只做翻页，不做懒加载/无限滚动 |
| 翻译 key 遗漏 | 🟡 中 | 🟡 中 | 建一个 checklist 跑所有页面提取 `data-i18n` |
| 子 Agent 不改 HTML 中的图片路径 | 🟡 中 | 🟡 中 | B1-3（图片映射）完成后才能派 HTML 更新 |
| NAS 路径在构建时不可用 | 🔴 高 | 🔴 高 | 必须把图片复制到项目内，不能引用 NAS |
| 现有项目图片目录已 85MB，新增 133 张 ~20MB 达到 105MB | 🟡 中 | 🟡 中 | 可以接受，单次提交尺寸在合理范围 |

### 图片验证标准（A0-2 必须执行）

```bash
# 1. 图片总数验证
ls src/assets/images/products/*/*.webp | wc -l
# 预期: 133 张 (coffee 49, tea 33, weight 9, beauty 1, gut 41, meal 0, lifestyle 0, legacy 0)

# 2. 单张图片大小验证（WebP q80，1024×1024）
# 目标: 每张 < 200KB（1024×1024 图片 q80 约 130-180KB）
failed=0
for f in src/assets/images/products/*/*.webp; do
  size=$(stat -f%z "$f")
  kb=$((size/1024))
  if [ $kb -gt 200 ]; then
    echo "⚠️  超限: $f (${kb}KB)"
    failed=$((failed+1))
  fi
done
if [ $failed -eq 0 ]; then echo "✅ 所有图片 < 200KB"; fi

# 3. 总大小验证
# 目标: 总新增 < 25MB
total_kb=$(du -sk src/assets/images/products/ | awk '{print $1}')
echo "产品图片总大小: $((total_kb/1024)) MB"

# 4. 格式验证
file src/assets/images/products/coffee/001.webp | grep -q WebP || echo "❌ 非 WebP 格式"

# 5. 分辨率验证
# 需要 ImageMagick 或 sips
identify -format "%wx%h" src/assets/images/products/coffee/001.webp 2>/dev/null
# 预期: 1024x1024

# 6. 图片是否被 product-data-table.js 引用
# 每个图片必须有一条对应的数据行
grep -c "/products/coffee/" src/assets/js/product-data-table.js
ls src/assets/images/products/coffee/*.webp | wc -l
# 两个数字必须一致
```

---

## 8. 📋 待定项（需要人类评审）

### 评审点 1 — 页面结构策略
- [ ] **Showcase + Gallery 双段结构**：是否认同为每个产品线增加 Showcase 引导区和 Gallery 翻页区？
- [ ] **三屏差异化**：PC 4x3 grid、Tablet 3x3、Mobile 2x3，是否接受这样渐进式简化？

### 评审点 2 — 多语言策略
- [ ] **方案 C（仅 en + zh-CN 翻译，其他 fallback）** 是否接受？
- [ ] 产品 SKU 名称保持电商原始语言（不翻译）是否接受？

### 评审点 3 — 数据策略
- [ ] **`info_preview` 字段只提取品牌/区域/饮食标签**，其余不解析，是否接受？
- [ ] **133 张图全部 WebP 压缩进 Git**，还是部分接入 CDN？

### 评审点 4 — 执行策略
- [ ] **3 轮分批执行**（数据层 → JS 功能 → HTML 页面）还是 2 轮合并？
- [ ] **Agent 并发**：8 个 Agent 同时改 8 条产品线 HTML，是否 OK？
- [ ] **总预计时间**：数据准备 2h + JS 功能 2h + HTML 更新 3h = 约 7 小时

### 评审点 5 — 危险区域确认
- [ ] `product-data-table.js` 被 `product-grid.js`/`product-detail.js` 引用，改动后必须回归测试
- [ ] `product-grid.js` 翻页功能新增后，不影响现有产品的普通 grid 模式
- [ ] 8 条产品线 HTML 结构统一，子 Agent 改完后主 Agent 做差异对比确保一致性
