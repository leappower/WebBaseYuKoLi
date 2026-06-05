/**
 * dropdown-styles.js — Shared dropdown base styles
 *
 * Generates identical CSS for all dropdown prefixes (abt, cnt, prod, sol, sup, app).
 * Each dropdown's injectStyles() calls injectDropdownBaseStyles() first,
 * then adds only its own unique overrides (e.g. WhatsApp green, ROI badge, emoji).
 *
 * Consumed by: about-dropdown.js, products-dropdown.js,
 *              support-dropdown.js, applications-dropdown.js
 */

(function (global) {
  "use strict";
  var _theme = (window.SITE_CONFIG || window._cfg || {}).theme || {};
  var _primary = (_theme.colors || {}).primary || "#2E7D32";

  /**
   * Shared style template — uses {{PREFIX}} placeholder.
   * Includes: trigger, arrow, wrap, panel, card, item, icon, label, chevron,
   *           separator, popup overlay/panel/handle/item/label/chevron,
   *           dark mode, @keyframes, mobile media query.
   */
  var TEMPLATE = [
    /* ===== Trigger ===== */
    ".{{PREFIX}}-dropdown-trigger {",
    "  display: inline-flex; align-items: center; gap: 4px;",
    "  cursor: pointer; user-select: none;",
    "  text-decoration: none;",
    "  -webkit-tap-highlight-color: transparent;",
    "  padding-bottom: 8px; margin-bottom: -8px;",
    "}",

    ".{{PREFIX}}-dropdown-arrow {",
    "  font-size: 16px; opacity: .5;",
    "  transition: transform .25s cubic-bezier(.4,0,.2,1);",
    "}",

    ".{{PREFIX}}-dropdown-wrap.is-open .{{PREFIX}}-dropdown-arrow,",
    ".{{PREFIX}}-dropdown-wrap:not(.touch-device):hover .{{PREFIX}}-dropdown-arrow {",
    "  transform: rotate(180deg);",
    "}",

    /* ===== Wrap ===== */
    ".{{PREFIX}}-dropdown-wrap { position: relative; display: inline-block; }",

    /* ===== Panel — floating card animation ===== */
    ".{{PREFIX}}-dropdown-panel {",
    "  position: absolute; left: 50%; top: 100%;",
    "  transform: translateX(-50%) scale(.97); transform-origin: top center;",
    "  opacity: 0; visibility: hidden; pointer-events: none;",
    "  transition: opacity .2s ease, transform .25s cubic-bezier(.32,.72,0,1), visibility 0s .2s;",
    "  z-index: 2500; padding-top: 8px;",
    "}",

    ".{{PREFIX}}-dropdown-wrap.is-open .{{PREFIX}}-dropdown-panel,",
    ".{{PREFIX}}-dropdown-wrap:not(.touch-device):hover .{{PREFIX}}-dropdown-panel {",
    "  opacity: 1; visibility: visible; pointer-events: auto;",
    "  transform: translateX(-50%) scale(1);",
    "  transition: opacity .2s ease, transform .35s cubic-bezier(.32,.72,0,1), visibility 0s 0s;",
    "}",

    /* ===== Card ===== */
    ".{{PREFIX}}-dropdown-card {",
    "  background: rgba(246,246,248,1);",
    "  border-radius: 13px; padding: 4px;",
    "  border: .5px solid rgba(0,0,0,.08);",
    "  box-shadow: 0 0 0 .5px rgba(0,0,0,.04), 0 8px 40px rgba(0,0,0,.12), 0 2px 12px rgba(0,0,0,.08);",
    "}",

    "html.dark .{{PREFIX}}-dropdown-card {",
    "  background: rgba(44,44,46,1); border-color: rgba(255,255,255,.12);",
    "  box-shadow: 0 0 0 .5px rgba(255,255,255,.06), 0 8px 40px rgba(0,0,0,.4), 0 2px 12px rgba(0,0,0,.3);",
    "}",

    /* ===== Item ===== */
    ".{{PREFIX}}-dropdown-item {",
    "  display: flex; align-items: center; gap: 10px; padding: 9px 12px;",
    "  font-size: 13px; font-weight: 500; letter-spacing: -.01em; line-height: 1.38;",
    "  color: #1d1d1f; text-decoration: none; border-radius: 10px; position: relative;",
    "  transition: background .1s ease, transform .15s cubic-bezier(.32,.72,0,1);",
    "}",

    "html.dark .{{PREFIX}}-dropdown-item { color: #f5f5f7; }",

    ".{{PREFIX}}-dropdown-item:hover { background: rgba(236,91,19,.06); }",

    ".{{PREFIX}}-dropdown-item:active { background: rgba(236,91,19,.12); transform: scale(.98); }",

    ".{{PREFIX}}-dropdown-item.is-active { background: rgba(236,91,19,.08); color: ' + _primary + '; }",

    "html.dark .{{PREFIX}}-dropdown-item.is-active { background: rgba(236,91,19,.14); color: #f97316; }",

    "html.dark .{{PREFIX}}-dropdown-item:hover { background: rgba(236,91,19,.10); }",

    "html.dark .{{PREFIX}}-dropdown-item:active { background: rgba(236,91,19,.18); }",

    /* ===== Active sub-item ===== */
    ".{{PREFIX}}-dropdown-item.is-active {",
    "  background: rgba(236,91,19,.08);",
    "  font-weight: 600;",
    "}",
    ".{{PREFIX}}-dropdown-item.is-active .{{PREFIX}}-dropdown-chevron { color: ' + _primary + '; }",
    "html.dark .{{PREFIX}}-dropdown-item.is-active { background: rgba(236,91,19,.14); }",

    /* ===== Icon ===== */
    ".{{PREFIX}}-dropdown-icon {",
    "  width: 28px; height: 28px; border-radius: 7px;",
    "  background: rgba(236,91,19,.10);",
    "  display: flex; align-items: center; justify-content: center; flex-shrink: 0;",
    "}",

    "html.dark .{{PREFIX}}-dropdown-icon { background: rgba(236,91,19,.18); }",

    ".{{PREFIX}}-dropdown-icon .material-symbols-outlined { font-size: 16px; color: ' + _primary + '; }",

    /* ===== Label ===== */
    ".{{PREFIX}}-dropdown-label {",
    "  flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",
    "}",

    /* ===== Chevron ===== */
    ".{{PREFIX}}-dropdown-chevron {",
    "  margin-left: auto; font-size: 14px; color: rgba(60,60,67,.3); flex-shrink: 0;",
    "}",

    "html.dark .{{PREFIX}}-dropdown-chevron { color: rgba(235,235,245,.25); }",

    /* ===== Separator ===== */
    ".{{PREFIX}}-dropdown-separator {",
    "  height: .5px; background: rgba(60,60,67,.12); margin: 0 12px 0 50px;",
    "}",

    "html.dark .{{PREFIX}}-dropdown-separator { background: rgba(235,235,245,.15); }",

    /* ===== Mobile — hide panel ===== */
    "@media (max-width: 767px) { .{{PREFIX}}-dropdown-panel { display: none !important; } }",

    /* ===== Popup — iOS bottom sheet ===== */
    ".{{PREFIX}}-popup-overlay {",
    "  position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 998;",
    "  animation: dd-fade-in .2s ease;",
    "}",

    ".{{PREFIX}}-popup-panel {",
    "  position: fixed; left: 8px; right: 8px; bottom: 0;",
    "  background: rgba(246,246,248,.97);",
    "  border-radius: 14px 14px 0 0; transform: translateY(100%);",
    "  transition: transform .35s cubic-bezier(.32,.72,0,1);",
    "  z-index: 999; padding: 8px 4px calc(16px + env(safe-area-inset-bottom)) 4px;",
    "  box-shadow: 0 -2px 20px rgba(0,0,0,.1);",
    "}",

    ".{{PREFIX}}-popup-panel.is-open { transform: translateY(0); }",

    "html.dark .{{PREFIX}}-popup-panel {",
    "  background: rgba(44,44,46,.97); box-shadow: 0 -2px 20px rgba(0,0,0,.4);",
    "}",

    /* iOS drag indicator */
    ".{{PREFIX}}-popup-handle {",
    "  width: 36px; height: 5px; border-radius: 3px;",
    "  background: rgba(60,60,67,.25); margin: 0 auto 8px;",
    "}",

    "html.dark .{{PREFIX}}-popup-handle { background: rgba(235,235,245,.2); }",

    /* Popup items */
    ".{{PREFIX}}-popup-item {",
    "  display: flex; align-items: center; gap: 12px; padding: 12px 16px;",
    "  font-size: 17px; font-weight: 400; color: #1d1d1f; text-decoration: none;",
    "  border-radius: 10px; margin: 0 4px;",
    "  transition: background .1s ease, transform .15s cubic-bezier(.32,.72,0,1);",
    "}",

    "html.dark .{{PREFIX}}-popup-item { color: #f5f5f7; }",

    ".{{PREFIX}}-popup-item:hover { background: rgba(236,91,19,.06); }",

    "html.dark .{{PREFIX}}-popup-item:hover { background: rgba(236,91,19,.10); }",

    ".{{PREFIX}}-popup-item:active { background: rgba(236,91,19,.12); transform: scale(.98); }",

    "html.dark .{{PREFIX}}-popup-item:active { background: rgba(236,91,19,.18); }",

    ".{{PREFIX}}-popup-item.is-active {",
    "  background: rgba(236,91,19,.08);",
    "  font-weight: 600;",
    "}",
    ".{{PREFIX}}-popup-item.is-active .{{PREFIX}}-popup-chevron { color: ' + _primary + '; }",
    "html.dark .{{PREFIX}}-popup-item.is-active { background: rgba(236,91,19,.14); }",

    ".{{PREFIX}}-popup-label { flex: 1; min-width: 0; }",

    ".{{PREFIX}}-popup-chevron { font-size: 16px; color: rgba(60,60,67,.3); flex-shrink: 0; }",

    "html.dark .{{PREFIX}}-popup-chevron { color: rgba(235,235,245,.25); }",
  ].join("\n");

  var PREFIXES = ["abt", "cnt", "prod", "sol", "sup", "app", "nav"];
  var STYLE_ID = "dd-base-styles";

  /**
   * Inject shared dropdown base styles for all prefixes.
   * Idempotent — safe to call multiple times.
   */
  function injectDropdownBaseStyles() {
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.setAttribute("data-ver", "2026-03-25-v1");

    var css = PREFIXES.map(function (pfx) {
      return TEMPLATE.replace(/\{\{PREFIX\}\}/g, pfx);
    }).join("\n\n");

    // Shared @keyframes (only once)
    css += "\n@keyframes dd-fade-in { from { opacity: 0; } to { opacity: 1; } }\n";

    style.textContent = css;
    document.head.appendChild(style);
  }

  window.DropdownBaseStyles = {
    inject: injectDropdownBaseStyles,
    STYLE_ID: STYLE_ID,
  };
})(window);
/**
 * dropdown-base.js — Shared dropdown infrastructure (factory pattern)
 *
 * Provides common utilities (_spaOn, esc, isTouch) and a createModule()
 * factory that generates the interaction layer (bindTriggers, initDropdownClick,
 * openPopup, closePopup, bindAllPopupTriggers) for each dropdown module.
 *
 * Must be loaded BEFORE any dropdown module that uses it.
 *
 * Consumed by: products-dropdown.js, applications-dropdown.js,
 *              support-dropdown.js, about-dropdown.js
 */

(function (global) {
  "use strict";

  /* ───────────────────────── SHARED UTILITIES ───────────────────────── */

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  function esc(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function isTouch() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  /* ───────────────────────── FACTORY ───────────────────────── */

  /**
   * Create a dropdown module with standard interaction behaviour.
   *
   * @param {Object} cfg
   * @param {string} cfg.prefix          — CSS prefix: "prod" | "app" | "sup" | "abt"
   * @param {Function} cfg.getItems       — () => Array<{key, icon, href, emoji?}>
   * @param {Function} cfg.injectStyles   — injects module-specific CSS overrides
   * @param {Function} cfg.renderDropdown — (cfg) => HTML string for desktop/tablet card
   * @param {Function} cfg.buildPopupContent — (items, parentHref) => HTML string for mobile popup items
   * @param {Function} [cfg.initDropdownClickOverride] — custom initDropdownClick (about's SPA nav)
   * @param {string} [cfg.defaultHref]   — default fallback href for popup triggers
   * @param {Function} [cfg.extraKeys]   — () => Object with extra public API keys (e.g. EXTRAS)
   */
  function createModule(cfg) {
    var prefix = cfg.prefix;
    var wrapClass = prefix + "-dropdown-wrap";
    var triggerClass = prefix + "-dropdown-trigger";
    var overlayClass = prefix + "-popup-overlay";
    var panelClass = prefix + "-popup-panel";
    var popupItemClass = prefix + "-popup-item";
    var boundFlag = "_" + prefix + "DropdownBound";
    var popupBoundFlag = "_" + prefix + "PopupBound";
    var defaultHref =
      cfg.defaultHref ||
      "/" + prefix.replace("prod", "products").replace("sup", "support").replace("abt", "about") + "/";

    var _docClickBound = false;

    /* ── buildItem helper (shared) ── */
    function _buildItem(sub, parentHref) {
      var itemHref = sub.href || parentHref;
      var chevron = '<span class="material-symbols-outlined ' + prefix + '-dropdown-chevron">chevron_right</span>';
      var emojiHtml = sub.emoji ? '<span class="' + prefix + '-dropdown-emoji">' + sub.emoji + "</span>" : "";
      return (
        '<a href="' +
        esc(itemHref) +
        '" class="' +
        prefix +
        '-dropdown-item">' +
        '<span class="' +
        prefix +
        '-dropdown-icon">' +
        '<span class="material-symbols-outlined">' +
        esc(sub.icon) +
        "</span>" +
        "</span>" +
        '<span class="' +
        prefix +
        '-dropdown-label" data-i18n="' +
        esc(sub.key) +
        '">' +
        esc(sub.key) +
        "</span>" +
        emojiHtml +
        chevron +
        "</a>"
      );
    }

    function _buildSeparator() {
      return '<div class="' + prefix + '-dropdown-separator"></div>';
    }

    /* ── Wrap HTML builder ── */
    function _wrapDropdown(innerHtml, cfg) {
      return (
        '<div class="' +
        wrapClass +
        (isTouch() ? " touch-device" : "") +
        '">' +
        '<a class="' +
        esc(cfg.activeClass || "") +
        " " +
        triggerClass +
        '"' +
        ' href="' +
        esc(cfg.href || "#") +
        '"' +
        " data-" +
        prefix +
        '-trigger-label="' +
        esc(cfg.labelKey || cfg.label) +
        '">' +
        '<span data-i18n="' +
        esc(cfg.labelKey || cfg.label) +
        '">' +
        esc(cfg.label || cfg.labelKey) +
        "</span>" +
        '<span class="material-symbols-outlined ' +
        prefix +
        '-dropdown-arrow">expand_more</span>' +
        "</a>" +
        '<div class="' +
        prefix +
        '-dropdown-panel"><div class="' +
        prefix +
        '-dropdown-card">' +
        innerHtml +
        "</div></div>" +
        "</div>"
      );
    }

    /* ── INTERACTION ── */

    function bindTriggers() {
      document.querySelectorAll("." + triggerClass).forEach(function (t) {
        if (t[boundFlag]) return;
        t[boundFlag] = true;
        t.addEventListener("click", function (e) {
          if (window.innerWidth <= 767) return;
          /* Touch devices: toggle dropdown & prevent navigation.
           * Non-touch devices: let click propagate to SPA router (hover handles dropdown). */
          if (isTouch()) {
            e.preventDefault();
            e.stopPropagation();
            t.closest("." + wrapClass).classList.toggle("is-open");
          }
          /* Non-touch: do nothing — hover already opened the dropdown,
           * and the click should navigate to the overview page via SPA router. */
        });
      });
    }

    function initDropdownClick() {
      if (!_docClickBound) {
        _docClickBound = true;
        document.addEventListener("click", function () {
          document.querySelectorAll("." + wrapClass + ".is-open").forEach(function (d) {
            d.classList.remove("is-open");
          });
        });
      }
      bindTriggers();
    }

    /* ── MOBILE POPUP ── */

    function openPopup(href) {
      closePopup();

      var overlay = document.createElement("div");
      overlay.className = overlayClass;

      var panel = document.createElement("div");
      panel.className = panelClass;

      var handle = '<div class="' + prefix + '-popup-handle"></div>';
      var items = cfg.getItems();
      var content = cfg.buildPopupContent ? cfg.buildPopupContent(items, href || defaultHref) : "";

      /* @audit-safe: config-driven-render */
      /* @audit-safe: config-driven-render */
      panel.innerHTML = handle + content;

      overlay.onclick = closePopup;
      document.body.appendChild(overlay);
      document.body.appendChild(panel);

      // Translate popup items immediately after DOM insertion
      if (window.translationManager) {
        panel.querySelectorAll("[data-i18n]").forEach(function (el) {
          var key = el.getAttribute("data-i18n");
          var translated = window.translationManager.translate(key);
          if (translated && translated !== key) {
            el.textContent = translated;
          }
        });
      }

      // Bind close on popup item click
      var popupItems = panel.querySelectorAll("." + popupItemClass);
      for (var k = 0; k < popupItems.length; k++) {
        popupItems[k].addEventListener("click", function () {
          closePopup();
          // Navigate 由全局 click handler (spa-router.js) 统一处理
        });
      }

      requestAnimationFrame(function () {
        panel.classList.add("is-open");
        navigator.vibrate && navigator.vibrate(12);
      });
    }

    function closePopup() {
      document.querySelectorAll("." + overlayClass + ",." + panelClass).forEach(function (el) {
        el.parentNode && el.parentNode.removeChild(el);
      });
    }

    function bindAllPopupTriggers() {
      var triggers = document.querySelectorAll("[data-" + prefix + "-popup]");
      for (var i = 0; i < triggers.length; i++) {
        var el = triggers[i];
        if (el[popupBoundFlag]) continue;
        el[popupBoundFlag] = true;
        el.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var triggerHref = el.getAttribute("data-" + prefix + "-popup-href") || el.getAttribute("href") || defaultHref;
          openPopup(triggerHref);
        });
      }
    }

    /* ── KEYBOARD NAVIGATION ── */
    function _bindKeyboardNav() {
      document.addEventListener("keydown", function (e) {
        var key = e.key;

        // Escape: close any open dropdown or popup
        if (key === "Escape") {
          var openDropdown = document.querySelector("." + wrapClass + ".is-open");
          if (openDropdown) {
            openDropdown.classList.remove("is-open");
            // Move focus back to trigger
            var trigger = openDropdown.querySelector("." + triggerClass);
            if (trigger) trigger.focus();
            return;
          }
          // Also close mobile popup if open
          var openPanel = document.querySelector("." + panelClass + ".is-open");
          if (openPanel) {
            closePopup();
            return;
          }
        }

        // Tab: close dropdown when focus moves away
        if (key === "Tab") {
          var activeEl = document.activeElement;
          if (activeEl) {
            var openWrap = activeEl.closest("." + wrapClass);
            if (!openWrap) {
              document.querySelectorAll("." + wrapClass + ".is-open").forEach(function (d) {
                d.classList.remove("is-open");
              });
            }
          }
        }
      });
    }

    /* ── SPA CLEANUP ── */
    _spaOn(
      document,
      "spa:load",
      function () {
        closePopup();
        _bindKeyboardNav();
      },
      "spa:load:closePopup:" + prefix
    );

    // Also bind keyboard nav on first call
    _bindKeyboardNav();

    /* ── PUBLIC API ── */
    var api = {
      renderPC: cfg.renderDropdown,
      renderTablet: cfg.renderDropdown,
      initDropdownClick: cfg.initDropdownClickOverride
        ? function () {
            cfg.initDropdownClickOverride({ initDropdownClick: initDropdownClick });
          }
        : initDropdownClick,
      openPopup: openPopup,
      closePopup: closePopup,
      bindAllPopupTriggers: bindAllPopupTriggers,
      injectAllStyles: cfg.injectStyles,
      SUBSERIES: cfg.getItems(),
    };

    // Merge any extra public keys
    if (cfg.extraKeys) {
      var extra = cfg.extraKeys();
      for (var key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) api[key] = extra[key];
      }
    }

    return api;
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  global.DropdownBase = {
    create: createModule,
    esc: esc,
    isTouch: isTouch,
    _spaOn: _spaOn,
  };
})(window);
/**
 * products-dropdown.js — Responsive Products Dropdown
 * Desktop / Tablet: floating card style
 * Mobile: iOS bottom sheet popup
 */

(function (global) {
  "use strict";
  var _theme = (window.SITE_CONFIG || window._cfg || {}).theme || {};
  var _primary = (_theme.colors || {}).primary || "#2E7D32";

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
        key: cat.i18nKey || "nav_" + categoryKey + "_" + cat.slug,
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
    label: (function () {
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
      '<span class="prod-dropdown-label" data-i18n="' +
      esc(i18nKey) +
      '">' +
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
    var i18nKey = child.i18nKey || "nav_" + (child.slug || child.id);
    return (
      '<a href="' +
      esc(childHref) +
      '" class="nav-dropdown-item">' +
      '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' +
      esc(child.icon || "circle") +
      "</span></span>" +
      '<span class="nav-dropdown-label" data-i18n="' +
      esc(i18nKey) +
      '">' +
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
/**
 * applications-dropdown.js — Responsive Applications Dropdown
 * Desktop / Tablet / Mobile adaptive
 */

(function (global) {
  "use strict";

  var esc = global.DropdownBase.esc;
  var isTouch = global.DropdownBase.isTouch;

  /* ───────────────────────── DATA ───────────────────────── */

  var _cfg = window.SITE_CONFIG || {};
  var _categories = _cfg.categories || {};

  function _buildCategoryItems(categoryKey, parentPath) {
    var cats = _categories[categoryKey] || [];
    return cats.map(function (cat) {
      return {
        key: cat.i18nKey || "nav_" + categoryKey + "_" + cat.slug,
        label: cat.label || cat.i18nKey || cat.slug,
        icon: cat.icon || "circle",
        href: parentPath + (cat.slug || "") + "/",
        emoji: cat.emoji || "",
      };
    });
  }

  var SUBSERIES = _buildCategoryItems("applications", "/applications/");

  var EXTRAS = [];

  /* ───────────────────────── CSS ───────────────────────── */

  function injectStyles() {
    // CSS moved to styles.css
  }

  /* ───────────────────────── RENDER ───────────────────────── */

  function renderDropdown(cfg) {
    var parentHref = "/applications/";

    var items = SUBSERIES.map(function (s, idx) {
      var html = _buildItem(s, parentHref);
      if (idx < SUBSERIES.length - 1) html += '<div class="app-dropdown-separator"></div>';
      return html;
    }).join("\n");

    var extrasHtml = EXTRAS.map(function (s, idx) {
      var row = _buildDropdownItem(s);
      if (idx < EXTRAS.length - 1) row += '<div class="app-dropdown-separator"></div>';
      return row;
    }).join("\n");

    return (
      '<div class="app-dropdown-wrap' +
      (isTouch() ? " touch-device" : "") +
      '">' +
      '<a class="' +
      esc(cfg.activeClass || "") +
      ' app-dropdown-trigger"' +
      ' href="' +
      esc(cfg.href || "#") +
      '"' +
      ' data-app-trigger-label="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      '<span data-i18n="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      esc(cfg.label || cfg.labelKey) +
      "</span>" +
      '<span class="material-symbols-outlined app-dropdown-arrow">expand_more</span>' +
      "</a>" +
      '<div class="app-dropdown-panel"><div class="app-dropdown-card">' +
      items +
      extrasHtml +
      "</div></div>" +
      "</div>"
    );
  }

  function _buildItem(sub, parentHref) {
    var itemHref = sub.href || parentHref;
    var chevron = '<span class="material-symbols-outlined app-dropdown-chevron">chevron_right</span>';
    var emojiHtml = sub.emoji ? '<span class="app-dropdown-emoji">' + sub.emoji + "</span>" : "";
    return (
      '<a href="' +
      esc(itemHref) +
      '" class="app-dropdown-item">' +
      '<span class="app-dropdown-icon">' +
      '<span class="material-symbols-outlined">' +
      esc(sub.icon) +
      "</span>" +
      "</span>" +
      '<span class="app-dropdown-label" data-i18n="' +
      esc(sub.key) +
      '">' +
      esc(sub.label || sub.key) +
      "</span>" +
      emojiHtml +
      chevron +
      "</a>"
    );
  }

  function _buildDropdownItem(item) {
    return (
      '<a href="' +
      esc(item.href) +
      '" class="app-dropdown-item">' +
      '<span class="app-dropdown-icon">' +
      '<span class="material-symbols-outlined">' +
      esc(item.icon) +
      "</span>" +
      "</span>" +
      '<span class="app-dropdown-label" data-i18n="' +
      esc(item.key) +
      '">' +
      esc(item.key) +
      "</span>" +
      '<span class="material-symbols-outlined app-dropdown-chevron">chevron_right</span>' +
      "</a>"
    );
  }

  /* ───────────────────────── POPUP CONTENT ───────────────────────── */

  function buildPopupContent(items, parentHref) {
    var list = items
      .map(function (s) {
        var itemHref = s.href || parentHref;
        var chevron = '<span class="material-symbols-outlined app-popup-chevron">chevron_right</span>';
        var emojiHtml = s.emoji ? '<span class="app-popup-emoji">' + s.emoji + "</span>" : "";
        return (
          '<a href="' +
          esc(itemHref) +
          '" class="app-popup-item">' +
          '<span class="app-dropdown-icon">' +
          '<span class="material-symbols-outlined">' +
          esc(s.icon) +
          "</span>" +
          "</span>" +
          '<span class="app-popup-label" data-i18n="' +
          esc(s.key) +
          '">' +
          esc(s.key) +
          "</span>" +
          emojiHtml +
          chevron +
          "</a>"
        );
      })
      .join("\n");

    var extrasItems = EXTRAS.map(function (s) {
      return (
        '<a href="' +
        esc(s.href) +
        '" class="app-popup-item">' +
        '<span class="app-dropdown-icon">' +
        '<span class="material-symbols-outlined">' +
        esc(s.icon) +
        "</span>" +
        "</span>" +
        '<span class="app-popup-label" data-i18n="' +
        esc(s.key) +
        '">' +
        esc(s.key) +
        "</span>" +
        '<span class="material-symbols-outlined app-popup-chevron">chevron_right</span>' +
        "</a>"
      );
    }).join("\n");

    return list + extrasItems;
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  global.ApplicationsDropdown = global.DropdownBase.create({
    prefix: "app",
    getItems: function () {
      return SUBSERIES;
    },
    injectStyles: injectStyles,
    renderDropdown: renderDropdown,
    buildPopupContent: buildPopupContent,
    defaultHref: "/applications/",
    extraKeys: function () {
      return { EXTRAS: EXTRAS };
    },
  });
})(window);
/**
 * support-dropdown.js — Responsive Support Dropdown
 * Desktop / Tablet / Mobile adaptive
 */

(function (global) {
  "use strict";

  var esc = global.DropdownBase.esc;
  var isTouch = global.DropdownBase.isTouch;

  /* ───────────────────────── DATA ───────────────────────── */

  var _cfg = window.SITE_CONFIG || {};
  var _categories = _cfg.categories || {};

  function _buildCategoryItems(categoryKey, parentPath) {
    var cats = _categories[categoryKey] || [];
    var items = [{ key: "nav_support_services", label: "全部服务", icon: "grid_view", href: parentPath, emoji: "" }];
    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i];
      items.push({
        key: cat.i18nKey || "nav_" + categoryKey + "_" + cat.slug,
        label: cat.label || cat.i18nKey || cat.slug,
        icon: cat.icon || "circle",
        href: parentPath + (cat.slug || "") + "/",
        emoji: cat.emoji || "",
      });
    }
    return items;
  }

  var SUBSERIES = _buildCategoryItems("support", "/support/");

  /* ───────────────────────── CSS ───────────────────────── */

  function injectStyles() {
    // CSS moved to styles.css
  }

  /* ───────────────────────── RENDER ───────────────────────── */

  function renderDropdown(cfg) {
    var parentHref = "/support/";

    var items = SUBSERIES.map(function (s, idx) {
      var html = _buildItem(s, parentHref);
      if (idx < SUBSERIES.length - 1) html += '<div class="sup-dropdown-separator"></div>';
      return html;
    }).join("\n");

    return (
      '<div class="sup-dropdown-wrap' +
      (isTouch() ? " touch-device" : "") +
      '">' +
      '<a class="' +
      esc(cfg.activeClass || "") +
      ' sup-dropdown-trigger"' +
      ' href="' +
      esc(cfg.href || "#") +
      '"' +
      ' data-sup-trigger-label="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      '<span data-i18n="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      esc(cfg.label || cfg.labelKey) +
      "</span>" +
      '<span class="material-symbols-outlined sup-dropdown-arrow">expand_more</span>' +
      "</a>" +
      '<div class="sup-dropdown-panel"><div class="sup-dropdown-card">' +
      items +
      "</div></div>" +
      "</div>"
    );
  }

  function _buildItem(sub, parentHref) {
    var itemHref = sub.href || parentHref;
    var chevron = '<span class="material-symbols-outlined sup-dropdown-chevron">chevron_right</span>';
    var emojiHtml = sub.emoji ? '<span class="sup-dropdown-emoji">' + sub.emoji + "</span>" : "";
    return (
      '<a href="' +
      esc(itemHref) +
      '" class="sup-dropdown-item">' +
      '<span class="sup-dropdown-icon">' +
      '<span class="material-symbols-outlined">' +
      esc(sub.icon) +
      "</span>" +
      "</span>" +
      '<span class="sup-dropdown-label" data-i18n="' +
      esc(sub.key) +
      '">' +
      esc(sub.label || sub.key) +
      "</span>" +
      emojiHtml +
      chevron +
      "</a>"
    );
  }

  /* ───────────────────────── POPUP CONTENT ───────────────────────── */

  function buildPopupContent(items, parentHref) {
    return items
      .map(function (s) {
        var itemHref = s.href || parentHref;
        var chevron = '<span class="material-symbols-outlined sup-popup-chevron">chevron_right</span>';
        var emojiHtml = s.emoji ? '<span class="sup-popup-emoji">' + s.emoji + "</span>" : "";
        return (
          '<a href="' +
          esc(itemHref) +
          '" class="sup-popup-item">' +
          '<span class="sup-dropdown-icon">' +
          '<span class="material-symbols-outlined">' +
          esc(s.icon) +
          "</span>" +
          "</span>" +
          '<span class="sup-popup-label" data-i18n="' +
          esc(s.key) +
          '">' +
          esc(s.key) +
          "</span>" +
          emojiHtml +
          chevron +
          "</a>"
        );
      })
      .join("\n");
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  global.SupportDropdown = global.DropdownBase.create({
    prefix: "sup",
    getItems: function () {
      return SUBSERIES;
    },
    injectStyles: injectStyles,
    renderDropdown: renderDropdown,
    buildPopupContent: buildPopupContent,
    defaultHref: "/support/",
  });
})(window);
/**
 * about-dropdown.js — About Dropdown (L2)
 *
 * L2: 公司简介 / 工厂实力 / 资质认证
 * CSS prefix: abt-dropdown-* / abt-popup-*
 * Unique: SPA sub-item navigation (hash anchor → SpaRouter.navigate)
 */

(function (global) {
  "use strict";

  var esc = global.DropdownBase.esc;
  var isTouch = global.DropdownBase.isTouch;

  /* ───────────────────────── DATA ───────────────────────── */

  var DEFAULT_ITEMS = [
    { key: "nav_about_profile", icon: "apartment", href: "/about/#profile" },
    { key: "nav_about_factory", icon: "factory", href: "/about/#factory" },
    { key: "nav_about_cert", icon: "verified", href: "/about/#cert" },
  ];

  function getItems() {
    return DEFAULT_ITEMS;
  }

  /* ───────────────────────── CSS ───────────────────────── */

  function injectStyles() {
    if (window.DropdownBaseStyles) window.DropdownBaseStyles.inject();
  }

  /* ───────────────────────── RENDER ───────────────────────── */

  function renderDropdown(cfg) {
    var items = getItems()
      .map(function (item, idx) {
        var row =
          '<a href="' +
          esc(item.href) +
          '" class="abt-dropdown-item">' +
          '<span class="abt-dropdown-icon"><span class="material-symbols-outlined">' +
          esc(item.icon) +
          "</span></span>" +
          '<span class="abt-dropdown-label" data-i18n="' +
          esc(item.key) +
          '">' +
          esc(item.key) +
          "</span>" +
          '<span class="material-symbols-outlined abt-dropdown-chevron">chevron_right</span>' +
          "</a>";
        if (idx < getItems().length - 1) row += '<div class="abt-dropdown-separator"></div>';
        return row;
      })
      .join("\n");

    return (
      '<div class="abt-dropdown-wrap' +
      (isTouch() ? " touch-device" : "") +
      '">' +
      '<a class="' +
      esc(cfg.activeClass || "") +
      ' abt-dropdown-trigger"' +
      ' href="' +
      esc(cfg.href || "#") +
      '"' +
      ' data-abt-trigger-label="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      '<span data-i18n="' +
      esc(cfg.labelKey || cfg.label) +
      '">' +
      esc(cfg.label || cfg.labelKey) +
      "</span>" +
      '<span class="material-symbols-outlined abt-dropdown-arrow">expand_more</span>' +
      "</a>" +
      '<div class="abt-dropdown-panel"><div class="abt-dropdown-card">' +
      items +
      "</div></div>" +
      "</div>"
    );
  }

  /* ───────────────────────── POPUP CONTENT ───────────────────────── */

  function buildPopupContent(items) {
    return items
      .map(function (item) {
        return (
          '<a href="' +
          esc(item.href) +
          '" class="abt-popup-item">' +
          '<span class="abt-dropdown-icon"><span class="material-symbols-outlined">' +
          esc(item.icon) +
          "</span></span>" +
          '<span class="abt-popup-label" data-i18n="' +
          esc(item.key) +
          '">' +
          esc(item.key) +
          "</span>" +
          '<span class="material-symbols-outlined abt-popup-chevron">chevron_right</span>' +
          "</a>"
        );
      })
      .join("\n");
  }

  /* ───────────────────────── CUSTOM INIT (SPA sub-item nav) ───────────────────────── */

  function initDropdownClickOverride(shared) {
    // Run the shared init first (document click-to-close + bindTriggers)
    shared.initDropdownClick();

    // SPA navigation for dropdown sub-items (prevent full page refresh)
    document.querySelectorAll(".abt-dropdown-item").forEach(function (item) {
      if (item._abtNavBound) return;
      item._abtNavBound = true;
      item.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = item.closest(".abt-dropdown-wrap");
        if (wrap) wrap.classList.remove("is-open");

        var href = item.getAttribute("href");
        if (!href) return;

        var hashMatch = href.match(/^(\/[^#]*?)#([^#]*)$/);
        if (hashMatch) {
          var targetPath = hashMatch[1];
          var anchorId = hashMatch[2];
          if (!targetPath.endsWith("/")) targetPath += "/";

          var currentPath = window.location.pathname;
          if (!currentPath.endsWith("/")) currentPath += "/";

          if (targetPath === currentPath) {
            window.setTimeout(function () {
              var el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          } else {
            // Store anchor for scroll after navigation
            window.__spaScrollAnchor = anchorId;
            window.location.href = href;
          }
        } else {
          window.location.href = href;
        }
      });
    });
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  global.AboutDropdown = global.DropdownBase.create({
    prefix: "abt",
    getItems: getItems,
    injectStyles: injectStyles,
    renderDropdown: renderDropdown,
    buildPopupContent: buildPopupContent,
    defaultHref: "/about/",
    initDropdownClickOverride: initDropdownClickOverride,
    extraKeys: function () {
      return { ITEMS: DEFAULT_ITEMS };
    },
  });
})(window);
