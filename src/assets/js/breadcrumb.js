/**
 * breadcrumb.js — Unified breadcrumb, back-bar & sibling navigation
 *
 * Renders:
 *   PC/Tablet (≥768px):  父级 › 当前页
 *   Mobile (<768px):      ← 父级标题 (back bar)
 *
 * Also renders "sibling" navigation links below the breadcrumb for:
 *   - Product categories (6 siblings)
 *   - Application scenarios (7 siblings)
 *   - Support services (5 siblings)
 *
 * Usage: Just include this script. It auto-detects the current page.
 *        Ensures <div id="breadcrumb-container"></div> exists in HTML.
 */
(function () {
  "use strict";

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  // ─── Category slug ↔ key ↔ label maps ──────────────────────────

  function tl(key, fallback) {
    if (typeof key === "object") key = key.en || key["zh-CN"] || "";
    if (typeof fallback === "object") fallback = key;
    if (typeof window.t === "function") {
      var result = window.t(key);
      if (result && result !== key) return result;
    }
    return fallback || key;
  }

  /**
   * Resolve a possibly-object label to a display string.
   * Handles both string and {en, "zh-CN"} object labels.
   */
  function resolveLabel(label) {
    if (typeof label === "string") return label;
    if (label && typeof label === "object") {
      // Try current language first, fall back to zh-CN or en
      var currentLang = window.translationManager ? window.translationManager.currentLanguage : "zh-CN";
      return label[currentLang] || label["zh-CN"] || label.en || "";
    }
    return String(label);
  }

  // ── Config-driven category maps ──
  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _categories = _cfg.categories || {};

  function buildSlugMap(items) {
    var map = {};
    if (!items) return map;
    for (var i = 0; i < items.length; i++) {
      map[items[i].slug] = items[i];
    }
    return map;
  }

  var PRODUCT_SLUGS = buildSlugMap(_categories.products);
  var APP_SLUGS = buildSlugMap(_categories.applications);

  // i18n-wrapped labels (lazy resolved at render time)
  function getProductLabel(slug) {
    return tl(PRODUCT_SLUGS[slug].label, PRODUCT_SLUGS[slug].label);
  }
  function getAppLabel(slug) {
    return tl(APP_SLUGS[slug].label, APP_SLUGS[slug].label);
  }
  function getSupportLabel(slug) {
    return tl(SUPPORT_SLUGS[slug].label, SUPPORT_SLUGS[slug].label);
  }

  var SUPPORT_SLUGS = buildSlugMap(_categories.support);
  // 动态构建分类 slug 正则（替代硬编码）
  function buildSlugPattern(slugMap) {
    var slugs = Object.keys(slugMap);
    if (slugs.length === 0) return "(?!x)x"; // never matches
    return slugs.join("|");
  }

  var PRODUCT_SLUG_PATTERN = buildSlugPattern(PRODUCT_SLUGS);
  var APP_SLUG_PATTERN = buildSlugPattern(APP_SLUGS);
  var SUPPORT_SLUG_PATTERN = buildSlugPattern(SUPPORT_SLUGS);

  // ─── Page route config ─────────────────────────────────────────
  // Each entry: { match: regex, parentPath, parentLabel, currentLabel, siblings }

  var SLUG_TO_CATEGORY_KEY = {};
  Object.keys(PRODUCT_SLUGS).forEach(function (slug) {
    SLUG_TO_CATEGORY_KEY[slug] = PRODUCT_SLUGS[slug].key;
  });

  var CATEGORY_KEY_TO_SLUG = {};
  Object.keys(PRODUCT_SLUGS).forEach(function (slug) {
    CATEGORY_KEY_TO_SLUG[PRODUCT_SLUGS[slug].key] = slug;
  });

  // ─── Detect current page ───────────────────────────────────────

  function detectPage() {
    var path = (window.location.pathname || "/").replace(/\/$/, "");
    var result = { type: "none", slug: "", parentPath: "", parentLabel: "", currentLabel: "", siblings: [] };

    // Product "all" page: /products/all/
    var allMatch = path.match(/^\/products\/all$/);
    if (allMatch) {
      result.type = "category";
      result.slug = "all";
      result.parentPath = "/products/";
      result.parentLabel = tl("nav_products", "产品中心");
      result.currentLabel = tl("nav_products_all", "全部产品");
      // No siblings — product grid has its own category tabs
      return result;
    }

    // Product category pages: /products/coffee/
    var catMatch = path.match(new RegExp("^/products/(" + PRODUCT_SLUG_PATTERN + ")$"));
    if (catMatch) {
      var slug = catMatch[1];
      var info = PRODUCT_SLUGS[slug];
      result.type = "category";
      result.slug = slug;
      result.parentPath = "/products/";
      result.parentLabel = tl("nav_product_center", "产品中心");
      result.currentLabel = resolveLabel(info.label);
      // No siblings — product grid has its own category tabs
      return result;
    }

    // PDP pages: /products/<category>/<model>/ 或 /products/<model>/
    var pdpMatch = path.match(/^\/products\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
    if (pdpMatch) {
      var categoryFromUrl = pdpMatch[1];
      var model = pdpMatch[2];
      // Extract category slug from URL: /products/coffee/CF-001/ → coffee
      var refSlug = PRODUCT_SLUGS[categoryFromUrl] ? categoryFromUrl : "";

      // Try to detect category from product data (async — will update after)
      result.type = "pdp";
      result.slug = "pdp";
      result.parentPath = refSlug ? "/products/" + refSlug + "/" : "/products/";
      result.parentLabel = tl("nav_product_center", "产品中心");
      result.currentLabel = model;
      result.refSlug = refSlug;
      result.refCategoryLabel = refSlug ? getProductLabel(refSlug) : "";
      return result;
    }

    // Products compare
    if (path === "/products/compare" || path === "/products/compare/") {
      result.type = "compare";
      result.parentPath = "/products/";
      result.parentLabel = tl("nav_product_center", "产品中心");
      result.currentLabel = tl("products_compare", "产品对比");
      return result;
    }

    // Application scenario pages
    var appMatch = path.match(new RegExp("^/applications/(" + APP_SLUG_PATTERN + ")$"));
    if (appMatch) {
      var appSlug = appMatch[1];
      result.type = "application";
      result.slug = appSlug;
      result.parentPath = "/applications/";
      result.parentLabel = tl("nav_applications", "行业场景");
      result.currentLabel = resolveLabel(APP_SLUGS[appSlug].label);
      result.siblings = buildSiblingLinks("applications", appSlug); // keep for now
      return result;
    }

    // Support pages
    var supMatch = path.match(new RegExp("^/support/(" + SUPPORT_SLUG_PATTERN + ")$"));
    if (supMatch) {
      var supSlug = supMatch[1];
      result.type = "support";
      result.slug = supSlug;
      result.parentPath = "/support/";
      result.parentLabel = tl("nav_support", "服务支持");
      result.currentLabel = resolveLabel(SUPPORT_SLUGS[supSlug].label);
      result.siblings = buildSiblingLinks("support", supSlug); // keep for now
      return result;
    }

    // News detail
    var newsMatch = path.match(/^\/news\/detail/);
    if (newsMatch) {
      result.type = "news-detail";
      result.parentPath = "/news/";
      result.parentLabel = tl("nav_news", "新闻动态");
      result.currentLabel = "";
      return result;
    }

    // Case studies detail: /cases/<slug>/
    var caseMatch = path.match(/^\/cases\/([a-z0-9-]+)$/);
    if (caseMatch) {
      result.type = "case-detail";
      result.slug = caseMatch[1];
      result.parentPath = "/cases/";
      result.parentLabel = tl("nav_cases", "案例研究");
      result.currentLabel = ""; // filled by updateCaseTitle
      return result;
    }

    return result;
  }

  // ─── Sibling navigation builder ────────────────────────────────

  function buildSiblingLinks(group, currentSlug) {
    var links = [];
    if (group === "products") {
      Object.keys(PRODUCT_SLUGS).forEach(function (slug) {
        var info = PRODUCT_SLUGS[slug];
        links.push({
          href: "/products/" + slug + "/",
          label: getProductLabel(slug),
          icon: info.icon,
          emoji: info.emoji,
          active: slug === currentSlug,
        });
      });
    } else if (group === "applications") {
      Object.keys(APP_SLUGS).forEach(function (slug) {
        var info = APP_SLUGS[slug];
        links.push({
          href: "/applications/" + slug + "/",
          label: getAppLabel(slug),
          icon: info.icon,
          active: slug === currentSlug,
        });
      });
    } else if (group === "support") {
      Object.keys(SUPPORT_SLUGS).forEach(function (slug) {
        var info = SUPPORT_SLUGS[slug];
        links.push({
          href: "/support/" + slug + "/",
          label: getSupportLabel(slug),
          icon: info.icon,
          active: slug === currentSlug,
        });
      });
    }
    return links;
  }

  // ─── Renderers ─────────────────────────────────────────────────

  function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderBreadcrumb(page) {
    if (page.type === "none") return "";

    // For pages where currentLabel is set by page-init scripts (case-detail, news-detail),
    // preserve existing breadcrumb-current text instead of overwriting with empty.
    var existingCurrent = "";
    if (!page.currentLabel && (page.type === "case-detail" || page.type === "news-detail")) {
      var existingEl = document.getElementById("breadcrumb-current");
      if (existingEl) existingCurrent = existingEl.textContent.trim();
    }
    var displayLabel = page.currentLabel || existingCurrent || "";

    var chevron = '<span class="mx-1.5 text-slate-300 dark:text-slate-600">/</span>';
    var mChevron = '<span class="mx-1 text-slate-300 text-xs">/</span>';

    // PC/Tablet breadcrumb — aligned with KitchenYuKoLi PDP style
    var bc =
      '<div class="pt-4 pb-0 hidden md:block max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">' +
      '<nav class="breadcrumb-nav text-sm text-slate-500 dark:text-slate-400 py-4" aria-label="Breadcrumb">' +
      '<ol class="flex items-center gap-1 flex-wrap">' +
      '<li><a href="' +
      page.parentPath +
      '" data-no-swup class="hover:text-primary transition-colors">' +
      esc(page.parentLabel) +
      "</a></li>";

    if (page.type === "pdp" && page.refCategoryLabel) {
      bc +=
        chevron +
        '<li><a href="/products/' +
        page.refSlug +
        '/" data-no-swup class="hover:text-primary transition-colors">' +
        esc(page.refCategoryLabel) +
        "</a></li>";
    }

    bc +=
      chevron +
      '<li><span id="breadcrumb-current" class="text-slate-900 dark:text-white font-medium">' +
      esc(displayLabel) +
      "</span></li>" +
      "</ol></nav></div>";

    // Mobile back bar — aligned with KitchenYuKoLi PDP style
    var backBar =
      '<div class="pt-4 pb-2 md:hidden max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">' +
      '<div class="flex items-center gap-2">' +
      '<button onclick="window.Breadcrumb.goBack()" class="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-all flex-shrink-0 shadow-sm" aria-label="' +
      tl("pd_back", "返回") +
      '">' +
      '<span class="material-symbols-outlined text-lg">arrow_back</span></button>' +
      '<div class="flex items-center gap-1 flex-wrap">' +
      '<a href="' +
      page.parentPath +
      '" data-no-swup class="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">' +
      esc(page.parentLabel) +
      "</a>";

    if (page.type === "pdp" && page.refCategoryLabel) {
      backBar +=
        mChevron +
        '<a href="/products/' +
        page.refSlug +
        '/" data-no-swup class="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">' +
        esc(page.refCategoryLabel) +
        "</a>";
    }

    backBar +=
      mChevron +
      '<span id="breadcrumb-current-mobile" class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[160px]">' +
      esc(displayLabel) +
      "</span>" +
      "</div></div></div>";

    return bc + backBar;
  }

  function renderSiblings(page) {
    if (!page.siblings || page.siblings.length <= 1) return "";
    var siblings = page.siblings;

    // PC/Tablet
    var siblingLabel = tl("cross_sell_other_category", "其他品类");
    if (page.type === "application") siblingLabel = tl("cross_sell_other_scenario", "其他场景");
    if (page.type === "support") siblingLabel = tl("cross_sell_other_service", "其他服务");
    var pc = '<div class="sibling-nav hidden md:block mb-8">';
    pc +=
      '<div class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">' +
      siblingLabel +
      "</div>";
    pc += '<div class="flex items-center gap-2 flex-wrap">';
    siblings.forEach(function (s) {
      if (s.active) return;
      pc +=
        '<a href="' +
        s.href +
        '" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all">';
      if (s.emoji) pc += '<span class="text-xs">' + s.emoji + "</span>";
      pc += esc(s.label) + "</a>";
    });
    pc += "</div></div>";

    // Mobile (horizontal scroll)
    var mobile = '<div class="sibling-nav md:hidden mb-6">';
    mobile += '<div class="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">';
    siblings.forEach(function (s) {
      if (s.active) return;
      mobile +=
        '<a href="' +
        s.href +
        '" class="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all whitespace-nowrap">';
      if (s.emoji) mobile += "<span>" + s.emoji + "</span>";
      mobile += esc(s.label) + "</a>";
    });
    mobile += "</div></div>";

    return pc + mobile;
  }

  // ─── PDP category detection from product data ──────────────────

  function updatePdpCategory(page) {
    if (page.type !== "pdp" || page.refSlug) return;

    // Listen for product-data-ready to find the category
    window.addEventListener("product-data-ready", function () {
      if (window.ProductGrid && window.ProductGrid.getAllProducts) {
        var products = window.ProductGrid.getAllProducts();
        var model = page.currentLabel;
        var found = products.find(function (p) {
          return p.model === model;
        });
        if (found && found._category) {
          var catKey = found._category;
          var slug = CATEGORY_KEY_TO_SLUG[catKey] || "";
          if (slug && PRODUCT_SLUGS[slug]) {
            page.refSlug = slug;
            page.refCategoryLabel = getProductLabel(slug);
            page.parentPath = "/products/" + slug + "/";
            reRender(page);
          }
        }
      }
    });
  }

  // ─── Referrer tracking for PDP ─────────────────────────────────

  function trackPdpReferrer() {
    var path = (window.location.pathname || "/").replace(/\/$/, "");
    // Track category page → PDP transitions
    if (new RegExp("^/products/(" + PRODUCT_SLUG_PATTERN + ")$").test(path)) {
      try {
        sessionStorage.setItem("pdp_referrer", path);
      } catch (e) {}
    }
    // Clear when navigating away from PDP
    if (!new RegExp("^/products/(?!(?:" + PRODUCT_SLUG_PATTERN + "|compare)(?:$|/))").test(path)) {
      // Don't clear — keep it for back navigation
    }
  }

  // ─── Main init ─────────────────────────────────────────────────

  function reRender(page) {
    var container = document.getElementById("breadcrumb-container");
    if (!container) {
      // Auto-create if missing (e.g. SWUP replaced #spa-content)
      var spa = document.getElementById("spa-content") || document.querySelector("main");
      if (spa) {
        container = document.createElement("div");
        container.id = "breadcrumb-container";
        spa.insertBefore(container, spa.firstChild);
      } else {
        return;
      }
    }

    var html = renderBreadcrumb(page);
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    container.innerHTML = html;

    // Cross-sell and scene-entry rendering is handled by cross-sell.js
    // (richer cards with highlight badges, descriptions, responsive grid)
    // Only render sibling nav here if no cross-sell container exists.
    if (!document.getElementById("cross-sell-container")) {
      var siblingContainer = document.getElementById("sibling-container");
      if (siblingContainer && page.siblings && page.siblings.length > 1) {
        /* @audit-safe: template-func-return */
        /* @audit-safe: template-func-return */
        siblingContainer.innerHTML = renderSiblings(page);
      }
    }

    // For pages with dedicated sibling-container (non-category pages)
    var siblingContainer2 = document.getElementById("sibling-container");
    if (siblingContainer2 && page.type !== "category") {
      /* @audit-safe: template-func-return */
      /* @audit-safe: template-func-return */
      siblingContainer2.innerHTML = renderSiblings(page);
    }
    // Fallback: if no sibling-container but has siblings, append to breadcrumb-container
    else if (!siblingContainer2 && page.siblings && page.siblings.length > 1) {
      var fallbackSiblings = renderSiblings(page);
      if (fallbackSiblings) {
        /* @audit-safe: constant-html */
        /* @audit-safe: constant-html */
        container.innerHTML += '<div id="sibling-wrapper">' + fallbackSiblings + "</div>";
      }
    }
  }

  function init() {
    trackPdpReferrer();

    var page = detectPage();
    if (page.type === "none") return;

    updatePdpCategory(page);

    // Wait for translations to be ready before first render
    function doRender() {
      // Re-detect to pick up translated labels
      var freshPage = detectPage();
      if (freshPage.type !== "none") {
        page = freshPage;
        reRender(page);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        if (document.querySelector('[data-swup-persist="nav"]') && !window.translationManager) {
          // Wait for spa:ready (translations loaded)
          document.addEventListener("spa:ready", doRender, { once: true });
        } else {
          doRender();
        }
      });
    } else {
      if (!window.translationManager) {
        document.addEventListener("spa:ready", doRender, { once: true });
      } else {
        doRender();
      }
    }

    // Re-render on SPA navigation
    _spaOn(window, "spa:load", function () {
      trackPdpReferrer();
      var newPage = detectPage();
      if (newPage.type !== "none") {
        updatePdpCategory(newPage);
        // Don't reRender for case-detail — it's handled by case-detail.js renderAll
        // which sets breadcrumb-current directly after init.
        // SPA async script injection means spa:load may fire before page scripts execute.
        if (newPage.type !== "case-detail" && newPage.type !== "news-detail") {
          reRender(newPage);
        } else {
          // Case-detail: breadcrumb is fully handled by case-detail.js renderAll().
          // Do NOT re-render skeleton here — renderBreadcrumb() uses currentLabel=""
          // which would overwrite the case title set by case-detail.js.
          // Only ensure the container exists for case-detail.js to populate.
          var container = document.getElementById("breadcrumb-container");
          if (!container) {
            var spa = document.getElementById("spa-content") || document.querySelector("main");
            if (spa) {
              container = document.createElement("div");
              container.id = "breadcrumb-container";
              spa.insertBefore(container, spa.firstChild);
            }
          }
        }
      }
    });

    // Re-render on language change (re-detect to get translated labels)
    _spaOn(window, "languageChanged", function () {
      var newPage = detectPage();
      if (newPage.type !== "none") {
        // For case-detail, let case-detail.js handle re-render via its own language listener
        if (newPage.type === "case-detail") {
          // Only update parent labels, preserve current label from DOM
          var bcEl = document.getElementById("breadcrumb-current");
          if (bcEl && bcEl.textContent.trim()) newPage.currentLabel = bcEl.textContent.trim();
        }
        reRender(newPage);
      }
    });
  }

  // ─── Public API ────────────────────────────────────────────────

  window.Breadcrumb = {
    init: init,
    refresh: function () {
      var newPage = detectPage();
      if (newPage.type !== "none") {
        // Preserve current label from DOM for case-detail/news-detail
        if (newPage.type === "case-detail" || newPage.type === "news-detail") {
          var bcEl = document.getElementById("breadcrumb-current");
          if (bcEl && bcEl.textContent.trim()) {
            newPage.currentLabel = bcEl.textContent.trim();
          }
          var bcMobEl = document.getElementById("breadcrumb-current-mobile");
          if (bcMobEl && bcMobEl.textContent.trim()) {
            newPage.currentLabelMobile = bcMobEl.textContent.trim();
          }
        }
        reRender(newPage);
      }
    },
    goBack: function () {
      var referrer;
      try {
        referrer = sessionStorage.getItem("pdp_referrer");
      } catch (e) {
        referrer = null;
      }
      if (
        referrer &&
        window.location.pathname.indexOf("/products/") === 0 &&
        !new RegExp("^(" + PRODUCT_SLUG_PATTERN + "|compare)$").test(window.location.pathname.replace("/products/", ""))
      ) {
        if (window.SpaRouter && typeof window.SpaRouter.navigate === "function") {
          window.SpaRouter.navigate(referrer);
        } else {
          window.location.href = referrer;
        }
      } else {
        window.history.back();
      }
    },
    SLUG_TO_CATEGORY_KEY: SLUG_TO_CATEGORY_KEY,
    CATEGORY_KEY_TO_SLUG: CATEGORY_KEY_TO_SLUG,
    PRODUCT_SLUGS: PRODUCT_SLUGS,
  };

  // Auto-init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
