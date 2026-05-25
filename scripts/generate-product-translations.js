#!/usr/bin/env node

/**
 * generate-product-translations.js - 生成产品翻译数据骨架
 *
 * 用法：node scripts/generate-product-translations.js
 * 用法：node scripts/generate-product-translations.js --dry-run
 */

"use strict";

var fs = require("fs");
var path = require("path");

var productDataPath = path.join(__dirname, "../src/assets/js/product-data-table.js");
var translationsPath = path.join(__dirname, "../src/assets/js/product-data-table-translations.js");

// Load product data by executing the JS file in a sandboxed context
var productSrc = fs.readFileSync(productDataPath, "utf8");
productSrc = productSrc.replace(/window\.\w+\s*=\s*\w+;?/g, ""); // remove window assignments
productSrc = productSrc.replace(/window\.dispatchEvent.*/, "");
productSrc = productSrc.replace(/"use strict";/, "");
var getProductTable = new Function(productSrc + "\nreturn PRODUCT_DATA_TABLE;");
var products = getProductTable();
var categories = {};
var totalProducts = products.length;

products.forEach(function (p) {
  if (!categories[p.category]) categories[p.category] = [];
  categories[p.category].push(p);
});

// Generate translations skeleton
var translations = {};
products.forEach(function (p) {
  translations[p.model] = {
    nameZh: p.name,
    nameEn: "",
    descriptionZh: p.description || "",
    descriptionEn: ""
  };
});

// Build output file
var lines = [];
lines.push('/**');
lines.push(' * product-data-table-translations.js — 产品数据多语言翻译文件');
lines.push(' * ');
lines.push(' * 生成时间: ' + new Date().toISOString());
lines.push(' * 产品总数: ' + totalProducts);
lines.push(' * 分类: ' + Object.keys(categories).join(', '));
lines.push(' * ');
lines.push(' * 翻译说明:');
lines.push(' * - nameZh: 中文产品名称（已填充原始数据）');
lines.push(' * - nameEn: 英文产品名称（需人工翻译）');
lines.push(' * - descriptionZh: 中文产品描述（已填充原始数据）');
lines.push(' * - descriptionEn: 英文产品描述（需人工翻译）');
lines.push(' */');
lines.push('');
lines.push('"use strict";');
lines.push('');
lines.push('var PRODUCT_DATA_TRANSLATIONS = {');

Object.keys(categories).sort().forEach(function (cat) {
  lines.push('  // ' + cat + ' (' + categories[cat].length + ' SKU)');
  categories[cat].forEach(function (p) {
    var t = translations[p.model];
    lines.push('  "' + p.model + '": {');
    lines.push('    nameZh: ' + JSON.stringify(t.nameZh) + ',');
    lines.push('    nameEn: ' + JSON.stringify(t.nameEn) + ',');
    lines.push('    descriptionZh: ' + JSON.stringify(t.descriptionZh) + ',');
    lines.push('    descriptionEn: ' + JSON.stringify(t.descriptionEn));
    lines.push('  },');
  });
  lines.push('');
});

lines.push('};');
lines.push('');
lines.push('window.PRODUCT_DATA_TRANSLATIONS = PRODUCT_DATA_TRANSLATIONS;');

var output = lines.join('\n') + '\n';

if (process.argv.indexOf('--dry-run') !== -1) {
  console.log('Dry run - would generate translations for ' + totalProducts + ' products');
  console.log('Categories:');
  Object.keys(categories).sort().forEach(function (cat) {
    console.log('  ' + cat + ': ' + categories[cat].length + ' SKU');
  });
  // Show sample
  console.log('\nSample entry (CF-001):');
  console.log(JSON.stringify(translations['CF-001'], null, 2));
} else {
  fs.writeFileSync(translationsPath, output);
  console.log('Generated ' + translationsPath);
  console.log('Total: ' + totalProducts + ' products, ' + Object.keys(categories).length + ' categories');
}
