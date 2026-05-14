/**
 * lang-registry.js — 语言注册表（config-driven）
 *
 * 优先从 site.config.js → window.SITE_CONFIG.i18n.languages 读取语言数据。
 * 若 config 未加载，则使用内嵌 fallback 数组（与 site.config.js 保持同步）。
 *
 * 使用方式：
 *   Node.js:  const { LANGUAGES, getLangs } = require('./lang-registry');
 *   Browser:  window.LANG_REGISTRY.LANGUAGES
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Fallback 语言数据（与 site.config.js i18n.languages 保持同步）
// ─────────────────────────────────────────────────────────────────────────────
var _FALLBACK_LANGUAGES = [
  { code: "zh-CN", nativeName: "中文（简体）", englishName: "Chinese (Simplified)", hasTranslation: true, uiGroup: "common", sortOrder: 1, currency: { symbol: "¥", code: "CNY", rate: 1, unit: "万元" } },
  { code: "en", nativeName: "English", englishName: "English", hasTranslation: true, uiGroup: "common", sortOrder: 2, currency: { symbol: "$", code: "USD", rate: 0.14, unit: "K" } },
  { code: "th", nativeName: "ไทย", englishName: "Thai", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 3, currency: { symbol: "฿", code: "THB", rate: 5.0, unit: "ล้าน" } },
  { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 4, currency: { symbol: "₫", code: "VND", rate: 3400, unit: "Triệu" } },
  { code: "ms", nativeName: "Bahasa Melayu", englishName: "Malay", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 5, currency: { symbol: "RM", code: "MYR", rate: 0.65, unit: "Juta" } },
  { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 6, currency: { symbol: "Rp", code: "IDR", rate: 2200, unit: "Juta" } },
  { code: "fil", nativeName: "Filipino", englishName: "Filipino", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 7, currency: { symbol: "₱", code: "PHP", rate: 0.017, unit: "K" } },
  { code: "km", nativeName: "ភាសាខ្មែរ", englishName: "Khmer", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 8, currency: { symbol: "៛", code: "KHR", rate: 4100, unit: "ម៉ឺន" } },
  { code: "lo", nativeName: "ລາວ", englishName: "Lao", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 9, currency: { symbol: "₭", code: "LAK", rate: 22000, unit: "ລ້ານ" } },
  { code: "my", nativeName: "မြန်မာဘာသာ", englishName: "Burmese", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 10, currency: { symbol: "K", code: "MMK", rate: 2100, unit: "K" } },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", hasTranslation: true, uiGroup: "east_asia", sortOrder: 11, currency: { symbol: "¥", code: "JPY", rate: 21, unit: "万円", label: "JP¥" } },
  { code: "ko", nativeName: "한국어", englishName: "Korean", hasTranslation: true, uiGroup: "east_asia", sortOrder: 12, currency: { symbol: "₩", code: "KRW", rate: 188, unit: "백만" } },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", hasTranslation: true, uiGroup: "other", sortOrder: 13, currency: { symbol: "₹", code: "INR", rate: 11.5, unit: "Lakh" } },
  { code: "zh-TW", nativeName: "中文（繁體）", englishName: "Chinese (Traditional)", hasTranslation: true, uiGroup: "other", sortOrder: 14, currency: { symbol: "NT$", code: "TWD", rate: 4.4, unit: "萬元" } },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", hasTranslation: true, uiGroup: "middle_east", sortOrder: 15, currency: { symbol: "ر.س", code: "SAR", rate: 0.52, unit: "K" } },
  { code: "he", nativeName: "עברית", englishName: "Hebrew", hasTranslation: true, uiGroup: "middle_east", sortOrder: 16, currency: { symbol: "₪", code: "ILS", rate: 3.7, unit: "K" } },
  { code: "tr", nativeName: "Türkçe", englishName: "Turkish", hasTranslation: true, uiGroup: "middle_east", sortOrder: 17, currency: { symbol: "₺", code: "TRY", rate: 30, unit: "K" } },
  { code: "fr", nativeName: "Français", englishName: "French", hasTranslation: true, uiGroup: "european", sortOrder: 18, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
  { code: "de", nativeName: "Deutsch", englishName: "German", hasTranslation: true, uiGroup: "european", sortOrder: 19, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
  { code: "es", nativeName: "Español", englishName: "Spanish", hasTranslation: true, uiGroup: "european", sortOrder: 20, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", hasTranslation: true, uiGroup: "european", sortOrder: 21, currency: { symbol: "R$", code: "BRL", rate: 5.0, unit: "K" } },
  { code: "ru", nativeName: "Русский", englishName: "Russian", hasTranslation: true, uiGroup: "european", sortOrder: 22, currency: { symbol: "₽", code: "RUB", rate: 92, unit: "K" } },
  { code: "it", nativeName: "Italiano", englishName: "Italian", hasTranslation: true, uiGroup: "european", sortOrder: 23, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
  { code: "nl", nativeName: "Nederlands", englishName: "Dutch", hasTranslation: true, uiGroup: "european", sortOrder: 24, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
  { code: "pl", nativeName: "Polski", englishName: "Polish", hasTranslation: true, uiGroup: "european", sortOrder: 25, currency: { symbol: "zł", code: "PLN", rate: 4.0, unit: "K" } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Config bridge: 优先读取 SITE_CONFIG，fallback 到内嵌数据
// ─────────────────────────────────────────────────────────────────────────────
function _resolveLanguages() {
  var cfg = (typeof window !== "undefined" && (window.SITE_CONFIG || window._cfg)) || {};
  if (cfg.i18n && cfg.i18n.languages && cfg.i18n.languages.length > 0) {
    return cfg.i18n.languages;
  }
  return _FALLBACK_LANGUAGES;
}

// 防止重复加载
if (typeof window !== "undefined" && window.LANG_REGISTRY && window.LANG_REGISTRY.LANGUAGES) {
  var LANGUAGES = window.LANG_REGISTRY.LANGUAGES;
} else {
  var LANGUAGES = _resolveLanguages();
}

// ─────────────────────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 筛选语言
 * @param {{ group?: string, hasTranslation?: boolean }} [filter]
 * @returns {Array} 符合条件的语言记录，按 sortOrder 升序
 */
function getLangs(filter) {
  var result = LANGUAGES.slice().sort(function (a, b) {
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
  if (!filter) return result;
  if (filter.group !== undefined) {
    result = result.filter(function (l) {
      return l.uiGroup === filter.group;
    });
  }
  if (filter.hasTranslation !== undefined) {
    result = result.filter(function (l) {
      return l.hasTranslation === filter.hasTranslation;
    });
  }
  return result;
}

/**
 * 返回 { code: nativeName } 映射
 */
function getNativeNames(filter) {
  return getLangs(filter).reduce(function (acc, l) {
    acc[l.code] = l.nativeName;
    return acc;
  }, {});
}

// ─────────────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────────────

// Node.js 环境
if (typeof module !== "undefined" && module.exports) {
  function getSupportedCodes(filter) {
    return getLangs(filter).map(function (l) { return l.code; });
  }
  function getAllCodes() {
    return LANGUAGES.map(function (l) { return l.code; });
  }
  function getEnglishNames(filter) {
    return getLangs(filter).reduce(function (acc, l) {
      acc[l.code] = l.englishName;
      return acc;
    }, {});
  }

  module.exports = {
    LANGUAGES: LANGUAGES,
    getLangs: getLangs,
    getNativeNames: getNativeNames,
    getSupportedCodes: getSupportedCodes,
    getAllCodes: getAllCodes,
    getEnglishNames: getEnglishNames,
    /** @deprecated Use SITE_CONFIG.i18n.languages directly */
    _FALLBACK_LANGUAGES: _FALLBACK_LANGUAGES,
  };
}

// 浏览器环境
if (typeof window !== "undefined") {
  window.LANG_REGISTRY = {
    LANGUAGES: LANGUAGES,
    getLangs: getLangs,
    getNativeNames: getNativeNames,
  };
}
