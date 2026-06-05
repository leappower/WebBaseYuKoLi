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
    } catch (e) {
      /* silent */
    }
    return [];
  }

  // ── 构建子项 HTML ──────────────────────────────────────────
  function buildDropdownItem(child, showSep) {
    var childHref = child.href || "/" + (child.slug || child.id) + "/";
    var childLabel = resolveLabel(child.label) || child.id;
    var childKey = child.i18nKey || "nav_" + child.id;
    var iconHtml = "";
    if (child.icon) {
      iconHtml =
        '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' + esc(child.icon) + "</span></span>";
    } else if (child.emoji) {
      iconHtml =
        '<span class="nav-dropdown-icon"><span class="nav-dropdown-emoji">' + esc(child.emoji) + "</span></span>";
    }
    var sep = showSep ? window.TemplateConstants.separator("nav-dropdown") : "";
    return (
      '<a href="' +
      esc(childHref) +
      '" class="nav-dropdown-item">' +
      iconHtml +
      '<span class="nav-dropdown-label" data-i18n="' +
      esc(childKey) +
      '">' +
      esc(childLabel) +
      "</span>" +
      '<span class="material-symbols-outlined nav-dropdown-chevron">chevron_right</span>' +
      "</a>" +
      sep
    );
  }

  // ── 构建分类总览入口 HTML ──────────────────────────────────
  function buildCenterEntry(navId) {
    var centerMap = {
      solutions: {
        href: "/solutions/",
        icon: "design_services",
        i18nKey: "nav_solutions_center",
        label: __safe.t("nav_solutions_center") || "Solutions Center",
      },
    };
    var entry = centerMap[navId];
    if (!entry) return "";
    return (
      '<a href="' +
      esc(entry.href) +
      '" class="nav-dropdown-item nav-dropdown-center">' +
      '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' +
      esc(entry.icon) +
      "</span></span>" +
      '<span class="nav-dropdown-label" data-i18n="' +
      esc(entry.i18nKey) +
      '">' +
      esc(entry.label) +
      "</span>" +
      '<span class="material-symbols-outlined nav-dropdown-chevron">chevron_right</span>' +
      "</a>"
    );
  }

  // ── 主渲染函数 ──────────────────────────────────────────────
  function renderDropdown(cfg) {
    var navItem = cfg.navItem || {};
    var navId = navItem.id || "";
    var children = getChildren(navId);

    // 无子项：渲染为普通链接（可点击跳转）
    if (children.length === 0) {
      var href = cfg.href || "/" + navId + "/";
      var lbl = resolveLabel(cfg.label) || navId;
      return '<a class="' + (cfg.activeClass || "") + '" href="' + esc(href) + '">' + esc(lbl) + "</a>";
    }

    // 有子项：trigger 只负责 hover/click 展开 dropdown，不跳转
    var labelKey = cfg.labelKey || "nav_" + navId;
    var label = resolveLabel(cfg.label) || navId;

    var centerEntry = buildCenterEntry(navId);
    var centerSep = centerEntry ? window.TemplateConstants.separator("nav-dropdown") : "";

    var itemsHtml = children
      .map(function (child, idx) {
        return buildDropdownItem(child, idx < children.length - 1);
      })
      .join("\n");

    return (
      '<div class="' +
      WRAP_CLASS +
      (isTouch() ? " touch-device" : "") +
      '">' +
      '<a class="' +
      esc(cfg.activeClass || "") +
      " " +
      TRIGGER_CLASS +
      '" href="#" data-nav-trigger-label="' +
      esc(labelKey) +
      '">' +
      '<span data-i18n="' +
      esc(labelKey) +
      '">' +
      esc(label) +
      "</span>" +
      '<span class="material-symbols-outlined nav-dropdown-arrow">expand_more</span>' +
      "</a>" +
      '<div class="' +
      PANEL_CLASS +
      '"><div class="nav-dropdown-card">' +
      centerEntry +
      centerSep +
      itemsHtml +
      "</div></div>" +
      "</div>"
    );
  }

  // ── 样式注入 ────────────────────────────────────────────────
  var _stylesInjected = false;
  function injectStyles() {
    // CSS moved to styles.css
  }

  // ── 桌面端 click 交互 ──────────────────────────────────────
  function bindTriggers() {
    document.querySelectorAll("." + TRIGGER_CLASS).forEach(function (t) {
      if (t[_triggerBoundFlag]) return;
      t[_triggerBoundFlag] = true;
      t.addEventListener("click", function (e) {
        if (window.innerWidth <= 767) return;
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

    // 构建子项 HTML
    var childItems = children
      .map(function (child) {
        var childHref = child.href || "/" + (child.slug || child.id) + "/";
        var childLabel = resolveLabel(child.label) || child.id;
        var childKey = child.i18nKey || "nav_" + child.id;
        var iconHtml = "";
        if (child.icon) {
          iconHtml =
            '<span class="nav-dropdown-icon"><span class="material-symbols-outlined">' +
            esc(child.icon) +
            "</span></span>";
        } else if (child.emoji) {
          iconHtml = '<span class="nav-dropdown-emoji">' + esc(child.emoji) + "</span>";
        }
        return (
          '<a href="' +
          esc(childHref) +
          '" class="' +
          POPUP_ITEM_CLASS +
          '">' +
          iconHtml +
          '<span class="nav-dropdown-popup-label" data-i18n="' +
          esc(childKey) +
          '">' +
          esc(childLabel) +
          "</span>" +
          '<span class="material-symbols-outlined nav-dropdown-popup-chevron">chevron_right</span>' +
          "</a>"
        );
      })
      .join("\n");

    // 给有 center entry 的 nav 加顶部总览入口
    var centerEntryHtml = buildCenterEntry(navId);
    var popupHtml;
    if (centerEntryHtml) {
      var centerPopupItem = centerEntryHtml
        .replace("nav-dropdown-item", "nav-dropdown-popup-item")
        .replace("nav-dropdown-chevron", "nav-dropdown-popup-chevron")
        .replace('href="/solutions/"', 'href="/solutions/"');
      popupHtml = centerPopupItem + window.TemplateConstants.separator("nav-dropdown") + childItems;
    } else {
      popupHtml = childItems;
    }

    /* @audit-safe: config-driven-render */
    panel.innerHTML = '<div class="nav-dropdown-popup-handle"></div>' + popupHtml;

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
      item.addEventListener("click", function () {
        closePopup();
      });
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
  _spaOn(
    document,
    "spa:load",
    function () {
      closePopup();
      bindAllPopupTriggers();
    },
    "spa:load:navDropdown"
  );

  // ── 键盘导航 ────────────────────────────────────────────────
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var openWrap = document.querySelector("." + WRAP_CLASS + ".is-open");
      if (openWrap) {
        openWrap.classList.remove("is-open");
        return;
      }
      var openPanel = document.querySelector("." + POPUP_PANEL_CLASS + ".is-open");
      if (openPanel) {
        closePopup();
        return;
      }
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
