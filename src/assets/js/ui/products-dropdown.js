/**
 * products-dropdown.js — Responsive Products Dropdown
 * Desktop / Tablet: floating card style
 * Mobile: iOS bottom sheet popup
 */

(function (global) {
  "use strict";
  var _theme = (window.SITE_CONFIG || window._cfg || {}).theme || {};
  var _primary = ((_theme.colors || {}).primary) || "#2E7D32";

  var esc = global.DropdownBase.esc;
  var isTouch = global.DropdownBase.isTouch;

  /* ───────────────────────── DATA ───────────────────────── */

  var _cfg = window.SITE_CONFIG || {};
  var _categories = _cfg.categories || {};

  /**
   * Resolve a label object to current language string
   * @param {*} labelObj
   * @returns {string}
   */
  function resolveLabel(labelObj) {
    if (!labelObj) return "";
    if (typeof labelObj === "string") return labelObj;
    var lang = (document.documentElement && document.documentElement.lang) || "zh-CN";
    return labelObj[lang] || labelObj.en || labelObj["zh-CN"] || "";
  }

  function _buildCategoryItems(categoryKey, parentPath) {
    var cats = _categories[categoryKey] || [];
    return cats.map(function (cat) {
      return {
        key: cat.i18nKey || ("nav_" + categoryKey + "_" + cat.slug),
        label: resolveLabel(cat.label) || cat.i18nKey || cat.slug,
        icon: cat.icon || "circle",
        emoji: cat.emoji || "",
        href: parentPath + (cat.slug || "") + "/",
      };
    });
  }

  var SUBSERIES = _buildCategoryItems("products", "/products/");

  /* ── Prepend: All Products entry ───────────────────────── */
  SUBSERIES.unshift({
    key: "all",
    label: (function(){
      var lang = (document.documentElement && document.documentElement.lang) || "zh-CN";
      return lang === "zh-CN" ? "全部产品" : "All Products";
    })(),
    icon: "grid_view",
    emoji: "📋",
    href: "/products/all/",
  });

  /* ───────────────────────── CSS ───────────────────────── */

  function injectStyles() {
    // CSS moved to styles.css
  }

  /* ───────────────────────── RENDER ───────────────────────── */

  function renderDropdown(cfg) {
    var parentHref = "/products/";

    var centerEntry =
      '<a href="' +
      esc(parentHref) +
      '" class="prod-dropdown-item prod-viewall-item">' +
      '<span class="prod-dropdown-icon">' +
      '<span class="material-symbols-outlined">store</span>' +
      "</span>" +
      '<span class="prod-dropdown-label" data-i18n="nav_products_center">Products Center</span>' +
      '<span class="material-symbols-outlined prod-dropdown-chevron">chevron_right</span>' +
      "</a>";

    var items = SUBSERIES.map(function (s, idx) {
      var html = _buildItem(s, parentHref);
      if (idx < SUBSERIES.length - 1) html += '<div class="prod-dropdown-separator"></div>';
      return html;
    }).join("\n");

    return (
      '<div class="prod-dropdown-wrap' +
      (isTouch() ? " touch-device" : "") +
      '">' +
      '<a class="' +
      esc(cfg.activeClass || "") +
      ' prod-dropdown-trigger"' +
      ' href="#"' +
      ' data-prod-trigger-label="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      '<span data-i18n="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      esc(cfg.label || cfg.labelKey) +
      "</span>" +
      '<span class="material-symbols-outlined prod-dropdown-arrow">expand_more</span>' +
      "</a>" +
      '<div class="prod-dropdown-panel"><div class="prod-dropdown-card">' +
      centerEntry +
      items +
      "</div></div>" +
      "</div>"
    );
  }

  function _buildItem(sub, parentHref) {
    var itemHref = sub.href || parentHref;
    var chevron = '<span class="material-symbols-outlined prod-dropdown-chevron">chevron_right</span>';
    var emojiHtml = sub.emoji ? '<span class="prod-dropdown-emoji">' + sub.emoji + "</span>" : "";
    // Use data-i18n so translations.js can update text when language switches.
    // Fallback label resolved by resolveLabel() for initial render before i18n loads.
    var i18nKey = sub.key || "";
    var fallbackLabel = esc(sub.label || sub.key);
    return (
      '<a href="' +
      esc(itemHref) +
      '" class="prod-dropdown-item">' +
      '<span class="prod-dropdown-icon">' +
      '<span class="material-symbols-outlined">' +
      esc(sub.icon) +
      "</span>" +
      "</span>" +
      '<span class="prod-dropdown-label" data-i18n="' + esc(i18nKey) + '">' +
      fallbackLabel +
      "</span>" +
      chevron +
      "</a>"
    );
  }

  /* ───────────────────────── POPUP CONTENT ───────────────────────── */

  function buildPopupContent(items, parentHref) {
    var centerHtml =
      '<a href="/products/" class="prod-popup-item prod-viewall-item">' +
      '<span class="prod-dropdown-icon">' +
      '<span class="material-symbols-outlined">store</span>' +
      "</span>" +
      '<span class="prod-popup-label" data-i18n="nav_products_center">Products Center</span>' +
      '<span class="material-symbols-outlined prod-popup-chevron">chevron_right</span>' +
      "</a>";

    var list = items
      .map(function (s) {
        var itemHref = s.href || parentHref;
        var chevron = '<span class="material-symbols-outlined prod-popup-chevron">chevron_right</span>';
        var emojiHtml = s.emoji ? '<span class="prod-popup-emoji">' + s.emoji + "</span>" : "";
        return (
          '<a href="' +
          esc(itemHref) +
          '" class="prod-popup-item">' +
          '<span class="prod-dropdown-icon">' +
          '<span class="material-symbols-outlined">' +
          esc(s.icon) +
          "</span>" +
          "</span>" +
          '<span class="prod-popup-label">' +
          esc(s.label || s.key) +
          "</span>" +
          emojiHtml +
          chevron +
          "</a>"
        );
      })
      .join("\n");

    return centerHtml + list;
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  global.ProductsDropdown = global.DropdownBase.create({
    prefix: "prod",
    getItems: function () {
      return SUBSERIES;
    },
    injectStyles: injectStyles,
    renderDropdown: renderDropdown,
    buildPopupContent: buildPopupContent,
    defaultHref: "/products/",
  });
})(window);
