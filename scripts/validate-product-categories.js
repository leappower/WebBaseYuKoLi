#!/usr/bin/env node
/**
 * validate-product-categories.js
 *
 * 校验 product-data-table.js 中 name 关键词与 category 的一致性。
 * 如果一个产品的 name 中出现了明确的分类关键词（如 "Coffee"/"Kopi"），
 * 但 category 值不是对应的预期分类，则报 error。
 *
 * 使用方式:
 *   node scripts/validate-product-categories.js                         # 校验 src 版本
 *   node scripts/validate-product-categories.js --src path/to/file.js   # 自定义路径
 *
 * 退出码:
 *   0 — 全部通过
 *   1 — 有校验失败
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SRC = path.join(ROOT, 'src', 'assets', 'js', 'product-data-table.js');

// ─── 分类关键词映射 ─────────────────────────────────────
// 每个分类的关键词列表：如果 name 包含这些关键词，则 category 必须匹配
const CATEGORY_KEYWORDS = {
  coffee: [
    /\bcoffee\b/i,
    /\bkopi\b/i,
    /\bcafe\b/i,
    /\bcaff[ée]\b/i,
    /\bcapuccino/i,
    /\blatte\b/i,
    /\bespresso\b/i,
    /\barabica\b/i,
    /\bmandheling\b/i,
    /\broast\s*ed?\b/i,
    /\bcoffeemix\b/i,
    /\bgula\b/i,        // 印尼/马来 "糖" 但常用于咖啡产品
    /\bกาแฟ\b/,         // 泰语 咖啡
    /\b咖啡\b/,         // 中文 咖啡
    /\bcafe\s*latte\b/i,
  ],
  tea: [
    /\btea\b/i,
    /\bteh\b/i,
    /\bteabag\b/i,
    /\b茶\b/,            // 中文 茶
    /\bชา\b/,            // 泰语 茶
    /\bchai\b/i,
    /\bteh\s*tarik\b/i,
    /\bherbal\s*tea\b/i,
    /\bflower\s*tea\b/i,
    /\boolong\b/i,
    /\bpu[-\s]*er[hr]\b/i,
    /\bjasmine\b/i,
    /\bchrysanthemum\b/i,
    /\bginger\s*tea\b/i,
  ],
  // 以下分类较宽松，只检测明显异常
  beauty: [
    /\bcollagen\b/i,
    /\b胶原蛋白\b/,
    /\bvitamin\b/i,
    /\b美白\b/,
    /\bskincare\b/i,
    /\bbeauty\b/i,
    /\b美容\b/,
    /\b抗衰\b/,
  ],
  gut: [
    /\bprobiotic\b/i,
    /\b益生菌\b/,
    /\bdigestive\b/i,
    /\b消化\b/,
    /\bgut\s*health\b/i,
    /\bprebiotic\b/i,
    /\b纤维\b/,
    /\bfiber\b/i,
  ],
  meal: [
    /\bmeal\b/i,
    /\b代餐\b/,
    /\bshake\b/i,
    /\bsmoothie\b/i,
  ],
  weight: [
    /\bweight\s*loss\b/i,
    /\b减肥\b/,
    /\bslim\b/i,
    /\bdiet\b/i,
    /\bketo\b/i,
    /\blow\s*carb\b/i,
  ],
  legacy: [],  // legacy 不做关键词校验
  lifestyle: [],  // lifestyle 不做关键词校验
};

// ─── 反向索引：关键词 -> 预期分类 ────────────────────────
// 对于特殊的关键词（如蛋白质），它们不是某个分类专属，
// 但如果出现了 "coffee" 却归到 "tea"，那肯定有问题。
// 这里定义的是 "如果 name 出现该词，则 category 绝不能是某分类"
// 但实际上我们用前向检查更简单：检查 name 关键词是否暗示了不同的分类。

// 相反，我们要检查的是：name 里的关键词暗示了分类 A，但 category 是 B
// 所以需要构建 nameKeyword → impliedCategory 映射

function buildKeywordMap() {
  const map = [];
  for (const [cat, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const pattern of patterns) {
      map.push({ pattern, impliedCategory: cat });
    }
  }
  return map;
}

// ─── 解析 product-data-table.js ────────────────────────
function parseProducts(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 查找 PRODUCT_DATA_TABLE 数组内容
  const match = content.match(/var\s+PRODUCT_DATA_TABLE\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    console.error('❌ 无法在文件中找到 PRODUCT_DATA_TABLE 变量');
    process.exit(1);
  }

  let products;
  try {
    // 将 JS 对象字面量解析为 JSON（需要补全 key 的引号）
    // 已有格式: {id:"coffee-001", model:"CF-001", category:"coffee", ...}
    // 这种格式 node 可以直接 eval，但使用 vm 模块更安全
    const vm = require('vm');
    const script = new vm.Script(`module.exports = ${match[1]};`, { filename: 'product-data-table.js' });
    const sandbox = { module: { exports: null } };
    const context = vm.createContext(sandbox);
    script.runInContext(context);
    products = sandbox.module.exports;
  } catch (err) {
    // fallback: 手动逐行解析
    console.warn('⚠️  vm 解析失败，尝试正则回退:', err.message);
    products = parseProductsFallback(match[1]);
  }

  if (!Array.isArray(products) || products.length === 0) {
    console.error('❌ 解析结果不是有效数组');
    process.exit(1);
  }

  return products;
}

// fallback 解析（如果 vm 方式不行）
function parseProductsFallback(arrayStr) {
  // 用正则提取每个产品对象
  const results = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(arrayStr)) !== null) {
    const objStr = m[1];
    const id = extractField(objStr, 'id');
    const name = extractField(objStr, 'name');
    const category = extractField(objStr, 'category');
    const model = extractField(objStr, 'model');
    if (id && category !== undefined) {
      results.push({ id, name, category, model });
    }
  }
  return results;
}

function extractField(objStr, fieldName) {
  const re = new RegExp(`${fieldName}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const m = objStr.match(re);
  if (m) return m[1];
  // 尝试无引号值
  const re2 = new RegExp(`${fieldName}\\s*:\\s*([^,"\\}]+)`);
  const m2 = objStr.match(re2);
  if (m2 && m2[1].trim()) return m2[1].trim();
  return undefined;
}

// ─── 校验逻辑 ───────────────────────────────────────────
function validateProducts(products) {
  const keywordMap = buildKeywordMap();
  const errors = [];
  const warnings = [];

  for (const product of products) {
    const { id, name, category, model } = product;
    if (!name || !category) continue;

    // 检查 name 中的关键词是否与 category 一致
    for (const { pattern, impliedCategory } of keywordMap) {
      if (pattern.test(name) && category !== impliedCategory) {
        // 检查一下是不是另一个预设分类下的合理关键词
        // 例如 "Jasmine Tea Powder" 虽然含 "tea" 关键词但也可能是其他
        // 所以我们再看 name 是否也有当前 category 的关键词
        const currentCatPatterns = CATEGORY_KEYWORDS[category] || [];
        const alsoHintsCurrent = currentCatPatterns.some(p => p.test(name));

        // 如果 name 同时暗示了当前分类，则降低为 warning
        // 例如 "Coffee Tree" 产品在 tea 类，"咖啡" 出现在 "tea" 类也属于可疑
        // 但如果是 "姜茶 Ginger Tea" 在 tea 类，同时含 "tea" 关键词，正常
        if (alsoHintsCurrent) {
          warnings.push({
            id,
            model,
            name: truncate(name, 60),
            category,
            keyword: pattern.source,
            impliedCategory,
            note: 'name同时含有当前分类关键词',
          });
        } else {
          errors.push({
            id,
            model,
            name: truncate(name, 60),
            category,
            keyword: pattern.source,
            impliedCategory,
          });
        }
        break; // 一个产品只需报告第一个关键词冲突
      }
    }
  }

  return { errors, warnings };
}

function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str || '';
  return str.substring(0, maxLen - 3) + '...';
}

// ─── 额外检查：category 值合法 ───────────────────────────
function validateCategoryValues(products) {
  const validCategories = Object.keys(CATEGORY_KEYWORDS);
  const invalid = [];
  for (const p of products) {
    if (p.category && !validCategories.includes(p.category)) {
      invalid.push(p);
    }
  }
  return invalid;
}

// ─── 额外检查：不同 id 但 name 高度相似（疑似重复） ───
function findDuplicates(products) {
  const dupes = [];
  const seen = new Map();
  for (const p of products) {
    if (!p.name) continue;
    // 标准化名称做比较
    const key = p.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '').substring(0, 30);
    if (seen.has(key)) {
      dupes.push({ a: seen.get(key), b: p });
    } else {
      seen.set(key, p);
    }
  }
  return dupes;
}

// ─── 主流程 ─────────────────────────────────────────────
function main() {
  const startTime = Date.now();

  // 解析参数
  const srcIndex = process.argv.indexOf('--src');
  const srcPath = srcIndex !== -1 ? path.resolve(process.argv[srcIndex + 1]) : DEFAULT_SRC;

  if (!fs.existsSync(srcPath)) {
    console.error(`❌ 文件不存在: ${srcPath}`);
    process.exit(1);
  }

  console.log(`🔍 校验产品分类数据: ${path.relative(ROOT, srcPath)}`);
  console.log('');

  const products = parseProducts(srcPath);
  console.log(`📊 共 ${products.length} 个产品`);
  console.log('');

  // 1. 校验 category 值合法性
  const invalidCats = validateCategoryValues(products);
  if (invalidCats.length > 0) {
    console.log(`❌ 非法 category 值 (${invalidCats.length}):`);
    for (const p of invalidCats) {
      console.log(`   ${p.id}  category="${p.category}"  name="${truncate(p.name, 60)}"`);
    }
    console.log('');
  }

  // 2. 校验 name 关键词与 category 一致性
  const { errors, warnings } = validateProducts(products);

  if (errors.length > 0) {
    console.log(`❌ 分类关键词不匹配 (${errors.length} 个错误):`);
    console.log('');
    for (const err of errors) {
      console.log(`   [${err.id}] ${err.name}`);
      console.log(`          category: "${err.category}" 但 name 含关键字 "${err.keyword}" → 应为 ${err.impliedCategory}`);
      console.log('');
    }
  }

  if (warnings.length > 0) {
    console.log(`⚠️  可疑匹配 (${warnings.length} 个警告，建议人工审核):`);
    console.log('');
    for (const w of warnings) {
      console.log(`   [${w.id}] ${w.name}`);
      console.log(`          category: "${w.category}" / 关键字 "${w.keyword}" 暗示 ${w.impliedCategory} (${w.note})`);
      console.log('');
    }
  }

  // 3. 检查疑似重复
  const dupes = findDuplicates(products);
  if (dupes.length > 0) {
    console.log(`⚠️  疑似重复产品 (${dupes.length} 组):`);
    for (const { a, b } of dupes) {
      console.log(`   [${a.id}] "${truncate(a.name, 45)}"  ←→  [${b.id}] "${truncate(b.name, 45)}"`);
      console.log(`         ${a.category} / ${b.category}`);
    }
    console.log('');
  }

  // ─── 结果统计 ────────────────────────────────
  const hasErrors = errors.length > 0 || invalidCats.length > 0;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  错误:  ${errors.length + invalidCats.length}`);
  console.log(`  警告:  ${warnings.length}`);
  console.log(`  重复:  ${dupes.length}`);
  console.log(`  耗时:  ${elapsed}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (hasErrors) {
    console.log('\n❌ 校验未通过！请修复后重试。');
    process.exit(1);
  }

  if (warnings.length > 0 || dupes.length > 0) {
    console.log('\n✅ 无硬错误，但有警告和/或重复，建议审核。');
    process.exit(0);
  }

  console.log('\n✅ 全部产品分类校验通过！');
  process.exit(0);
}

main();
