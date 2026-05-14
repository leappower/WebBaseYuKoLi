/**
 * theme-init.js — 主题初始化（字体 CDN 注入 + CSS 变量补全）
 *
 * 从 SITE_CONFIG.theme 读取字体配置，动态注入 Google Fonts CDN 链接。
 * 同时将 site.config.js 中的设计 token 写入 CSS 自定义属性。
 *
 * 依赖：
 *   - window.SITE_CONFIG（site.config.js）
 *
 * 导出：window.ThemeInit
 */
;(function (_global) {
  "use strict";

  var MODULE_ID = "theme-init";

  /* ─── Google Fonts URL Builder ─────────────────────────────── */

  /**
   * 根据字体名构建 Google Fonts CDN URL
   * @param {string} fontStack - CSS font stack，如 '"Public Sans", sans-serif'
   * @returns {string} Google Fonts CDN URL
   */
  function buildGoogleFontsUrl(fontStack) {
    // 从 font stack 中提取主字体名
    // '"Public Sans", sans-serif' → 'Public Sans'
    var match = fontStack.match(/"([^"]+)"/);
    if (!match) return "";
    var family = match[1];
    // 替换空格为 +
    return "https://fonts.googleapis.com/css2?family=" + family.replace(/ /g, "+") + ":wght@400;500;600;700&display=swap";
  }

  /**
   * 将 CSS font stack 中的字体名转为 Google Fonts identifier
   * @param {string} fontStack - CSS font stack
   * @returns {string} 字体名
   */
  function extractFontName(fontStack) {
    var match = fontStack.match(/"([^"]+)"/);
    return match ? match[1] : "";
  }

  /* ─── Font Link Injection ──────────────────────────────────── */

  /**
   * 检查某个 URL 的 link 标签是否已存在
   * @param {string} url - CSS URL
   * @returns {boolean}
   */
  function hasFontLink(url) {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if ((links[i].getAttribute("href") || "").indexOf(url) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * 注入单个 <link rel="stylesheet"> 标签
   * @param {string} href - CSS URL
   */
  function injectLink(href) {
    if (!href || hasFontLink(href)) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }

  /**
   * 从 SITE_CONFIG.theme.fonts 读取配置，注入字体 CDN 链接
   */
  function injectFontLinks() {
    var cfg = window.SITE_CONFIG || window._cfg || {};
    var fonts = (cfg.theme || {}).fonts || {};

    // 方式 1：直接 CDN URL 列表
    if (Array.isArray(fonts.cdn) && fonts.cdn.length > 0) {
      for (var i = 0; i < fonts.cdn.length; i++) {
        injectLink(fonts.cdn[i]);
      }
      return;
    }

    // 方式 2：单一 CDN URL
    if (fonts.cdn && typeof fonts.cdn === "string") {
      injectLink(fonts.cdn);
      return;
    }

    // 方式 3：从 heading/body 字体自动生成 Google Fonts URL
    var headingUrl = "";
    var bodyUrl = "";

    if (fonts.heading) {
      headingUrl = buildGoogleFontsUrl(fonts.heading);
    }
    if (fonts.body) {
      bodyUrl = buildGoogleFontsUrl(fonts.body);
    }

    // 去重（heading 和 body 可能用同一字体）
    var urls = [];
    if (headingUrl) urls.push(headingUrl);
    if (bodyUrl && bodyUrl !== headingUrl) urls.push(bodyUrl);

    for (var j = 0; j < urls.length; j++) {
      injectLink(urls[j]);
    }
  }

  /* ─── CSS Token Variables ──────────────────────────────────── */

  /**
   * 安全设置 CSS 自定义属性
   * @param {HTMLElement} el - 目标元素（通常是 document.documentElement）
   * @param {string} name - 属性名（不含 --）
   * @param {string} value - 属性值
   */
  function setToken(el, name, value) {
    if (!el || name == null || value == null) return;
    el.style.setProperty("--" + name, value);
  }

  /**
   * 将对象的所有键值对写入 CSS 自定义属性
   * @param {HTMLElement} el - 目标元素
   * @param {Object} obj - 键值对
   */
  function applyTokens(el, obj) {
    if (!obj || typeof obj !== "object") return;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      setToken(el, keys[i], obj[keys[i]]);
    }
  }

  /**
   * 从 SITE_CONFIG.theme.tokens 读取所有 token 并写入 CSS 自定义属性
   * 包括 colors, spacing, radius 等
   */
  function applyTokenVars() {
    var cfg = window.SITE_CONFIG || window._cfg || {};
    var theme = cfg.theme || {};
    var el = document.documentElement;

    // 1. 设计 token → --token-name
    // tokens 对象的 key 直接作为 CSS 变量名
    // 例如 tokens.containerWide → --containerWide
    applyTokens(el, theme.tokens);

    // 2. 色彩变量
    var colors = theme.colors || {};
    if (colors.primary) setToken(el, "color-primary", colors.primary);
    if (colors.primaryRgb) setToken(el, "color-primary-rgb", colors.primaryRgb);
    if (colors.primaryHover) setToken(el, "color-primary-hover", colors.primaryHover);
    if (colors.bgLight) setToken(el, "color-bg-light", colors.bgLight);
    if (colors.bgDark) setToken(el, "color-bg-dark", colors.bgDark);
    if (colors.textPrimary) setToken(el, "color-text", colors.textPrimary);
    if (colors.textMuted) setToken(el, "color-text-muted", colors.textMuted);
    if (colors.textLight) setToken(el, "color-text-light", colors.textLight);

    // 3. 间距变量 → --space-*
    var spacing = theme.spacing || {};
    var spacingKeys = Object.keys(spacing);
    for (var i = 0; i < spacingKeys.length; i++) {
      setToken(el, "space-" + spacingKeys[i], spacing[spacingKeys[i]]);
    }

    // 4. 圆角变量 → --radius-*
    var radius = theme.radius || {};
    var radiusKeys = Object.keys(radius);
    for (var j = 0; j < radiusKeys.length; j++) {
      setToken(el, "radius-" + radiusKeys[j], radius[radiusKeys[j]]);
    }

    // 5. 字体变量 → --font-heading, --font-body
    if (theme.fonts) {
      if (theme.fonts.heading) setToken(el, "font-heading", theme.fonts.heading);
      if (theme.fonts.body) setToken(el, "font-body", theme.fonts.body);
      if (theme.fonts.mono) setToken(el, "font-mono", theme.fonts.mono);
    }
  }

  /* ─── Init ─────────────────────────────────────────────────── */

  /**
   * 初始化主题
   */
  function init() {
    injectFontLinks();
    applyTokenVars();
  }

  /* ─── Export ───────────────────────────────────────────────── */

  _global.ThemeInit = {
    init: init,
    injectFontLinks: injectFontLinks,
    applyTokenVars: applyTokenVars
  };

})(window || global);
