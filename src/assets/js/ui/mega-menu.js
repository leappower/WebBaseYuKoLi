/**
 * mega-menu.js — Mega Menu 渲染器（通用脚手架组件）
 *
 * 当 SITE_CONFIG.navMode.desktop === "mega-menu" 时启用。
 * 从 SITE_CONFIG 读取导航数据和产品线数据，渲染网格布局的 Mega Menu。
 *
 * 导出：window.MegaMenu
 * 依赖：SITE_CONFIG.theme.accentColors, SITE_CONFIG.nav.items
 */
(function (global) {
  "use strict";

  /* ================================================================
   *  工具
   * ================================================================ */

  /**
   * HTML 实体转义
   * @param {string} str
   * @returns {string}
   */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * 安全读取嵌套属性
   * @param {Object} obj
   * @param {string} path  e.g. "theme.accentColors"
   * @returns {*}
   */
  function get(obj, path) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  /**
   * 获取当前语言代码
   * @returns {string}
   */
  function getLang() {
    try { return localStorage.getItem("userLanguage") || "zh-CN"; }
    catch (e) { return "zh-CN"; }
  }

  /**
   * 解析 label（支持 { en: "...", "zh-CN": "..." } 格式）
   * @param {string|Object} label
   * @returns {string}
   */
  function resolveLabel(label) {
    if (typeof label === "string") return label;
    if (!label) return "";
    var lang = getLang();
    return label[lang] || label["en"] || label["zh-CN"] || "";
  }

  /**
   * 生成 Material Icon HTML（优先 icon name，fallback emoji）
   * @param {string} [iconName]  Material Icons name
   * @param {string} [emoji]     emoji fallback
   * @returns {string}
   */
  function renderIcon(iconName, emoji) {
    if (iconName) {
      return '<span class="material-symbols-outlined">' + esc(iconName) + "</span>";
    }
    if (emoji) {
      return '<span class="mega-menu-emoji">' + esc(emoji) + "</span>";
    }
    return "";
  }

  /* ================================================================
   *  数据读取
   * ================================================================ */

  /**
   * 从 SITE_CONFIG 读取导航树
   * @returns {Array}
   */
  function _getNavItems() {
    var cfg = global.SITE_CONFIG || {};
    return get(cfg, "nav.items") || [];
  }

  /**
   * 获取产品线列表（非空时优先使用）
   * @returns {Array}
   */
  function getProductLines() {
    var cfg = global.SITE_CONFIG || {};
    var lines = get(cfg, "productLines") || [];
    return lines.filter(function (l) { return !l.hidden; });
  }

  /**
   * 获取 Mega Menu 列数
   * @returns {number}
   */
  function getMegaColumns() {
    var cfg = global.SITE_CONFIG || {};
    var mode = get(cfg, "navMode.megaColumns");
    return mode ? parseInt(mode, 10) : 4;
  }

  /**
   * 从 categories.products 构建产品线卡片数据（fallback）
   * @returns {Array}
   */
  function buildProductCardsFromCategories() {
    var cfg = global.SITE_CONFIG || {};
    var cats = get(cfg, "categories.products") || [];
    return cats.map(function (cat) {
      return {
        key: cat.slug || cat.key || "",
        name: resolveLabel(cat.label),
        icon: cat.icon || "",
        emoji: cat.emoji || "",
        accent: cat.accent || "coral",
        desc: "",
      };
    });
  }

  /**
   * 从 categories 构建非产品的导航分类列表（如 Solutions、Support）
   * @returns {Array<{title: string, items: Array}>}
   */
  function buildNavSections() {
    var cfg = global.SITE_CONFIG || {};
    var cats = get(cfg, "categories") || {};
    var basePath = global.BASE_PATH || "";
    var sections = [];

    if (cats.solutions && cats.solutions.length > 0) {
      sections.push({
        title: "Solutions",
        id: "solutions",
        items: cats.solutions.map(function (sol) {
          return {
            label: resolveLabel(sol.label),
            href: basePath + "/solutions/" + (sol.slug || sol.id || "") + "/",
            icon: sol.icon || "",
            emoji: sol.emoji || "",
          };
        }),
      });
    }

    if (cats.support && cats.support.length > 0) {
      sections.push({
        title: "Support",
        id: "support",
        items: cats.support.map(function (sup) {
          return {
            label: resolveLabel(sup.label),
            href: basePath + "/support/" + (sup.slug || sup.id || "") + "/",
            icon: sup.icon || "",
            emoji: sup.emoji || "",
          };
        }),
      });
    }

    return sections;
  }

  /* ================================================================
   *  渲染：产品线卡片
   * ================================================================ */

  /**
   * 渲染单个产品线卡片
   * @param {Object} item
   * @param {string} basePath
   * @returns {string}
   */
  function renderProductCard(item, basePath) {
    var href = item.href || (basePath + "/products/" + (item.slug || item.key || "") + "/");
    var accent = item.accent || "coral";
    var name = resolveLabel(item.name || item.label);
    var desc = item.desc || "";

    return (
      '<a class="mega-menu-card" href="' + esc(href) + '" data-accent="' + esc(accent) + '">' +
        '<div class="mega-menu-card-icon">' +
          renderIcon(item.icon, item.emoji) +
        "</div>" +
        '<div class="mega-menu-card-title">' + esc(name) + "</div>" +
        (desc ? '<div class="mega-menu-card-desc">' + esc(desc) + "</div>" : "") +
      "</a>"
    );
  }

  /**
   * 渲染产品线卡片网格
   * @returns {string}
   */
  function renderProductCardsHtml() {
    var basePath = global.BASE_PATH || "";
    var lines = getProductLines();
    var cards;

    if (lines.length > 0) {
      cards = lines.map(function (line) {
        return renderProductCard(line, basePath);
      }).join("\n");
    } else {
      var fallback = buildProductCardsFromCategories();
      cards = fallback.map(function (cat) {
        return renderProductCard(cat, basePath);
      }).join("\n");
    }

    return cards;
  }

  /* ================================================================
   *  渲染：导航分类列
   * ================================================================ */

  /**
   * 渲染单个分类列
   * @param {Object} section
   * @returns {string}
   */
  function renderSectionHtml(section) {
    var itemsHtml = section.items.map(function (item) {
      return (
        '<a class="mega-menu-link" href="' + esc(item.href) + '">' +
          '<span class="mega-menu-link-icon">' +
            renderIcon(item.icon, item.emoji) +
          "</span>" +
          '<span class="mega-menu-link-label">' + esc(item.label) + "</span>" +
        "</a>"
      );
    }).join("\n");

    return (
      '<div class="mega-menu-section">' +
        '<div class="mega-menu-section-title">' + esc(section.title) + "</div>" +
        '<div class="mega-menu-section-list">' + itemsHtml + "</div>" +
      "</div>"
    );
  }

  /**
   * 渲染所有分类列
   * @returns {string}
   */
  function renderNavSectionsHtml() {
    var sections = buildNavSections();
    if (sections.length === 0) return "";
    return sections.map(renderSectionHtml).join("\n");
  }

  /* ================================================================
   *  主渲染函数
   * ================================================================ */

  /**
   * 渲染完整的 Mega Menu 导航项（包含 trigger + dropdown）
   *
   * @param {Object} opts
   * @param {string} opts.href       导航项链接
   * @param {string} opts.labelKey   i18n key
   * @param {string} opts.label      显示文本
   * @param {string} opts.activeClass active 状态 class
   * @param {string} opts.variant    设备变体 (pc / tablet)
   * @param {Object} opts.navItem    原始导航项配置
   * @returns {string} HTML 字符串
   */
  function render(opts) {
    opts = opts || {};
    var navItem = opts.navItem || {};
    var navId = navItem.id || "";
    var basePath = global.BASE_PATH || "";
    var cols = getMegaColumns();

    /* ── 触发按钮 ── */
    var triggerClass = "mega-dropdown-trigger";
    var triggerLabel = esc(opts.label || navItem.label || "");
    var triggerI18n = esc(opts.labelKey || navItem.i18nKey || "");
    var triggerHtml =
      '<a class="' + triggerClass + " " + (opts.activeClass || "") + '" ' +
        'href="' + esc(opts.href || navItem.path || "#") + '" ' +
        'data-i18n="' + triggerI18n + '">' +
        triggerLabel +
      "</a>";

    /* ── 根据导航项 id 决定内容 ── */
    var contentHtml = "";
    var gridHtml = "";

    if (navId === "products") {
      gridHtml = renderProductCardsHtml();
    } else if (navItem.children && navItem.children.length > 0) {
      var basePathLocal = basePath;
      gridHtml = navItem.children.map(function (child) {
        var childHref = child.href || (basePathLocal + "/" + navId + "/" + (child.slug || child.id || "") + "/");
        return renderProductCard({
          key: child.id || "",
          name: resolveLabel(child.label),
          icon: child.icon || "",
          emoji: child.emoji || "",
          accent: child.accent || "coral",
          desc: child.desc || "",
          href: childHref,
        }, basePathLocal);
      }).join("\n");
    }

    /* 追加导航分类列（非产品菜单项时显示） */
    var sectionsHtml = (navId === "products") ? renderNavSectionsHtml() : "";

    if (gridHtml || sectionsHtml) {
      contentHtml =
        '<div class="mega-menu-inner">' +
          (gridHtml ? '<div class="mega-menu-grid mega-menu-grid--cols-' + cols + '">' + gridHtml + "</div>" : "") +
          sectionsHtml +
        "</div>";
    }

    /* ── Wrap ── */
    return (
      '<div class="mega-menu-wrap" data-mega-nav="' + esc(navId) + '">' +
        triggerHtml +
        '<div class="mega-menu-panel">' + contentHtml + "</div>" +
      "</div>"
    );
  }

  /* ================================================================
   *  样式注入
   * ================================================================ */

  var _stylesInjected = false;

  /**
   * 注入 Mega Menu 所需样式（幂等，仅注入一次）
   */
  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;

    var style = document.createElement("style");
    style.id = "mega-menu-styles";
    style.setAttribute("data-ver", "2026-05-14-v1");
    style.textContent = [
      /* ── Wrap & Panel ── */
      ".mega-menu-wrap { position: relative; }",

      ".mega-menu-panel {",
      "  position: absolute;",
      "  top: 100%;",
      "  left: 50%;",
      "  transform: translateX(-50%);",
      "  width: min(1080px, calc(100vw - 48px));",
      "  margin-top: 8px;",
      "  padding: 24px 28px 20px;",
      "  background: #ffffff;",
      "  border-radius: 16px;",
      "  box-shadow: 0 8px 40px rgba(0,0,0,0.10), 0 1.5px 6px rgba(0,0,0,0.06);",
      "  opacity: 0;",
      "  visibility: hidden;",
      "  transform: translateX(-50%) translateY(8px);",
      "  transition: opacity .25s ease, visibility .25s ease, transform .25s ease;",
      "  pointer-events: none;",
      "  z-index: var(--z-overlay, 800);",
      "}",
      ".mega-menu-wrap.is-open .mega-menu-panel,",
      ".mega-menu-wrap:hover .mega-menu-panel {",
      "  opacity: 1;",
      "  visibility: visible;",
      "  transform: translateX(-50%) translateY(0);",
      "  pointer-events: auto;",
      "}",

      /* ── Inner ── */
      ".mega-menu-inner { display: flex; gap: 32px; align-items: flex-start; }",

      /* ── Grid（产品线卡片） ── */
      ".mega-menu-grid { display: grid; gap: 16px; flex: 1; }",
      ".mega-menu-grid--cols-2 { grid-template-columns: repeat(2, 1fr); }",
      ".mega-menu-grid--cols-3 { grid-template-columns: repeat(3, 1fr); }",
      ".mega-menu-grid--cols-4 { grid-template-columns: repeat(4, 1fr); }",
      ".mega-menu-grid--cols-5 { grid-template-columns: repeat(5, 1fr); }",
      ".mega-menu-grid--cols-6 { grid-template-columns: repeat(6, 1fr); }",

      /* ── 产品线卡片 ── */
      ".mega-menu-card {",
      "  display: flex; flex-direction: column; align-items: center;",
      "  padding: 20px 12px 16px; text-align: center; text-decoration: none;",
      "  border-radius: 12px; border-top: 4px solid transparent;",
      "  background: #FAFAFA;",
      "  transition: transform .48s cubic-bezier(0.34,1.56,0.64,1), box-shadow .32s ease, background .2s ease;",
      "  cursor: pointer;",
      "}",
      ".mega-menu-card:hover {",
      "  transform: translateY(-8px);",
      "  box-shadow: 0 12px 28px rgba(0,0,0,0.10);",
      "  background: #F5F5F5;",
      "}",
      ".mega-menu-card .material-symbols-outlined {",
      "  font-size: 32px; line-height: 1; margin-bottom: 10px; color: #64748b;",
      "}",
      ".mega-menu-card:hover .material-symbols-outlined { color: var(--color-primary); }",
      ".mega-menu-card[data-accent] .material-symbols-outlined { color: var(--color-primary); }",

      ".mega-menu-emoji { font-size: 32px; line-height: 1; margin-bottom: 10px; display: block; }",

      ".mega-menu-card-title {",
      "  font-size: 14px; font-weight: 600; color: #1F2937; line-height: 1.3; margin-bottom: 4px;",
      "}",
      ".mega-menu-card:hover .mega-menu-card-title { color: var(--color-primary); }",
      ".mega-menu-card[data-accent]:hover .mega-menu-card-title { color: var(--color-primary); }",

      ".mega-menu-card-desc {",
      "  font-size: 12px; color: #6B7280; line-height: 1.4;",
      "  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;",
      "}",

      /* ── 导航分类列 ── */
      ".mega-menu-section { min-width: 180px; flex-shrink: 0; }",
      ".mega-menu-section-title {",
      "  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;",
      "  color: #9CA3AF; margin-bottom: 12px; padding-bottom: 8px;",
      "  border-bottom: 1px solid #E7E1D6;",
      "}",
      ".mega-menu-section-list { display: flex; flex-direction: column; gap: 2px; }",

      ".mega-menu-link {",
      "  display: flex; align-items: center; gap: 8px;",
      "  padding: 8px 10px; font-size: 13px; font-weight: 500; color: #4B5563;",
      "  text-decoration: none; border-radius: 8px;",
      "  transition: background .15s ease, color .15s ease;",
      "}",
      ".mega-menu-link:hover { background: rgba(var(--primary-rgb, 0,0,0), 0.06); color: var(--color-primary); }",
      ".mega-menu-link-icon .material-symbols-outlined { font-size: 18px; line-height: 1; }",
      ".mega-menu-link-icon .mega-menu-emoji { font-size: 16px; margin-bottom: 0; display: inline; }",
      ".mega-menu-link-label { line-height: 1.3; }",

      /* ── Trigger ── */
      ".mega-dropdown-trigger {",
      "  text-decoration: none; -webkit-tap-highlight-color: transparent;",
      "  display: flex; align-items: center; gap: 2px;",
      "}",
      ".mega-dropdown-trigger::after {",
      "  content: 'expand_more'; font-family: 'Material Symbols Outlined';",
      "  font-size: 16px; line-height: 1; opacity: .5;",
      "  transition: transform .2s ease;",
      "}",
      ".mega-menu-wrap.is-open .mega-dropdown-trigger::after,",
      ".mega-menu-wrap:hover .mega-dropdown-trigger::after {",
      "  transform: rotate(180deg);",
      "}",

      /* ── 暗色模式 ── */
      "html.dark .mega-menu-panel {",
      "  background: #1E1B2E; box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 1.5px 6px rgba(0,0,0,0.20);",
      "}",
      "html.dark .mega-menu-card { background: #26233A; }",
      "html.dark .mega-menu-card:hover { background: #302D48; }",
      "html.dark .mega-menu-card-title { color: #E5E7EB; }",
      "html.dark .mega-menu-card-desc { color: #9CA3AF; }",
      "html.dark .mega-menu-section-title { color: #6B7280; border-bottom-color: #374151; }",
      "html.dark .mega-menu-link { color: #D1D5DB; }",
      "html.dark .mega-menu-link:hover { background: rgba(236,91,19,0.12); color: #f97316; }",

      /* ── 响应式：移动端隐藏 ── */
      "@media (max-width: 767px) {",
      "  .mega-menu-panel { display: none !important; }",
      "  .mega-dropdown-trigger::after { display: none; }",
      "}",
    ].join("\n");
    document.head.appendChild(style);
  }

  /* ================================================================
   *  事件绑定
   * ================================================================ */

  var _spaRegs = {};

  /**
   * 使用 AbortController 绑定事件（与 navigator.js _spaOn 风格一致）
   * @param {EventTarget} tgt
   * @param {string} evt
   * @param {Function} fn
   * @param {string} key
   */
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  /**
   * 绑定 Mega Menu 的鼠标交互事件
   *
   * @param {HTMLElement} [container]  挂载容器（默认 document）
   */
  function bind(container) {
    container = container || document;
    injectStyles();

    /* 鼠标移入显示 */
    _spaOn(container, "mouseenter", function (e) {
      var wrap = e.target.closest(".mega-menu-wrap");
      if (!wrap) return;
      /* 关闭其他 dropdown */
      if (typeof global.Navigator !== "undefined" && typeof global.Navigator._closeOtherDropdowns === "function") {
        global.Navigator._closeOtherDropdowns(wrap);
      }
      wrap.classList.add("is-open");
    }, "mega-mouseenter");

    /* 鼠标移出隐藏 */
    _spaOn(container, "mouseleave", function (e) {
      var wrap = e.target.closest(".mega-menu-wrap");
      if (!wrap) return;
      wrap.classList.remove("is-open");
    }, "mega-mouseleave");
  }

  /* ================================================================
   *  导出
   * ================================================================ */

  global.MegaMenu = {
    render: render,
    injectStyles: injectStyles,
    bind: bind,
  };
})(window);
