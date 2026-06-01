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
  function _t(k){if(typeof window!=='undefined'&&window.translationManager&&typeof window.translationManager.translate==='function'){var r=window.translationManager.translate(k);return r&&r!==k?r:k}return k}
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
                { key: "nav_oem", label: _t("nav_oem") || "OEM", icon: "precision_manufacturing", emoji: "", href: "/solutions/oem/" },
                { key: "nav_odm", label: _t("nav_odm") || "ODM", icon: "design_services", emoji: "", href: "/solutions/odm/" },
                { key: "nav_obm", label: _t("nav_obm") || "OBM", icon: "verified", emoji: "", href: "/solutions/obm/" },
                { key: "nav_rd", label: _t("nav_rd") || "R&D & Flavor Lab", icon: "science", emoji: "", href: "/solutions/rd/" },
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
                { key: "nav_cases", label: _t("nav_cases") || "Case Studies", icon: "analytics", emoji: "", href: "/cases/" },
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
                { key: "nav_quote", label: _t("nav_quote") || "Get a Quote", icon: "request_quote", emoji: "", href: "/contact/#quote" },
                { key: "nav_samples", label: _t("nav_samples") || "Free Samples", icon: "redeem", emoji: "", href: "/contact/#samples" },
                { key: "nav_visit", label: _t("nav_visit") || "Visit Our Factory", icon: "tour", emoji: "", href: "/contact/#visit" },
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
            if (window.SpaRouter) {
              try {
                window.SpaRouter.navigate(targetItem.href);
              } catch (e) {
                location.href = targetItem.href;
              }
            } else {
              location.href = targetItem.href;
            }
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

        html +=
          '<a class="mobile-search-result-item" href="/products/">' +
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
