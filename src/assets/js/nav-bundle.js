function _t(k) {
  if (
    typeof window !== "undefined" &&
    window.translationManager &&
    typeof window.translationManager.translate === "function"
  ) {
    var r = window.translationManager.translate(k);
    return r && r !== k ? r : k;
  }
  return k;
}
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
    var sep = showSep ? '<div class="nav-dropdown-separator"></div>' : "";
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
        label: _t("nav_solutions_center") || "Solutions Center",
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
    var centerSep = centerEntry ? '<div class="nav-dropdown-separator"></div>' : "";

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
      popupHtml = centerPopupItem + '<div class="nav-dropdown-separator"></div>' + childItems;
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
      var allCard = renderProductCard(
        {
          key: "all",
          name: resolveLabel({ en: "All Products", "zh-CN": "全部产品" }),
          icon: "grid_view",
          emoji: "📋",
          accent: "coral",
          desc: resolveLabel({ en: "Browse all product categories", "zh-CN": "浏览全部产品分类" }),
          href: (global.BASE_PATH || "") + "/products/all/",
        },
        global.BASE_PATH || ""
      );
      gridHtml = allCard + "\n" + renderProductCardsHtml();
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
/**
 * custom-select.js - Universal Custom Select Component
 *
 * Replaces native <select> elements with a styled custom dropdown.
 * - PC/Tablet: floating dropdown panel (above/below trigger)
 * - Mobile (≤720px): iOS-style bottom sheet popup
 * - Supports: placeholder, searchable, disabled, optgroup, data-i18n
 * - Fully compatible with existing form-interactions.js validation
 * - Preserves native <select> as hidden source of truth (.value, .selectedIndex)
 * - Dark mode via class-based toggle
 *
 * Usage:
 *   <select data-custom-select id="my-field" required>
 *     <option value="">请选择</option>
 *     <option value="TH">🇹🇭 泰国</option>
 *   </select>
 *
 * Options (via data attributes):
 *   data-custom-select        - auto-init on DOMContentLoaded
 *   data-custom-search="true" - enable search filter in dropdown
 *   data-placeholder          - override placeholder text
 */

(function (global) {
  "use strict";
  var _theme = (window.SITE_CONFIG || window._cfg || {}).theme || {};
  var _primary = (_theme.colors || {}).primary || "#2E7D32";

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  /* ────────────────────────────────────────────────────────────────
   *  CONFIG
   * ──────────────────────────────────────────────────────────────── */

  var MOBILE_BREAKPOINT = 767;
  var STYLE_ID = "custom-select-styles";
  var ATTR = "data-custom-select";
  var OPEN_CLASS = "cs-is-open";
  var ACTIVE_CLASS = "cs-item-active";
  var HOVER_CLASS = "cs-item-hover";
  var DISABLED_CLASS = "cs-disabled";

  /* ────────────────────────────────────────────────────────────────
   *  HELPERS
   * ──────────────────────────────────────────────────────────────── */

  function esc(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  /* ────────────────────────────────────────────────────────────────
   *  CSS INJECTION (idempotent)
   * ──────────────────────────────────────────────────────────────── */

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var css = [
      /* ─── Trigger (the visible button) ─── */
      ".cs-trigger {",
      "  display: flex; align-items: center; justify-content: space-between;",
      "  width: 100%; cursor: pointer; user-select: none;",
      "  -webkit-tap-highlight-color: transparent;",
      "  position: relative;",
      "}",
      ".cs-trigger-text {",
      "  flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",
      "}",
      ".cs-trigger-text.cs-placeholder {",
      "  color: #94a3b8;",
      "}",
      "html.dark .cs-trigger-text.cs-placeholder {",
      "  color: #64748b;",
      "}",
      ".cs-trigger-chevron {",
      "  font-size: 20px; color: #94a3b8; flex-shrink: 0;",
      "  transition: transform .25s cubic-bezier(.4,0,.2,1);",
      "  margin-left: 4px;",
      "}",
      "html.dark .cs-trigger-chevron { color: #64748b; }",
      ".cs-is-open .cs-trigger-chevron,",
      ".cs-trigger-wrap:hover .cs-trigger-chevron {",
      "  transform: rotate(180deg);",
      "}",

      /* ─── Wrapper ─── */
      ".cs-trigger-wrap { position: relative; width: 100%; }",
      ".cs-trigger-wrap" + "." + DISABLED_CLASS + " .cs-trigger {",
      "  cursor: not-allowed; opacity: .5; pointer-events: none;",
      "}",

      /* ─── Floating Panel (PC/Tablet) - uses position:fixed to avoid overflow clipping ─── */
      ".cs-panel {",
      "  position: fixed;",
      "  background: rgba(248,250,252,1);",
      "  border: .5px solid rgba(0,0,0,.08);",
      "  border-radius: 12px; padding: 4px;",
      "  box-shadow: 0 0 0 .5px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06);",
      "  z-index: 3000; max-height: 260px; overflow-y: auto;",
      "  opacity: 0; visibility: hidden; pointer-events: none;",
      "  transform: translateY(-4px) scale(.98); transform-origin: top center;",
      "  transition: opacity .15s ease, transform .2s cubic-bezier(.32,.72,0,1), visibility 0s .15s;",
      "}",
      "html.dark .cs-panel {",
      "  background: rgba(30,41,59,1); border-color: rgba(255,255,255,.10);",
      "  box-shadow: 0 0 0 .5px rgba(255,255,255,.06), 0 8px 32px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.3);",
      "}",
      ".cs-is-open .cs-panel,.cs-panel.cs-is-open {",
      "  opacity: 1; visibility: visible; pointer-events: auto;",
      "  transform: translateY(0) scale(1);",
      "  transition: opacity .15s ease, transform .25s cubic-bezier(.32,.72,0,1), visibility 0s 0s;",
      "}",
      ".cs-panel-below { transform-origin: top center; }",
      ".cs-panel-above { transform-origin: bottom center; }",

      /* ─── Items ─── */
      ".cs-item {",
      "  display: flex; align-items: center; gap: 8px; padding: 10px 12px;",
      "  font-size: 14px; font-weight: 400; color: #1e293b; cursor: pointer;",
      "  border-radius: 8px; transition: background .1s ease;",
      "}",
      "html.dark .cs-item { color: #e2e8f0; }",
      ".cs-item:hover, .cs-item" + "." + HOVER_CLASS + " { background: rgba(236,91,19,.06); }",
      ".cs-item:active { background: rgba(236,91,19,.12); }",
      "html.dark .cs-item:hover, html.dark .cs-item" + "." + HOVER_CLASS + " { background: rgba(236,91,19,.10); }",
      ".cs-item" + "." + ACTIVE_CLASS + " {",
      "  background: rgba(236,91,19,.08); color: ' + _primary + '; font-weight: 600;",
      "}",
      "html.dark .cs-item" + "." + ACTIVE_CLASS + " { background: rgba(236,91,19,.14); color: #f97316; }",
      ".cs-item.cs-item-disabled {",
      "  opacity: .4; pointer-events: none;",
      "}",
      ".cs-check {",
      "  margin-left: auto; font-size: 18px; color: ' + _primary + '; opacity: 0; flex-shrink: 0;",
      "  transition: opacity .15s ease;",
      "}",
      "html.dark .cs-check { color: #f97316; }",
      ".cs-item" + "." + ACTIVE_CLASS + " .cs-check { opacity: 1; }",

      /* ─── Optgroup ─── */
      ".cs-group-label {",
      "  padding: 10px 12px 4px; font-size: 11px; font-weight: 600; letter-spacing: .03em;",
      "  color: #64748b; pointer-events: none;",
      "  border-top: 1px solid rgba(0,0,0,.06); margin-top: 2px;",
      "}",
      ".cs-group-label:first-child { border-top: none; margin-top: 0; }",
      "html.dark .cs-group-label { color: #94a3b8; border-top-color: rgba(255,255,255,.08); }",
      ".cs-group-items .cs-item { padding-left: 20px; font-size: 13px; }",

      /* ─── Search ─── */
      ".cs-search-wrap {",
      "  padding: 4px 4px 0; position: sticky; top: 0; z-index: 1;",
      "  background: inherit; border-radius: 8px 8px 0 0;",
      "}",
      ".cs-search {",
      "  width: 100%; padding: 8px 10px 8px 32px; font-size: 13px;",
      "  border: .5px solid rgba(0,0,0,.06); border-radius: 8px;",
      "  background: rgba(255,255,255,.8); color: #1e293b; outline: none;",
      "}",
      ".cs-search:focus { border-color: ' + _primary + '; box-shadow: 0 0 0 2px rgba(236,91,19,.15); }",
      "html.dark .cs-search {",
      "  background: rgba(51,65,85,.8); color: #e2e8f0; border-color: rgba(255,255,255,.08);",
      "}",
      "html.dark .cs-search:focus { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249,115,22,.15); }",
      ".cs-search-icon {",
      "  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);",
      "  font-size: 16px; color: #94a3b8; pointer-events: none;",
      "}",
      "html.dark .cs-search-icon { color: #64748b; }",
      ".cs-search-wrap .cs-search {",
      "  background: rgba(248,250,252,.95);",
      "}",
      "html.dark .cs-search-wrap .cs-search {",
      "  background: rgba(30,41,59,.95);",
      "}",

      /* ─── No Results ─── */
      ".cs-no-results {",
      "  padding: 16px; text-align: center; font-size: 13px; color: #94a3b8;",
      "}",
      "html.dark .cs-no-results { color: #64748b; }",

      /* ─── Mobile - hide float panel ─── */
      "@media (max-width: " + MOBILE_BREAKPOINT + "px) {",
      "  .cs-panel { display: none !important; }",
      "}",

      /* ─── Mobile Popup (bottom sheet) ─── */
      ".cs-popup-overlay {",
      "  position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 998;",
      "  animation: cs-fade-in .2s ease;",
      "}",
      ".cs-popup-panel {",
      "  position: fixed; left: 8px; right: 8px; bottom: 0;",
      "  background: rgba(248,250,252,.98);",
      "  border-radius: 14px 14px 0 0; transform: translateY(100%);",
      "  transition: transform .35s cubic-bezier(.32,.72,0,1);",
      "  z-index: 999; padding: 8px 4px calc(16px + env(safe-area-inset-bottom)) 4px;",
      "  box-shadow: 0 -2px 20px rgba(0,0,0,.1);",
      "}",
      ".cs-popup-panel.cs-popup-open { transform: translateY(0); }",
      "html.dark .cs-popup-panel {",
      "  background: rgba(30,41,59,.98); box-shadow: 0 -2px 20px rgba(0,0,0,.4);",
      "}",
      ".cs-popup-handle {",
      "  width: 36px; height: 5px; border-radius: 3px;",
      "  background: rgba(100,116,139,.25); margin: 0 auto 8px;",
      "}",
      "html.dark .cs-popup-handle { background: rgba(100,116,139,.35); }",
      ".cs-popup-title {",
      "  padding: 4px 12px 8px; font-size: 15px; font-weight: 600; color: #1e293b;",
      "}",
      "html.dark .cs-popup-title { color: #e2e8f0; }",
      /* ─── Mobile Popup Optgroup ─── */
      ".cs-popup-panel .cs-group-label {",
      "  padding: 10px 12px 4px; font-size: 11px; font-weight: 600; letter-spacing: .03em;",
      "  color: #64748b; pointer-events: none;",
      "  border-top: 1px solid rgba(0,0,0,.06); margin-top: 2px;",
      "}",
      ".cs-popup-panel .cs-group-label:first-child { border-top: none; margin-top: 0; }",
      "html.dark .cs-popup-panel .cs-group-label { color: #94a3b8; border-top-color: rgba(255,255,255,.08); }",
      ".cs-popup-panel .cs-group-items .cs-item { padding-left: 20px; font-size: 13px; }",
      ".cs-popup-list {",
      "  max-height: 50vh; overflow-y: auto; -webkit-overflow-scrolling: touch;",
      "}",
      ".cs-popup-search-wrap {",
      "  padding: 0 4px 8px; position: relative;",
      "}",
      ".cs-popup-search {",
      "  width: 100%; padding: 10px 10px 10px 36px; font-size: 15px;",
      "  border: .5px solid rgba(0,0,0,.06); border-radius: 10px;",
      "  background: rgba(255,255,255,.8); color: #1e293b; outline: none;",
      "}",
      ".cs-popup-search:focus { border-color: ' + _primary + '; box-shadow: 0 0 0 2px rgba(236,91,19,.15); }",
      "html.dark .cs-popup-search {",
      "  background: rgba(51,65,85,.8); color: #e2e8f0; border-color: rgba(255,255,255,.08);",
      "}",
      "html.dark .cs-popup-search:focus { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249,115,22,.15); }",
      ".cs-popup-search-icon {",
      "  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);",
      "  font-size: 18px; color: #94a3b8; pointer-events: none;",
      "}",
      "html.dark .cs-popup-search-icon { color: #64748b; }",

      /* shared keyframes */
      "@keyframes cs-fade-in { from { opacity: 0; } to { opacity: 1; } }",
    ].join("\n");

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ────────────────────────────────────────────────────────────────
   *  SINGLE INSTANCE
   * ──────────────────────────────────────────────────────────────── */

  function CustomSelectInstance(selectEl) {
    this.select = selectEl;
    this.wrap = null;
    this.trigger = null;
    this.panel = null;
    this.searchable = selectEl.getAttribute("data-custom-search") === "true";
    this.placeholder = selectEl.getAttribute("data-placeholder") || "";
    this._popupOverlay = null;
    this._popupPanel = null;
    this._bound = false;
  }

  /* Read options from native <select> */
  CustomSelectInstance.prototype.getOptions = function () {
    var opts = [];
    var groups = [];
    for (var i = 0; i < this.select.options.length; i++) {
      var o = this.select.options[i];
      opts.push({
        value: o.value,
        text: o.text,
        selected: o.selected,
        disabled: o.disabled,
        i18n: o.getAttribute("data-i18n") || "",
      });
    }
    // optgroups
    if (this.select.children) {
      for (var g = 0; g < this.select.children.length; g++) {
        var child = this.select.children[g];
        if (child.tagName && child.tagName.toLowerCase() === "optgroup") {
          var label = child.getAttribute("label") || "";
          var groupOpts = [];
          var groupChildren = child.children || child.childNodes;
          for (var j = 0; j < groupChildren.length; j++) {
            var go = groupChildren[j];
            if (!go || (go.tagName && go.tagName.toLowerCase() !== "option")) continue;
            groupOpts.push({
              value: go.value,
              text: go.text,
              selected: go.selected,
              disabled: go.disabled,
              i18n: go.getAttribute("data-i18n") || "",
            });
          }
          groups.push({ label: label, options: groupOpts });
        }
      }
    }
    return { options: opts, groups: groups };
  };

  /* Get display text for current value */
  CustomSelectInstance.prototype.getDisplayText = function () {
    if (!this.select.value) return this.placeholder || this.getOptions().options[0].text || "";
    var opt = this.select.options[this.select.selectedIndex];
    return opt ? opt.text : "";
  };

  /* Render the trigger + hidden native select + float panel */
  CustomSelectInstance.prototype.render = function () {
    if (this.wrap) return; // already rendered

    var selectEl = this.select;

    // ★ Read computed styles BEFORE hiding the native select
    var selectStyle = window.getComputedStyle(selectEl);
    var inheritProps = [
      "height",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "borderRadius",
      "fontSize",
      "fontWeight",
      "letterSpacing",
      "lineHeight",
    ];
    var computedStyle = {};
    for (var p = 0; p < inheritProps.length; p++) {
      var cssProp = inheritProps[p].replace(/([A-Z])/g, "-$1").toLowerCase();
      computedStyle[inheritProps[p]] = selectStyle.getPropertyValue(cssProp);
    }

    // Copy Tailwind classes from select to trigger (before mutating)
    // Use indexOf with the class suffix portion, so dark:text-white matches text-white etc.
    var classList = selectEl.classList;
    var SKIP = {
      "appearance-none": 1,
      "w-full": 1,
      "h-14": 1,
      "h-12": 1,
      "p-3": 1,
      "p-2\.5": 1,
      "px-4": 1,
      "px-3": 1,
      "py-3": 1,
    };
    var bgClasses = [];
    for (var c = 0; c < classList.length; c++) {
      var cls = classList[c];
      if (SKIP[cls]) continue;
      // Strip responsive/state prefixes to get the raw Tailwind token
      var token = cls.replace(/^(sm:|md:|lg:|xl:|dark:|focus:|hover:|active:)+/, "");
      // Match visual-property prefixes (everything except layout/spacing)
      var visPrefixes = ["border", "bg", "rounded", "text", "outline", "transition", "shadow", "ring"];
      var matched = false;
      for (var v = 0; v < visPrefixes.length; v++) {
        if (token.indexOf(visPrefixes[v]) === 0) {
          matched = true;
          break;
        }
      }
      if (matched) bgClasses.push(cls);
    }

    // ★ NOW hide native select (after reading styles)
    selectEl.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;clip:rect(0,0,0,0);";

    // Build trigger
    var displayText = this.getDisplayText();
    var isPlaceholder = !selectEl.value;

    this.wrap = document.createElement("div");
    this.wrap.className = "cs-trigger-wrap" + (selectEl.disabled ? " " + DISABLED_CLASS : "");
    this.wrap.style.width = "100%";

    this.trigger = document.createElement("div");
    this.trigger.className = "cs-trigger";

    // Apply pre-read computed styles (use array order, not for-in)
    for (var s = 0; s < inheritProps.length; s++) {
      var val = computedStyle[inheritProps[s]];
      if (val) this.trigger.style[inheritProps[s]] = val;
    }

    // Apply Tailwind classes
    if (bgClasses.length > 0) {
      this.trigger.classList.add.apply(this.trigger.classList, bgClasses);
    }

    // Ensure trigger has visible border (some selects only have border-color class
    // but no border-width - Tailwind reset sets border-width: 0)
    var hasBorderWidth =
      selectEl.classList.contains("border") ||
      selectEl.classList.contains("border-2") ||
      selectEl.classList.contains("border-y") ||
      selectEl.classList.contains("border-t") ||
      selectEl.classList.contains("border-b");
    if (!hasBorderWidth) {
      this.trigger.style.borderWidth = "1px";
      this.trigger.style.borderStyle = "solid";
    }
    this.trigger.setAttribute("tabindex", selectEl.disabled ? "-1" : "0");
    this.trigger.setAttribute("role", "combobox");
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.setAttribute("aria-haspopup", "listbox");
    // Copy relevant ARIA attributes
    if (selectEl.id) this.trigger.setAttribute("aria-labelledby", selectEl.id);

    /* @audit-safe: internal-data */
    /* @audit-safe: internal-data */
    this.trigger.innerHTML =
      '<span class="cs-trigger-text' +
      (isPlaceholder ? " cs-placeholder" : "") +
      '">' +
      esc(displayText) +
      "</span>" +
      '<span class="material-symbols-outlined cs-trigger-chevron">expand_more</span>';

    // Build float panel
    this.panel = this._buildPanel();

    // Insert into DOM
    selectEl.parentNode.insertBefore(this.wrap, selectEl);
    this.wrap.appendChild(this.trigger);
    this.wrap.appendChild(selectEl);
    // Panel goes to <body> to avoid being affected by ancestor transforms
    // (e.g. .animate-hidden translate3d) which break position:fixed
    document.body.appendChild(this.panel);

    // Debug: log sizing after DOM insertion
    if (window.__CS_DEBUG) {
      var wR = this.wrap.getBoundingClientRect();
      var tR = this.trigger.getBoundingClientRect();
      // Compare with nearby input if any
      var siblingInput = this.wrap.parentNode.querySelector("input");
      if (siblingInput) {
        var iR = siblingInput.getBoundingClientRect();
      }
    }

    this._bindEvents();
  };

  /* Build the floating dropdown panel */
  CustomSelectInstance.prototype._buildPanel = function () {
    var data = this.getOptions();
    var panel = document.createElement("div");
    panel.className = "cs-panel cs-panel-below";
    panel.setAttribute("role", "listbox");

    var html = "";

    // Search box
    if (this.searchable) {
      html +=
        '<div class="cs-search-wrap" style="position:relative;">' +
        '<span class="material-symbols-outlined cs-search-icon">search</span>' +
        '<input type="text" class="cs-search" placeholder="搜索...">' +
        "</div>";
    }

    // Items
    html += this._buildItemsHTML(data);

    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    panel.innerHTML = html;

    // Bind search
    if (this.searchable) {
      var self = this;
      var searchInput = panel.querySelector(".cs-search");
      searchInput.addEventListener("input", function () {
        var q = this.value.trim().toLowerCase();
        var items = panel.querySelectorAll(".cs-item");
        var groups = panel.querySelectorAll(".cs-group-label");
        var hasVisible = false;
        for (var i = 0; i < items.length; i++) {
          var text = (items[i].getAttribute("data-text") || "").toLowerCase();
          var show = !q || text.indexOf(q) !== -1;
          items[i].style.display = show ? "" : "none";
          if (show) hasVisible = true;
        }
        // show/hide group labels
        for (var g = 0; g < groups.length; g++) {
          var wrapper = groups[g].nextElementSibling;
          var anyVisible = false;
          if (wrapper && wrapper.classList.contains("cs-group-items")) {
            var wrappedItems = wrapper.querySelectorAll(".cs-item");
            for (var w = 0; w < wrappedItems.length; w++) {
              if (wrappedItems[w].style.display !== "none") {
                anyVisible = true;
                break;
              }
            }
          }
          groups[g].style.display = anyVisible ? "" : "none";
        }
        // no results
        var noRes = panel.querySelector(".cs-no-results");
        if (!hasVisible && q) {
          if (!noRes) {
            noRes = document.createElement("div");
            noRes.className = "cs-no-results";
            noRes.textContent = "无匹配结果";
            panel.appendChild(noRes);
          }
          noRes.style.display = "";
        } else if (noRes) {
          noRes.style.display = "none";
        }
      });
    }

    // Bind item click
    var self = this;
    panel.addEventListener("click", function (e) {
      var item = e.target.closest(".cs-item");
      if (!item || item.classList.contains("cs-item-disabled")) return;
      self._selectItem(item);
    });

    return panel;
  };

  /* Build items HTML */
  CustomSelectInstance.prototype._buildItemsHTML = function (data) {
    var html = "";
    var hasGroups = data.groups && data.groups.length > 0;

    // Filter out placeholder options (value="") — shown as popup-title, not as item
    function withoutPlaceholder(opts) {
      return opts.filter(function (o) {
        return o.value !== "";
      });
    }

    if (hasGroups) {
      for (var g = 0; g < data.groups.length; g++) {
        html += '<div class="cs-group-label">' + esc(data.groups[g].label) + "</div>";
        html +=
          '<div class="cs-group-items">' +
          this._buildOptionItemsHTML(withoutPlaceholder(data.groups[g].options)) +
          "</div>";
      }
      // Also add non-grouped options
      if (data.options.length > 0) {
        // Check if options were already in groups
        var groupedValues = {};
        for (var gg = 0; gg < data.groups.length; gg++) {
          for (var oo = 0; oo < data.groups[gg].options.length; oo++) {
            groupedValues[data.groups[gg].options[oo].value] = true;
          }
        }
        var ungrouped = data.options.filter(function (o) {
          return !groupedValues[o.value] && o.value !== "";
        });
        if (ungrouped.length > 0) {
          html += this._buildOptionItemsHTML(ungrouped);
        }
      }
    } else {
      html += this._buildOptionItemsHTML(withoutPlaceholder(data.options));
    }

    return html;
  };

  CustomSelectInstance.prototype._buildOptionItemsHTML = function (options) {
    var html = "";
    for (var i = 0; i < options.length; i++) {
      var o = options[i];
      var active = o.selected ? " " + ACTIVE_CLASS : "";
      var disabled = o.disabled ? " cs-item-disabled" : "";
      var i18nAttr = o.i18n ? ' data-i18n="' + esc(o.i18n) + '"' : "";
      html +=
        '<div class="cs-item' +
        active +
        disabled +
        '"' +
        ' data-value="' +
        esc(o.value) +
        '"' +
        ' data-text="' +
        esc(o.text) +
        '"' +
        i18nAttr +
        ' role="option">' +
        "<span>" +
        esc(o.text) +
        "</span>" +
        '<span class="material-symbols-outlined cs-check">check</span>' +
        "</div>";
    }
    return html;
  };

  /* Select an item by its DOM element */
  CustomSelectInstance.prototype._selectItem = function (itemEl) {
    var value = itemEl.getAttribute("data-value");
    var text = itemEl.getAttribute("data-text");

    // Update native select
    this.select.value = value;
    // Trigger change event on native select for form handlers
    var evt = new Event("change", { bubbles: true });
    this.select.dispatchEvent(evt);

    // Update trigger text (may be null when using buildPanel without render)
    var isPlaceholder = !value;
    if (this.trigger) {
      var textEl = this.trigger.querySelector(".cs-trigger-text");
      if (textEl) {
        textEl.textContent = isPlaceholder ? this.placeholder || text : text;
        textEl.className = "cs-trigger-text" + (isPlaceholder ? " cs-placeholder" : "");
      }
    }

    // Update active state
    if (this.panel) {
      var items = this.panel.querySelectorAll(".cs-item");
      for (var i = 0; i < items.length; i++) {
        items[i].classList.remove(ACTIVE_CLASS);
      }
      itemEl.classList.add(ACTIVE_CLASS);
    }

    // Close
    this.close();
  };

  /* Open */
  CustomSelectInstance.prototype.open = function () {
    if (this.select.disabled) return;

    if (isMobile()) {
      this._openPopup();
    } else {
      this._openPanel();
    }
  };

  CustomSelectInstance.prototype._openPanel = function () {
    // Close others first
    CustomSelect.closeAll();

    this.wrap.classList.add(OPEN_CLASS);
    this.panel.classList.add(OPEN_CLASS);
    this.trigger.setAttribute("aria-expanded", "true");

    // Position panel using fixed coordinates from trigger rect (or override anchor)
    var anchor = this._positionAnchor || this.trigger;
    var rect = anchor.getBoundingClientRect();
    var panelWidth = rect.width;
    var gap = 6;
    var spaceBelow = window.innerHeight - rect.bottom;
    var spaceAbove = rect.top;
    var openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;

    // Set position
    this.panel.style.left = rect.left + "px";
    this.panel.style.width = panelWidth + "px";

    if (openAbove) {
      this.panel.classList.remove("cs-panel-below");
      this.panel.classList.add("cs-panel-above");
      this.panel.style.top = "";
      this.panel.style.bottom = window.innerHeight - rect.top + gap + "px";
    } else {
      this.panel.classList.remove("cs-panel-above");
      this.panel.classList.add("cs-panel-below");
      this.panel.style.bottom = "";
      this.panel.style.top = rect.bottom + gap + "px";
    }

    // Bind scroll/resize reposition for this instance
    var self = this;
    this._onScrollResize = function () {
      if (!self.wrap.classList.contains(OPEN_CLASS)) {
        self._removeScrollResize();
        return;
      }
      var anchor = self._positionAnchor || self.trigger;
      var r = anchor.getBoundingClientRect();
      self.panel.style.left = r.left + "px";
      self.panel.style.width = r.width + "px";
      var sb = window.innerHeight - r.bottom;
      var sa = r.top;
      var above = sb < 280 && sa > sb;
      if (above) {
        self.panel.style.top = "";
        self.panel.style.bottom = window.innerHeight - r.top + gap + "px";
        self.panel.classList.remove("cs-panel-below");
        self.panel.classList.add("cs-panel-above");
      } else {
        self.panel.style.bottom = "";
        self.panel.style.top = r.bottom + gap + "px";
        self.panel.classList.remove("cs-panel-above");
        self.panel.classList.add("cs-panel-below");
      }
    };
    window.addEventListener("scroll", this._onScrollResize, true);
    window.addEventListener("resize", this._onScrollResize);

    // Focus search if available
    var searchInput = this.panel.querySelector(".cs-search");
    if (searchInput) {
      setTimeout(function () {
        searchInput.focus();
      }, 50);
    }
  };

  CustomSelectInstance.prototype._removeScrollResize = function () {
    if (this._onScrollResize) {
      window.removeEventListener("scroll", this._onScrollResize, true);
      window.removeEventListener("resize", this._onScrollResize);
      this._onScrollResize = null;
    }
  };

  CustomSelectInstance.prototype._openPopup = function () {
    this._closePopup();
    CustomSelect.closeAll();

    var data = this.getOptions();
    var placeholder = this.placeholder || this.getOptions().options[0].text || "";

    // Overlay
    this._popupOverlay = document.createElement("div");
    this._popupOverlay.className = "cs-popup-overlay";

    // Panel
    this._popupPanel = document.createElement("div");
    this._popupPanel.className = "cs-popup-panel";

    var html = '<div class="cs-popup-handle"></div>';

    // Title (trigger text or label)
    var labelEl = this.select.parentNode.querySelector("label");
    var titleText = labelEl ? labelEl.textContent.trim().replace(/\s*\*\s*$/, "") : placeholder;
    html += '<div class="cs-popup-title">' + esc(titleText) + "</div>";

    // Search
    if (this.searchable) {
      html +=
        '<div class="cs-popup-search-wrap">' +
        '<span class="material-symbols-outlined cs-popup-search-icon">search</span>' +
        '<input type="text" class="cs-popup-search" placeholder="搜索...">' +
        "</div>";
    }

    // Items
    html += '<div class="cs-popup-list">' + this._buildItemsHTML(data) + "</div>";

    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    this._popupPanel.innerHTML = html;

    // Insert
    document.body.appendChild(this._popupOverlay);
    document.body.appendChild(this._popupPanel);

    // Bind overlay close
    var self = this;
    this._popupOverlay.addEventListener("click", function () {
      self.close();
    });

    // Bind item click
    var popupItems = this._popupPanel.querySelectorAll(".cs-item");
    for (var i = 0; i < popupItems.length; i++) {
      popupItems[i].addEventListener("click", function () {
        self._selectItem(this);
        self._closePopup();
      });
    }

    // Bind search
    if (this.searchable) {
      var searchInput = this._popupPanel.querySelector(".cs-popup-search");
      searchInput.addEventListener("input", function () {
        var q = this.value.trim().toLowerCase();
        var items = self._popupPanel.querySelectorAll(".cs-item");
        var groupLabels = self._popupPanel.querySelectorAll(".cs-group-label");
        var hasVisible = false;
        for (var j = 0; j < items.length; j++) {
          var text = (items[j].getAttribute("data-text") || "").toLowerCase();
          var show = !q || text.indexOf(q) !== -1;
          items[j].style.display = show ? "" : "none";
          if (show) hasVisible = true;
        }
        // Hide group labels whose items are all filtered out
        for (var g = 0; g < groupLabels.length; g++) {
          var wrapper = groupLabels[g].nextElementSibling;
          var anyVisible = false;
          if (wrapper && wrapper.classList.contains("cs-group-items")) {
            var wrappedItems = wrapper.querySelectorAll(".cs-item");
            for (var w = 0; w < wrappedItems.length; w++) {
              if (wrappedItems[w].style.display !== "none") {
                anyVisible = true;
                break;
              }
            }
          }
          groupLabels[g].style.display = anyVisible ? "" : "none";
        }
        var noRes = self._popupPanel.querySelector(".cs-no-results");
        if (!hasVisible && q) {
          if (!noRes) {
            noRes = document.createElement("div");
            noRes.className = "cs-no-results";
            noRes.textContent = "无匹配结果";
            self._popupPanel.querySelector(".cs-popup-list").appendChild(noRes);
          }
          noRes.style.display = "";
        } else if (noRes) {
          noRes.style.display = "none";
        }
      });
      setTimeout(function () {
        searchInput.focus();
      }, 100);
    }

    // Animate open
    requestAnimationFrame(function () {
      if (self._popupPanel) {
        self._popupPanel.classList.add("cs-popup-open");
        if (navigator.vibrate) navigator.vibrate(10);
      }
    });
  };

  CustomSelectInstance.prototype._closePopup = function () {
    if (this._popupOverlay) {
      this._popupOverlay.parentNode && this._popupOverlay.parentNode.removeChild(this._popupOverlay);
      this._popupOverlay = null;
    }
    if (this._popupPanel) {
      this._popupPanel.parentNode && this._popupPanel.parentNode.removeChild(this._popupPanel);
      this._popupPanel = null;
    }
  };

  /* Close */
  CustomSelectInstance.prototype.close = function () {
    this.wrap && this.wrap.classList.remove(OPEN_CLASS);
    this.panel && this.panel.classList.remove(OPEN_CLASS);
    this.trigger && this.trigger.setAttribute("aria-expanded", "false");
    this._closePopup();
    this._removeScrollResize();
    // Reset inline positioning so it doesn't linger
    if (this.panel) {
      this.panel.style.left = "";
      this.panel.style.top = "";
      this.panel.style.bottom = "";
      this.panel.style.width = "";
    }
  };

  /* Bind events */
  CustomSelectInstance.prototype._bindEvents = function () {
    if (this._bound) return;
    this._bound = true;
    var self = this;

    // Trigger click
    this.trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (self.wrap.classList.contains(OPEN_CLASS)) {
        self.close();
      } else {
        self.open();
      }
    });

    // Keyboard
    this.trigger.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        self.open();
      } else if (e.key === "Escape") {
        self.close();
      }
    });
  };

  /* Refresh trigger text (e.g. after external value change) */
  CustomSelectInstance.prototype.refresh = function () {
    var text = this.getDisplayText();
    var isPlaceholder = !this.select.value;
    var textEl = this.trigger.querySelector(".cs-trigger-text");
    if (textEl) {
      textEl.textContent = text;
      textEl.className = "cs-trigger-text" + (isPlaceholder ? " cs-placeholder" : "");
    }
    // Refresh panel active state
    if (this.panel) {
      var items = this.panel.querySelectorAll(".cs-item");
      for (var i = 0; i < items.length; i++) {
        if (items[i].getAttribute("data-value") === this.select.value) {
          items[i].classList.add(ACTIVE_CLASS);
        } else {
          items[i].classList.remove(ACTIVE_CLASS);
        }
      }
    }
  };

  /* ────────────────────────────────────────────────────────────────
   *  STATIC API
   * ──────────────────────────────────────────────────────────────── */

  var instances = [];

  /* CustomSelect constructor (factory - delegates to Instance) */
  function CustomSelect(el) {
    return CustomSelect.init(el);
  }

  CustomSelect.closeAll = function () {
    for (var i = 0; i < instances.length; i++) {
      instances[i].close();
    }
  };

  /* Close all when clicking outside */
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".cs-trigger-wrap")) {
      CustomSelect.closeAll();
    }
  });

  /* Close on Escape */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") CustomSelect.closeAll();
  });

  /* Close on spa:load */
  _spaOn(
    document,
    "spa:load",
    function () {
      CustomSelect.closeAll();
    },
    "spa:load:closeAll"
  );

  /* Init all [data-custom-select] elements */
  CustomSelect.initAll = function (root) {
    injectStyles();
    root = root || document;
    var els = root.querySelectorAll("select[" + ATTR + "]");
    for (var i = 0; i < els.length; i++) {
      // Skip if already initialized
      if (els[i]._customSelectInstance) continue;
      // Skip lang-selector — managed manually by navigator.js (buildPanel)
      if (els[i].id === "lang-selector") continue;
      // Skip selects with no options (may be populated later by JS)
      if (els[i].options.length === 0 && els[i].children.length === 0) continue;
      var inst = new CustomSelectInstance(els[i]);
      inst.render();
      els[i]._customSelectInstance = inst;
      instances.push(inst);
    }
  };

  /* Init a single element and return the instance */
  CustomSelect.init = function (selectEl) {
    injectStyles();
    if (selectEl._customSelectInstance) return selectEl._customSelectInstance;
    if (selectEl.id === "lang-selector") return null; // managed by navigator.js
    var inst = new CustomSelectInstance(selectEl);
    inst.render();
    selectEl._customSelectInstance = inst;
    instances.push(inst);
    return inst;
  };

  /* Get instance by native select element */
  CustomSelect.getInstance = function (selectEl) {
    return selectEl._customSelectInstance || null;
  };

  /**
   * Lightweight panel factory — builds a dropdown panel without rendering trigger/wrap.
   * Useful for custom button-triggered selects (e.g. language switcher).
   * Returns { panel: HTMLElement, data: Object } — caller manages show/hide/position.
   */
  CustomSelect.buildPanel = function (selectEl) {
    injectStyles();
    var tempInst = new CustomSelectInstance(selectEl);
    var data = tempInst.getOptions();
    var panel = tempInst._buildPanel();
    return { panel: panel, data: data, inst: tempInst };
  };

  /* ────────────────────────────────────────────────────────────────
   *  AUTO-INIT on DOMContentLoaded
   * ──────────────────────────────────────────────────────────────── */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      CustomSelect.initAll();
    });
  } else {
    CustomSelect.initAll();
  }

  /* Re-init on spa:load (SPA navigation may inject new selects) */
  _spaOn(
    document,
    "spa:load",
    function () {
      CustomSelect.initAll();
    },
    "spa:load:initAll"
  );

  /* ────────────────────────────────────────────────────────────────
   *  EXPORT
   * ──────────────────────────────────────────────────────────────── */

  global.CustomSelect = CustomSelect;
})(window);
/**
 * navigator.js — 主导航组件
 *
 * 负责渲染桌面端、平板端、移动端三种布局的顶部导航栏，
 * 协调各 dropdown 子模块的样式注入与点击事件绑定，
 * 并提供 updateActive / highlightCategory 等公开 API 供 SPA 路由调用。
 *
 * 依赖：
 *   - (nav-config removed — uses built-in defaults)
 *   - window.ProductsDropdown       (dropdown/products-dropdown.js)
 *   - window.SolutionsDropdown       (dropdown/solutions-dropdown.js)
 *   - window.AboutDropdown          (dropdown/about-dropdown.js)
 *   - window.SlideMenu              (slide-menu.js)
 *   - window.DropdownBaseStyles     (dropdown-styles.js)
 */
/* global CustomSelect */
(function (_global) {
  "use strict";
  /**
   * 获取主题 primary 色彩（实时从 SITE_CONFIG 读取）
   * @returns {string} primary 色值
   */
  function getPrimaryColor() {
    var cfg = window.SITE_CONFIG || window._cfg || {};
    return ((cfg.theme || {}).colors || {}).primary || "#2E7D32";
  }
  /**
   * 获取主题 accent 色彩（实时从 SITE_CONFIG 读取）
   * @param {string} accentKey - accent 名称
   * @returns {string} accent primary 色值
   */
  function _getAccentColor(accentKey) {
    var cfg = window.SITE_CONFIG || window._cfg || {};
    var accents = (cfg.theme || {}).accentColors || {};
    return (accents[accentKey] || {}).primary || getPrimaryColor();
  }

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  /** i18n helper: translate key via window.translationManager */
  function _t(k) {
    if (
      typeof window !== "undefined" &&
      window.translationManager &&
      typeof window.translationManager.translate === "function"
    ) {
      var r = window.translationManager.translate(k);
      return r && r !== k ? r : k;
    }
    return k;
  }

  /* ================================================================
   *  常量 & 配置
   * ================================================================ */

  /** @type {Array} 当前生效的导航项 (recomputed per-call to avoid stale closure) */

  /* CANONICAL_NAV_ITEMS 定义在文件末尾，作为 config 完全不可用时的 fallback */

  /**
   * 获取导航项（配置驱动）
   * 优先从 SITE_CONFIG.nav 读取，fallback 到 DEFAULT_NAV_ITEMS
   * @returns {Array} 导航项数组
   */
  function getNavItems() {
    var cfg = window.SITE_CONFIG || window._cfg || {};
    // 如果配置了自定义导航项（nav.items 格式），转换为内部格式
    if (cfg.nav && Array.isArray(cfg.nav.items) && cfg.nav.items.length > 0) {
      return cfg.nav.items.map(function (navItem) {
        var label =
          typeof navItem.label === "object" ? navItem.label["zh-CN"] || navItem.label.en || navItem.id : navItem.label;
        return {
          key: navItem.i18nKey || "nav_" + navItem.id,
          label: label,
          path: navItem.href || "/" + navItem.id + "/",
          id: navItem.id,
          hasDropdown: !!(navItem.children && navItem.children.length > 0),
          children: navItem.children || [], // 供 MegaMenu 渲染子项
          i18nKey: navItem.i18nKey || "nav_" + navItem.id,
          // 保留原始引用，供未来扩展
          _source: navItem,
        };
      });
    }
    // Fallback 到 CANONICAL_NAV_ITEMS（定义在文件末尾）
    return CANONICAL_NAV_ITEMS;
  }

  /**
   * 从 SITE_CONFIG 构建导航项
   * @param {Object} cfg - SITE_CONFIG 对象
   * @returns {Array} 导航项数组
   */
  function buildNavFromConfig(cfg) {
    var navItems = (cfg.nav || {}).items;
    if (!navItems || !Array.isArray(navItems) || navItems.length === 0) {
      return CANONICAL_NAV_ITEMS;
    }
    return navItems.map(function (navItem) {
      var label =
        typeof navItem.label === "object" ? navItem.label["zh-CN"] || navItem.label.en || navItem.id : navItem.label;
      return {
        key: navItem.i18nKey || "nav_" + navItem.id,
        label: label,
        path: navItem.href || "/" + navItem.id + "/",
        id: navItem.id,
        hasDropdown: !!(navItem.children && navItem.children.length > 0),
        _source: navItem,
      };
    });
  }

  /**
   * 所有 dropdown 容器的 CSS 类名（用于互斥开关）
   * @type {string[]}
   */
  var DROPDOWN_WRAP_SELECTORS = [
    ".prod-dropdown-wrap",
    ".sol-dropdown-wrap",
    ".abt-dropdown-wrap",
    ".cnt-dropdown-wrap",
    ".nav-dropdown-wrap",
    ".mega-menu-wrap",
  ];

  /**
   * 特殊路径 → 导航 active id 的映射
   * 用于将非标准路径（如 case-studies）映射到对应主导航项
   * @type {Object<string, string>}
   */
  var PATH_TO_ACTIVE_MAP = {
    "oem-customization": "solutions",
    "odm-service": "solutions",
    "obm-partnership": "solutions",
    "case-studies": "resources",
    news: "contact",
    "thank-you": "contact",
    all: "products",
    coffee: "products",
    tea: "products",
    meal: "products",
    beauty: "products",
    weight: "products",
    gut: "products",
    lifestyle: "products",
    legacy: "products",
    oem: "solutions",
    rd: "solutions",
    packaging: "solutions",
    catalog: "resources",
    videos: "resources",
    whitepapers: "resources",
    cases: "resources",
  };

  /**
   * 获取路径激活映射（配置驱动）
   * @returns {Object} 路径 → active id 映射
   */
  function getPathToActiveMap() {
    var cfg = window.SITE_CONFIG || window._cfg || {};
    if (cfg.routes && cfg.routes.activeMap) {
      return cfg.routes.activeMap;
    }
    return PATH_TO_ACTIVE_MAP;
  }

  /* Sections whose nav item id differs from the activeSectionId (version drift) */
  var ID_ALIASES = {
    solutions: ["solutions"],
  };

  /**
   * 导航 id → dropdown item 前缀的映射
   * @type {Object<string, string>}
   */
  var ACTIVE_TO_PREFIX_MAP = {
    products: "prod",
    solutions: "sol",
    manufacturing: "mfg",
    compliance: "cmp",
    about: "abt",
    contact: "cnt",
    resources: "res",
    "case-studies": "res",
    "oem-customization": "sol",
    "odm-service": "sol",
    "obm-partnership": "sol",
    news: "cnt",
    "thank-you": "cnt",
    all: "prod",
    coffee: "prod",
    tea: "prod",
    meal: "prod",
    beauty: "prod",
    weight: "prod",
    gut: "prod",
    lifestyle: "prod",
    legacy: "prod",
    oem: "sol",
    rd: "sol",
    packaging: "sol",
    catalog: "res",
    videos: "res",
    whitepapers: "res",
    cases: "res",
  };

  /** @type {string} 当前检测到的设备变体（mobile / tablet / pc） */
  var currentVariant = "pc";

  /** @type {number|null} resize 防抖定时器 */
  var resizeTimer = null;

  /* ================================================================
   *  工具函数
   * ================================================================ */

  /**
   * 对字符串做 HTML 实体转义，防止 XSS
   * @param {string} str - 原始字符串
   * @returns {string} 转义后的安全字符串
   */
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /**
   * 解析 HTML data-* 属性为布尔值
   *   - null / "" / "false" → fallback
   *   - 其它任何值 → true
   * @param {string|null|undefined} attrVal - data 属性的原始值
   * @param {boolean} fallback - 默认值
   * @returns {boolean}
   */
  function parseBooleanAttr(attrVal, fallback) {
    return attrVal == null || attrVal === "" ? fallback : attrVal !== "false";
  }

  /* ================================================================
   *  Header 渲染
   * ================================================================ */

  /**
   * 构建 PC / 移动端搜索栏 HTML
   * @param {string} placeholderI18nKey - i18n placeholder key
   * @returns {string} HTML 字符串
   */
  /**
   * 统一搜索栏构建（PC / Mobile / Tablet 共用）
   * @param {Object} opts
   * @param {string} opts.id          - 搜索栏 DOM id（如 'search-bar'）
   * @param {string} opts.inputId     - 搜索输入框 id（如 'search-input'）
   * @param {string} opts.placeholderI18n - i18n placeholder key
   * @param {string} [opts.wrapperClass] - 可选 wrapper 额外 class
   * @param {string} [opts.barClass]    - 可选 bar 额外 class
   * @returns {string} HTML 字符串
   */
  function buildSearchBarHtml(opts) {
    var id = opts.id || "search-bar";
    var inputId = opts.inputId || id + "-input";
    return (
      '<div class="ios-search-wrapper ' +
      (opts.wrapperClass || "") +
      '">' +
      '<div class="ios-search-bar" id="' +
      id +
      '" ' +
      (opts.barClass || "") +
      ">" +
      '<span class="ios-search-icon material-symbols-outlined">search</span>' +
      '<input class="ios-search-input" id="' +
      inputId +
      '" ' +
      'placeholder="' +
      _t("search_products_placeholder") +
      '" ' +
      'data-i18n-placeholder="' +
      escapeHtml(opts.placeholderI18n || "search_placeholder") +
      '" ' +
      'type="search" autocomplete="off" spellcheck="false"/>' +
      '<a class="ios-search-clear" href="javascript:void(0)" ' +
      'aria-label="Clear" role="button" tabindex="-1" ' +
      'style="text-decoration:none;-webkit-tap-highlight-color:transparent">' +
      '<span class="material-symbols-outlined">cancel</span>' +
      "</a>" +
      "</div>" +
      "</div>"
    );
  }

  /**
   * 构建移动端 / 平板端 Header HTML
   * @param {Object} opts - 配置项
   * @param {string} opts.searchI18n - 搜索栏 placeholder i18n key
   * @returns {string} HTML 字符串
   */
  function buildMobileHeaderHtml(opts) {
    var basePath = window.BASE_PATH || "";
    var searchI18n = opts.searchI18n || "search_placeholder";
    var isTablet = opts.variant === "tablet";

    /* 右侧区域：tablet 显示 语言切换 + CTA（和 PC 顺序一致），mobile 只显示语言切换 */
    var rightSide = "";
    if (isTablet && opts.showCta) {
      rightSide =
        '<div class="flex items-center gap-2 flex-shrink-0">' +
        buildLangSelectorHtml() +
        '<a href="' +
        escapeHtml(opts.ctaHref || "/contact/") +
        '" ' +
        'class="bg-primary text-white px-4 py-2 rounded-lg font-bold ' +
        'text-xs whitespace-nowrap active:scale-95 transition-all outline-none" ' +
        'style="-webkit-tap-highlight-color:transparent;color:#fff!important;"' +
        'data-i18n="' +
        escapeHtml(opts.ctaTextKey || "nav_contact_us") +
        '">' +
        "联系我们" +
        "</a>" +
        "</div>";
    } else {
      rightSide = '<div class="flex-shrink-0">' + buildLangSelectorHtml() + "</div>";
    }

    return (
      '<header id="mobile-header" ' +
      'class="fixed top-0 left-0 right-0 z-[var(--z-header)] ' +
      "border-b border-slate-200 dark:border-slate-800 " +
      'bg-background-light/90 dark:bg-background-dark/90 transition-transform duration-300">' +
      '<div class="px-4 py-3 flex items-center gap-3" style="padding-top:calc(var(--trust-bar-height,0px) + 0.75rem)">' +
      /* 左侧：汉堡菜单 + Logo */
      '<div class="flex items-center gap-1 flex-shrink-0">' +
      '<a id="mobile-menu-toggle" href="javascript:void(0)" ' +
      'class="flex items-center justify-center w-10 h-10 -ml-2 ' +
      "rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 " +
      'transition-colors" role="button" aria-label="Menu" ' +
      'style="text-decoration:none;-webkit-tap-highlight-color:transparent">' +
      '<span class="material-symbols-outlined text-2xl">menu</span>' +
      "</a>" +
      '<a class="nav-logo-link hidden lg:block" href="' +
      basePath +
      '/home/">' +
      '<img loading="eager" ' +
      'src="' +
      basePath +
      '/assets/images/logo-footer.webp" ' +
      'alt="Yukoli" width="32" height="32" ' +
      'style="width:32px;height:32px;object-fit:contain" />' +
      "</a>" +
      "</div>" +
      /* 中间：搜索栏 */
      '<div class="flex-1 min-w-0 mx-1">' +
      buildSearchBarHtml({ id: "mobile-search-bar", inputId: "mobile-search-input", placeholderI18n: searchI18n }) +
      "</div>" +
      /* 右侧 */
      rightSide +
      "</div>" +
      "</header>"
    );
  }

  /**
   * 构建单个导航项的 HTML（含 dropdown 集成）
   * @param {Object} navItem - 导航项配置
   * @param {string} activeId - 当前激活的导航 id
   * @param {string} variant - 设备变体 (pc / tablet)
   * @returns {string} HTML 字符串
   */
  function buildNavItemHtml(navItem, activeId, variant) {
    var activeIds = ID_ALIASES[activeId] || [activeId];
    var isActive = activeIds.indexOf(navItem.id) !== -1;
    var activeClass = isActive
      ? "text-sm font-semibold text-primary"
      : "text-sm font-semibold hover:text-primary transition-colors";
    var href = navItem.path;

    /* ---------- 有 dropdown 的导航项 ---------- */
    if (navItem.hasDropdown) {
      /* ---------- Mega Menu 模式 ---------- */
      if (typeof window.MegaMenu !== "undefined") {
        var cfg = window.SITE_CONFIG || window._cfg || {};
        if (
          (cfg.navMode || {}).desktop === "mega-menu" &&
          (cfg.features || {}).megaMenu !== false &&
          variant === "pc"
        ) {
          return window.MegaMenu.render({
            href: href,
            label: navItem.label,
            activeClass: activeClass,
            navItem: navItem,
          });
        }
      }

      var dropdownModules = {
        products: window.ProductsDropdown,
        applications: window.ApplicationsDropdown,
        support: window.SupportDropdown,
        solutions: window.SolutionsDropdown,
        about: window.AboutDropdown,
      };
      var dropdown = dropdownModules[navItem.id];

      if (dropdown) {
        var renderArgs = { href: href, labelKey: navItem.key, label: navItem.label, activeClass: activeClass };

        if (variant === "pc") {
          return dropdown.renderPC(renderArgs);
        }
        if (variant === "tablet") {
          return dropdown.renderTablet(renderArgs);
        }
      }

      /* 通用 NavDropdown 模块（处理所有未定制的有子项菜单） */
      if (typeof window.NavDropdown !== "undefined") {
        var genericRenderArgs = {
          href: href,
          labelKey: navItem.key,
          label: navItem.label,
          activeClass: activeClass,
          navItem: navItem,
        };
        if (variant === "pc") {
          return window.NavDropdown.renderPC(genericRenderArgs);
        }
        if (variant === "tablet") {
          return window.NavDropdown.renderTablet(genericRenderArgs);
        }
      }

      /* dropdown 模块未加载时，降级为纯文本占位 */
      return '<span class="' + activeClass + ' pointer-events-none">' + navItem.label + "</span>";
    }

    /* ---------- 普通链接导航项 ---------- */
    var safeHref = escapeHtml(href);
    return (
      '<a class="' +
      activeClass +
      '" href="' +
      safeHref +
      '">' +
      '<span data-i18n="' +
      escapeHtml(navItem.key) +
      '">' +
      escapeHtml(navItem.label) +
      "</span>" +
      "</a>"
    );
  }

  /**
   * 构建导航区域（<nav> 内的所有项）
   * @param {string} activeId - 当前激活的导航 id
   * @param {string} variant - 设备变体
   * @returns {string} HTML 字符串
   */
  function buildNavItemsHtml(activeId, variant) {
    var items = getNavItems();
    return items
      .map(function (item) {
        return buildNavItemHtml(item, activeId, variant);
      })
      .join("\n");
  }

  /**
   * 构建桌面端搜索栏 HTML
   * @param {Object} opts - 配置项
   * @param {string} opts.searchI18n - i18n key
   * @param {string} opts.searchBp - 断点 (lg / xl)
   * @returns {string} HTML 字符串
   */
  function buildDesktopSearchHtml(opts) {
    var hiddenClass = opts.searchBp === "lg" ? "hidden lg:flex" : "hidden xl:flex";
    return buildSearchBarHtml({
      id: "search-bar",
      inputId: "search-input",
      placeholderI18n: opts.searchI18n,
      wrapperClass: hiddenClass + " items-center flex-shrink-0",
      barClass: "",
    });
  }

  /**
   * Ensure custom-select.js is loaded (dynamic loader)
   * Idempotent — safe to call multiple times.
   */
  function _loadScript(src, id) {
    if (document.getElementById(id)) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.id = id;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureCustomSelect() {
    if (typeof CustomSelect !== "undefined") return Promise.resolve();
    var basePath = window.BASE_PATH || "";
    return _loadScript(basePath + "/assets/js/ui/custom-select.js", "custom-select-dynamic");
  }

  function ensureLangRegistry() {
    if (typeof window.LANG_REGISTRY !== "undefined") return Promise.resolve();
    var basePath = window.BASE_PATH || "";
    return _loadScript(basePath + "/assets/js/lang-registry.js", "lang-registry-dynamic");
  }

  /**
   * Populate hidden <select> with optgroups from LANG_REGISTRY.
   * Safe to call multiple times — clears and rebuilds.
   */
  function _populateLangSelect(selectEl) {
    var reg = window.LANG_REGISTRY;
    if (!reg || !reg.LANGUAGES || !selectEl) return;

    // Clear existing content
    /* @audit-safe: constant-html */
    /* @audit-safe: constant-html */
    selectEl.innerHTML = "";

    var currentLang;
    try {
      currentLang = localStorage.getItem("userLanguage");
    } catch (e) {
      currentLang = null;
    }
    currentLang = currentLang || "zh-CN";
    var groups = {
      common: { label: "常用 / Common", langs: [] },
      southeast_asia: { label: "东南亚 / Southeast Asia", langs: [] },
      east_asia: { label: "东亚 / East Asia", langs: [] },
      middle_east: { label: "中东 / Middle East", langs: [] },
      european: { label: "欧洲 / Europe", langs: [] },
      other: { label: "其他 / Other", langs: [] },
    };

    reg.LANGUAGES.forEach(function (l) {
      var g = l.uiGroup || "common";
      if (!groups[g]) groups[g] = { label: g, langs: [] };
      groups[g].langs.push(l);
    });

    var groupOrder = ["common", "southeast_asia", "east_asia", "middle_east", "european", "other"];
    groupOrder.forEach(function (gid) {
      var grp = groups[gid];
      if (!grp || grp.langs.length === 0) return;
      var og = document.createElement("optgroup");
      og.setAttribute("label", grp.label);
      grp.langs.forEach(function (l) {
        var opt = document.createElement("option");
        opt.value = l.code;
        opt.textContent = l.nativeName;
        if (l.code === currentLang) opt.selected = true;
        og.appendChild(opt);
      });
      selectEl.appendChild(og);
    });
  }

  /**
   * Build language switcher — icon+text button (original style) + hidden <select> with optgroups.
   * The button triggers custom-select's dropdown on click via initLangSwitcher().
   * @returns {string} HTML string
   */
  function buildLangSelectorHtml() {
    // Always generate the button + empty hidden <select>.
    // The <select> is populated lazily on first click (when LANG_REGISTRY is available),
    // so this works even on pages that don't load lang-registry.js directly.
    var currentLang;
    try {
      currentLang = localStorage.getItem("userLanguage");
    } catch (e) {
      currentLang = null;
    }
    currentLang = currentLang || "zh-CN";
    var currentLangName = "简体中文";
    if (currentLang === "en") currentLangName = "English";
    var reg = window.LANG_REGISTRY;
    if (reg && reg.LANGUAGES) {
      var found = reg.LANGUAGES.find(function (l) {
        return l.code === currentLang;
      });
      if (found) currentLangName = found.nativeName;
    }

    return (
      '<div class="lang-dropdown-container relative flex-shrink-0">' +
      '<a id="lang-toggle-btn" href="javascript:void(0)" ' +
      'class="flex items-center gap-1 px-2 py-2 rounded-xl ' +
      "text-sm font-medium text-slate-600 dark:text-slate-300 " +
      "hover:bg-slate-100 dark:hover:bg-slate-800 " +
      "active:bg-slate-200 dark:active:bg-slate-700 " +
      'transition-colors md:gap-1.5 md:px-3" role="button" ' +
      'aria-label="Switch language" ' +
      'data-i18n-aria="lang_switcher_aria" ' +
      'style="text-decoration:none;-webkit-tap-highlight-color:transparent">' +
      '<span class="material-symbols-outlined text-base ' +
      'leading-none">language</span>' +
      '<span id="current-lang-label" data-i18n="current_lang">' +
      escapeHtml(currentLangName) +
      "</span>" +
      '<span class="material-symbols-outlined text-xs opacity-40">' +
      "expand_more</span>" +
      "</a>" +
      '<select id="lang-selector" style="display:none"></select>' +
      "</div>"
    );
  }

  /**
   * 构建 CTA 按钮（"联系我们"）HTML
   * @param {Object} opts - 配置项
   * @param {string} opts.ctaTextKey - i18n key
   * @param {string} opts.ctaHref - 链接地址
   * @returns {string} HTML 字符串
   */
  function buildCtaButtonHtml(opts) {
    return (
      '<div class="hidden lg:block flex-shrink-0">' +
      '<a href="' +
      escapeHtml(opts.ctaHref) +
      '" ' +
      'class="bg-primary text-white px-6 py-2.5 rounded-xl font-bold ' +
      "text-sm whitespace-nowrap hover:opacity-90 active:scale-95 " +
      'transition-all outline-none" ' +
      'style="-webkit-tap-highlight-color:transparent;color:#fff!important;" ' +
      'data-i18n="' +
      escapeHtml(opts.ctaTextKey) +
      '">' +
      "联系我们" +
      "</a>" +
      "</div>"
    );
  }

  /**
   * 构建完整的桌面端 Header HTML
   * @param {Object} opts - 完整配置项
   * @returns {string} HTML 字符串
   */
  function buildDesktopHeaderHtml(opts) {
    var basePath = window.BASE_PATH || "";
    var rightSideItems = [];

    if (opts.showSearch) {
      rightSideItems.push(
        buildDesktopSearchHtml({
          searchI18n: opts.searchI18n,
          searchBp: opts.searchBp,
        })
      );
    }
    if (opts.showLang) {
      rightSideItems.push(buildLangSelectorHtml());
    }
    if (opts.showCta) {
      rightSideItems.push(
        buildCtaButtonHtml({
          ctaTextKey: opts.ctaTextKey,
          ctaHref: opts.ctaHref,
        })
      );
    }

    return (
      '<header id="main-header" class="fixed top-0 left-0 right-0 z-[var(--z-header)] ' +
      "border-b border-slate-200 dark:border-slate-800 " +
      'bg-background-light/90 dark:bg-background-dark/90">' +
      '<div class="max-w-[1920px] mx-auto px-3 md:px-5 lg:px-5 xl:px-10 ' +
      'py-4 flex items-center justify-between" style="min-height:108px;padding-top:calc(var(--trust-bar-height,0px) + 1rem)">' +
      /* 左侧：Logo + 导航 */
      '<div class="flex items-center gap-4 lg:gap-8">' +
      '<a class="nav-logo-link hidden lg:block" href="' +
      basePath +
      '/home/">' +
      '<img loading="eager" ' +
      'src="' +
      basePath +
      '/assets/images/logo-footer.webp" ' +
      'alt="Yukoli" width="44" height="44" ' +
      'style="width:44px;height:44px;object-fit:contain" />' +
      "</a>" +
      '<nav class="hidden md:flex items-center gap-4 lg:gap-8">' +
      buildNavItemsHtml(opts.active, opts.variant) +
      "</nav>" +
      "</div>" +
      /* 右侧：搜索 / 语言 / CTA */
      '<div class="flex items-center gap-6">' +
      rightSideItems.join("\n") +
      "</div>" +
      "</div>" +
      "</header>"
    );
  }

  /**
   * 根据配置构建 Header HTML（统一入口）
   * @param {Object} opts - 完整配置项
   * @param {string} opts.variant - 设备变体 (mobile / tablet / pc)
   * @returns {string} HTML 字符串
   */
  function buildHeaderHtml(opts) {
    if (opts.variant === "mobile" || opts.variant === "tablet") {
      return buildMobileHeaderHtml(opts);
    }
    return buildDesktopHeaderHtml(opts);
  }

  /* ================================================================
   *  样式注入
   * ================================================================ */

  /**
   * 注入 Logo 链接的基础样式（仅注入一次）
   */
  function injectLogoStyles() {
    // CSS moved to styles.css
  }

  /**
   * 注入 iOS 风格搜索栏样式（仅注入一次）
   */
  function injectSearchStyles() {
    /* migrated to styles.css — no-op */
  }

  /**
   * 注入所有 dropdown 模块的基础样式
   */
  function injectDropdownStyles() {
    if (window.DropdownBaseStyles) window.DropdownBaseStyles.inject();
    if (window.ProductsDropdown) window.ProductsDropdown.injectAllStyles();
    if (window.SolutionsDropdown) window.SolutionsDropdown.injectAllStyles();
    if (window.AboutDropdown) window.AboutDropdown.injectAllStyles();
    if (window.ApplicationsDropdown) window.ApplicationsDropdown.injectAllStyles();
    if (window.SupportDropdown) window.SupportDropdown.injectAllStyles();
    if (window.NavDropdown) window.NavDropdown.injectAllStyles();
    if (window.ContactDropdown) window.ContactDropdown.injectAllStyles();
  }

  /* ================================================================
   *  Dropdown 互斥逻辑
   * ================================================================ */

  /**
   * 关闭除指定元素外的所有已打开 dropdown
   * @param {HTMLElement|null} keepOpen - 保持打开的 dropdown 容器
   */
  function closeOtherDropdowns(keepOpen) {
    for (var i = 0; i < DROPDOWN_WRAP_SELECTORS.length; i++) {
      var openDropdowns = document.querySelectorAll(DROPDOWN_WRAP_SELECTORS[i] + ".is-open");
      for (var j = 0; j < openDropdowns.length; j++) {
        if (openDropdowns[j] !== keepOpen) {
          openDropdowns[j].classList.remove("is-open");
        }
      }
    }
  }

  /* ================================================================
   *  搜索栏交互
   * ================================================================ */

  /**
   * 统一搜索栏交互初始化（focus / blur / input / clear / Escape）
   * 自动检测页面上存在的搜索栏并绑定事件
   */
  function initSearchInteraction() {
    var bars = document.querySelectorAll(".ios-search-bar");
    if (bars.length === 0) return;

    bars.forEach(function (bar) {
      var searchInput = bar.querySelector(".ios-search-input");
      var clearBtn = bar.querySelector(".ios-search-clear");
      if (!searchInput) return;

      function removeFocus() {
        bar.classList.remove("is-focused");
      }

      function updateClearVisibility() {
        if (!clearBtn) return;
        if (searchInput.value.length > 0) {
          clearBtn.classList.add("is-visible");
        } else {
          clearBtn.classList.remove("is-visible");
        }
      }

      searchInput.addEventListener("focus", function () {
        bar.classList.add("is-focused");
      });

      searchInput.addEventListener("blur", function () {
        setTimeout(function () {
          if (document.activeElement !== searchInput) removeFocus();
        }, 150);
      });

      searchInput.addEventListener("input", updateClearVisibility);

      if (clearBtn) {
        clearBtn.addEventListener("mousedown", function (e) {
          e.preventDefault();
        });

        clearBtn.addEventListener("click", function () {
          searchInput.value = "";
          updateClearVisibility();
          searchInput.focus();
        });

        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && document.activeElement === searchInput) {
            searchInput.value = "";
            updateClearVisibility();
            searchInput.blur();
            removeFocus();
          }
        });
      }
    });
  }

  /* ================================================================
   *  Dropdown 鼠标互斥 & 点击事件绑定
   * ================================================================ */

  /* ================================================================
   *  翻译 & SlideMenu 初始化
   * ================================================================ */

  /**
   * 重新绑定翻译管理器的事件监听并应用当前语言翻译
   */
  function reinitTranslationManager() {
    if (!window.translationManager) return;

    if (typeof window.translationManager.resetEventListeners === "function") {
      window.translationManager.resetEventListeners();
    }
    if (typeof window.translationManager.applyTranslations === "function") {
      window.translationManager.applyTranslations();
    }
    if (typeof window.translationManager.setupEventListeners === "function") {
      window.translationManager.setupEventListeners();
    }
  }

  /**
   * 初始化 SlideMenu（侧滑菜单）
   */
  function initSlideMenu() {
    if (!window.SlideMenu) return;

    if (typeof window.SlideMenu.initToggle === "function") {
      window.SlideMenu.initToggle();
    }
    if (typeof window.SlideMenu.initSmartHeader === "function") {
      window.SlideMenu.initSmartHeader();
    }
  }

  /**
   * 初始化平板端搜索切换按钮
   */
  function initTabletSearchToggle() {
    var toggleBtn = document.getElementById("tablet-search-toggle");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.SlideMenu && typeof window.SlideMenu.openMobileSearch === "function") {
        window.SlideMenu.openMobileSearch();
      }
    });
  }

  /* ── Language switcher panel management (lightweight, no full CustomSelectInstance render) ── */
  var _langPanel = null;
  var _langOverlay = null;
  var _langAnchor = null;

  function initLangSwitcher() {
    var btn = document.getElementById("lang-toggle-btn");
    if (!btn) return;

    // Remove old listeners by replacing node
    var clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    clone.addEventListener("click", function (e) {
      e.stopPropagation();
      _closeLangPanel();

      var selectEl = document.getElementById("lang-selector");
      if (!selectEl) return;

      // Ensure lang-registry.js + custom-select.js are loaded, then open
      Promise.all([ensureLangRegistry(), ensureCustomSelect()])
        .then(function () {
          // Populate <select> with optgroups from LANG_REGISTRY (idempotent)
          _populateLangSelect(selectEl);
          _openLangPanel(selectEl, clone);
        })
        .catch(function (err) {
          console.warn("[Navigator] Failed to load lang dependencies:", err);
        });
    });
  }

  function _closeLangPanel() {
    if (_langPanel) {
      _langPanel.parentNode && _langPanel.parentNode.removeChild(_langPanel);
      _langPanel = null;
    }
    if (_langOverlay) {
      _langOverlay.parentNode && _langOverlay.parentNode.removeChild(_langOverlay);
      _langOverlay = null;
    }
    document.removeEventListener("scroll", _onLangScroll, true);
    document.removeEventListener("resize", _onLangScroll);
    document.removeEventListener("keydown", _onLangKeydown);
    // Remove outside-click listener
    if (_langOutsideClickHandler) {
      document.removeEventListener("click", _langOutsideClickHandler, true);
      _langOutsideClickHandler = null;
    }
  }

  var _langOutsideClickHandler = null;
  function _onLangKeydown(e) {
    if (e.key === "Escape") _closeLangPanel();
  }

  /**
   * Handle language change from hidden <select>.
   * Called when custom-select's _selectItem fires change event on the <select>.
   * Updates localStorage, button label, and closes the panel.
   */
  function _onLangChange() {
    var selectEl = document.getElementById("lang-selector");
    if (!selectEl) return;
    var langCode = selectEl.value;
    if (!langCode) return;

    // Update localStorage
    try {
      localStorage.setItem("userLanguage", langCode);
    } catch (e) {}

    // Update button label
    var labelEl = document.getElementById("current-lang-label");
    if (labelEl && window.LANG_REGISTRY) {
      var found = window.LANG_REGISTRY.LANGUAGES.find(function (l) {
        return l.code === langCode;
      });
      labelEl.textContent = found ? found.nativeName : langCode;
    }

    // Close panel
    _closeLangPanel();

    // Trigger full page language change via translationManager
    if (window.translationManager && typeof window.translationManager.setLanguage === "function") {
      window.translationManager.setLanguage(langCode);
    }
  }

  function _onLangScroll() {
    if (!_langPanel || !_langAnchor) return;
    _positionLangPanel(_langAnchor.getBoundingClientRect());
  }

  function _positionLangPanel(rect) {
    if (!_langPanel) return;
    var spaceBelow = window.innerHeight - rect.bottom;
    var spaceAbove = rect.top;
    var openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    var gap = 6;
    var panelWidth = Math.min(280, Math.max(rect.width, 220));
    var left = rect.right - panelWidth;
    if (left < 8) left = Math.min(rect.left, 8);
    if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - 8 - panelWidth;
    _langPanel.style.left = left + "px";
    _langPanel.style.width = panelWidth + "px";
    if (openAbove) {
      _langPanel.classList.remove("cs-panel-below");
      _langPanel.classList.add("cs-panel-above");
      _langPanel.style.top = "";
      _langPanel.style.bottom = window.innerHeight - rect.top + gap + "px";
    } else {
      _langPanel.classList.remove("cs-panel-above");
      _langPanel.classList.add("cs-panel-below");
      _langPanel.style.bottom = "";
      _langPanel.style.top = rect.bottom + gap + "px";
    }
  }

  function _openLangPanel(selectEl, anchorBtn) {
    _closeLangPanel();
    _langAnchor = anchorBtn;

    if (window.innerWidth <= 767) {
      _openLangMobile(selectEl, anchorBtn);
      return;
    }

    // ── PC/Tablet: floating panel ──
    // Use lightweight panel factory — no full render, no trigger/wrap
    var result = CustomSelect.buildPanel(selectEl);
    _langPanel = result.panel;
    document.body.appendChild(_langPanel);

    // Intercept item clicks to handle close ourselves (before custom-select's _selectItem.close)
    _langPanel.addEventListener(
      "click",
      function (e) {
        var item = e.target.closest(".cs-item");
        if (!item || item.classList.contains("cs-item-disabled")) return;
        e.stopImmediatePropagation(); // prevent custom-select's handler
        selectEl.value = item.getAttribute("data-value");
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        // _onLangChange will handle the rest
      },
      true
    );

    // Listen for change on the hidden <select> (fired by item click handlers)
    // to close the panel and update the button label
    if (!selectEl._langChangeBound) {
      selectEl._langChangeBound = true;
      selectEl.addEventListener("change", _onLangChange);
    }

    _positionLangPanel(anchorBtn.getBoundingClientRect());
    requestAnimationFrame(function () {
      _langPanel.classList.add("cs-is-open");
    });

    document.addEventListener("scroll", _onLangScroll, true);
    document.addEventListener("resize", _onLangScroll);
    document.addEventListener("keydown", _onLangKeydown);

    _langOutsideClickHandler = function (e) {
      if (!_langPanel) return;
      if (_langPanel.contains(e.target) || anchorBtn.contains(e.target)) return;
      _closeLangPanel();
    };
    setTimeout(function () {
      document.addEventListener("click", _langOutsideClickHandler, true);
    }, 0);
  }

  function _openLangMobile(selectEl, anchorBtn) {
    _langOverlay = document.createElement("div");
    _langOverlay.className = "cs-popup-overlay";
    _langPanel = document.createElement("div");
    _langPanel.className = "cs-popup-panel";

    // Listen for change on hidden <select> (fired by item click handlers)
    if (!selectEl._langChangeBound) {
      selectEl._langChangeBound = true;
      selectEl.addEventListener("change", _onLangChange);
    }

    var result = CustomSelect.buildPanel(selectEl);
    var data = result.data;

    var html = '<div class="cs-popup-handle"></div>';
    var labelEl = anchorBtn.querySelector("#current-lang-label");
    html += '<div class="cs-popup-title">' + escapeHtml(labelEl ? labelEl.textContent : "") + "</div>";
    html +=
      '<div class="cs-popup-search-wrap">' +
      '<span class="material-symbols-outlined cs-popup-search-icon">search</span>' +
      '<input type="text" class="cs-popup-search" placeholder="搜索...">' +
      "</div>";
    html += '<div class="cs-popup-list">' + result.inst._buildItemsHTML(data) + "</div>";
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    _langPanel.innerHTML = html;

    document.body.appendChild(_langOverlay);
    document.body.appendChild(_langPanel);

    _langOverlay.addEventListener("click", function () {
      _closeLangPanel();
    });

    var items = _langPanel.querySelectorAll(".cs-item");
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        item.addEventListener("click", function () {
          selectEl.value = item.getAttribute("data-value");
          selectEl.dispatchEvent(new Event("change", { bubbles: true }));
          // _onLangChange will handle the rest (label update, close, setLanguage)
        });
      })(items[i]);
    }

    var searchInput = _langPanel.querySelector(".cs-popup-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        var q = this.value.trim().toLowerCase();
        var panelItems = _langPanel.querySelectorAll(".cs-item");
        var groupLabels = _langPanel.querySelectorAll(".cs-group-label");
        var hasVisible = false;
        for (var j = 0; j < panelItems.length; j++) {
          var text = (panelItems[j].getAttribute("data-text") || "").toLowerCase();
          var show = !q || text.indexOf(q) !== -1;
          panelItems[j].style.display = show ? "" : "none";
          if (show) hasVisible = true;
        }
        for (var g = 0; g < groupLabels.length; g++) {
          var next = groupLabels[g].nextElementSibling;
          var anyVisible = false;
          while (next && !next.classList.contains("cs-group-label")) {
            if (next.classList.contains("cs-item") && next.style.display !== "none") {
              anyVisible = true;
              break;
            }
            next = next.nextElementSibling;
          }
          groupLabels[g].style.display = anyVisible ? "" : "none";
        }
        var noRes = _langPanel.querySelector(".cs-no-results");
        if (!hasVisible && q) {
          if (!noRes) {
            noRes = document.createElement("div");
            noRes.className = "cs-no-results";
            noRes.textContent = "无匹配结果";
            _langPanel.querySelector(".cs-popup-list").appendChild(noRes);
          }
          noRes.style.display = "";
        } else if (noRes) {
          noRes.style.display = "none";
        }
      });
    }

    requestAnimationFrame(function () {
      _langPanel.classList.add("cs-popup-open");
    });
    document.addEventListener("keydown", _onLangKeydown);
  }

  /* ================================================================
   *  从 placeholder 解析配置
   * ================================================================ */

  /**
   * 根据窗口宽度和 data-variant 属性确定设备变体
   * @param {string} declaredVariant - placeholder 上声明的 variant
   * @returns {string} 实际使用的 variant (mobile / tablet / pc)
   */
  function resolveVariant(declaredVariant) {
    if (declaredVariant !== "pc") return declaredVariant;

    // 优先使用 DeviceUtils（与 CSS @media 一致）
    if (window.DeviceUtils && typeof window.DeviceUtils.getDeviceType === "function") {
      return window.DeviceUtils.getDeviceType();
    }

    var width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1280) return "tablet";
    return "pc";
  }

  /**
   * 从 placeholder DOM 元素提取完整的 header 配置
   * @param {HTMLElement} placeholder - data-component="navigator" 元素
   * @returns {Object} 配置对象
   */
  function extractConfigFromPlaceholder(placeholder) {
    var variant = resolveVariant(placeholder.getAttribute("data-variant") || "pc");

    return {
      variant: variant,
      active: placeholder.getAttribute("data-active") || "",
      showSearch: parseBooleanAttr(placeholder.getAttribute("data-search"), false),
      searchI18n: placeholder.getAttribute("data-search-i18n") || "search_placeholder",
      searchBp: placeholder.getAttribute("data-search-bp") || "lg",
      showLang: parseBooleanAttr(placeholder.getAttribute("data-lang"), true),
      showCta: parseBooleanAttr(placeholder.getAttribute("data-cta"), true),
      ctaTextKey: placeholder.getAttribute("data-cta-text-key") || "nav_contact_us",
      ctaHref: placeholder.getAttribute("data-cta-href") || "/contact/",
    };
  }

  /* ================================================================
   *  mount() — 核心挂载函数
   * ================================================================ */

  /**
   * 查找所有 [data-component="navigator"] 占位符并替换为实际的 header。
   * 同时注入样式、绑定交互事件。
   */
  /**
   * Register all document-level event listeners.
   * Called exactly ONCE — at the end of this IIFE.
   * These listeners survive SPA navigations (document is not destroyed).
   */
  function registerListeners() {
    /* Inject CSS (one-time — these functions check by ID internally) */
    injectDropdownStyles();
    injectLogoStyles();
    injectSearchStyles();

    initSearchInteraction();

    /* Dropdown trigger click — close other dropdowns on trigger click.
     * DropdownBase.bindTriggers() handles toggle (touch) or pass-through (non-touch). */
    document.addEventListener(
      "click",
      function (e) {
        var trigger = e.target.closest(
          ".prod-dropdown-trigger, .sol-dropdown-trigger, .abt-dropdown-trigger, .cnt-dropdown-trigger, .nav-dropdown-trigger"
        );
        if (!trigger) return;
        if (window.innerWidth <= 767) return;
        var wrap = trigger.closest(".prod-dropdown-wrap, .sol-dropdown-wrap, .abt-dropdown-wrap, .cnt-dropdown-wrap");
        if (wrap) {
          closeOtherDropdowns(wrap);
        }
      },
      true
    );

    /* Dropdown hover mutex via event delegation (works even after mountNavigator rebuilds DOM) */
    document.addEventListener(
      "mouseover",
      function (e) {
        var wrap = e.target.closest(DROPDOWN_WRAP_SELECTORS.join(", "));
        if (wrap && !wrap.classList.contains("touch-device")) {
          closeOtherDropdowns(wrap);
        }
      },
      true
    );

    /* Global click to close all dropdowns */
    document.addEventListener(
      "click",
      function (e) {
        var clickedWrap = e.target.closest(
          ".prod-dropdown-wrap, .sol-dropdown-wrap, .abt-dropdown-wrap, .cnt-dropdown-wrap, .nav-dropdown-wrap, .mega-menu-wrap"
        );
        closeOtherDropdowns(clickedWrap || null);
      },
      true
    );

    /* Dropdown click handlers are initialized in mountNavigator() after
     * trigger elements exist in the DOM. Each dropdown module has its own
     * _dropdownClickBound guard to prevent duplicate listeners. */

    initTabletSearchToggle();
  }

  /**
   * mountNavigator — Build the header DOM from placeholder config.
   *
   * This function only deals with DOM: injecting styles and replacing
   * <navigator> placeholders with actual <header> elements.
   * It does NOT register any document-level event listeners.
   *
   * Can be called multiple times safely (idempotent by nature).
   */
  function mountNavigator() {
    /* Close all open dropdowns before remounting */
    closeOtherDropdowns(null);
    var placeholders = document.querySelectorAll('[data-component="navigator"]');

    for (var i = 0; i < placeholders.length; i++) {
      var placeholder = placeholders[i];

      if (!placeholder.parentNode) continue;

      /* 如果 placeholder 内已有 <header>，直接提取替换 */
      var existingHeader = placeholder.querySelector("header");
      if (existingHeader) {
        placeholder.parentNode.replaceChild(existingHeader, placeholder);
        continue;
      }

      /* 否则根据配置构建新 header */
      var config = extractConfigFromPlaceholder(placeholder);
      currentVariant = config.variant;

      var wrapper = document.createElement("div");
      /* @audit-safe: template-func-return */
      /* @audit-safe: template-func-return */
      wrapper.innerHTML = buildHeaderHtml(config);

      var headerEl = wrapper.firstElementChild;

      var navHeight = config.variant === "pc" ? "109px" : "65px";
      document.documentElement.style.setProperty("--nav-height", navHeight);

      // Replace placeholder with header directly.
      // Main content spacing is handled by CSS: main#spa-content { padding-top: var(--nav-height) }
      // No spacer div needed — prevents double-spacing bug on non-home pages.
      // Transfer swup persist attribute so SPA navigation keeps the header
      if (placeholder.hasAttribute("data-swup-persist")) {
        headerEl.setAttribute("data-swup-persist", placeholder.getAttribute("data-swup-persist"));
      }
      placeholder.parentNode.replaceChild(headerEl, placeholder);
    }

    /* 3. 每次构建后需要重新执行的 DOM 相关初始化 */
    reinitTranslationManager();
    initSlideMenu();
    initLangSwitcher();

    /* Re-bind dropdown click handlers after mount — trigger elements
     * may not have existed when registerListeners() first called initDropdownClick() */
    if (window.ProductsDropdown) window.ProductsDropdown.initDropdownClick();
    if (window.SolutionsDropdown) window.SolutionsDropdown.initDropdownClick();
    if (window.AboutDropdown) window.AboutDropdown.initDropdownClick();
    if (window.ContactDropdown) window.ContactDropdown.initDropdownClick();
    if (window.NavDropdown) window.NavDropdown.initDropdownClick();
  }

  /* ================================================================
   *  updateActive() — SPA 导航后更新 active 状态
   * ================================================================ */

  /**
   * 更新导航栏中的 active 高亮状态。
   * 根据当前 URL 匹配导航项和 dropdown 子项。
   *
   * @param {string} [activeSectionId=""] - 当前页面所属导航 section id
   *   (e.g. "products", "solutions", "manufacturing", "about")
   */
  function updateActive(activeSectionId) {
    activeSectionId = activeSectionId || "";
    var currentPath = window.location.pathname.replace(/\/$/, "") || "/";

    var navItems = getNavItems();

    /* 确保 dropdown 样式已注入（SPA 动态加载场景） */
    injectDropdownStyles();

    /* ---------- 1. 更新 dropdown trigger 元素的高亮 ---------- */
    var triggerSelectors = [
      "header nav a.prod-dropdown-trigger",
      "header nav a.sol-dropdown-trigger",
      "header nav a.abt-dropdown-trigger",
      "header nav a.nav-dropdown-trigger",
      "header nav a.cnt-dropdown-trigger",
      "header nav a[data-sol-trigger-label]",
      "header nav a[data-prod-trigger-label]",
      "header nav a[data-abt-trigger-label]",
      "header nav a[data-cnt-trigger-label]",
      "header nav a[data-nav-trigger-label]",
    ];

    var triggers = document.querySelectorAll(triggerSelectors.join(", "));

    for (var i = 0; i < triggers.length; i++) {
      var triggerEl = triggers[i];

      /* 应用路径映射 */
      var _activeMap = getPathToActiveMap();
      var mappedId = activeSectionId;
      if (_activeMap[activeSectionId]) {
        mappedId = _activeMap[activeSectionId];
      }

      /* 判断该 trigger 是否属于当前激活的 section */
      var triggerKey =
        triggerEl.getAttribute("data-i18n") ||
        triggerEl.getAttribute("data-prod-trigger-label") ||
        triggerEl.getAttribute("data-sol-trigger-label") ||
        triggerEl.getAttribute("data-abt-trigger-label") ||
        triggerEl.getAttribute("data-cnt-trigger-label") ||
        triggerEl.getAttribute("data-nav-trigger-label") ||
        "";

      var isMatch = false;
      var matchIds = ID_ALIASES[mappedId] || [mappedId];
      for (var j = 0; j < navItems.length; j++) {
        if (matchIds.indexOf(navItems[j].id) !== -1 && triggerKey === navItems[j].key) {
          isMatch = true;
          break;
        }
      }

      /* 使用 classList 增删样式，不覆盖 className */
      if (isMatch) {
        triggerEl.classList.add("text-primary");
        triggerEl.classList.remove("hover:text-primary", "transition-colors");
      } else {
        triggerEl.classList.remove("text-primary");
        triggerEl.classList.add("hover:text-primary", "transition-colors");
      }
    }

    /* ---------- 1b. 更新非 dropdown 普通链接导航项的高亮 ---------- */
    var plainLinks = document.querySelectorAll("header nav a > span[data-i18n]");
    for (var pi = 0; pi < plainLinks.length; pi++) {
      var plainSpan = plainLinks[pi];
      var plainEl = plainSpan.parentElement;
      /* Skip dropdown triggers (already handled above) */
      if (
        plainEl.classList.contains("prod-dropdown-trigger") ||
        plainEl.classList.contains("sol-dropdown-trigger") ||
        plainEl.classList.contains("abt-dropdown-trigger") ||
        plainEl.classList.contains("nav-dropdown-trigger") ||
        plainEl.classList.contains("cnt-dropdown-trigger")
      ) {
        continue;
      }
      var plainKey = plainSpan.getAttribute("data-i18n") || "";
      var plainMatch = false;
      var matchIds2 = ID_ALIASES[mappedId] || [mappedId];
      for (var pk = 0; pk < navItems.length; pk++) {
        if (matchIds2.indexOf(navItems[pk].id) !== -1 && plainKey === navItems[pk].key) {
          plainMatch = true;
          break;
        }
      }
      if (plainMatch) {
        plainEl.classList.add("text-primary");
        plainEl.classList.remove("hover:text-primary", "transition-colors");
      } else {
        plainEl.classList.remove("text-primary");
        plainEl.classList.add("hover:text-primary", "transition-colors");
      }
    }

    /* ---------- 2. 清除所有 dropdown item 的 is-active ---------- */
    var activeItems = document.querySelectorAll(
      ".prod-dropdown-item.is-active, " +
        ".sol-dropdown-item.is-active, " +
        ".abt-dropdown-item.is-active, " +
        ".nav-dropdown-item.is-active, " +
        ".nav-dropdown-popup-item.is-active"
    );
    for (var k = 0; k < activeItems.length; k++) {
      activeItems[k].classList.remove("is-active");
    }

    /* ---------- 3. 根据当前 URL 设置 dropdown item 的 is-active ---------- */
    if (!activeSectionId) return;

    var prefix = ACTIVE_TO_PREFIX_MAP[activeSectionId];
    if (!prefix) return;

    var dropdownItems = document.querySelectorAll("." + prefix + "-dropdown-item");
    var matchedItem = null;

    /* 3a. 精确匹配 href */
    for (var m = 0; m < dropdownItems.length; m++) {
      var itemHref = dropdownItems[m].getAttribute("href");
      if (!itemHref) continue;

      var cleanHref = itemHref.replace(/\/$/, "");
      var cleanPath = currentPath.replace(/\/$/, "");

      if (cleanHref === cleanPath) {
        matchedItem = dropdownItems[m];
        break;
      }
    }

    /* 3b. 前缀匹配（排除 viewall 项） */
    if (!matchedItem) {
      for (var n = 0; n < dropdownItems.length; n++) {
        var subHref = dropdownItems[n].getAttribute("href");
        if (!subHref) continue;

        var cleanSubHref = subHref.replace(/\/$/, "");
        if (dropdownItems[n].classList.contains("prod-viewall-item")) continue;

        var pathPrefix = cleanSubHref.split("?")[0].replace(/\/$/, "");
        var normalizedPath = currentPath.replace(/\/$/, "");

        if (normalizedPath.indexOf(pathPrefix + "/") === 0) {
          matchedItem = dropdownItems[n];
          break;
        }
      }
    }

    /* 3c. NavDropdown 回退匹配：如果前缀匹配未找到，搜索所有 nav-dropdown items */
    if (!matchedItem) {
      var navDropdownItems = document.querySelectorAll(
        ".nav-dropdown-item, .nav-dropdown-popup-item, .nav-dropdown-center"
      );
      /* 精确匹配 href */
      for (var nd1 = 0; nd1 < navDropdownItems.length; nd1++) {
        var ndHref = navDropdownItems[nd1].getAttribute("href");
        if (!ndHref) continue;
        var cleanNdHref = ndHref.replace(/\/$/, "");
        var cleanPath2 = currentPath.replace(/\/$/, "");
        if (cleanNdHref === cleanPath2) {
          matchedItem = navDropdownItems[nd1];
          break;
        }
      }
      /* 前缀匹配 */
      if (!matchedItem) {
        for (var nd2 = 0; nd2 < navDropdownItems.length; nd2++) {
          var subNdHref = navDropdownItems[nd2].getAttribute("href");
          if (!subNdHref) continue;
          var cleanSubNdHref = subNdHref.replace(/\/$/, "");
          var ndPathPrefix = cleanSubNdHref.split("?")[0].replace(/\/$/, "");
          var normalizedPath2 = currentPath.replace(/\/$/, "");
          if (normalizedPath2.indexOf(ndPathPrefix + "/") === 0) {
            matchedItem = navDropdownItems[nd2];
            break;
          }
        }
      }
    }

    if (matchedItem && matchedItem.classList) {
      matchedItem.classList.add("is-active");
    }
  }

  /* ================================================================
   *  highlightCategory() — 手动高亮产品分类
   * ================================================================ */

  /**
   * 高亮指定的产品分类 dropdown item（用于产品详情页侧边栏联动）
   *
   * @param {string} categoryKey - 要高亮的分类 i18n key
   *   (e.g. "nav_products_coffee")
   */
  function highlightCategory(categoryKey) {
    if (!categoryKey) return;

    /* 先清除所有产品 dropdown 的 is-active */
    var activeProducts = document.querySelectorAll(".prod-dropdown-item.is-active");
    for (var i = 0; i < activeProducts.length; i++) {
      activeProducts[i].classList.remove("is-active");
    }

    /* 按匹配 key 设置 is-active */
    var allProductItems = document.querySelectorAll(".prod-dropdown-item");
    for (var j = 0; j < allProductItems.length; j++) {
      var label = allProductItems[j].getAttribute("data-i18n") || "";
      if (label === categoryKey) {
        allProductItems[j].classList.add("is-active");
        break;
      }
    }
  }

  /* ================================================================
   *  resize 响应（防抖）
   * ================================================================ */

  /**
   * 监听窗口 resize，当设备变体变化时重新挂载导航
   */
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var newVariant;
      // 优先使用 DeviceUtils（与 CSS @media 一致）
      if (window.DeviceUtils && typeof window.DeviceUtils.getDeviceType === "function") {
        newVariant = window.DeviceUtils.getDeviceType();
      } else {
        if (window.innerWidth < 768) {
          newVariant = "mobile";
        } else if (window.innerWidth < 1280) {
          newVariant = "tablet";
        } else {
          newVariant = "pc";
        }
      }

      if (newVariant !== currentVariant) {
        currentVariant = newVariant;
        mountNavigator();

        /* 移动端变体需要重新初始化菜单切换 */
        if (newVariant === "mobile" && window.SlideMenu) {
          if (typeof window.SlideMenu.initToggle === "function") {
            window.SlideMenu.initToggle();
          }
        }
      }
    }, 300);
  });

  /* ================================================================
   *  初始化入口
   * ================================================================ */

  /* Register document-level listeners exactly ONCE */
  registerListeners();

  /* 首次加载：DOM ready 后构建 header DOM */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountNavigator);
  } else {
    mountNavigator();
  }

  /* bfcache 回退：pageshow 时重新挂载（如果 header 已丢失） */
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;

    var placeholders = document.querySelectorAll('[data-component="navigator"]');
    var needsRemount = false;

    for (var i = 0; i < placeholders.length; i++) {
      var ph = placeholders[i];
      if (!ph.querySelector("header") && !ph.querySelector("nav")) {
        needsRemount = true;
        break;
      }
    }

    if (needsRemount) mountNavigator();
  });

  /* ================================================================
   *  CANONICAL_NAV_ITEMS — 全局共享导航项常量
   *  当 SITE_CONFIG.nav.items 完全不可用时作为 fallback
   *  navigator.js 与 slide-menu.js 共用同一份定义
   * ================================================================ */

  var CANONICAL_NAV_ITEMS = [
    { key: "nav_solutions", label: "Solutions", path: "/solutions/", id: "solutions", hasDropdown: true },
    { key: "nav_products", label: "Products", path: "/products/", id: "products", hasDropdown: true },
    {
      key: "nav_manufacturing",
      label: "Manufacturing",
      path: "/manufacturing/",
      id: "manufacturing",
      hasDropdown: false,
    },
    { key: "nav_compliance", label: "Compliance", path: "/compliance/", id: "compliance", hasDropdown: false },
    { key: "nav_resources", label: "Resources", path: "/resources/", id: "resources", hasDropdown: true },
    { key: "nav_contact", label: "Contact", path: "/contact/", id: "contact", hasDropdown: false },
  ];

  /* ================================================================
   *  公开 API — window.Navigator
   * ================================================================ */

  window.Navigator = {
    /**
     * 挂载导航栏（查找占位符并替换）
     */
    mount: mountNavigator,

    /**
     * 根据 section id 更新导航 active 状态
     * @param {string} [activeSectionId] - 当前 section id
     */
    updateActive: updateActive,

    /**
     * 高亮指定的产品分类
     * @param {string} categoryKey - 分类 i18n key
     */
    highlightCategory: highlightCategory,

    /**
     * 关闭除指定元素外的所有已打开 dropdown（供外部模块调用）
     * @param {HTMLElement|null} keepOpen - 保持打开的元素
     */
    _closeOtherDropdowns: closeOtherDropdowns,
  };

  /* ================================================================
   *  移动端底部栏 & SPA 事件
   * ================================================================ */

  /**
   * SPA 路由导航事件——重新初始化导航和底部栏
   */
  _spaOn(document, "spa:load", function () {
    /* 关闭所有打开的 dropdown（SPA 导航前未关闭的） */
    closeOtherDropdowns(null);

    /* 重新绑定 dropdown click handlers（mountNavigator 可能未调用） */
    if (window.ProductsDropdown) window.ProductsDropdown.initDropdownClick();
    if (window.SolutionsDropdown) window.SolutionsDropdown.initDropdownClick();
    if (window.AboutDropdown) window.AboutDropdown.initDropdownClick();
    if (window.ContactDropdown) window.ContactDropdown.initDropdownClick();
    if (window.NavDropdown) window.NavDropdown.initDropdownClick();

    /* 重新初始化 custom-select（navigator 可能创建了新的 lang-selector） */
    if (typeof CustomSelect !== "undefined" && CustomSelect.initAll) {
      CustomSelect.initAll();
    }
    // Re-init lang switcher bridge (uses Promise-based ensureCustomSelect internally)
    initLangSwitcher();

    /* 确保 mobile header 可见 */
    var mobileHeader = document.getElementById("mobile-header");
    if (mobileHeader) mobileHeader.classList.remove("header-hidden");

    /* 延迟重新初始化依赖模块 */
    setTimeout(function () {
      if (window.SlideMenu) {
        if (window.SlideMenu.initToggle) window.SlideMenu.initToggle();
        if (window.SlideMenu.initSmartHeader) window.SlideMenu.initSmartHeader();
      }
    }, 0);
  });
})(window);
/**
 * SlideMenu - 移动端滑出导航菜单组件
 *
 * 提供从左侧滑入的导航面板，支持多级菜单展开/折叠、
 * 底部 CTA 栏、智能头部隐藏、以及移动端搜索覆盖层。
 *
 * 公开 API (window.SlideMenu):
 *   - open()              打开滑出菜单
 *   - close()             关闭滑出菜单
 *   - initToggle()        初始化汉堡按钮 & 搜索按钮的事件绑定
 *   - openMobileSearch()  打开移动端搜索覆盖层
 *   - closeMobileSearch() 关闭移动端搜索覆盖层
 *
 * @module SlideMenu
 */
/* global SlideMenu */
(function (global) {
  "use strict";
  function _t(k) {
    if (
      typeof window !== "undefined" &&
      window.translationManager &&
      typeof window.translationManager.translate === "function"
    ) {
      var r = window.translationManager.translate(k);
      return r && r !== k ? r : k;
    }
    return k;
  }
  var _theme = (window.SITE_CONFIG || window._cfg || {}).theme || {};
  var _primary = (_theme.colors || {}).primary || "#2E7D32";
  var _primaryHover = (_theme.colors || {}).primaryHover || "#1B5E20";

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  /* ================================================================
   *  工具函数
   * ================================================================ */

  /**
   * HTML 特殊字符转义，防止 XSS 注入
   * @param {*} value - 任意值，会被转为字符串处理
   * @returns {string} 转义后的安全字符串
   */
  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ================================================================
   *  样式注入
   * ================================================================ */

  /**
   * 注入移动端菜单所需的全部 CSS 样式（仅注入一次）
   * 创建 <style id="mobile-menu-styles"> 并追加到 <head>
   */
  function injectStyles() {
    // CSS moved to styles.css (mobile-menu section)
  }

  /* ================================================================
   *  菜单数据构建
   * ================================================================ */

  /** @type {Array|null} 缓存的菜单项，避免重复构建 */
  var cachedMenuItems = null;

  var L1_ICON_MAP = {
    products: "inventory_2",
    solutions: "lightbulb",
    manufacturing: "factory",
    compliance: "verified",
    resources: "menu_book",
    contact: "mail",
  };

  function getL1Icon(navId) {
    return L1_ICON_MAP[navId] || "";
  }

  /* ── Config-driven helpers ── */

  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _nav = _cfg.nav || {};
  var _categories = _cfg.categories || {};

  /**
   * 从 categories 构建子菜单项（供 dropdown 使用）
   * @param {string} categoryKey - categories 中的 key（products/applications/support）
   * @param {string} parentPath - 路径前缀，如 "/products/"
   * @returns {Array<{key, icon, emoji, href}>}
   */
  /**
   * Resolve a label object to current language string
   */
  function resolveLabel(labelObj) {
    if (!labelObj) return "";
    if (typeof labelObj === "string") return labelObj;
    var lang = (document.documentElement && document.documentElement.lang) || "zh-CN";
    return labelObj[lang] || labelObj.en || labelObj["zh-CN"] || "";
  }

  function buildCategoryItems(categoryKey, parentPath) {
    var cats = _categories[categoryKey] || [];
    var result = [];
    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i];
      result.push({
        key: cat.i18nKey || cat.key || "nav_" + categoryKey + "_" + cat.slug,
        label: resolveLabel(cat.label) || cat.i18nKey || cat.slug,
        icon: cat.icon || "circle",
        emoji: cat.emoji || "",
        href: parentPath + cat.slug + "/",
      });
    }
    return result;
  }

  /**
   * 构建导航菜单项数组（配置驱动）
   * @returns {Array<{key, href, id, icon, children}>} 菜单项列表
   */
  function getMenuItems() {
    if (cachedMenuItems) return cachedMenuItems;

    // 从 SITE_CONFIG.categories 构建产品子菜单
    var productChildren = buildCategoryItems("products", "/products/");

    // 从 SITE_CONFIG.nav 获取导航定义（保证与桌面端一致）
    var navFromConfig = [];
    try {
      var cfgItems = window.SITE_CONFIG && window.SITE_CONFIG.nav && window.SITE_CONFIG.nav.items;
      if (cfgItems && cfgItems.length > 0) {
        navFromConfig = cfgItems.map(function (item) {
          var label =
            typeof item.label === "object" ? item.label["zh-CN"] || item.label.en || item.id : item.label || item.id;
          var mapped = {
            key: item.i18nKey || "nav_" + item.id,
            label: label,
            href: item.href || "/" + item.id + "/",
            id: item.id,
            icon: item.icon || getL1Icon(item.id) || "link",
            children: [],
          };
          if (item.children && item.children.length > 0) {
            mapped.children = item.children.map(function (child) {
              var childLabel = typeof child.label === "object" ? resolveLabel(child.label) : child.label || child.id;
              return {
                key: child.i18nKey || "nav_" + child.id,
                label: childLabel,
                href: child.href || "/" + child.id + "/",
                id: child.id,
                icon: child.icon || "arrow_forward",
                emoji: child.emoji || "",
              };
            });
          }
          return mapped;
        });
      }
    } catch (e) {
      /* fall through to hardcoded defaults */
    }

    var items =
      navFromConfig.length > 0
        ? navFromConfig
        : [
            // CANONICAL_NAV_ITEMS-based fallback — matches navigator.js canonical order
            {
              key: "nav_solutions",
              label: _t("nav_solutions") || "Solutions",
              href: "/solutions/",
              id: "solutions",
              icon: "lightbulb",
              children: [
                {
                  key: "nav_oem",
                  label: _t("nav_oem") || "OEM",
                  icon: "precision_manufacturing",
                  emoji: "",
                  href: "/solutions/oem/",
                },
                {
                  key: "nav_odm",
                  label: _t("nav_odm") || "ODM",
                  icon: "design_services",
                  emoji: "",
                  href: "/solutions/odm/",
                },
                { key: "nav_obm", label: _t("nav_obm") || "OBM", icon: "verified", emoji: "", href: "/solutions/obm/" },
                {
                  key: "nav_rd",
                  label: _t("nav_rd") || "R&D & Flavor Lab",
                  icon: "science",
                  emoji: "",
                  href: "/solutions/rd/",
                },
                {
                  key: "nav_packaging",
                  label: _t("nav_packaging") || "Packaging & Labeling",
                  icon: "inventory",
                  emoji: "",
                  href: "/solutions/packaging/",
                },
              ],
            },
            {
              key: "nav_products",
              label: _t("nav_products") || "Products",
              href: "/products/",
              id: "products",
              icon: "inventory_2",
              children: productChildren,
            },
            {
              key: "nav_manufacturing",
              label: _t("nav_manufacturing") || "Manufacturing",
              href: "/manufacturing/",
              id: "manufacturing",
              icon: "factory",
              children: [
                {
                  key: "nav_bases",
                  label: _t("nav_bases") || "4 Production Bases",
                  icon: "factory",
                  emoji: "",
                  href: "/manufacturing/#bases",
                },
                {
                  key: "nav_quality",
                  label: _t("nav_quality") || "Quality Control",
                  icon: "verified",
                  emoji: "",
                  href: "/manufacturing/#quality",
                },
                {
                  key: "nav_smart",
                  label: _t("nav_smart") || "Smart Factory",
                  icon: "precision_manufacturing",
                  emoji: "",
                  href: "/manufacturing/#smart",
                },
                {
                  key: "nav_supplychain",
                  label: _t("nav_supplychain") || "Global Supply Chain",
                  icon: "public",
                  emoji: "",
                  href: "/manufacturing/#supplychain",
                },
              ],
            },
            {
              key: "nav_compliance",
              label: _t("nav_compliance") || "Compliance",
              href: "/compliance/",
              id: "compliance",
              icon: "verified_user",
              children: [
                {
                  key: "nav_certs",
                  label: _t("nav_certs") || "Global Certifications",
                  icon: "verified_user",
                  emoji: "",
                  href: "/compliance/#certs",
                },
                {
                  key: "nav_halal",
                  label: _t("nav_halal") || "Halal Certified",
                  icon: "assured_workload",
                  emoji: "",
                  href: "/compliance/#halal",
                },
                {
                  key: "nav_coa",
                  label: _t("nav_coa") || "Lab Reports & COA",
                  icon: "description",
                  emoji: "",
                  href: "/compliance/#coa",
                },
              ],
            },
            {
              key: "nav_resources",
              label: _t("nav_resources") || "Resources",
              href: "/resources/",
              id: "resources",
              icon: "menu_book",
              children: [
                {
                  key: "nav_catalog",
                  label: _t("nav_catalog") || "2026 Product Catalog",
                  icon: "menu_book",
                  emoji: "",
                  href: "/resources/catalog/",
                },
                {
                  key: "nav_whitepapers",
                  label: _t("nav_whitepapers") || "Whitepapers",
                  icon: "article",
                  emoji: "",
                  href: "/resources/whitepapers/",
                },
                {
                  key: "nav_cases",
                  label: _t("nav_cases") || "Case Studies",
                  icon: "analytics",
                  emoji: "",
                  href: "/cases/",
                },
                {
                  key: "nav_videos",
                  label: _t("nav_videos") || "Video Library",
                  icon: "play_circle",
                  emoji: "",
                  href: "/resources/videos/",
                },
              ],
            },
            {
              key: "nav_contact",
              label: _t("nav_contact") || "Contact",
              href: "/contact/",
              id: "contact",
              icon: "mail",
              children: [
                {
                  key: "nav_quote",
                  label: _t("nav_quote") || "Get a Quote",
                  icon: "request_quote",
                  emoji: "",
                  href: "/contact/#quote",
                },
                {
                  key: "nav_samples",
                  label: _t("nav_samples") || "Free Samples",
                  icon: "redeem",
                  emoji: "",
                  href: "/contact/#samples",
                },
                {
                  key: "nav_visit",
                  label: _t("nav_visit") || "Visit Our Factory",
                  icon: "tour",
                  emoji: "",
                  href: "/contact/#visit",
                },
                {
                  key: "nav_network",
                  label: _t("nav_network") || "Global Sales Network",
                  icon: "language",
                  emoji: "",
                  href: "/contact/#network",
                },
              ],
            },
          ];

    cachedMenuItems = items;
    return items;
  }

  /* ================================================================
   *  HTML 渲染辅助
   * ================================================================ */

  /**
   * 在当前 URL 上下文中，找出与某个一级菜单下最匹配的子项 href
   * 用于给当前激活的子菜单项添加 .is-active 高亮
   *
   * @param {Array} children - 子菜单项数组
   * @returns {string|undefined} 匹配的子项 href（去掉尾部斜杠后比较）
   */
  function findActiveChildHref(children) {
    var currentPath = location.pathname.replace(/\/$/, "");
    var matchedHref = "";
    var matchedLength = 0;

    children.forEach(function (child) {
      var childPath = child.href.replace(/\/$/, "");

      // 精确匹配优先
      if (currentPath === childPath) {
        matchedHref = child.href;
        matchedLength = childPath.length;
      }
      // 前缀匹配（当前路径以子项路径 + "/" 开头），取最长匹配
      else if (currentPath.indexOf(childPath + "/") === 0 && childPath.length > matchedLength) {
        matchedHref = child.href;
        matchedLength = childPath.length;
      }
    });

    return matchedHref;
  }

  /**
   * 渲染单个子菜单项的 HTML
   * @param {Object} child    - 子菜单项数据
   * @param {string} activeHref - 当前激活项的 href
   * @returns {string} HTML 字符串
   */
  function renderChildItem(child, activeHref) {
    var whatsappClass = child.isWhatsApp ? " is-whatsapp" : "";
    var badgeHtml = child.badge ? '<span class="mobile-menu-badge" data-i18n="nav_roi_badge">HOT</span>' : "";
    var targetAttr = child.isWhatsApp ? ' target="_blank" rel="noopener noreferrer"' : "";

    // 分隔线（applications 分类的第 6 项之后）
    if (child._separator) {
      return '<div class="mobile-menu-l2-separator"></div>';
    }

    var isActive = child.href === activeHref ? " is-active" : "";

    return (
      '<a href="' +
      escapeHtml(child.href) +
      '"' +
      ' class="mobile-menu-l2-item' +
      whatsappClass +
      isActive +
      '"' +
      targetAttr +
      ">" +
      '<span class="mobile-menu-l2-icon">' +
      '<span class="material-symbols-outlined">' +
      escapeHtml(child.icon) +
      "</span>" +
      "</span>" +
      '<span class="mobile-menu-l2-label" data-i18n="' +
      escapeHtml(child.key) +
      '">' +
      escapeHtml(child.label || child.key) +
      "</span>" +
      (child.emoji ? '<span class="mobile-menu-l2-emoji">' + escapeHtml(child.emoji) + "</span>" : "") +
      badgeHtml +
      "</a>"
    );
  }

  /**
   * 渲染一级菜单项（包含其子菜单容器）
   * @param {Object} item - 一级菜单项数据
   * @returns {string} HTML 字符串
   */
  function renderMenuItem(item) {
    var subMenuHtml = "";

    if (item.children && item.children.length > 0) {
      var activeHref = findActiveChildHref(item.children);

      var childItemsHtml = item.children
        .map(function (child) {
          return renderChildItem(child, activeHref);
        })
        .join("\n");

      if (item.id === "products") {
        subMenuHtml =
          '<div class="mobile-menu-l2" data-menu-l2="' +
          escapeHtml(item.id) +
          '">' +
          '<a class="mobile-menu-l2-item mobile-menu-l2-viewall" href="/products/">' +
          '<span class="mobile-menu-l2-icon">' +
          '<span class="material-symbols-outlined">store</span>' +
          "</span>" +
          '<span class="mobile-menu-l2-label" data-i18n="nav_products_center">Products Center</span>' +
          "</a>" +
          '<div class="mobile-menu-l2-separator"></div>' +
          childItemsHtml;
      } else if (item.id === "solutions") {
        subMenuHtml =
          '<div class="mobile-menu-l2" data-menu-l2="' +
          escapeHtml(item.id) +
          '">' +
          '<a class="mobile-menu-l2-item mobile-menu-l2-viewall" href="/solutions/">' +
          '<span class="mobile-menu-l2-icon">' +
          '<span class="material-symbols-outlined">design_services</span>' +
          "</span>" +
          '<span class="mobile-menu-l2-label" data-i18n="nav_solutions_center">Solutions Center</span>' +
          "</a>" +
          '<div class="mobile-menu-l2-separator"></div>' +
          childItemsHtml;
      } else {
        subMenuHtml = '<div class="mobile-menu-l2" data-menu-l2="' + escapeHtml(item.id) + '">' + childItemsHtml;
      }

      subMenuHtml += "</div>";
    }

    return (
      '<div class="mobile-menu-l1-wrap">' +
      '<button class="mobile-menu-l1" data-menu-toggle="' +
      escapeHtml(item.id) +
      '" type="button">' +
      '<span class="mobile-menu-l1-icon">' +
      '<span class="material-symbols-outlined">' +
      escapeHtml(item.icon) +
      "</span>" +
      "</span>" +
      '<span class="mobile-menu-l1-label" data-i18n="' +
      escapeHtml(item.key) +
      '">' +
      escapeHtml(item.label || item.key) +
      "</span>" +
      '<span class="material-symbols-outlined mobile-menu-l1-arrow">chevron_right</span>' +
      "</button>" +
      subMenuHtml +
      "</div>"
    );
  }

  /**
   * 生成完整的菜单面板内部 HTML
   * @returns {string}
   */
  function renderMenuPanelContent() {
    var basePath = window.BASE_PATH || "";

    var headerHtml =
      '<div class="mobile-menu-header">' +
      '<a class="mobile-menu-logo" href="' +
      basePath +
      '/home/">' +
      '<img src="' +
      basePath +
      '/assets/images/logo-footer.webp" alt="Yukoli" width="32" height="32" />' +
      "</a>" +
      '<button id="mobile-menu-close" type="button" class="mobile-menu-close" aria-label="Close menu">' +
      '<span class="material-symbols-outlined">close</span>' +
      "</button>" +
      "</div>";

    var menuItemsHtml = getMenuItems()
      .map(function (item) {
        return renderMenuItem(item);
      })
      .join("\n");

    return (
      headerHtml + '<div class="mobile-menu-scroll">' + menuItemsHtml + "</div>"
    ); /**ctaBarHtml removed — rendered as separate body child in openMenu()*/
  }

  /* ================================================================
   *  菜单打开 / 关闭
   * ================================================================ */

  /** @type {HTMLElement|null} 遮罩层 DOM 引用 */
  var overlayEl = null;

  /** @type {HTMLElement|null} 菜单面板 DOM 引用 */
  var panelEl = null;

  /** @type {HTMLElement|null} CTA 栏 DOM 引用 */
  var ctaBarEl = null;

  /**
   * 生成 CTA 栏 HTML
   */
  function renderCtaBar() {
    return (
      '<div class="mobile-menu-cta-bar" id="mobile-menu-cta-bar">' +
      '<a class="mobile-menu-cta-btn secondary" href="/contact/" data-nav="/contact/">' +
      '<span class="material-symbols-outlined">mail</span>' +
      '<span data-i18n="btn_contact_us">Contact Us</span>' +
      "</a>" +
      '<a class="mobile-menu-cta-btn primary" href="/contact/" data-nav="/contact/">' +
      '<span class="material-symbols-outlined">request_quote</span>' +
      '<span data-i18n="nav_get_quote">Get Quote</span>' +
      "</a>" +
      "</div>"
    );
  }

  /**
   * 打开移动端滑出菜单
   * - 动态创建遮罩层和面板并插入 DOM
   * - 绑定所有交互事件（关闭、折叠、导航）
   * - 支持翻译管理器自动翻译 data-i18n 元素
   */
  function openMenu() {
    if (panelEl) return; // 已打开，忽略重复调用

    injectStyles();

    // 创建遮罩层
    overlayEl = document.createElement("div");
    overlayEl.className = "mobile-menu-overlay";
    overlayEl.id = "mobile-menu-overlay";

    // 创建面板
    panelEl = document.createElement("div");
    panelEl.className = "mobile-menu-panel";
    panelEl.id = "mobile-menu-panel";
    /* @audit-safe: template-func-return */
    /* @audit-safe: template-func-return */
    panelEl.innerHTML = renderMenuPanelContent();

    // 应用翻译
    if (window.translationManager) {
      panelEl.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        var translated = window.translationManager.translate(key);
        if (translated && translated !== key) {
          el.textContent = translated;
        }
      });
    }

    // 创建 CTA 栏（独立于面板，避免 position:fixed 在 overflow:auto 容器内失效）
    ctaBarEl = document.createElement("div");
    ctaBarEl.innerHTML = renderCtaBar();
    var ctaBarChild = ctaBarEl.firstElementChild;

    // 为 CTA 栏应用翻译
    if (window.translationManager && ctaBarChild) {
      ctaBarChild.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        var translated = window.translationManager.translate(key);
        if (translated && translated !== key) {
          el.textContent = translated;
        }
      });
    }

    // 插入 DOM 并锁定滚动
    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);
    if (ctaBarChild) document.body.appendChild(ctaBarChild);
    document.body.style.overflow = "hidden";

    // 触发入场动画（下一帧添加 is-open class）
    requestAnimationFrame(function () {
      overlayEl.classList.add("is-open");
      panelEl.classList.add("is-open");
      if (navigator.vibrate) navigator.vibrate(10);
    });

    // 绑定交互事件
    bindMenuEvents();

    // 应用当前页面激活状态到刚创建的菜单
    if (typeof window.SlideMenu !== "undefined" && window.SlideMenu.updateActive) {
      window.SlideMenu.updateActive();
    }
  }

  /**
   * 关闭移动端滑出菜单
   * - 移除 is-open 动画类
   * - 动画完成后销毁 DOM 元素并恢复滚动
   */
  function closeMenu() {
    if (!panelEl) return;

    overlayEl.classList.remove("is-open");
    panelEl.classList.remove("is-open");

    // 等待动画完成后再移除 DOM（350ms 与 CSS transition 保持一致）
    setTimeout(function () {
      if (overlayEl && overlayEl.parentNode) {
        overlayEl.parentNode.removeChild(overlayEl);
      }
      if (panelEl && panelEl.parentNode) {
        panelEl.parentNode.removeChild(panelEl);
      }
      // 清理独立 CTA 栏
      var ctaBar = document.getElementById("mobile-menu-cta-bar");
      if (ctaBar && ctaBar.parentNode) {
        ctaBar.parentNode.removeChild(ctaBar);
      }
      overlayEl = null;
      panelEl = null;
      ctaBarEl = null;
      document.body.style.overflow = "";
    }, 350);
  }

  /* ================================================================
   *  菜单事件绑定
   * ================================================================ */

  /**
   * 为菜单面板内的所有交互元素绑定事件
   * 包括：关闭按钮、遮罩层点击、Logo 点击、子菜单折叠、CTA 按钮导航
   */
  function bindMenuEvents() {
    var closeBtn = document.getElementById("mobile-menu-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", function (evt) {
        evt.preventDefault();
        closeMenu();
      });
    }

    // 点击遮罩层关闭
    overlayEl.addEventListener("click", closeMenu);

    // 点击 Logo 也关闭菜单
    var logoEl = panelEl.querySelector(".mobile-menu-logo");
    if (logoEl) {
      logoEl.addEventListener("click", function () {
        closeMenu();
      });
    }

    // 一级菜单折叠/展开切换
    var toggleButtons = panelEl.querySelectorAll("[data-menu-toggle]");
    for (var i = 0; i < toggleButtons.length; i++) {
      toggleButtons[i].addEventListener("click", function (evt) {
        var menuId = this.getAttribute("data-menu-toggle");
        var subMenu = panelEl.querySelector('[data-menu-l2="' + menuId + '"]');
        if (!subMenu) return;

        var isExpanded = this.classList.contains("is-expanded");

        // 关闭其他已展开的子菜单（手风琴行为）
        var expandedButtons = panelEl.querySelectorAll("[data-menu-toggle].is-expanded");
        for (var j = 0; j < expandedButtons.length; j++) {
          if (expandedButtons[j] !== this) {
            expandedButtons[j].classList.remove("is-expanded");
            var otherId = expandedButtons[j].getAttribute("data-menu-toggle");
            var otherSubMenu = panelEl.querySelector('[data-menu-l2="' + otherId + '"]');
            if (otherSubMenu) {
              otherSubMenu.classList.remove("is-open");
            }
          }
        }

        // 切换当前子菜单
        if (isExpanded) {
          this.classList.remove("is-expanded");
          subMenu.classList.remove("is-open");
        } else {
          this.classList.add("is-expanded");
          subMenu.classList.add("is-open");
        }

        if (navigator.vibrate) navigator.vibrate(8);
      });
    }

    // 二级菜单项点击
    var subItems = panelEl.querySelectorAll(".mobile-menu-l2-item");
    for (var k = 0; k < subItems.length; k++) {
      subItems[k].addEventListener("click", function (evt) {
        // WhatsApp 链接不在 SPA 内处理，关闭菜单后让默认行为生效
        if (this.classList.contains("is-whatsapp")) {
          closeMenu();
          return;
        }

        // 常规链接：关闭菜单，navigate 由全局 click handler 处理
        closeMenu();
      });
    }

    // 一级菜单项点击 —— 若无子菜单则关闭面板（作为普通链接处理）
    var l1Buttons = panelEl.querySelectorAll(".mobile-menu-l1");
    for (var m = 0; m < l1Buttons.length; m++) {
      l1Buttons[m].addEventListener("click", function (evt) {
        var menuId = this.getAttribute("data-menu-toggle");
        var subMenu = panelEl.querySelector('[data-menu-l2="' + menuId + '"]');

        // 如果子菜单存在且不为空，折叠逻辑由上面的 toggleButtons 处理
        // 如果子菜单为空或不存在，则关闭整个菜单并导航
        if (!subMenu || subMenu.children.length === 0) {
          var href = this.getAttribute("data-menu-toggle");
          // Find href from menu items data
          var navItems = getMenuItems();
          var targetItem = null;
          for (var idx = 0; idx < navItems.length; idx++) {
            if (navItems[idx].id === menuId) {
              targetItem = navItems[idx];
              break;
            }
          }
          closeMenu();
          if (targetItem && targetItem.href) {
            location.href = targetItem.href;
          }
        }
      });
    }

    // 底部 CTA 按钮
    var ctaButtons = document.querySelectorAll(".mobile-menu-cta-btn[data-nav]");
    for (var n = 0; n < ctaButtons.length; n++) {
      ctaButtons[n].addEventListener("click", function (_evt) {
        closeMenu();
        // Navigate 由全局 click handler (spa-router.js) 统一处理
      });
    }
  }

  /* ================================================================
   *  智能头部隐藏（滚动方向检测）
   * ================================================================ */

  /** @type {number} 上一帧的滚动位置 */
  var lastScrollY = 0;

  /** @type {HTMLElement|null} 移动端头部 DOM 引用 */
  var mobileHeaderEl = null;

  /** @type {boolean} 滚动事件 RAF 节流锁 */
  var scrollFramePending = false;

  /**
   * 初始化智能头部行为
   * - 检测是否处于平板模式（禁用隐藏逻辑，头部始终可见）
   * - 仅在移动模式下绑定滚动监听
   */
  function initSmartHeader() {
    lastScrollY = 0;
    mobileHeaderEl = document.getElementById("mobile-header");

    if (!mobileHeaderEl) return;

    // 判断是否为平板模式：innerWidth 768–1280px
    // Note: navigator.js replaces <navigator> placeholder with <header> element,
    // so document.querySelector('navigator[data-variant]') always returns null.
    // We rely solely on innerWidth for tablet detection.
    var isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;

    if (isTablet) {
      mobileHeaderEl.classList.remove("header-hidden");
      return;
    }

    // 移动模式：绑定滚动监听
    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    mobileHeaderEl.classList.remove("header-hidden");
  }

  /**
   * 滚动事件处理函数（使用 requestAnimationFrame 节流）
   * - 向下滚动超过 50px 时隐藏头部
   * - 向上滚动时显示头部
   */
  function onScroll() {
    if (scrollFramePending) return;
    scrollFramePending = true;

    requestAnimationFrame(function () {
      var currentY = window.pageYOffset || document.documentElement.scrollTop;

      if (currentY > 50 && currentY > lastScrollY) {
        // 向下滚动：隐藏头部
        mobileHeaderEl.classList.add("header-hidden");
      } else {
        // 向上滚动：显示头部
        mobileHeaderEl.classList.remove("header-hidden");
      }

      lastScrollY = currentY;
      scrollFramePending = false;
    });
  }

  /* ================================================================
   *  汉堡按钮 & 搜索按钮初始化
   * ================================================================ */

  /** @type {boolean} 汉堡按钮事件是否已绑定 */
  var toggleBound = false;

  /** @type {boolean} 搜索按钮事件是否已绑定 */
  var searchBound = false;

  /** @type {Function|null} 汉堡按钮点击处理函数引用（用于解绑旧按钮） */
  var toggleClickHandler = null;

  /** @type {Function|null} 搜索按钮点击处理函数引用 */
  var searchClickHandler = null;

  /** @type {HTMLElement|null} 上一次绑定的汉堡按钮 DOM 引用 */
  var lastToggleBtn = null;

  /**
   * 初始化汉堡按钮和搜索按钮的事件绑定
   * - 若按钮已更换（SPA 路由后 DOM 重建），会自动解绑旧按钮、绑定新按钮
   */
  function initToggle() {
    var toggleBtn = document.getElementById("mobile-menu-toggle");

    // PC 视图下无 mobile toggle 按钮，静默跳过
    if (!toggleBtn) return;

    if (toggleBound && toggleBtn === lastToggleBtn) return;

    // 如果按钮已被替换，解绑旧按钮
    if (toggleBound && toggleClickHandler && lastToggleBtn && lastToggleBtn !== toggleBtn) {
      try {
        lastToggleBtn.removeEventListener("click", toggleClickHandler);
      } catch (err) {
        /* 忽略解绑失败 */
      }
    }

    // 绑定汉堡按钮
    toggleBound = true;
    lastToggleBtn = toggleBtn;
    toggleClickHandler = function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      openMenu();
    };
    toggleBtn.addEventListener("click", toggleClickHandler);

    // 绑定搜索按钮
    var searchBtn = document.getElementById("mobile-search-toggle");
    if (searchBtn && !searchBound) {
      searchBound = true;
      searchClickHandler = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        // 切换搜索覆盖层的开/关
        if (document.getElementById("mobile-search-overlay")) {
          closeMobileSearch();
        } else {
          openMobileSearch();
        }
      };
      searchBtn.addEventListener("click", searchClickHandler);
    } else if (!searchBtn) {
      searchBound = false;
    }
  }

  /* ================================================================
   *  移动端搜索覆盖层
   * ================================================================ */

  /** @type {HTMLElement|null} 搜索覆盖层 DOM 引用 */
  var searchOverlayEl = null;

  /** @type {HTMLInputElement|null} 搜索输入框 DOM 引用 */
  var searchInputEl = null;

  /** @type {number|null} 搜索防抖定时器 ID */
  var searchDebounceTimer = null;

  /**
   * 打开移动端搜索覆盖层
   * - 创建全屏搜索 UI 并插入 DOM
   * - 自动聚焦输入框并绑定搜索事件
   * - 支持翻译管理器翻译占位符
   */
  function openMobileSearch() {
    searchOverlayEl = document.createElement("div");
    searchOverlayEl.id = "mobile-search-overlay";
    searchOverlayEl.className = "mobile-search-overlay";
    /* @audit-safe: internal-data */
    /* @audit-safe: internal-data */
    searchOverlayEl.innerHTML =
      '<div class="mobile-search-bar">' +
      '<span class="material-symbols-outlined mobile-search-icon">search</span>' +
      '<input type="search" id="mobile-search-input" class="mobile-search-input"' +
      ' placeholder="Search..." data-i18n-placeholder="search_placeholder"' +
      ' autocomplete="off" spellcheck="false" />' +
      '<button id="mobile-search-clear" type="button" class="mobile-search-clear" aria-label="Clear">' +
      '<span class="material-symbols-outlined">cancel</span>' +
      "</button>" +
      "</div>" +
      '<div id="mobile-search-results" class="mobile-search-results"></div>';

    document.body.appendChild(searchOverlayEl);
    document.body.style.overflow = "hidden";

    // 翻译搜索框占位符
    if (window.translationManager) {
      var placeholderEl = searchOverlayEl.querySelector("[data-i18n-placeholder]");
      if (placeholderEl) {
        var placeholderKey = placeholderEl.getAttribute("data-i18n-placeholder");
        var translatedPlaceholder = window.translationManager.translate(placeholderKey);
        if (translatedPlaceholder && translatedPlaceholder !== placeholderKey) {
          placeholderEl.placeholder = translatedPlaceholder;
        }
      }
    }

    // 入场动画 + 事件绑定（下一帧）
    requestAnimationFrame(function () {
      searchOverlayEl.classList.add("is-open");

      searchInputEl = document.getElementById("mobile-search-input");
      if (searchInputEl) {
        searchInputEl.focus();
        searchInputEl.addEventListener("input", onSearchInput);
        searchInputEl.addEventListener("keydown", onSearchKeydown);
      }

      // 清除按钮
      var clearBtn = document.getElementById("mobile-search-clear");
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (searchInputEl) {
            searchInputEl.value = "";
            onSearchInput();
            searchInputEl.focus();
          }
        });
      }

      // 点击覆盖层空白区域关闭
      searchOverlayEl.addEventListener("click", function (evt) {
        if (evt.target === searchOverlayEl) {
          closeMobileSearch();
        }
      });
    });
  }

  /**
   * 关闭移动端搜索覆盖层
   * - 等待退场动画完成后销毁 DOM
   */
  function closeMobileSearch() {
    if (!searchOverlayEl) return;

    searchOverlayEl.classList.remove("is-open");

    setTimeout(function () {
      if (searchOverlayEl && searchOverlayEl.parentNode) {
        searchOverlayEl.parentNode.removeChild(searchOverlayEl);
      }
      searchOverlayEl = null;
      searchInputEl = null;
      document.body.style.overflow = "";
    }, 300);
  }

  /**
   * 搜索输入事件处理
   * - 控制清除按钮显示/隐藏
   * - 200ms 防抖后执行搜索
   */
  function onSearchInput() {
    if (!searchInputEl) return;

    clearTimeout(searchDebounceTimer);

    var query = searchInputEl.value.trim();

    // 切换清除按钮可见性
    var clearBtn = document.getElementById("mobile-search-clear");
    if (clearBtn) {
      if (query.length > 0) {
        clearBtn.classList.add("is-visible");
      } else {
        clearBtn.classList.remove("is-visible");
      }
    }

    // 清空时清除结果
    if (query.length < 1) {
      var resultsContainer = document.getElementById("mobile-search-results");
      if (resultsContainer) {
        /* @audit-safe: constant-html */
        /* @audit-safe: constant-html */
        resultsContainer.innerHTML = "";
      }
      return;
    }

    // 防抖搜索
    searchDebounceTimer = setTimeout(function () {
      var results = [];
      if (window.ProductSearchEngine && typeof window.ProductSearchEngine.search === "function") {
        results = window.ProductSearchEngine.search(query);
      }
      renderSearchResults(results);
    }, 200);
  }

  /**
   * 渲染搜索结果到结果容器
   * @param {Array} results - 搜索结果数组
   */
  function renderSearchResults(results) {
    var container = document.getElementById("mobile-search-results");
    if (!container) return;

    if (results && results.length > 0) {
      var html = "";
      for (var i = 0; i < results.length; i++) {
        var item = results[i];

        var displayName = (item._displayName || item._displayCategory + " " + item.model)
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        var model = (item.model || "").replace(/</g, "&lt;");
        var category = (item._displayCategory || item.category || "").replace(/</g, "&lt;");
        var imageUrl = item.image || item.productImage || item.imageUrl || "";

        var imageHtml = imageUrl
          ? '<img src="' +
            imageUrl +
            '" alt="" loading="lazy" ><div style="font-size:6px;color:rgba(0,0,0,0.3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40px">' +
            imageUrl +
            "</div>"
          : '<span class="material-symbols-outlined">inventory_2</span>';

        var itemHref = item.model
          ? "/products/" + encodeURIComponent(item.category || "") + "/" + encodeURIComponent(item.model) + "/"
          : "/products/";
        html +=
          '<a class="mobile-search-result-item" href="' +
          itemHref +
          '">' +
          '<div class="mobile-search-result-img">' +
          imageHtml +
          "</div>" +
          '<div class="mobile-search-result-info">' +
          '<div class="mobile-search-result-name">' +
          displayName +
          "</div>" +
          '<div class="mobile-search-result-meta">' +
          "<span>" +
          model +
          "</span>" +
          '<span class="mobile-search-result-sep">·</span>' +
          "<span>" +
          category +
          "</span>" +
          "</div>" +
          "</div>" +
          "</a>";
      }

      /* @audit-safe: config-driven-render */
      /* @audit-safe: config-driven-render */
      container.innerHTML = html;

      // 点击搜索结果时关闭搜索覆盖层
      var resultLinks = container.querySelectorAll(".mobile-search-result-item");
      for (var j = 0; j < resultLinks.length; j++) {
        resultLinks[j].addEventListener("click", function () {
          closeMobileSearch();
        });
      }
    } else {
      // 空结果提示
      var trFn = (window.CommonUtils && window.CommonUtils.tr) || window.t;
      var emptyText = trFn ? trFn("search_no_results", "No matching products found") : "No matching products found";

      /* @audit-safe: config-driven-render */
      /* @audit-safe: config-driven-render */
      container.innerHTML =
        '<div class="mobile-search-empty">' +
        '<span class="material-symbols-outlined">search_off</span>' +
        "<p>" +
        escapeHtml(emptyText) +
        "</p>" +
        "</div>";
    }
  }

  /**
   * 搜索框键盘事件处理
   * @param {KeyboardEvent} evt
   */
  function onSearchKeydown(evt) {
    if (evt.key === "Escape") {
      closeMobileSearch();
    }
  }

  /* ================================================================
   *  初始化 & 生命周期事件
   * ================================================================ */

  /**
   * SPA 路由切换后的清理
   * - 关闭已打开的菜单
   * - 重置按钮绑定状态
   * - 重新初始化按钮和智能头部
   */
  _spaOn(
    document,
    "spa:load",
    function () {
      closeMenu();
      lastToggleBtn = null;
      toggleBound = false;
      searchBound = false;
      initToggle();
      initSmartHeader();
      if (typeof SlideMenu !== "undefined" && SlideMenu.updateActive) SlideMenu.updateActive();
    },
    "spa:load:cleanup"
  );

  // 初始样式注入（立即执行）
  injectStyles();

  // DOM 就绪后初始化
  function tryInit() {
    initToggle();
    initSmartHeader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // Retry after a short delay in case navigator.js hasn't mounted yet
      tryInit();
      setTimeout(tryInit, 50);
    });
  } else {
    tryInit();
    setTimeout(tryInit, 50);
  }

  // bfcache（前进/后退缓存）恢复时重新初始化
  window.addEventListener("pageshow", function (evt) {
    if (evt.persisted) {
      closeMenu();
      initToggle();
      initSmartHeader();
    }
  });

  /* ================================================================
   *  公开 API
   * ================================================================ */

  /**
   * @namespace SlideMenu
   * @global
   */
  window.SlideMenu = {
    /** 打开移动端滑出菜单 */
    open: openMenu,

    /** 关闭移动端滑出菜单 */
    close: closeMenu,

    /** 初始化汉堡按钮 & 搜索按钮的事件绑定 */
    initToggle: initToggle,

    /** 打开移动端搜索覆盖层 */
    openMobileSearch: openMobileSearch,

    /** 关闭移动端搜索覆盖层 */
    closeMobileSearch: closeMobileSearch,

    /** 更新子菜单项的 is-active 高亮（SPA 导航后调用） */
    updateActive: function () {
      var menuItems = getMenuItems();
      var currentPath = location.pathname.replace(/\/$/, "") || "/";

      // 清除所有已有的一级菜单高亮
      var allL1 = document.querySelectorAll(".mobile-menu-l1");
      for (var b = 0; b < allL1.length; b++) {
        allL1[b].classList.remove("is-active");
      }

      menuItems.forEach(function (item) {
        if (!item.children || item.children.length === 0) return;

        var activeHref = findActiveChildHref(item.children);
        var panel = document.querySelector('[data-menu-l2="' + item.id + '"]');
        if (!panel) return;

        var isOnChildPage = false;
        var childItems = panel.querySelectorAll(".mobile-menu-l2-item");

        // 处理二级项目的高亮
        for (var i = 0; i < childItems.length; i++) {
          var href = childItems[i].getAttribute("href") || "";
          if (activeHref && href.replace(/\/$/, "") === activeHref.replace(/\/$/, "")) {
            childItems[i].classList.add("is-active");
            isOnChildPage = true;
          } else {
            childItems[i].classList.remove("is-active");
          }
        }

        // 处理一级菜单按钮的高亮 + 自动展开
        var l1Button = document.querySelector('[data-menu-toggle="' + item.id + '"]');
        if (!l1Button) return;

        var parentPath = (item.href || "").replace(/\/$/, "");
        var isOnParentPage = parentPath.length > 0 && currentPath === parentPath;

        if (isOnChildPage || isOnParentPage) {
          l1Button.classList.add("is-active");

          // 在二级页面时自动展开（一级页面不展开）
          if (isOnChildPage && !isOnParentPage) {
            l1Button.classList.add("is-expanded");
            panel.classList.add("is-open");
          }
        }
      });
    },
  };
})(window);
