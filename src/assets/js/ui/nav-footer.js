/**
 * nav-footer.js — Fixed Footer Tab（移动端/平板底部导航）
 *
 * 当 SITE_CONFIG.features.mobileFooterNav === true 时启用。
 * 从 SITE_CONFIG.footer 读取 tab 项，渲染固定底部导航栏。
 *
 * 依赖：
 *   - Material Icons（项目已有 CDN 引用）
 *   - window.SITE_CONFIG（site.config.js）
 *
 * 导出：window.NavFooter
 */
;(function (_global) {
  "use strict";

  var _MODULE_ID = "nav-footer";

  /* ─── Helpers ──────────────────────────────────────────────── */

  /**
   * 从 tab.label 中读取当前语言版本
   * label 可能是 string 或 { en: "...", "zh-CN": "..." }
   */
  function getLocalizedLabel(label) {
    if (typeof label === "string") return label;
    if (!label || typeof label !== "object") return "";
    // 优先用当前语言
    var lang = (document.documentElement.lang || "en").toLowerCase();
    // 精确匹配
    if (label[lang]) return label[lang];
    // 回退到 en
    if (label.en) return label.en;
    // 回退到 zh-CN
    if (label["zh-CN"]) return label["zh-CN"];
    // 取第一个值
    var keys = Object.keys(label);
    return keys.length > 0 ? label[keys[0]] : "";
  }

  /**
   * 判断当前路径是否匹配 tab 的 href
   */
  function isActiveTab(href) {
    if (!href) return false;
    var pathname = window.location.pathname;
    // 精确匹配或子路径匹配
    // /products/ 匹配 /products/, /products/stirfry/ 等
    var tabPath = href.replace(/\/$/, "");
    var currentPath = pathname.replace(/\/$/, "");
    if (currentPath === tabPath) return true;
    if (currentPath.indexOf(tabPath + "/") === 0) return true;
    return false;
  }

  /**
   * 判断是否为平板设备（768–1023px）
   */
  function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }

  /**
   * 判断是否在移动端/平板范围内（< 1024px）
   */
  function isMobileOrTablet() {
    return window.innerWidth < 1024;
  }

  /* ─── Render ───────────────────────────────────────────────── */

  /**
   * 渲染底部导航栏 HTML
   * @returns {string} HTML 字符串
   */
  function render() {
    var cfg = window.SITE_CONFIG || {};
    var footer = cfg.footer || {};

    // 选择 tab 数据源
    var items;
    if (footer.tabletItems && isTablet()) {
      items = footer.tabletItems;
    } else {
      items = footer.mobileItems || [];
    }

    if (!items || items.length === 0) return "";

    var html = '<nav class="nav-footer-bar" role="navigation" aria-label="Footer navigation">';
    for (var i = 0; i < items.length; i++) {
      var tab = items[i];
      var label = getLocalizedLabel(tab.label || tab.text);
      var icon = tab.icon || "circle";
      var href = tab.href || "#";
      var id = tab.id || ("tab-" + i);
      var activeClass = isActiveTab(href) ? " active" : "";

      html += '<a href="' + href + '" class="nav-footer-tab' + activeClass + '" data-tab="' + id + '">';
      html += '<span class="material-icons nav-footer-icon">' + icon + '</span>';
      html += '<span class="nav-footer-label">' + label + '</span>';
      html += "</a>";
    }
    html += "</nav>";

    return html;
  }

  /* ─── Styles ───────────────────────────────────────────────── */

  /**
   * 注入底部导航栏样式
   */
  function injectStyles() {
    // 防止重复注入
    if (document.getElementById("nav-footer-styles")) return;

    var css = [
      ".nav-footer-bar {",
      "  display: none;",
      "  position: fixed;",
      "  bottom: 0;",
      "  left: 0;",
      "  width: 100%;",
      "  height: 64px;",
      "  background: #FFFFFF;",
      "  border-top: 1px solid var(--border, #E7E1D6);",
      "  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);",
      "  z-index: var(--z-sticky, 200);",
      "  flex-direction: row;",
      "  align-items: center;",
      "  justify-content: space-around;",
      "  padding: 0 8px;",
      "}",
      "",
      "@media (max-width: 1023px) {",
      "  .nav-footer-bar {",
      "    display: flex;",
      "  }",
      "  body {",
      "    padding-bottom: 64px;",
      "  }",
      "}",
      "",
      ".nav-footer-tab {",
      "  display: flex;",
      "  flex-direction: column;",
      "  align-items: center;",
      "  justify-content: center;",
      "  text-decoration: none;",
      "  color: var(--color-text-muted, #6B7280);",
      "  padding: 6px 12px;",
      "  border-radius: 8px;",
      "  transition: var(--transition-normal, all 0.32s cubic-bezier(0.4, 0, 0.2, 1));",
      "  cursor: pointer;",
      "  flex: 1;",
      "  max-width: 80px;",
      "  -webkit-tap-highlight-color: transparent;",
      "}",
      "",
      ".nav-footer-tab:hover,",
      ".nav-footer-tab.active {",
      "  color: var(--color-primary);",
      "  background: rgba(var(--color-primary-rgb, 236, 91, 19), 0.08);",
      "}",
      "",
      ".nav-footer-icon {",
      "  font-size: 22px;",
      "  margin-bottom: 2px;",
      "  line-height: 1;",
      "}",
      "",
      ".nav-footer-label {",
      "  font-size: 10px;",
      "  font-weight: var(--fw-medium, 500);",
      "  line-height: 1.2;",
      "  white-space: nowrap;",
      "  overflow: hidden;",
      "  text-overflow: ellipsis;",
      "  max-width: 100%;",
      "}"
    ].join("\n");

    var style = document.createElement("style");
    style.id = "nav-footer-styles";
    style.type = "text/css";
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    document.head.appendChild(style);
  }

  /* ─── Event Binding ────────────────────────────────────────── */

  /**
   * 绑定 tab 点击事件
   */
  function bindEvents() {
    var tabs = document.querySelectorAll(".nav-footer-tab");
    if (!tabs || tabs.length === 0) return;

    for (var i = 0; i < tabs.length; i++) {
      (function (tab) {
        tab.addEventListener("click", function () {
          // 移除所有 active
          var allTabs = document.querySelectorAll(".nav-footer-tab");
          for (var j = 0; j < allTabs.length; j++) {
            allTabs[j].classList.remove("active");
          }
          // 添加当前 active
          tab.classList.add("active");
        });
      })(tabs[i]);
    }

    // 监听窗口 resize，重新判断是否显示/隐藏
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var bar = document.querySelector(".nav-footer-bar");
        if (!bar) return;
        if (isMobileOrTablet()) {
          bar.style.display = "flex";
          document.body.style.paddingBottom = "64px";
        } else {
          bar.style.display = "none";
          document.body.style.paddingBottom = "";
        }
      }, 150);
    });
  }

  /* ─── Update Active ────────────────────────────────────────── */

  /**
   * 更新当前活跃 tab（供 SPA 路由调用）
   * @param {string} pathname - 当前路径
   */
  function updateActive(pathname) {
    var tabs = document.querySelectorAll(".nav-footer-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove("active");
      var href = tabs[i].getAttribute("href") || "";
      var tabPath = href.replace(/\/$/, "");
      var currentPath = (pathname || window.location.pathname).replace(/\/$/, "");
      if (currentPath === tabPath || currentPath.indexOf(tabPath + "/") === 0) {
        tabs[i].classList.add("active");
      }
    }
  }

  /* ─── Init ─────────────────────────────────────────────────── */

  /**
   * 初始化 Fixed Footer Tab
   */
  function init() {
    var cfg = window.SITE_CONFIG || {};
    var features = cfg.features || {};

    // 功能开关检查
    if (!features.mobileFooterNav && !cfg.navMode.footerTabs) return;

    // 设备检查
    if (!isMobileOrTablet()) return;

    // 注入样式
    injectStyles();

    // 渲染 HTML
    var html = render();
    if (!html) return;

    // 插入到 body 末尾
    var container = document.createElement("div");
    container.id = "nav-footer-container";
    container.innerHTML = html;
    document.body.appendChild(container);

    // 绑定事件
    bindEvents();
  }

  /* ─── Export ───────────────────────────────────────────────── */

  _global.NavFooter = {
    init: init,
    render: render,
    injectStyles: injectStyles,
    updateActive: updateActive
  };

})(window || global);
