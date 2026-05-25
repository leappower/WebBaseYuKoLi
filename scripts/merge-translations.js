#!/usr/bin/env node

/**
 * merge-translations.js - 重新生成翻译文件（从 scratch）
 */

"use strict";

var fs = require("fs");
var path = require("path");

var productDataPath = path.join(__dirname, "../src/assets/js/product-data-table.js");
var translationsPath = path.join(__dirname, "../src/assets/js/product-data-table-translations.js");

// Load product data
var productSrc = fs.readFileSync(productDataPath, "utf8");
productSrc = productSrc.replace(/window\.\w+\s*=\s*\w+;?/g,"").replace(/window\.dispatchEvent.*/,"").replace(/"use strict";/,"");
var pfn = new Function(productSrc + "\nreturn PRODUCT_DATA_TABLE;");
var products = pfn();

// Build initial translations from product data
var translations = {};
products.forEach(function(p) {
  var n = p.name;
  var hasZh = /[\u4e00-\u9fff]/.test(n) || /[\u3400-\u4dbf]/.test(n);
  var hasTh = /[\u0e00-\u0e7f]/.test(n);
  translations[p.model] = {
    nameZh: (hasZh || hasTh) ? n : "",
    nameEn: hasZh ? "" : (hasTh ? "" : n),
    descriptionZh: p.description || "",
    descriptionEn: ""
  };
});

// Load batch translations
function loadBatch(filePath) {
  try {
    var absPath = path.join(__dirname, filePath);
    var data = fs.readFileSync(absPath, "utf8");
    return data.trim().split("\n").filter(Boolean).map(function(line) {
      return JSON.parse(line);
    });
  } catch(e) {
    return [];
  }
}

var batchFiles = ["translations-batch1-2.json", "translations-batch3.json", "translations-cn-to-en.json"];
batchFiles.forEach(function(fName) {
  var items = loadBatch(fName);
  items.forEach(function(item) {
    if (item && item.model && translations[item.model]) {
      if (item.nameZh) translations[item.model].nameZh = item.nameZh;
      if (item.nameEn) translations[item.model].nameEn = item.nameEn;
    }
  });
  if (items.length > 0) console.log("Merged " + items.length + " translations from " + fName);
});

// Check completion
var missingZh = 0, missingEn = 0;
products.forEach(function(p) {
  var t = translations[p.model];
  if (t && !t.nameZh) missingZh++;
  if (t && !t.nameEn) missingEn++;
});

console.log("Missing nameZh: " + missingZh + " | Missing nameEn: " + missingEn);

// Generate clean JS output
var lines = [];
lines.push('"use strict";');
lines.push('');
lines.push('// product-data-table-translations.js — 产品多语言翻译文件');
lines.push('// Products: ' + products.length + ' | Generated: ' + new Date().toISOString());
lines.push('// Missing nameZh: ' + missingZh + ' | Missing nameEn: ' + missingEn);
lines.push('');
lines.push('var PRODUCT_DATA_TRANSLATIONS = {');

var cats = {};
products.forEach(function(p) {
  if (!cats[p.category]) cats[p.category] = [];
  cats[p.category].push(p);
});

Object.keys(cats).sort().forEach(function(cat) {
  lines.push('  // ' + cat + ' (' + cats[cat].length + ' SKU)');
  cats[cat].forEach(function(p) {
    var t = translations[p.model];
    if (!t) return;
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

fs.writeFileSync(translationsPath, lines.join('\n') + '\n');
console.log('Generated ' + translationsPath + ' (' + products.length + ' products)');
