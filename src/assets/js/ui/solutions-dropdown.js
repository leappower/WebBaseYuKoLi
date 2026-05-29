/**
 * solutions-dropdown.js — Solutions Dropdown（对齐 Products 结构）
 *
 * 桌面/平板：悬浮卡片式 dropdown，顶部"Solutions Center"总览入口 + 各子方案
 * 移动端：popup 弹窗，相同结构
 */

(function (global) {
  "use strict";

  var base = global.DropdownBase;
  if (!base) {
    console.warn("[solutions-dropdown] DropdownBase not loaded");
    return;
  }

  var esc = base.esc;
  var isTouch = base.isTouch;

  // ── 从 nav.items 读取 Solutions children ──────────────────
  function getChildren() {
    try {
      var items = (window.SITE_CONFIG || window._cfg || {}).nav && (window.SITE_CONFIG || window._cfg || {}).nav.items;
      if (!items) return [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === "solutions" && items[i].children) {
          return items[i].children;
        }
      }
    } catch (e) {
      /* silent */
    }
    return [];
  }

  function getLang() {
    var doc = document.documentElement;
    return (doc && doc.lang) || "zh-CN";
  }

  function resolveLabel(labelObj) {
    if (!labelObj) return "";
    if (typeof labelObj === "string") return labelObj;
    var lang = getLang();
    return labelObj[lang] || labelObj.en || labelObj["zh-CN"] || "";
  }

  // ── CSS（保持与 products-dropdown 一致） ─────────────────
  function injectStyles() {
    // CSS moved to styles.css
  }

  // ── 子项渲染 ──────────────────────────────────────────────
  function buildChildHtml(child) {
    var childHref = child.href || "/" + (child.slug || child.id) + "/";
    var childLabel = resolveLabel(child.label) || child.id;
    return (
      '<a href="' +
      esc(childHref) +
      '" class="nav-dropdown-item">' +
      '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' +
      esc(child.icon || "circle") +
      "</span></span>" +
      '<span class="nav-dropdown-label">' +
      esc(childLabel) +
      "</span>" +
      '<span class="material-symbols-outlined nav-dropdown-chevron">chevron_right</span>' +
      "</a>"
    );
  }

  // ── desktop / tablet dropdown ──────────────────────────────
  function renderDropdown(cfg) {
    var children = getChildren();

    var centerEntry =
      '<a href="/solutions/" class="nav-dropdown-item nav-dropdown-center">' +
      '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">design_services</span></span>' +
      '<span class="nav-dropdown-label" data-i18n="nav_solutions_center">Solutions Center</span>' +
      '<span class="material-symbols-outlined nav-dropdown-chevron">chevron_right</span>' +
      "</a>";

    var itemsHtml = children
      .map(function (child, idx) {
        var sep = idx < children.length - 1 ? '<div class="nav-dropdown-separator"></div>' : "";
        return buildChildHtml(child) + sep;
      })
      .join("\n");

    return (
      '<div class="nav-dropdown-wrap' +
      (isTouch() ? " touch-device" : "") +
      '">' +
      '<a class="' +
      esc(cfg.activeClass || "") +
      ' nav-dropdown-trigger" href="#" data-nav-trigger-label="' +
      esc(cfg.labelKey || "nav_solutions") +
      '">' +
      '<span data-i18n="' +
      esc(cfg.labelKey || "nav_solutions") +
      '">' +
      esc(cfg.label || "Solutions") +
      "</span>" +
      '<span class="material-symbols-outlined nav-dropdown-arrow">expand_more</span>' +
      "</a>" +
      '<div class="nav-dropdown-panel"><div class="nav-dropdown-card">' +
      centerEntry +
      '<div class="nav-dropdown-separator"></div>' +
      itemsHtml +
      "</div></div>" +
      "</div>"
    );
  }

  // ── mobile popup ──────────────────────────────────────────
  function buildPopupContent() {
    var children = getChildren();

    var centerHtml =
      '<a href="/solutions/" class="nav-dropdown-popup-item nav-dropdown-center">' +
      '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">design_services</span></span>' +
      '<span class="nav-dropdown-popup-label" data-i18n="nav_solutions_center">Solutions Center</span>' +
      '<span class="material-symbols-outlined nav-dropdown-popup-chevron">chevron_right</span>' +
      "</a>";
    centerHtml += '<div class="nav-dropdown-separator"></div>';

    var itemsHtml = children
      .map(function (child) {
        var childHref = child.href || "/" + (child.slug || child.id) + "/";
        var childLabel = resolveLabel(child.label) || child.id;
        return (
          '<a href="' +
          esc(childHref) +
          '" class="nav-dropdown-popup-item">' +
          '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' +
          esc(child.icon || "circle") +
          "</span></span>" +
          '<span class="nav-dropdown-popup-label">' +
          esc(childLabel) +
          "</span>" +
          '<span class="material-symbols-outlined nav-dropdown-popup-chevron">chevron_right</span>' +
          "</a>"
        );
      })
      .join("\n");

    return centerHtml + itemsHtml;
  }

  // ── 委托给 DropdownBase ──────────────────────────────────
  global.SolutionsDropdown = {
    renderPC: renderDropdown,
    renderTablet: renderDropdown,
    buildPopupContent: buildPopupContent,
    injectAllStyles: injectStyles,
    initDropdownClick: function () {
      document.querySelectorAll(".nav-dropdown-wrap .nav-dropdown-trigger").forEach(function (t) {
        if (t._solDropdownBound) return;
        t._solDropdownBound = true;
        t.addEventListener("click", function (e) {
          if (window.innerWidth <= 767) return;
          if (isTouch()) {
            e.preventDefault();
            e.stopPropagation();
            t.closest(".nav-dropdown-wrap").classList.toggle("is-open");
          }
        });
      });
    },
  };
})(window);
