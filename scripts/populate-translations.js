#!/usr/bin/env node

/**
 * populate-translations.js - 自动填充翻译数据
 *
 * 策略：
 * 1. 已是英文名 → nameEn = name, nameZh = ""
 * 2. 已是中文名 → nameZh = name, nameEn = ""
 * 3. 泰语/马来语/混合 → 两边都留空待翻译
 *
 * 用法：node scripts/populate-translations.js
 */

"use strict";

var fs = require("fs");
var path = require("path");

var productDataPath = path.join(__dirname, "../src/assets/js/product-data-table.js");
var translationsPath = path.join(__dirname, "../src/assets/js/product-data-table-translations.js");

// Load product data
var productSrc = fs.readFileSync(productDataPath, "utf8");
productSrc = productSrc.replace(/window\.\w+\s*=\s*\w+;?/g, "").replace(/window\.dispatchEvent.*/, "").replace(/"use strict";/, "");
var fn = new Function(productSrc + "\nreturn PRODUCT_DATA_TABLE;");
var products = fn();

// Build product map by model
var productMap = {};
products.forEach(function(p) { productMap[p.model] = p; });

// Load existing translations
var transSrc = fs.readFileSync(translationsPath, "utf8");
var fn2 = new Function(transSrc.replace(/"use strict";/, "").replace(/window\.\w+\s*=\s*\w+;?/g, "") + "\nreturn PRODUCT_DATA_TRANSLATIONS;");
var translations = fn2();

// Language detection
function detectLang(name) {
  var hasZh = /[\u4e00-\u9fff]/.test(name);
  var hasTh = /[\u0e00-\u0e7f]/.test(name);
  var hasMs = /\b( teh|kopi|susu|yang|dengan|dari|dalam|untuk|dan|isi|pcs|box|pack|sachet|perisa|serbuk|wangi|halal|gr|กรัม|ซอง|แพ็ค|ผง|ชง|น้ำ|สำเร็จรูป)\b/i.test(name);
  
  if (hasTh) return "th";
  if (hasZh && hasMs) return "mixed";
  if (hasZh) return "zh";
  if (hasMs) return "ms";
  return "en";
}

var stats = { en: 0, zh: 0, th: 0, ms: 0, mixed: 0 };
var needsTranslation = [];
var done = 0;

products.forEach(function(p) {
  var t = translations[p.model];
  if (!t) return;
  
  var lang = detectLang(p.name);
  stats[lang]++;
  
  if (lang === "en") {
    // English name → use as nameEn, leave nameZh empty for manual translation
    if (!t.nameEn) { t.nameEn = p.name; done++; }
  } else if (lang === "zh") {
    // Chinese name → use as nameZh, leave nameEn empty for translation
    if (!t.nameZh) { t.nameZh = p.name; done++; }
  } else {
    // Thai/Malay/Mixed → both need translation
    // Keep original in nameZh for reference
    if (!t.nameZh) { t.nameZh = p.name; }
    needsTranslation.push(p.model + " (" + lang + "): " + p.name.substring(0, 60));
  }
  
  // Always copy description
  if (p.description && !t.descriptionZh) { t.descriptionZh = p.description; }
});

// Regenerate translations file
var lines = [];
lines.push("/**");
lines.push(" * product-data-table-translations.js");
lines.push(" * Auto-populated: " + new Date().toISOString());
lines.push(" * Products: " + products.length);
lines.push(" * Auto-assigned: " + done + " | Needs translation: " + (products.length - done));
lines.push(" * ");
lines.push(" * Language breakdown:");
lines.push(" *   English: " + stats.en + " (nameEn auto-filled)");
lines.push(" *   Chinese: " + stats.zh + " (nameZh auto-filled)");
lines.push(" *   Thai:    " + stats.th + " (needs nameEn + nameZh)");
lines.push(" *   Malay:   " + stats.ms + " (needs nameEn + nameZh)");
lines.push(" *   Mixed:   " + stats.mixed + " (needs nameEn + nameZh)");
lines.push(" */");
lines.push("");
lines.push('"use strict";');
lines.push("");
lines.push("var PRODUCT_DATA_TRANSLATIONS = {");

var cats = {};
products.forEach(function(p) {
  if (!cats[p.category]) cats[p.category] = [];
  cats[p.category].push(p);
});

Object.keys(cats).sort().forEach(function(cat) {
  lines.push("  // === " + cat + " (" + cats[cat].length + " SKU) ===");
  cats[cat].forEach(function(p) {
    var t = translations[p.model];
    if (!t) return;
    var lang = detectLang(p.name);
    var needsEn = !t.nameEn;
    var needsZh = lang !== "zh" && lang !== "en";
    var flags = [];
    if (needsEn) flags.push("TODO:nameEn");
    if (needsZh && lang !== "zh") flags.push("TODO:nameZh");
    
    lines.push('  "' + p.model + '": {');
    lines.push("    nameZh: " + JSON.stringify(t.nameZh || "") + ",");
    lines.push("    nameEn: " + JSON.stringify(t.nameEn || "") + ",");
    lines.push("    descriptionZh: " + JSON.stringify(t.descriptionZh || "") + ",");
    lines.push("    descriptionEn: " + JSON.stringify(t.descriptionEn || ""));
    lines.push("  }" + (flags.length ? " // " + flags.join(", ") : "") + ",");
  });
  lines.push("");
});

lines.push("};");
lines.push("");
lines.push("window.PRODUCT_DATA_TRANSLATIONS = PRODUCT_DATA_TRANSLATIONS;");

fs.writeFileSync(translationsPath, lines.join("\n") + "\n");

console.log("Done. " + products.length + " products processed.");
console.log("Auto-assigned: " + done);
console.log("Needs translation: " + needsTranslation.length);
console.log("");
console.log("=== NEEDS TRANSLATION ===");
needsTranslation.forEach(function(n) { console.log("  " + n); });
