/**
 * nav-dropdown.js — 通用导航 Dropdown（走 DropdownBase 体系）
 *
 * 替代逐个硬编码的 dropdown 模块。任何 L1 项只要在 nav.items[x].children
 * 有数据，就会自动渲染 dropdown 内容。
 *
 * 依赖：DropdownBase (isTouch, esc, _spaOn)
 * hover 模式：与 dropdown-styles.js 一致
 *   - touch 设备：click toggle is-open
 *   - 非 touch：CSS :not(.touch-device):hover 控制
 *
 * ES5 兼容。@audit-safe — 静态配置数据，无用户输入。
 */

(function () {
  "use strict";

  var base = window.DropdownBase;
  if (!base) {
    console.warn("[nav-dropdown] DropdownBase not loaded");
    return;
  }

  var esc = base.esc;
  var isTouch = base.isTouch;
  var _spaOn = base._spaOn;

  var WRAP_CLASS = "nav-dropdown-wrap";
  var TRIGGER_CLASS = "nav-dropdown-trigger";
  var PANEL_CLASS = "nav-dropdown-panel";
  var OVERLAY_CLASS = "nav-dropdown-popup-overlay";
  var POPUP_PANEL_CLASS = "nav-dropdown-popup-panel";
  var POPUP_ITEM_CLASS = "nav-dropdown-popup-item";

  var _docClickBound = false;
  var _triggerBoundFlag = "_navDropdownTriggerBound";
  var _popupBoundFlag = "_navDropdownPopupBound";

  // ── 获取当前语言 ─────────────────────────────────────────────
  function getLang() {
    var doc = document.documentElement;
    return (doc && doc.lang) || "zh-CN";
  }

  // ── 从 label 对象取文本 ─────────────────────────────────────
  function resolveLabel(labelObj) {
    if (!labelObj) return "";
    if (typeof labelObj === "string") return labelObj;
    var lang = getLang();
    return labelObj[lang] || labelObj.en || labelObj["zh-CN"] || "";
  }

  // ── 从 SITE_CONFIG 读取该 L1 的 children ────────────────────
  function getChildren(navId) {
    try {
      var items = (window.SITE_CONFIG || window._cfg || {}).nav && (window.SITE_CONFIG || window._cfg || {}).nav.items;
      if (!items) return [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === navId && items[i].children) {
          return items[i].children;
        }
      }
    } catch (e) { /* silent */ }
    return [];
  }

  // ── 构建子项 HTML ──────────────────────────────────────────
  function buildDropdownItem(child, showSep) {
    var childHref = child.href || ("/" + (child.slug || child.id) + "/");
    var childLabel = resolveLabel(child.label) || child.id;
    var childKey = child.i18nKey || ("nav_" + child.id);
    var iconHtml = "";
    if (child.icon) {
      iconHtml = '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' + esc(child.icon) + '</span></span>';
    } else if (child.emoji) {
      iconHtml = '<span class="nav-dropdown-icon"><span class="nav-dropdown-emoji">' + esc(child.emoji) + '</span></span>';
    }
    var sep = showSep ? '<div class="nav-dropdown-separator"></div>' : "";
    return (
      '<a href="' + esc(childHref) + '" class="nav-dropdown-item">' +
        iconHtml +
        '<span class="nav-dropdown-label" data-i18n="' + esc(childKey) + '">' + esc(childLabel) + '</span>' +
        '<span class="material-symbols-outlined nav-dropdown-chevron">chevron_right</span>' +
      "</a>" + sep
    );
  }

  // ── 主渲染函数 ──────────────────────────────────────────────
  function renderDropdown(cfg) {
    var navItem = cfg.navItem || {};
    var navId = navItem.id || "";
    var children = getChildren(navId);

    // 无子项：渲染为普通链接
    if (children.length === 0) {
      var href = cfg.href || ("/" + navId + "/");
      var label = resolveLabel(cfg.label) || navId;
      return '<a class="' + (cfg.activeClass || "") + '" href="' + esc(href) + '">' + esc(label) + "</a>";
    }

    var href = cfg.href || ("/" + navId + "/");
    var labelKey = cfg.labelKey || ("nav_" + navId);
    var label = resolveLabel(cfg.label) || navId;

    var itemsHtml = children.map(function (child, idx) {
      return buildDropdownItem(child, idx < children.length - 1);
    }).join("\n");

    return (
      '<div class="' + WRAP_CLASS + (isTouch() ? " touch-device" : "") + '">' +
        '<a class="' + esc(cfg.activeClass || "") + ' ' + TRIGGER_CLASS + '" href="' + esc(href) + '" data-nav-trigger-label="' + esc(labelKey) + '">' +
          '<span data-i18n="' + esc(labelKey) + '">' + esc(label) + '</span>' +
          '<span class="material-symbols-outlined nav-dropdown-arrow">expand_more</span>' +
        '</a>' +
        '<div class="' + PANEL_CLASS + '"><div class="nav-dropdown-card">' +
          itemsHtml +
        '</div></div>' +
      '</div>'
    );
  }

  // ── 样式注入 ────────────────────────────────────────────────
  var _stylesInjected = false;
  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    if (window.DropdownBaseStyles) window.DropdownBaseStyles.inject();

    var style = document.createElement("style");
    style.id = "nav-dropdown-styles";
    var _primary = ((window.SITE_CONFIG || {}).theme || {}).primary || "#2E7D32";
    style.textContent = [
      /* Wrap */
      ".nav-dropdown-wrap { position: relative; display: inline-block; }",
      /* Trigger */
      ".nav-dropdown-trigger {",
      "  display: inline-flex; align-items: center; gap: 2px; cursor: pointer; user-select: none;",
      "  color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent;",
      "  padding-bottom: 8px; margin-bottom: -8px;",
      "}",
      ".nav-dropdown-arrow { font-size: 16px; opacity: .5; transition: transform .25s cubic-bezier(.4,0,.2,1); }",
      ".nav-dropdown-wrap.is-open .nav-dropdown-arrow,",
      ".nav-dropdown-wrap:not(.touch-device):hover .nav-dropdown-arrow { transform: rotate(180deg); }",
      /* Panel */
      ".nav-dropdown-panel {",
      "  position: absolute; left: 50%; top: 100%; transform: translateX(-50%) scale(.97); transform-origin: top center;",
      "  opacity: 0; visibility: hidden; pointer-events: none;",
      "  transition: opacity .2s ease, transform .25s cubic-bezier(.32,.72,0,1), visibility 0s .2s;",
      "  z-index: 2500; padding-top: 8px;",
      "}",
      ".nav-dropdown-wrap.is-open .nav-dropdown-panel,",
      ".nav-dropdown-wrap:not(.touch-device):hover .nav-dropdown-panel {",
      "  opacity: 1; visibility: visible; pointer-events: auto;",
      "  transform: translateX(-50%) scale(1);",
      "  transition: opacity .2s ease, transform .35s cubic-bezier(.32,.72,0,1), visibility 0s 0s;",
      "}",
      /* Card */
      ".nav-dropdown-card {",
      "  background: rgba(246,246,248,1); border-radius: 13px; padding: 4px;",
      "  border: .5px solid rgba(0,0,0,.08);",
      "  box-shadow: 0 0 0 .5px rgba(0,0,0,.04), 0 8px 40px rgba(0,0,0,.12), 0 2px 12px rgba(0,0,0,.08);",
      "}",
      "html.dark .nav-dropdown-card { background: rgba(44,44,46,1); border-color: rgba(255,255,255,.12);",
      "  box-shadow: 0 0 0 .5px rgba(255,255,255,.06), 0 8px 40px rgba(0,0,0,.4), 0 2px 12px rgba(0,0,0,.3); }",
      /* Item */
      ".nav-dropdown-item {",
      "  display: flex; align-items: center; gap: 10px; padding: 9px 12px;",
      "  font-size: 13px; font-weight: 500; letter-spacing: -.01em; line-height: 1.38;",
      "  color: #1d1d1f; text-decoration: none; border-radius: 10px; position: relative;",
      "  transition: background .1s ease, transform .15s cubic-bezier(.32,.72,0,1);",
      "}",
      "html.dark .nav-dropdown-item { color: #f5f5f7; }",
      ".nav-dropdown-item:hover { background: rgba(236,91,19,.06); }",
      ".nav-dropdown-item:active { background: rgba(236,91,19,.12); transform: scale(.98); }",
      /* Icon */
      ".nav-dropdown-icon {",
      "  width: 28px; height: 28px; border-radius: 7px; background: rgba(236,91,19,.10);",
      "  display: flex; align-items: center; justify-content: center; flex-shrink: 0;",
      "}",
      "html.dark .nav-dropdown-icon { background: rgba(236,91,19,.18); }",
      ".nav-dropdown-icon .material-symbols-outlined { font-size: 16px; color: " + _primary + "; }",
      ".nav-dropdown-emoji { font-size: 16px; line-height: 1; }",
      /* Label */
      ".nav-dropdown-label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
      /* Chevron */
      ".nav-dropdown-chevron { margin-left: auto; font-size: 14px; color: rgba(60,60,67,.3); flex-shrink: 0; }",
      "html.dark .nav-dropdown-chevron { color: rgba(235,235,245,.25); }",
      /* Separator */
      ".nav-dropdown-separator { height: .5px; background: rgba(60,60,67,.12); margin: 0 12px 0 50px; }",
      "html.dark .nav-dropdown-separator { background: rgba(235,235,245,.15); }",
      /* Mobile popup */
      ".nav-dropdown-popup-overlay {",
      "  position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 998;",
      "  animation: dd-fade-in .2s ease;",
      "}",
      ".nav-dropdown-popup-panel {",
      "  position: fixed; left: 8px; right: 8px; bottom: 0;",
      "  background: rgba(246,246,248,.97); border-radius: 14px 14px 0 0;",
      "  transform: translateY(100%);",
      "  transition: transform .35s cubic-bezier(.32,.72,0,1);",
      "  z-index: 999; padding: 8px 4px calc(16px + env(safe-area-inset-bottom)) 4px;",
      "  box-shadow: 0 -2px 20px rgba(0,0,0,.1);",
      "}",
      ".nav-dropdown-popup-panel.is-open { transform: translateY(0); }",
      "html.dark .nav-dropdown-popup-panel { background: rgba(44,44,46,.97); box-shadow: 0 -2px 20px rgba(0,0,0,.4); }",
      ".nav-dropdown-popup-handle { width: 36px; height: 5px; border-radius: 3px; background: rgba(60,60,67,.25); margin: 0 auto 8px; }",
      "html.dark .nav-dropdown-popup-handle { background: rgba(235,235,245,.2); }",
      ".nav-dropdown-popup-item {",
      "  display: flex; align-items: center; gap: 12px; padding: 12px 16px;",
      "  font-size: 17px; font-weight: 400; color: #1d1d1f; text-decoration: none;",
      "  border-radius: 10px; margin: 0 4px;",
      "  transition: background .1s ease, transform .15s cubic-bezier(.32,.72,0,1);",
      "}",
      "html.dark .nav-dropdown-popup-item { color: #f5f5f7; }",
      ".nav-dropdown-popup-item:hover { background: rgba(236,91,19,.06); }",
      "html.dark .nav-dropdown-popup-item:hover { background: rgba(236,91,19,.10); }",
      ".nav-dropdown-popup-item:active { background: rgba(236,91,19,.12); transform: scale(.98); }",
      ".nav-dropdown-popup-label { flex: 1; min-width: 0; }",
      ".nav-dropdown-popup-chevron { font-size: 16px; color: rgba(60,60,67,.3); flex-shrink: 0; }",
      "html.dark .nav-dropdown-popup-chevron { color: rgba(235,235,245,.25); }",
      /* Mobile hide panel */
      "@media (max-width: 720px) { .nav-dropdown-panel { display: none !important; } }",
    ].join("\n");
    document.head.appendChild(style);
  }

  // ── 桌面端 click 交互 ──────────────────────────────────────
  function bindTriggers() {
    document.querySelectorAll("." + TRIGGER_CLASS).forEach(function (t) {
      if (t[_triggerBoundFlag]) return;
      t[_triggerBoundFlag] = true;
      t.addEventListener("click", function (e) {
        if (window.innerWidth <= 720) return;
        if (isTouch()) {
          e.preventDefault();
          e.stopPropagation();
          t.closest("." + WRAP_CLASS).classList.toggle("is-open");
        }
      });
    });
  }

  function initDropdownClick() {
    if (!_docClickBound) {
      _docClickBound = true;
      document.addEventListener("click", function () {
        document.querySelectorAll("." + WRAP_CLASS + ".is-open").forEach(function (d) {
          d.classList.remove("is-open");
        });
      });
    }
    bindTriggers();
  }

  // ── 移动端 popup ────────────────────────────────────────────
  function openPopup(navId) {
    closePopup();
    var children = getChildren(navId);
    if (!children.length) return;

    var overlay = document.createElement("div");
    overlay.className = OVERLAY_CLASS;
    var panel = document.createElement("div");
    panel.className = POPUP_PANEL_CLASS;

    var itemsHtml = children.map(function (child) {
      var childHref = child.href || ("/" + (child.slug || child.id) + "/");
      var childLabel = resolveLabel(child.label) || child.id;
      var childKey = child.i18nKey || ("nav_" + child.id);
      var iconHtml = "";
      if (child.icon) {
        iconHtml = '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' + esc(child.icon) + '</span></span>';
      } else if (child.emoji) {
        iconHtml = '<span class="nav-dropdown-emoji">' + esc(child.emoji) + '</span>';
      }
      return (
        '<a href="' + esc(childHref) + '" class="' + POPUP_ITEM_CLASS + '">' +
          iconHtml +
          '<span class="nav-dropdown-popup-label" data-i18n="' + esc(childKey) + '">' + esc(childLabel) + '</span>' +
          '<span class="material-symbols-outlined nav-dropdown-popup-chevron">chevron_right</span>' +
        '</a>'
      );
    }).join("\n");

    /* @audit-safe: config-driven-render */
    panel.innerHTML = '<div class="nav-dropdown-popup-handle"></div>' + itemsHtml;

    if (window.translationManager) {
      panel.querySelectorAll("[data-i18n]").forEach(function (el) {
        var val = window.translationManager.translate(el.getAttribute("data-i18n"));
        if (val && val !== el.getAttribute("data-i18n")) el.textContent = val;
      });
    }

    overlay.onclick = closePopup;
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    panel.querySelectorAll("." + POPUP_ITEM_CLASS).forEach(function (item) {
      item.addEventListener("click", function () { closePopup(); });
    });

    requestAnimationFrame(function () {
      panel.classList.add("is-open");
      navigator.vibrate && navigator.vibrate(12);
    });
  }

  function closePopup() {
    document.querySelectorAll("." + OVERLAY_CLASS + ",." + POPUP_PANEL_CLASS).forEach(function (el) {
      el.parentNode && el.parentNode.removeChild(el);
    });
  }

  function bindAllPopupTriggers() {
    document.querySelectorAll("[data-nav-popup]").forEach(function (el) {
      if (el[_popupBoundFlag]) return;
      el[_popupBoundFlag] = true;
      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openPopup(el.getAttribute("data-nav-popup") || "products");
      });
    });
  }

  // ── SPA 清理 ────────────────────────────────────────────────
  _spaOn(document, "spa:load", function () {
    closePopup();
    bindAllPopupTriggers();
  }, "spa:load:navDropdown");

  // ── 键盘导航 ────────────────────────────────────────────────
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var openWrap = document.querySelector("." + WRAP_CLASS + ".is-open");
      if (openWrap) { openWrap.classList.remove("is-open"); return; }
      var openPanel = document.querySelector("." + POPUP_PANEL_CLASS + ".is-open");
      if (openPanel) { closePopup(); return; }
    }
  });

  // ── 公开 API ────────────────────────────────────────────────
  window.NavDropdown = {
    renderPC: renderDropdown,
    renderTablet: renderDropdown,
    initDropdownClick: initDropdownClick,
    openPopup: openPopup,
    closePopup: closePopup,
    bindAllPopupTriggers: bindAllPopupTriggers,
    injectAllStyles: injectStyles,
  };
})();
