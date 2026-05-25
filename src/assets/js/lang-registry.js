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
var _FALLBACK_LANGUAGES = [];

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
