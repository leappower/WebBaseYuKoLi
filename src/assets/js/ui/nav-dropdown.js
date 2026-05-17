/**
 * nav-dropdown.js — 通用导航 Dropdown（从 SITE_CONFIG 自动生成）
 *
 * 替代逐个硬编码的 dropdown 模块。任何 L1 项只要在 nav.items[x].children
 * 有数据，就会自动渲染 dropdown 内容。
 *
 * 依赖：
 *   - window.SITE_CONFIG.nav.items（当前语言从 config label 获取）
 *
 * ES5 兼容。@audit-safe — 静态配置数据，无用户输入。
 */

(function () {
  "use strict";

  /** @type {Object} 本模块公开接口 */
  var NavDropdown = {};

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

  // ── 构建 dropdown HTML ──────────────────────────────────────
  /**
   * 根据 navItem.id 从 SITE_CONFIG 查找对应的 children，生成 dropdown
   * @param {Object} options - { href, labelKey, label, activeClass, navItem }
   * @returns {string} dropdown HTML
   */
  function renderDropdown(options) {
    var navItem = options.navItem || {};
    var itemId = navItem.id || "";
    var activeClass = options.activeClass || "";

    // 从 SITE_CONFIG 获取该 L1 的 children
    var children = [];
    try {
      var items = (window.SITE_CONFIG || window._cfg || {}).nav && (window.SITE_CONFIG || window._cfg || {}).nav.items;
      if (items) {
        for (var i = 0; i < items.length; i++) {
          if (items[i].id === itemId && items[i].children) {
            children = items[i].children;
            break;
          }
        }
      }
    } catch (e) {
      /* silent fallback */
    }

    if (children.length === 0) {
      // 无子项：渲染为普通链接
      var href = options.href || ("/" + itemId + "/");
      return '<a class="' + activeClass + '" href="' + href + '">' + resolveLabel(options.label) + "</a>";
    }

    var html = '<div class="nav-dropdown">';
    html += '<div class="nav-dropdown__inner">';

    for (var j = 0; j < children.length; j++) {
      var child = children[j];
      var childHref = child.href || ("/" + child.slug + "/") || ("/" + child.id + "/");
      var childLabel = resolveLabel(child.label) || child.id;
      var icon = child.icon || "";

      html +=
        '<a class="nav-dropdown__item dropdown-list-item-parent" href="' + childHref + '">';
      if (icon) {
        html +=
          '<span class="material-symbols-outlined nav-dropdown__icon">' + icon + "</span>";
      }
      html +=
          '<span class="nav-dropdown__label">' + childLabel + "</span>" +
        "</a>";
    }

    html += "</div></div>";
    return html;
  }

  // ── 暴露接口 ────────────────────────────────────────────────
  NavDropdown.renderPC = function (options) {
    return renderDropdown(options);
  };
  NavDropdown.renderTablet = function (options) {
    return renderDropdown(options);
  };

  // ── CSS 注入（一次性） ──────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("nav-dropdown-style")) return;
    var style = document.createElement("style");
    style.id = "nav-dropdown-style";
    style.textContent =
      ".nav-dropdown {" +
        "  position: absolute; top: 100%; left: 0; z-index: 999;" +
        "  min-width: 200px; padding: 8px 0;" +
        "  background: #fff; border-radius: 8px;" +
        "  box-shadow: 0 4px 20px rgba(0,0,0,0.1);" +
        "  opacity: 0; visibility: hidden;" +
        "  transition: opacity 0.2s, visibility 0.2s;" +
      "}" +
      ".nav-dropdown__inner { display: flex; flex-direction: column; }" +
      ".nav-dropdown__item {" +
        "  display: flex; align-items: center; gap: 12px;" +
        "  padding: 10px 20px; color: #333; text-decoration: none;" +
        "  font-size: 14px; line-height: 1.4; transition: background 0.15s;" +
      "}" +
      ".nav-dropdown__item:hover { background: #f5f5f5; color: var(--color-primary, #2E7D32); }" +
      ".nav-dropdown__icon { font-size: 20px; color: var(--color-primary, #2E7D32); }" +
      ".nav-dropdown__label { white-space: nowrap; }" +
      /* Dark mode */
      ".dark .nav-dropdown { background: #1e293b; }" +
      ".dark .nav-dropdown__item { color: #e2e8f0; }" +
      ".dark .nav-dropdown__item:hover { background: #334155; }";
    document.head.appendChild(style);
  }

  injectStyles();

  // ── 挂载到全局 ──────────────────────────────────────────────
  window.NavDropdown = NavDropdown;

})();
