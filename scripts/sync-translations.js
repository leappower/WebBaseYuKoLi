#!/usr/bin/env node
/**
 * sync-translations.js — 从 KitchenYuKoLi 同步 legal/privacy/user_agreement 翻译 keys 到 BrewYuKoLi
 *
 * 从每个 -ui.json 文件中提取所有以 privacy_ / user_agreement_ / footer_legal_ / meta_privacy / meta_terms / popup_privacy_note 开头的 key，
 * 合并到 Brew 的对应翻译文件中。如果 Brew 没有某个语言的翻译文件，则创建。
 */
const fs = require("fs");
const path = require("path");

const KITCHEN = path.join(require("os").homedir(), "Projects/KitchenYuKoLi/src/assets/lang");
const BREW = path.join(require("os").homedir(), "Projects/BrewYuKoLi/src/assets/lang");

const LEGAL_PREFIXES = ["privacy_", "user_agreement_", "footer_legal_", "meta_privacy", "meta_terms", "popup_privacy_note"];

function isLegalKey(k) {
  return LEGAL_PREFIXES.some(function(p) { return k.startsWith(p); });
}

function mergeAndAdapt(kitchenFile, brewFile) {
  var kitchen = JSON.parse(fs.readFileSync(kitchenFile, "utf8"));
  var brew = fs.existsSync(brewFile) ? JSON.parse(fs.readFileSync(brewFile, "utf8")) : {};

  var added = 0;
  Object.keys(kitchen).forEach(function(k) {
    if (isLegalKey(k) && brew[k] === undefined) {
      brew[k] = kitchen[k];
      added++;
    }
  });

  // Adapt Brew-specific values
  Object.keys(brew).forEach(function(k) {
    if (isLegalKey(k)) {
      // Replace kitchen email with brew email
      brew[k] = brew[k].replace(/support\.kitchen@yukoli\.com/g, "support@brew.yukoli.com");
      brew[k] = brew[k].replace(/kitchen@yukoli\.com/g, "brew.yukoli.com");

      // For section_2: replace kitchen description with brew description (only for user_agreement)
      if (k === "user_agreement_section_2_content" && brewFile.indexOf("/en-") >= 0) {
        brew[k] = "Our services are designed for health food OEM/ODM consultation, quoting, and procurement. We specialize in functional beverages, meal replacements, beauty supplements, and weight management products.";
      }
      if (k === "user_agreement_section_2_content" && brewFile.indexOf("/zh-CN-") >= 0) {
        brew[k] = "我们的服务专为健康食品 OEM/ODM 咨询、报价和采购而设计。我们专注于功能性饮品、代餐、美容口服液和体重管理产品。";
      }
    }
  });

  var sorted = {};
  Object.keys(brew).sort().forEach(function(k) { sorted[k] = brew[k]; });
  fs.writeFileSync(brewFile, JSON.stringify(sorted, null, 4) + "\n");
  return added;
}

// Process all Kitchen languages
var kitchenFiles = fs.readdirSync(KITCHEN).filter(function(f) { return f.endsWith("-ui.json"); });

kitchenFiles.forEach(function(file) {
  var kitchenFile = path.join(KITCHEN, file);
  var brewFile = path.join(BREW, file);

  // Ensure Brew directory exists (src/assets/lang/)
  if (!fs.existsSync(BREW)) {
    fs.mkdirSync(BREW, { recursive: true });
  }

  var added = mergeAndAdapt(kitchenFile, brewFile);
  var total = 0;
  if (fs.existsSync(brewFile)) {
    var b = JSON.parse(fs.readFileSync(brewFile, "utf8"));
    total = Object.keys(b).length;
  }
  console.log(file + ": added " + added + " legal keys (" + total + " total keys)");
});
