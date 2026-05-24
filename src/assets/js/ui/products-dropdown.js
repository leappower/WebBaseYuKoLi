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

  /* ───────────────────────── CSS ───────────────────────── */

  function injectStyles() {
    // CSS moved to styles.css
  }

  /* ───────────────────────── RENDER ───────────────────────── */

  function renderDropdown(cfg) {
    var parentHref = "/products/";
    var viewAllHref = "/products/all/";

    var viewAll =
      '<a href="' +
      esc(viewAllHref) +
      '" class="prod-dropdown-item prod-viewall-item">' +
      '<span class="prod-dropdown-icon">' +
      '<span class="material-symbols-outlined">grid_view</span>' +
      "</span>" +
      '<span class="prod-dropdown-label" data-i18n="nav_mega_view_all">View All Products</span>' +
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
      ' href="' +
      esc(cfg.href || "#") +
      '"' +
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
      items +
      '<div class="prod-dropdown-separator" style="margin: 4px 0;"></div>' +
      viewAll +
      "</div></div>" +
      "</div>"
    );
  }

  function _buildItem(sub, parentHref) {
    var itemHref = sub.href || parentHref;
    var chevron = '<span class="material-symbols-outlined prod-dropdown-chevron">chevron_right</span>';
    var emojiHtml = sub.emoji ? '<span class="prod-dropdown-emoji">' + sub.emoji + "</span>" : "";
    // NOTE: L2 items use config label directly (not data-i18n).
    // Translation keys like nav_products_tea don't exist in language files
    // (carried over from old KitchenYuKoLi), so data-i18n would cause the
    // translation manager to show the key string as fallback text.
    // Labels from SITE_CONFIG.categories are already bilingual objects
    // resolved by _buildCategoryItems → resolveLabel().
    return (
      '<a href="' +
      esc(itemHref) +
      '" class="prod-dropdown-item">' +
      '<span class="prod-dropdown-icon">' +
      '<span class="material-symbols-outlined">' +
      esc(sub.icon) +
      "</span>" +
      "</span>" +
      '<span class="prod-dropdown-label">' +
      esc(sub.label || sub.key) +
      "</span>" +
      chevron +
      "</a>"
    );
  }

  /* ───────────────────────── POPUP CONTENT ───────────────────────── */

  function buildPopupContent(items, parentHref) {
    var viewAllHtml =
      '<a href="/products/all/" class="prod-popup-item prod-viewall-item">' +
      '<span class="prod-dropdown-icon">' +
      '<span class="material-symbols-outlined">grid_view</span>' +
      "</span>" +
      '<span class="prod-popup-label" data-i18n="nav_mega_view_all">View All Products</span>' +
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

    return list + viewAllHtml;
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
