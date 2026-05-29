/**
 * mega-menu.js — Mega Menu 渲染器（通用脚手架组件）
 *
 * 当 SITE_CONFIG.navMode.desktop === "mega-menu" 时启用。
 * 从 SITE_CONFIG 读取导航数据和产品线数据，渲染网格布局的 Mega Menu。
 *
 * hover 模式：与 DropdownBase 体系一致
 *   - touch 设备：click toggle is-open
 *   - 非 touch：CSS :not(.touch-device):hover 控制
 *
 * 依赖：DropdownBase (isTouch, esc, _spaOn)
 * 导出：window.MegaMenu
 */
(function (global) {
  "use strict";

  /* ================================================================
   *  工具（从 DropdownBase 借用）
   * ================================================================ */

  var base = global.DropdownBase;
  var esc = base
    ? base.esc
    : function (str) {
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      };
  var isTouch = base
    ? base.isTouch
    : function () {
        return "ontouchstart" in window || navigator.maxTouchPoints > 0;
      };
  var _spaOn = base ? base._spaOn : _fallbackSpaOn;

  var _spaRegs = {};
  function _fallbackSpaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
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
    try {
      return localStorage.getItem("userLanguage") || "zh-CN";
    } catch (e) {
      return "zh-CN";
    }
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
    return lines.filter(function (l) {
      return !l.hidden;
    });
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
    var href = item.href || basePath + "/products/" + (item.slug || item.key || "") + "/";
    var accent = item.accent || "coral";
    var name = resolveLabel(item.name || item.label);
    var desc = item.desc || "";

    return (
      '<a class="mega-menu-card" href="' +
      esc(href) +
      '" data-accent="' +
      esc(accent) +
      '">' +
      '<div class="mega-menu-card-icon">' +
      renderIcon(item.icon, item.emoji) +
      "</div>" +
      '<div class="mega-menu-card-title">' +
      esc(name) +
      "</div>" +
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
      cards = lines
        .map(function (line) {
          return renderProductCard(line, basePath);
        })
        .join("\n");
    } else {
      var fallback = buildProductCardsFromCategories();
      cards = fallback
        .map(function (cat) {
          return renderProductCard(cat, basePath);
        })
        .join("\n");
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
    var itemsHtml = section.items
      .map(function (item) {
        return (
          '<a class="mega-menu-link" href="' +
          esc(item.href) +
          '">' +
          '<span class="mega-menu-link-icon">' +
          renderIcon(item.icon, item.emoji) +
          "</span>" +
          '<span class="mega-menu-link-label">' +
          esc(item.label) +
          "</span>" +
          "</a>"
        );
      })
      .join("\n");

    return (
      '<div class="mega-menu-section">' +
      '<div class="mega-menu-section-title">' +
      esc(section.title) +
      "</div>" +
      '<div class="mega-menu-section-list">' +
      itemsHtml +
      "</div>" +
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
      '<a class="mega-menu-trigger ' +
      triggerClass +
      " " +
      (opts.activeClass || "") +
      '" ' +
      'href="' +
      esc(opts.href || navItem.path || "#") +
      '" ' +
      'data-i18n="' +
      triggerI18n +
      '">' +
      "<span>" +
      triggerLabel +
      "</span>" +
      '<span class="material-symbols-outlined mega-menu-arrow">expand_more</span>' +
      "</a>";

    /* ── 根据导航项 id 决定内容 ── */
    var contentHtml = "";
    var gridHtml = "";

    if (navId === "products") {
      gridHtml = renderProductCardsHtml();
    } else if (navItem.children && navItem.children.length > 0) {
      var basePathLocal = basePath;
      gridHtml = navItem.children
        .map(function (child) {
          var childHref = child.href || basePathLocal + "/" + navId + "/" + (child.slug || child.id || "") + "/";
          return renderProductCard(
            {
              key: child.id || "",
              name: resolveLabel(child.label),
              icon: child.icon || "",
              emoji: child.emoji || "",
              accent: child.accent || "coral",
              desc: child.desc || "",
              href: childHref,
            },
            basePathLocal
          );
        })
        .join("\n");
    }

    /* 追加导航分类列（非产品菜单项时显示） */
    var sectionsHtml = navId === "products" ? renderNavSectionsHtml() : "";

    if (gridHtml || sectionsHtml) {
      contentHtml =
        '<div class="mega-menu-inner">' +
        (gridHtml ? '<div class="mega-menu-grid mega-menu-grid--cols-' + cols + '">' + gridHtml + "</div>" : "") +
        sectionsHtml +
        "</div>";
    }

    /* ── Wrap ── */
    return (
      '<div class="mega-menu-wrap' +
      (isTouch() ? " touch-device" : "") +
      '" data-mega-nav="' +
      esc(navId) +
      '">' +
      triggerHtml +
      '<div class="mega-menu-panel">' +
      contentHtml +
      "</div>" +
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
    // CSS moved to styles.css
  }

  /* ================================================================
   *  事件绑定（走 DropdownBase 统一模式）
   * ================================================================ */

  var WRAP_CLASS = "mega-menu-wrap";
  var TRIGGER_CLASS = "mega-dropdown-trigger";
  var _triggerBoundFlag = "_megaTriggerBound";
  var _docClickBound = false;

  /**
   * 绑定 Mega Menu 交互事件（统一 DropdownBase 模式）
   *
   * @param {HTMLElement} [container]  挂载容器（默认 document）
   */
  function bind(container) {
    container = container || document;
    injectStyles();

    /* 绑定 trigger click（touch 设备 toggle，非 touch 不拦截） */
    container.querySelectorAll("." + TRIGGER_CLASS).forEach(function (t) {
      if (t[_triggerBoundFlag]) return;
      t[_triggerBoundFlag] = true;
      t.addEventListener("click", function (e) {
        if (window.innerWidth <= 767) return;
        if (isTouch()) {
          e.preventDefault();
          e.stopPropagation();
          var wrap = t.closest("." + WRAP_CLASS);
          if (wrap) wrap.classList.toggle("is-open");
        }
        /* 非 touch: click 不拦截，hover 已打开 dropdown，click 用于导航 */
      });
    });

    /* 全局 click 关闭 */
    if (!_docClickBound) {
      _docClickBound = true;
      document.addEventListener("click", function () {
        document.querySelectorAll("." + WRAP_CLASS + ".is-open").forEach(function (d) {
          d.classList.remove("is-open");
        });
      });
    }
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
