/**
 * search-engine.js — Multi-language Product Search Engine
 *
 * Provides a lightweight, debounced search over the full product catalog.
 * Searches across: product name, model number, category, and translated fields.
 * Results are displayed in a floating dropdown panel below the search bar.
 *
 * Dependencies:
 *   - window.AppUtils.buildProductCatalog()
 *   - window.translationManager (for current language + product translations)
 *   - CommonUtils.tr (fallback)
 *
 * Exposes: window.ProductSearchEngine
 */

(function (global) {
  "use strict";
  function _extend(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src) {
        for (var k in src) {
          if (src.hasOwnProperty(k)) target[k] = src[k];
        }
      }
    }
    return target;
  }
  var _theme = (window.SITE_CONFIG || window._cfg || {}).theme || {};
  var _primary = (_theme.colors || {}).primary || "#2E7D32";

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Fallback tr() if CommonUtils is not loaded yet */
  function tr(key, fallback) {
    if (window.CommonUtils && typeof window.CommonUtils.tr === "function") {
      return window.CommonUtils.tr(key, fallback);
    }
    var v = typeof window.t === "function" ? window.t(key) : key;
    return v && v !== key ? v : fallback;
  }

  /** Get translated field from window._productTranslations */
  function getProductTranslation(product, field, fallback) {
    if (!product) return fallback || "";
    var pid = product._productId || product.id;
    if (pid && window._productTranslations && window._productTranslations[pid]) {
      var val = window._productTranslations[pid][field];
      if (val) return val;
    }
    var model = product.model;
    if (model && window._productTranslationsByModel && window._productTranslationsByModel[model]) {
      var val2 = window._productTranslationsByModel[model][field];
      if (val2) return val2;
    }
    return fallback || "";
  }

  /** Simple debounce */
  function debounce(fn, ms) {
    ms = ms || 250;
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
  }

  /** HTML-escape a string */
  function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ─── State ────────────────────────────────────────────────────────────────

  var panel = null; // DOM reference to results panel
  var isOpen = false;
  var currentQuery = "";
  var highlightedIndex = -1;
  var resultItems = []; // array of product objects in current results

  // ─── Search Logic ─────────────────────────────────────────────────────────

  /**
   * Build an enhanced product array with translated names for the current language.
   * Each product gets an additional `_searchName` field combining all searchable fields.
   */
  function buildSearchableProducts() {
    var table = window.PRODUCT_DATA_TABLE || [];
    var translations = window.PRODUCT_DATA_TRANSLATIONS || {};
    var tm = window.translationManager;
    var lang = tm && tm.currentLanguage ? tm.currentLanguage : "en";

    return table.map(function (p) {
      var t = translations[p.model] || {};
      var displayName = lang === "zh-CN" && t.nameZh ? t.nameZh : t.nameEn || p.name;
      var displayCategory = tr("filter_" + p.category, p.category);
      var displayDescription = t.descriptionEn || t.descriptionZh || p.description || "";

      return _extend({}, p, {
        _displayName: displayName,
        _displayCategory: displayCategory,
        _displayBadge: "",
        _searchText: [
          displayName,
          p.model,
          displayCategory,
          p.category,
          p.brand,
          displayDescription,
          (p.diets || []).join(" "),
          (p.tags || []).join(" "),
          p.origin,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    });
  }

  /**
   * Search page content index.
   * @param {string} query - The search query
   * @returns {Array} Matching pages
   */
  function searchPages(query) {
    var index = window.SEARCH_INDEX || [];
    if (!query || !index.length) return [];

    var q = query.toLowerCase().trim();
    var tokens = q
      .replace(/\//g, " ")
      .split(/[\s,，、-]+/)
      .filter(Boolean);

    var results = [];
    var seen = {};

    // Detect current language for multilingual matching
    var tm = window.translationManager;
    var lang = (tm && tm.currentLanguage) || "en";
    var isZh = lang === "zh-CN" || lang === "zh-TW";

    for (var i = 0; i < index.length; i++) {
      var page = index[i];
      if (seen[page.path]) continue;
      seen[page.path] = true;

      // Use Chinese h1/h2s when language is zh-CN
      var h1Text = isZh && page.h1Zh ? page.h1Zh : page.h1;
      var h2sText = isZh && page.h2sZh ? page.h2sZh : page.h2s;
      var text = [
        page.title,
        page.titleZh,
        h1Text,
        (page.keywords || []).join(" "),
        page.meta,
        (h2sText || []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      var score = 0;
      var matched = false;

      for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t];
        if (text.indexOf(token) === -1) {
          matched = false;
          break;
        }
        matched = true;
        if (page.title && page.title.toLowerCase() === token) score += 30;
        else if (page.titleZh && page.titleZh.toLowerCase() === token) score += 30;
        else if ((page.keywords || []).indexOf(token) !== -1) score += 20;
        else score += 10;
      }

      if (matched) {
        // Pick display name based on current language
        var displayName = isZh && page.titleZh ? page.titleZh : page.title;
        results.push({
          _type: "page",
          _score: score,
          _displayName: displayName,
          _displayCategory: "Page",
          _page: page,
          path: page.path,
          image: page.image,
        });
      }
    }

    results.sort(function (a, b) {
      return (b._score || 0) - (a._score || 0);
    });

    return results;
  }

  /**
   * Perform the actual search (products + pages).
   * @param {string} query - The search query
   * @returns {Array} Matching products (max 8)
   */
  function doSearch(query) {
    if (!query || query.length < 1) return [];

    var q = query.toLowerCase().trim();
    // Split query into tokens for multi-term search; normalize slashes first
    var tokens = q
      .replace(/\//g, " ")
      .split(/[\s,，、-]+/)
      .filter(Boolean);

    var allProducts = buildSearchableProducts();
    var allPages = searchPages(query);
    var results = [];
    var seen = {};

    // Page results first (up to 3), then product results (fill to 8)
    var pageLimit = 3;
    for (var pi = 0; pi < allPages.length && pi < pageLimit; pi++) {
      results.push(allPages[pi]);
    }

    for (var i = 0; i < allProducts.length && results.length < 8; i++) {
      var p = allProducts[i];
      // Skip inactive
      if (p.isActive === false) continue;

      // Deduplicate by model
      if (seen[p.model]) continue;
      seen[p.model] = true;

      var text = p._searchText;

      // Score-based matching
      var score = 0;
      var matched = false;

      for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t];
        var idx = text.indexOf(token);
        if (idx === -1) {
          matched = false;
          break;
        }
        matched = true;
        // Exact model match gets highest score
        if (p.model && p.model.toLowerCase() === token) {
          score += 100;
        }
        // Model starts-with match
        else if (p.model && p.model.toLowerCase().indexOf(token) === 0) {
          score += 50;
        }
        // Name starts-with match
        else if (p._displayName && p._displayName.toLowerCase().indexOf(token) === 0) {
          score += 30;
        }
        // Any match
        else {
          score += 10;
        }
        // Earlier matches get bonus
        score -= Math.floor(idx / 50);
      }

      if (matched) {
        p._score = score;
        results.push(p);
      }
    }

    // Sort by score descending
    results.sort(function (a, b) {
      return (b._score || 0) - (a._score || 0);
    });

    return results;
  }

  // ─── UI Rendering ─────────────────────────────────────────────────────────

  function createPanel() {
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "ios-search-results";
    panel.className = "ios-search-results";
    panel.setAttribute("role", "listbox");
    panel.setAttribute("aria-label", tr("search_results_title", "Search results"));
    document.body.appendChild(panel);

    // Close on click outside
    document.addEventListener("mousedown", function (e) {
      if (panel && !panel.contains(e.target)) {
        var bar = document.querySelector(".ios-search-bar");
        if (!bar || !bar.contains(e.target)) {
          hidePanel();
        }
      }
    });

    return panel;
  }

  function showPanel() {
    if (!panel) createPanel();
    if (isOpen) return;
    isOpen = true;
    panel.style.display = "block";
    panel.classList.add("is-visible");

    // Position below search bar
    positionPanel();
  }

  function hidePanel() {
    if (!panel || !isOpen) return;
    isOpen = false;
    highlightedIndex = -1;
    panel.style.display = "none";
    panel.classList.remove("is-visible");
  }

  function positionPanel() {
    var bar = document.querySelector(".ios-search-bar");
    if (!bar || !panel) return;

    var rect = bar.getBoundingClientRect();
    var isRTL = document.documentElement.dir === "rtl";

    panel.style.position = "fixed";
    panel.style.top = rect.bottom + 6 + "px";
    panel.style.zIndex = "2500";

    var panelWidth = Math.max(rect.width, 320);
    var vpWidth = window.innerWidth;

    if (isRTL) {
      panel.style.right = "auto";
      panel.style.left = rect.left + "px";
    } else {
      // Align panel right edge to bar right edge, but clamp within viewport
      var rightEdge = rect.right;
      if (rightEdge + 8 > vpWidth) rightEdge = vpWidth - 8;
      panel.style.left = "auto";
      panel.style.right = vpWidth - rightEdge + "px";
    }

    // Ensure panel doesn't overflow left edge
    if (vpWidth - parseFloat(panel.style.right || 0) - panelWidth < 8) {
      panel.style.left = "8px";
      panel.style.right = "auto";
    }

    panel.style.width = panelWidth + "px";
  }

  function renderResults(results, query) {
    if (!panel) createPanel();

    if (!results || results.length === 0) {
      var noResultsText = tr("search_no_results", "No matching products found");
      var hintText = tr("search_hint", "Try searching by model number or product type");
      /* @audit-safe: internal-data */
      /* @audit-safe: internal-data */
      panel.innerHTML =
        '<div class="ios-search-empty">' +
        '<span class="material-symbols-outlined ios-search-empty-icon">search_off</span>' +
        '<p class="ios-search-empty-title">' +
        esc(noResultsText) +
        "</p>" +
        (query.length >= 2 ? '<p class="ios-search-empty-hint">' + esc(hintText) + "</p>" : "") +
        "</div>";
      showPanel();
      return;
    }

    var countText = tr("search_results_count", "{count} results found").replace("{count}", String(results.length));
    var viewAllText = tr("search_view_all", "View all products");

    // Count by type
    var productCount = 0;
    var pageCount = 0;
    for (var ri = 0; ri < results.length; ri++) {
      if (results[ri]._type === "page") pageCount++;
      else productCount++;
    }

    var html =
      '<div class="ios-search-header">' + '<span class="ios-search-count">' + esc(countText) + "</span>" + "</div>";

    html += '<div class="ios-search-results-list">';

    // Render pages first, then products
    var sections = [
      { type: "page", label: tr("search_pages", "Pages") },
      { type: "product", label: tr("search_products", "Products") },
    ];
    var renderedIndex = 0;

    for (var si = 0; si < sections.length; si++) {
      var sectionType = sections[si].type;
      var sectionLabel = sections[si].label;
      var sectionItems = [];
      for (var rj = 0; rj < results.length; rj++) {
        if ((results[rj]._type || "product") === sectionType) {
          results[rj]._sectionIndex = renderedIndex++;
          sectionItems.push(results[rj]);
        }
      }
      if (sectionItems.length === 0) continue;

      // Section header
      html += '<div class="ios-search-section-label">' + esc(sectionLabel) + "</div>";

      for (var sk = 0; sk < sectionItems.length; sk++) {
        var item = sectionItems[sk];
        var idx = item._sectionIndex;
        var hlClass = idx === highlightedIndex ? " is-highlighted" : "";

        if (sectionType === "page") {
          // Page item: icon + title + path
          var page = item._page || {};
          var pageTitle = esc(item._displayName || page.title || page.path);
          var pagePath = esc(page.path || "");
          html +=
            '<a class="ios-search-result-item' +
            hlClass +
            '" href="' +
            pagePath +
            '" data-search-idx="' +
            idx +
            '" role="option">' +
            '<div class="ios-search-result-img">' +
            (item.image
              ? '<img src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async">'
              : '<span class="material-symbols-outlined">language</span>') +
            "</div>" +
            '<div class="ios-search-result-info">' +
            '<div class="ios-search-result-name">' +
            pageTitle +
            "</div>" +
            '<div class="ios-search-result-meta">' +
            '<span class="ios-search-result-model">' +
            esc("Page") +
            "</span>" +
            '<span class="ios-search-result-sep">·</span>' +
            '<span class="ios-search-result-category">' +
            pagePath +
            "</span>" +
            "</div>" +
            "</div>" +
            "</a>";
        } else {
          // Product item
          var name = esc(item._displayName || item._displayCategory + " " + item.model);
          var model = esc(item.model || "");
          var category = esc(item._displayCategory || item.category || "");
          var badge = item._displayBadge ? '<span class="ios-search-badge">' + esc(item._displayBadge) + "</span>" : "";
          if (!item.image && !item.productImage && !item.imageUrl) {
            console.warn("[search-engine] No image for", item.model, item.category);
          }
          var imgSrc = item.image || item.productImage || item.imageUrl || "";
          var cat = item.category || "";
          var detailHref = item.model ? "/products/" + encodeURIComponent(cat) + "/" + item.model + "/" : "/products/";

          html +=
            '<a class="ios-search-result-item' +
            hlClass +
            '" ' +
            'href="' +
            detailHref +
            '" data-search-idx="' +
            idx +
            '" role="option">' +
            '<div class="ios-search-result-img">' +
            (imgSrc
              ? '<img src="' + esc(imgSrc) + '" alt="" loading="lazy" decoding="async">'
              : '<span class="material-symbols-outlined">inventory_2</span>') +
            "</div>" +
            '<div class="ios-search-result-info">' +
            '<div class="ios-search-result-name">' +
            name +
            badge +
            "</div>" +
            '<div class="ios-search-result-meta">' +
            '<span class="ios-search-result-model">' +
            model +
            "</span>" +
            '<span class="ios-search-result-sep">·</span>' +
            '<span class="ios-search-result-category">' +
            category +
            "</span>" +
            "</div>" +
            "</div>" +
            "</a>";
        }
      }
    }

    html += "</div>";

    html +=
      '<a class="ios-search-view-all" href="/products/all/">' +
      "<span>" +
      esc(viewAllText) +
      "</span>" +
      '<span class="material-symbols-outlined">arrow_forward</span>' +
      "</a>";

    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    panel.innerHTML = html;

    // Bind click events on result items
    var items = panel.querySelectorAll(".ios-search-result-item");
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener("click", function (e) {
        hidePanel();
        // Let the SPA router handle navigation
        // The href is already set to /products/
        if (e.target.closest(".ios-search-view-all")) {
          hidePanel();
        }
      });
    }

    // View all link
    var viewAllLink = panel.querySelector(".ios-search-view-all");
    if (viewAllLink) {
      viewAllLink.addEventListener("click", function () {
        hidePanel();
      });
    }

    showPanel();
    resultItems = results;
  }

  function highlightItem(index) {
    var items = panel ? panel.querySelectorAll(".ios-search-result-item") : [];
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("is-highlighted", i === index);
    }
    highlightedIndex = index;

    // Scroll into view
    if (index >= 0 && items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  var debouncedSearch = debounce(function (query) {
    if (query === currentQuery) return;
    currentQuery = query;

    if (!query || query.length < 1) {
      hidePanel();
      return;
    }

    var results = doSearch(query);
    renderResults(results, query);
  }, 200);

  /**
   * Initialize search: bind to the iOS search bar input.
   * Should be called after navigator.js has rendered the search bar.
   */
  function init() {
    // Support unified search bar input (.ios-search-input)
    var inputs = document.querySelectorAll(".ios-search-bar .ios-search-input");
    if (!inputs || inputs.length === 0) {
      return;
    }

    inputs.forEach(function (input) {
      // Skip if already bound (idempotent reinit)
      if (input._searchEngineBound) return;
      input._searchEngineBound = true;

      // Input event
      input.addEventListener("input", function () {
        debouncedSearch(input.value.trim());
      });

      // Focus — show results panel + is-focused style
      input.addEventListener("focus", function () {
        var bar = input.closest && input.closest(".ios-search-bar");
        if (bar) bar.classList.add("is-focused");
        if (currentQuery && currentQuery.length >= 1) {
          showPanel();
        }
      });

      // Blur — remove is-focused
      input.addEventListener("blur", function () {
        var bar = input.closest && input.closest(".ios-search-bar");
        if (bar) bar.classList.remove("is-focused");
      });

      // Keyboard navigation
      input.addEventListener("keydown", function (e) {
        var maxIndex = resultItems.length - 1;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            if (!isOpen) {
              debouncedSearch(input.value.trim());
              return;
            }
            if (highlightedIndex < maxIndex) {
              highlightItem(highlightedIndex + 1);
            }
            break;

          case "ArrowUp":
            e.preventDefault();
            if (highlightedIndex > 0) {
              highlightItem(highlightedIndex - 1);
            }
            break;

          case "Enter":
            if (isOpen && highlightedIndex >= 0 && resultItems[highlightedIndex]) {
              e.preventDefault();
              hidePanel();
              if (window.SpaRouter && window.SpaRouter.navigate) {
                window.SpaRouter.navigate("/products/");
              } else {
                window.location.href = "/products/";
              }
            }
            break;

          case "Escape":
            hidePanel();
            input.blur();
            break;
        }
      });
    });
  }

  /**
   * Re-initialize (e.g. after SPA navigation re-renders the header).
   */
  function reinit() {
    panel = null;
    isOpen = false;
    currentQuery = "";
    highlightedIndex = -1;
    resultItems = [];
    init();
  }

  /**
   * Destroy the search engine (cleanup).
   */
  function destroy() {
    hidePanel();
    if (panel && panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }
    panel = null;
    isOpen = false;
    currentQuery = "";
  }

  // ─── Inject Styles (once) ────────────────────────────────────────────────

  // ─── Inject Styles — 已迁移至 styles.css ──────────────
  // 搜索框 CSS 已统一在 styles.css 中定义，所有 SSG 页面
  // 从首次渲染就具有完整样式，不再依赖 JS 运行时注入。
  function injectStyles() {
    // no-op: all search styles are in styles.css
  }

  // ─── Auto-init ───────────────────────────────────────────────────────────

  // Inject styles immediately
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectStyles();
      init();
    });
  } else {
    injectStyles();
    init();
  }

  // Re-init on SPA navigation (spa:ready ensures translations + DOM are ready)
  _spaOn(
    document,
    "spa:ready",
    function () {
      reinit();
    },
    "spa:ready:reinit"
  );

  // Re-init on language change
  if (window.translationManager) {
    window.translationManager.on("languageChanged", function () {
      // Clear current query and hide panel
      currentQuery = "";
      hidePanel();
    });
  }
  _spaOn(
    window,
    "languageChanged",
    function () {
      currentQuery = "";
      hidePanel();
    },
    "languageChanged"
  );

  // ─── Expose ──────────────────────────────────────────────────────────────

  window.ProductSearchEngine = {
    init: init,
    reinit: reinit,
    destroy: destroy,
    search: function (query) {
      return doSearch(query);
    },
  };
})(window);
/**
 * footer.js — Footer component (bottom nav & page footer)
 *
 * Mobile (<768px): 4 items — 首页/产品/解决方案/WhatsApp
 * Tablet (768-1279px): 6 items — 首页/产品/解决方案/制造/关于/WhatsApp
 * PC (>=1280px): Full site footer (4-column) with legal links
 *
 * ⚠️ Bottom navigation can be delegated to bottom-tab.js when
 *    SITE_CONFIG.features.unifiedBottomNav === true.
 */
(function (window) {
  "use strict";

  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _features = _cfg.features || {};

  /* ── Guard: unifiedBottomNav 开启时，bottom tab bar 由 bottom-tab.js 接管 ── */
  /* PC (>=1280px) 需要 PC footer，不受影响 */
  /* <1280px: 只渲染 compact footer（不含 bottom bar），bottom bar 由 bottom-tab.js 负责 */
  var _unifiedBottomNav = _features.unifiedBottomNav;

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (key == null) key = evt + ":" + (++_spaRegs.__k || (_spaRegs.__k = 1));
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  var resizeTimer;

  /* ─── Mobile items (4) ─── */
  var mobileItems = [
    { id: "home", icon: "home", key: "nav_home", href: "/home/", fill: true },
    { id: "products", icon: "local_cafe", key: "nav_products", href: "/products/", fill: false },
    { id: "solutions", icon: "business_center", key: "nav_solutions", href: "/solutions/", fill: false },
    { id: "whatsapp", icon: "chat", key: "nav_whatsapp", href: "", fill: false, isWhatsApp: true },
  ];

  /* ─── Tablet items (6) ─── */
  var tabletItems = [
    { id: "home", icon: "home", key: "nav_home", href: "/home/", fill: true },
    { id: "products", icon: "local_cafe", key: "nav_products", href: "/products/", fill: false },
    { id: "solutions", icon: "business_center", key: "nav_solutions", href: "/solutions/", fill: false },
    {
      id: "manufacturing",
      icon: "precision_manufacturing",
      key: "nav_manufacturing",
      href: "/manufacturing/",
      fill: false,
    },
    { id: "about", icon: "info", key: "nav_about", href: "/about/", fill: false },
    { id: "whatsapp", icon: "chat", key: "nav_whatsapp", href: "", fill: false, isWhatsApp: true },
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getItemsForVariant(variant) {
    return variant === "tablet" ? tabletItems : mobileItems;
  }

  function buildItemHtml(item, activeId) {
    var isActive = item.id === activeId;
    var colorClass = isActive ? "text-primary" : "text-slate-400 dark:text-slate-500";
    var fillStyle = isActive && item.fill ? " style=\"font-variation-settings: 'FILL' 1;\"" : "";
    var label = item.key
      ? '<p class="text-[10px] font-bold uppercase tracking-wider text-center" data-i18n="' +
        esc(item.key) +
        '">' +
        esc(item.key) +
        "</p>"
      : "";
    var waHref =
      "https://wa.me/" +
      ((window.Contacts && window.Contacts.whatsapp) || (_cfg.contacts || {}).whatsapp || "8618565718814");

    if (item.isWhatsApp) {
      return (
        '<a class="whatsapp-tab-item relative flex flex-1 flex-col items-center justify-center gap-1 text-[#25d366]" ' +
        'href="' +
        waHref +
        '" data-wa-message-key="wa_msg_contact" data-wa-source="footer-tab" ' +
        'target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">' +
        '<span class="material-symbols-outlined relative" style="font-size:26px">' +
        esc(item.icon) +
        "</span>" +
        label +
        "</a>"
      );
    }

    return (
      '<a class="relative flex flex-1 flex-col items-center justify-center gap-1 ' +
      colorClass +
      '" href="' +
      esc(item.href) +
      '">' +
      '<span class="material-symbols-outlined relative"' +
      fillStyle +
      ">" +
      esc(item.icon) +
      "</span>" +
      label +
      "</a>"
    );
  }

  function buildBarHtml(variant, activeId) {
    var items = getItemsForVariant(variant);
    var tabletClass = variant === "tablet" ? " max-w-3xl mx-auto" : "";
    var pbSafe = variant === "tablet" ? " pb-3" : " pb-6";

    var itemsHtml = items
      .map(function (item) {
        return buildItemHtml(item, activeId);
      })
      .join("\n");

    return (
      '<div class="fixed bottom-0 left-0 right-0 z-[var(--z-footer)]">' +
      '<div class="flex gap-2 border-t border-slate-200 dark:border-slate-800 ' +
      "bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4" +
      pbSafe +
      " pt-2" +
      tabletClass +
      '">' +
      itemsHtml +
      "</div></div>"
    );
  }

  /* ─── Mobile/Tablet Site Footer (compact) ─── */
  function buildMobileFooterHtml() {
    return (
      '<div class="bg-slate-900 text-white pb-20 mx-auto mt-8" style="max-width:1920px">' +
      '<div class="section-content mx-auto px-3 sm:px-5 py-4 sm:py-6">' +
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">' +
      /* Products */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 text-center" data-i18n="footer_products_title">Products</h4>' +
      '<ul class="space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/products/all/" class="hover:text-white transition-colors" data-i18n="nav_products">All Products</a></li>' +
      '<li><a href="/products/coffee/" class="hover:text-white transition-colors" data-i18n="nav_products_coffee">Coffee</a></li>' +
      '<li><a href="/products/tea/" class="hover:text-white transition-colors" data-i18n="nav_products_tea">Tea &amp; Milk Tea</a></li>' +
      '<li><a href="/products/meal/" class="hover:text-white transition-colors" data-i18n="nav_products_meal">Meal Replacement</a></li>' +
      '<li><a href="/products/beauty/" class="hover:text-white transition-colors" data-i18n="nav_products_beauty">Beauty</a></li>' +
      '<li><a href="/products/weight/" class="hover:text-white transition-colors" data-i18n="nav_products_weight">Weight Management</a></li>' +
      '<li><a href="/products/gut/" class="hover:text-white transition-colors" data-i18n="nav_products_gut">Gut Health</a></li>' +
      '<li><a href="/products/lifestyle/" class="hover:text-white transition-colors" data-i18n="nav_products_lifestyle">Lifestyle</a></li>' +
      "</ul></div>" +
      /* Solutions */
      '<div class="block text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 text-center" data-i18n="footer_solutions_title">Solutions</h4>' +
      '<ul class="space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/solutions/oem/" class="hover:text-white transition-colors" data-i18n="nav_solutions_oem">OEM</a></li>' +
      '<li><a href="/solutions/odm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_odm">ODM</a></li>' +
      '<li><a href="/solutions/obm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_obm">OBM</a></li>' +
      '<li><a href="/solutions/rd/" class="hover:text-white transition-colors" data-i18n="nav_solutions_rd">R&amp;D</a></li>' +
      '<li><a href="/solutions/packaging/" class="hover:text-white transition-colors" data-i18n="nav_solutions_packaging">Packaging</a></li>' +
      "</ul></div>" +
      /* Support (shown on md+) */
      '<div class="hidden md:block">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2" data-i18n="footer_support_title">Support</h4>' +
      '<ul class="space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/cases/" class="hover:text-white transition-colors" data-i18n="nav_cases">Case Studies</a></li>' +
      '<li><a href="/resources/catalog/" class="hover:text-white transition-colors" data-i18n="nav_resources">Resources</a></li>' +
      '<li><a href="/contact/" class="hover:text-white transition-colors" data-i18n="nav_contact">Contact</a></li>' +
      '<li><a href="/about/" class="hover:text-white transition-colors" data-i18n="nav_about">About</a></li>' +
      "</ul></div>" +
      /* Legal (shown on md+) */
      '<div class="hidden md:block">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2" data-i18n="footer_legal_title">Legal</h4>' +
      '<ul class="space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/privacy/" class="hover:text-white transition-colors" data-i18n="footer_legal_privacy_policy">Privacy Policy</a></li>' +
      '<li><a href="/terms/" class="hover:text-white transition-colors" data-i18n="footer_legal_user_agreement">User Agreement</a></li>' +
      "</ul></div>" +
      "</div>" +
      /* Legal + Copyright */
      '<div class="border-t border-white/20 pt-3 sm:pt-4 flex flex-col items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400">' +
      '<div class="flex gap-3 sm:gap-4">' +
      '<a href="/privacy/" class="hover:text-white transition-colors" data-i18n="footer_legal_privacy_policy">Privacy Policy</a>' +
      '<a href="/terms/" class="hover:text-white transition-colors" data-i18n="footer_legal_user_agreement">User Agreement</a>' +
      "</div>" +
      '<p data-i18n="footer_copyright"></p>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  /* ─── PC Footer ─── */
  function buildPCFooterHtml() {
    return (
      '<div class="bg-slate-900 text-white mx-auto mt-8" style="max-width:1920px">' +
      '<div class="section-content mx-auto px-3 sm:px-5 xl:px-10 pt-8 sm:pt-12 pb-6 sm:pb-8">' +
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">' +
      /* Products */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_products_title">Products</h4>' +
      '<ul class="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/products/all/" class="hover:text-white transition-colors" data-i18n="nav_products">All Products</a></li>' +
      '<li><a href="/products/coffee/" class="hover:text-white transition-colors" data-i18n="nav_products_coffee">Coffee Series</a></li>' +
      '<li><a href="/products/tea/" class="hover:text-white transition-colors" data-i18n="nav_products_tea">Tea &amp; Milk Tea</a></li>' +
      '<li><a href="/products/meal/" class="hover:text-white transition-colors" data-i18n="nav_products_meal">Meal Replacement</a></li>' +
      '<li><a href="/products/beauty/" class="hover:text-white transition-colors" data-i18n="nav_products_beauty">Beauty &amp; Collagen</a></li>' +
      '<li><a href="/products/weight/" class="hover:text-white transition-colors" data-i18n="nav_products_weight">Weight Management</a></li>' +
      '<li><a href="/products/gut/" class="hover:text-white transition-colors" data-i18n="nav_products_gut">Gut Health</a></li>' +
      '<li><a href="/products/lifestyle/" class="hover:text-white transition-colors" data-i18n="nav_products_lifestyle">Lifestyle</a></li>' +
      "</ul>" +
      "</div>" +
      /* Solutions */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_solutions_title">Solutions</h4>' +
      '<ul class="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/solutions/oem/" class="hover:text-white transition-colors" data-i18n="nav_solutions_oem">OEM Services</a></li>' +
      '<li><a href="/solutions/odm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_odm">ODM Services</a></li>' +
      '<li><a href="/solutions/obm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_obm">OBM Services</a></li>' +
      '<li><a href="/solutions/rd/" class="hover:text-white transition-colors" data-i18n="nav_solutions_rd">R&amp;D Capabilities</a></li>' +
      '<li><a href="/solutions/packaging/" class="hover:text-white transition-colors" data-i18n="nav_solutions_packaging">Packaging Solutions</a></li>' +
      "</ul>" +
      "</div>" +
      /* Support */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_support_title">Support</h4>' +
      '<ul class="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/cases/" class="hover:text-white transition-colors" data-i18n="nav_cases">Case Studies</a></li>' +
      '<li><a href="/resources/catalog/" class="hover:text-white transition-colors" data-i18n="nav_resources">Resources</a></li>' +
      '<li><a href="/contact/" class="hover:text-white transition-colors" data-i18n="nav_contact">Contact Us</a></li>' +
      '<li><a href="/about/" class="hover:text-white transition-colors" data-i18n="nav_about">About YuKoLi</a></li>' +
      "</ul>" +
      "</div>" +
      /* Legal */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_legal_title">Legal</h4>' +
      '<ul class="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/privacy/" class="hover:text-white transition-colors" data-i18n="footer_legal_privacy_policy">Privacy Policy</a></li>' +
      '<li><a href="/terms/" class="hover:text-white transition-colors" data-i18n="footer_legal_user_agreement">User Agreement</a></li>' +
      "</ul>" +
      "</div>" +
      "</div>" +
      '<div class="border-t border-white/20 mt-6 pt-6 text-center text-xs sm:text-sm text-slate-400">' +
      '<p data-i18n="footer_copyright"></p>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function mount() {
    var footers = document.querySelectorAll('footer[data-component="footer"]');

    // Defensive: if no footer placeholder exists, create one
    if (footers.length === 0) {
      var f = document.createElement("footer");
      f.setAttribute("data-component", "footer");
      f.setAttribute("data-active", "");
      document.body.appendChild(f);
      footers = [f];
    }

    var w = window.innerWidth;

    for (var i = 0; i < footers.length; i++) {
      var footer = footers[i];
      var _variant = footer.getAttribute("data-variant") || "mobile";
      var activeId = footer.getAttribute("data-active") || "";

      // PC (>=1280px) → render full site footer
      if (w >= 1280) {
        footer.style.display = "";
        footer.innerHTML = buildPCFooterHtml();
        continue;
      }

      // Use tablet items for 768-1279, mobile items for <768
      var resolvedVariant = w >= 768 ? "tablet" : "mobile";

      footer.style.display = "";
      // unifiedBottomNav: bottom-tab.js 接管底栏，footer.js 只渲染紧凑 footer
      if (_unifiedBottomNav) {
        footer.innerHTML = buildMobileFooterHtml();
      } else {
        footer.innerHTML = buildMobileFooterHtml() + buildBarHtml(resolvedVariant, activeId);
      }
    }

    // Fade-in animation (unifiedBottomNav 模式没有 .fixed.bottom-0 bar)
    var bar = document.querySelector(".fixed.bottom-0");
    if (bar) {
      bar.style.opacity = "0";
      bar.style.transition = "opacity 0.15s ease-out";
    }

    // Apply translations
    if (window.translationManager && typeof window.translationManager.applyTranslations === "function") {
      window.translationManager.applyTranslations();
    }

    window.requestAnimationFrame(function () {
      if (bar) bar.style.opacity = "1";
    });
  }

  /* ─── Handle bfcache (back/forward) ─── */
  _spaOn(
    window,
    "pageshow",
    function (e) {
      if (!e.persisted) return;
      var needsRemount = false;
      var footers = document.querySelectorAll('footer[data-component="footer"]');
      for (var i = 0; i < footers.length; i++) {
        if (!footers[i].querySelector || !footers[i].querySelector(".fixed.bottom-0")) {
          needsRemount = true;
          break;
        }
      }
      if (!document.querySelector(".fixed.bottom-0")) needsRemount = true;
      if (needsRemount) mount();
    },
    "footer:pageshow"
  );

  /* ─── Public API ─── */
  window.Footer = {
    mount: mount,
    updateActive: function (newActiveId) {
      newActiveId = newActiveId || "";
      var allItems = mobileItems.concat(tabletItems);
      var links = document.querySelectorAll(".fixed.bottom-0 a[href]");
      if (links.length === 0) return;

      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var href = link.getAttribute("href") || "";
        // Skip external links
        if (href.startsWith("http") || href.indexOf("wa.me") >= 0) continue;

        var matched = null;
        for (var j = 0; j < allItems.length; j++) {
          var itemHref = allItems[j].href;
          var linkHref = href;
          if (itemHref.endsWith("/")) itemHref = itemHref.slice(0, -1);
          if (linkHref.endsWith("/")) linkHref = linkHref.slice(0, -1);
          if (itemHref === linkHref) {
            matched = allItems[j];
            break;
          }
        }

        var isActive = matched && matched.id === newActiveId;
        var icon = link.querySelector(".material-symbols-outlined");

        if (isActive) {
          link.className = "flex flex-1 flex-col items-center justify-center gap-1 text-primary";
          if (icon && matched.fill) icon.setAttribute("style", "font-variation-settings: 'FILL' 1;");
        } else {
          link.className = "flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500";
          if (icon) icon.removeAttribute("style");
        }
      }
    },
  };

  /* ─── Init ─── */
  function init() {
    mount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ─── Resize handler ─── */
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(mount, 200);
  });
})(window);
/**
 * floating-actions.js — Yukoli Floating Actions Component
 *
 * 功能：
 * - 回到顶部按钮（滚动 > threshold 时显示）
 * - WhatsApp 按钮（所有设备显示，Mobile 在 Tab Bar 中也有）
 * - 定时闪烁动画：页面停止滚动 10s 后触发，滚动时取消
 * - 初次显示时触发一次闪烁动画
 *
 * 改为直接注入 DOM（不依赖占位符），SPA 导航后自动保活。
 */

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

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  /* ─────────────────────────────────────────────
   * 0. CONFIG
   * ───────────────────────────────────────────── */

  var WHATSAPP_HREF =
    "https://wa.me/" +
    ((window.Contacts && window.Contacts.whatsapp) ||
      ((window.SITE_CONFIG || {}).contacts || {}).whatsapp ||
      "8618565718814");
  var SCROLL_THRESHOLD = 300;

  // 可通过 window 覆盖
  if (window.FLOATING_ACTIONS_CONFIG) {
    if (window.FLOATING_ACTIONS_CONFIG.whatsapp) WHATSAPP_HREF = window.FLOATING_ACTIONS_CONFIG.whatsapp;
    if (window.FLOATING_ACTIONS_CONFIG.threshold) SCROLL_THRESHOLD = window.FLOATING_ACTIONS_CONFIG.threshold;
  }

  /** Build tracked WhatsApp URL via Contacts module (or fallback to static) */
  function buildWhatsAppUrl() {
    if (window.Contacts && typeof window.Contacts.contactsWhatsApp === "function") {
      return window.Contacts.contactsWhatsApp({ source: "悬浮按钮" });
    }
    return WHATSAPP_HREF;
  }

  /* ─────────────────────────────────────────────
   * 1. SVG ICONS
   * ───────────────────────────────────────────── */

  var SVG_WHATSAPP =
    '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15' +
    "-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475" +
    "-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52" +
    ".149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207" +
    "-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372" +
    "-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487" +
    ".709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413" +
    ".248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" +
    "m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648" +
    "-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898" +
    "a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" +
    "m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945" +
    "L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893" +
    'a11.821 11.821 0 00-3.48-8.413Z"></path>' +
    "</svg>";

  var SVG_BACKTOTOP =
    '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>' +
    "</svg>";

  /* ─────────────────────────────────────────────
   * 2. STYLES
   * ───────────────────────────────────────────── */

  function injectStyles() {
    /* migrated to styles.css — no-op */
  }

  /* ─────────────────────────────────────────────
   * 3. HELPERS
   * ───────────────────────────────────────────── */

  function debounce(func, wait) {
    var timeout;
    return function () {
      var ctx = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        var _cfg = window.SITE_CONFIG || window._cfg || {};
        func.apply(ctx, args);
      }, wait);
    };
  }

  /* ─────────────────────────────────────────────
   * 4. CONTROLLER
   * ───────────────────────────────────────────── */

  function FloatingActionsController() {
    this.backToTopVisible = false;
    this._pulseTimer = null;
    this._scrollIdleTimer = null;
    this._firstPulseDone = false;
    this._isScrolling = false;
    this._container = null;
    this._btnBtt = null;
    this._btnWa = null;
  }

  FloatingActionsController.prototype.init = function () {
    injectStyles();
    this._createDOM();
    this._bindButtons();
    this._bindScroll();
    this._scheduleFirstPulse();
  };

  FloatingActionsController.prototype._createDOM = function () {
    if (document.getElementById("floating-actions-container")) return;

    var container = document.createElement("div");
    container.id = "floating-actions-container";

    // WhatsApp
    var wa = document.createElement("a");
    wa.id = "fab-whatsapp";
    wa.className = "fab-btn";
    wa.href = buildWhatsAppUrl();
    wa.setAttribute("aria-label", "WhatsApp");
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    /* @audit-safe: template-func-return */
    /* @audit-safe: template-func-return */
    wa.innerHTML = SVG_WHATSAPP;

    // Back to top
    var btt = document.createElement("button");
    btt.id = "fab-backtotop";
    btt.className = "fab-btn";
    btt.setAttribute("aria-label", _t("ui_back_to_top") || "Back to top");
    /* @audit-safe: template-func-return */
    /* @audit-safe: template-func-return */
    btt.innerHTML = SVG_BACKTOTOP;

    container.appendChild(btt);
    container.appendChild(wa);

    document.body.appendChild(container);

    this._container = container;
    this._btnBtt = btt;
    this._btnWa = wa;
  };

  FloatingActionsController.prototype._bindButtons = function () {
    var _self = this;

    // Back to top click
    if (this._btnBtt) {
      this._btnBtt.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    // WhatsApp click — build tracked URL dynamically (captures current page)
    if (this._btnWa) {
      this._btnWa.addEventListener("click", function (e) {
        e.preventDefault();
        FloatingActionsController.openWhatsApp();
      });
    }
  };

  /**
   * Public API: open WhatsApp from any page CTA button.
   * Usage: <button onclick="YuKoLiFAB.openWhatsApp('source','msg_key')">
   * Falls back to opening WhatsApp directly if FAB not initialized.
   */
  FloatingActionsController.openWhatsApp = function (source, msgKey) {
    var url;
    // Use Contacts module if available (adds tracking)
    if (window.Contacts && typeof window.Contacts.contactsWhatsApp === "function") {
      url = window.Contacts.contactsWhatsApp({ source: source || "page-cta", messageKey: msgKey });
    } else {
      url = buildWhatsAppUrl();
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  FloatingActionsController.prototype._bindScroll = function () {
    var _self = this;

    var onScroll = debounce(function () {
      _self._isScrolling = true;
      _self._cancelPulse();
      _self._clearScrollIdleTimer();
      _self._updateBackToTop();

      // 停止滚动后 10s 触发闪烁
      _self._scrollIdleTimer = setTimeout(function () {
        _self._isScrolling = false;
        _self._triggerPulse();
      }, 10000);
    }, 50);

    window.addEventListener("scroll", onScroll, { passive: true });

    // 初始检查
    this._updateBackToTop();
  };

  FloatingActionsController.prototype._updateBackToTop = function () {
    var visible = window.scrollY > SCROLL_THRESHOLD;
    if (visible === this.backToTopVisible) return;
    this.backToTopVisible = visible;
    this._animateBackToTop(visible);
  };

  FloatingActionsController.prototype._animateBackToTop = function (show) {
    if (!this._btnBtt) return;

    if (show) {
      this._btnBtt.classList.add("visible");
    } else {
      this._btnBtt.classList.remove("visible");
    }
  };

  FloatingActionsController.prototype._triggerPulse = function () {
    var _self = this;
    if (!this._btnWa) return;

    function pulse(el) {
      if (!el) return;
      el.classList.remove("fab-pulsing");
      // force reflow
      void el.offsetWidth;
      el.classList.add("fab-pulsing");
      el.addEventListener("animationend", function onEnd() {
        el.removeEventListener("animationend", onEnd);
        el.classList.remove("fab-pulsing");
      });
    }

    // Only pulse WhatsApp (primary conversion entry)
    pulse(this._btnWa);

    // Repeat after 30s if not scrolling
    _self._pulseTimer = setTimeout(function () {
      if (!_self._isScrolling) _self._triggerPulse();
    }, 30000);
  };

  FloatingActionsController.prototype._cancelPulse = function () {
    clearTimeout(this._pulseTimer);
    this._pulseTimer = null;
    if (this._btnWa) this._btnWa.classList.remove("fab-pulsing");
  };

  FloatingActionsController.prototype._clearScrollIdleTimer = function () {
    clearTimeout(this._scrollIdleTimer);
    this._scrollIdleTimer = null;
  };

  // 初次显示时触发一次闪烁（延迟 2s，让页面先稳定）
  FloatingActionsController.prototype._scheduleFirstPulse = function () {
    var self = this;
    if (this._firstPulseDone) return;
    setTimeout(function () {
      self._firstPulseDone = true;
      if (!self._isScrolling) self._triggerPulse();
    }, 2000);
  };

  /* ─────────────────────────────────────────────
   * 5. SINGLETON
   * ───────────────────────────────────────────── */

  var _ctrl = null;

  function mount() {
    // Feature gate: skip if floatingWhatsApp disabled
    var _features = (window.SITE_CONFIG || window._cfg || {}).features || {};
    if (_features.floatingWhatsApp === false) return;

    // Ensure container exists (SPA navigation safety)
    if (!document.getElementById("floating-actions-container")) {
      if (!_ctrl) {
        _ctrl = new FloatingActionsController();
      }
      _ctrl.init();
    }

    // Also handle legacy placeholder-based mount
    var placeholders = document.querySelectorAll('[data-component="floating-actions"]');
    for (var i = 0; i < placeholders.length; i++) {
      var el = placeholders[i];
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }

  /* ─────────────────────────────────────────────
   * 6. BOOT
   * ───────────────────────────────────────────── */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  // SPA 导航后保活
  _spaOn(
    document,
    "spa:load",
    function () {
      mount();
    },
    "spa:load:mount"
  );

  // bfcache 恢复
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      mount();
    }
  });

  window.FloatingActions = { mount: mount, openWhatsApp: FloatingActionsController.openWhatsApp };
  window.YuKoLiFAB = { openWhatsApp: FloatingActionsController.openWhatsApp };
})(window);
/**
 * currency.js — 多币种工具模块
 *
 * 从 lang-registry 读取当前语言的币种配置，
 * 提供金额格式化和单位切换功能。
 *
 * ⚠ 不做汇率换算：数字始终以 CNY 计算，
 *    只切换显示符号和万位单位名称（万元→K→ล้าน…）。
 *
 * unit 说明（仅用于显示标签）：
 *   CNY: 万元 (10,000 CNY)
 *   USD: K (1,000 USD)
 *   THB: ล้าน (1,000,000 THB)
 *   VND: Triệu (1,000,000 VND)
 *   MYR: Juta (1,000,000 MYR)
 *   IDR: Juta (1,000,000 IDR)
 *   JPY: 万円 (10,000 JPY)
 *   KRW: 백만 (1,000,000 KRW)
 *   INR: Lakh (100,000 INR)
 *   TWD: 萬元 (10,000 TWD)
 *   SAR: K (1,000 SAR)
 */

("use strict");

(function (root) {
  "use strict";

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  // 万位单位的本地数值（该单位代表多少当地货币）
  var UNIT_VALUES = {
    万元: 10000,
    萬元: 10000,
    K: 1000,
    ล้าน: 1000000,
    Triệu: 1000000,
    Juta: 1000000,
    万円: 10000,
    백만: 1000000,
    Lakh: 100000,
    ม้น: 1000000,
    ร้อยล้าน: 100000000,
    Milhão: 1000000,
    Million: 1000000,
    "": 1,
  };

  // ── 缓存 ──
  var _cachedLang = null;
  var _cachedConfig = null;

  function _getCurrentLang() {
    if (root.translationManager && root.translationManager.currentLanguage) {
      return root.translationManager.currentLanguage;
    }
    if (root.LANGUAGE_CODE) return root.LANGUAGE_CODE;
    return "en";
  }

  /**
   * 获取当前语言的币种配置（带缓存，语言切换时自动失效）
   * @returns {{ symbol: string, code: string, rate: number, unit: string }}
   */
  function getConfig() {
    var lang = _getCurrentLang();
    if (lang === _cachedLang && _cachedConfig) return _cachedConfig;

    var reg = root.LANG_REGISTRY;
    if (!reg || !reg.LANGUAGES) {
      _cachedConfig = { symbol: "$", code: "USD", rate: 0.14, unit: "K" };
      _cachedLang = lang;
      return _cachedConfig;
    }

    var found = null;
    for (var i = 0; i < reg.LANGUAGES.length; i++) {
      if (reg.LANGUAGES[i].code === lang) {
        found = reg.LANGUAGES[i];
        break;
      }
    }

    _cachedConfig = found && found.currency ? found.currency : { symbol: "$", code: "USD", rate: 0.14, unit: "K" };
    _cachedLang = lang;
    return _cachedConfig;
  }

  /** 语言切换时清除缓存 */
  function _invalidateCache() {
    _cachedLang = null;
    _cachedConfig = null;
  }

  /**
   * 将金额转换为万位显示值（不做汇率换算，始终以 CNY 计算）
   * 数字不变，只切换单位名称和符号。
   * @param {number} cnyAmount
   * @returns {{ value: number, display: string, symbol: string, unit: string }}
   */
  function formatCurrencyWan(cnyAmount) {
    var cfg = getConfig();
    // 始终以 CNY 万元为基准，不换算汇率
    var wanValue = cnyAmount / 10000;
    var sym = cfg.label || cfg.symbol;

    var display = wanValue >= 100 ? Math.round(wanValue).toString() : wanValue.toFixed(1).replace(/\.0$/, "");

    return { value: wanValue, display: display, symbol: sym, unit: cfg.unit };
  }

  /**
   * 格式化金额（不做汇率换算，始终以 CNY 计算）
   * @param {number} cnyAmount
   * @returns {{ value: number, display: string, symbol: string }}
   */
  function formatCurrency(cnyAmount) {
    var cfg = getConfig();
    var display;
    if (cnyAmount >= 1000000) display = (cnyAmount / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    else if (cnyAmount >= 10000) display = (cnyAmount / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    else display = Math.round(cnyAmount).toString();
    return { value: cnyAmount, display: display, symbol: cfg.label || cfg.symbol };
  }

  /**
   * 获取输入框的 placeholder 和默认值（不换算汇率）
   * @param {number} cnyDefault
   * @returns {{ placeholder: string, defaultValue: number, label: string }}
   */
  function getInputConfig(cnyDefault) {
    var cfg = getConfig();
    return { placeholder: cnyDefault.toString(), defaultValue: cnyDefault, label: cfg.label || cfg.symbol };
  }

  /** identity — 不做汇率换算 */
  function toCNY(amount) {
    return amount;
  }

  // ── 语言切换时自动刷新币种相关 DOM ──
  function refreshCurrencyUI() {
    _invalidateCache();
    var cfg = getConfig();
    var sym = cfg.label || cfg.symbol; // label 用于区分同符号币种（JP¥ vs ¥）

    // 1) 更新 [data-currency-symbol] 元素（输入框前缀 ¥ → $ 等）
    document.querySelectorAll("[data-currency-symbol]").forEach(function (el) {
      el.textContent = sym;
    });

    // 2) 更新 [data-currency-unit] 元素（万元/年 → K/yr 等）
    document.querySelectorAll("[data-currency-unit]").forEach(function (el) {
      var t = el.textContent.trim();
      // 匹配 "10K RMB/year"、"万元/年"、"K/yr" 等格式
      var m = t.match(
        /^(\d*[\.]?\d*)\s*(万元|萬元|K|M|Lakh|ล้าน|Triệu|Juta|万円|백만| mille|tys\.|mln)?\s*(RMB|USD|CNY|THB|VND|MYR|IDR|JPY|KRW|INR|TWD|SAR|EUR|BRL|RUB|PLN|GBP|ILS|TRY|KHR|LAK|MMK|PHP|SGD)?\s*\/\s*(year|yr|年)$/i
      );
      if (m) {
        var num = m[1] || "";
        el.textContent = (num ? num + " " : "") + cfg.unit + "/yr";
      } else {
        el.textContent = cfg.unit + "/yr";
      }
    });

    // 2b) 更新 [data-currency-label] 元素，替换括号内的币种文字/符号
    document.querySelectorAll("[data-currency-label]").forEach(function (el) {
      el.textContent = el.textContent
        .replace(
          /[(（]\s*(RMB|USD|CNY|THB|VND|MYR|IDR|JPY|KRW|INR|TWD|SAR|EUR|BRL|RUB|PLN|GBP|ILS|TRY|KHR|LAK|MMK|PHP|SGD|人民币|新台幣|新台币|新加坡元|泰铢|越南盾|令吉|卢比|韩元|日元|沙特里亚尔|欧元|英镑|卢布|兹罗提|雷亚尔|谢克尔|里拉|瑞尔|基普|缅元|比索|新元|[¥$₹฿₫₩₤€£₺₽₾zł₭៛]+)\s*[)）]/g,
          function (match) {
            return match.indexOf("（") === 0 ? "（" + sym + "）" : "(" + sym + ")";
          }
        )
        .replace(/\s+RMB\s*/g, " " + cfg.code + " ")
        .replace(/\s+人民币\s*/g, " " + cfg.code + " ")
        .replace(/\s+新台幣?\s*/g, " " + cfg.code + " ");
    });

    // 3) ROI / deploy 输入框不改动数值 — ROI 是比率，与币种无关
    //    切换语言只更新标签符号，用户可手动调整数值
  }

  // ── 监听语言切换事件 ──
  // languageChanged: 开始切换，用于清除缓存
  // ── 监听 i18n 事件 ──
  // currency.js 是 defer 且排在 translations.js 之后，
  // 加载时 translationManager 已存在，直接注册事件即可
  if (root.addEventListener) {
    _spaOn(
      root,
      "languageChanged",
      function () {
        _invalidateCache();
      },
      "languageChanged:cache"
    );
    if (root.translationManager && root.translationManager.on) {
      // 首次翻译可能已完成，立即补刷新一次
      if (root.translationManager.isInitialized) {
        requestAnimationFrame(function () {
          refreshCurrencyUI();
        });
      }
      root.translationManager.on("translationsApplied", function () {
        // applyTranslations 内部用 requestAnimationFrame 替换 DOM，
        // 等下一帧再刷新币种标签
        requestAnimationFrame(function () {
          refreshCurrencyUI();
        });
      });
    }
  }

  // ── SPA 导航后重新翻译+刷新币种 ──
  _spaOn(
    document,
    "spa:load",
    function () {
      if (root.translationManager && root.translationManager.isInitialized) {
        root.translationManager
          .applyTranslations()
          .then(function () {
            requestAnimationFrame(function () {
              refreshCurrencyUI();
            });
          })
          .catch(function () {
            setTimeout(refreshCurrencyUI, 300);
          });
      } else {
        setTimeout(refreshCurrencyUI, 300);
      }
    },
    "spa:load:currencyRefresh"
  );

  // ── Export ──
  var Currency = {
    getConfig: getConfig,
    formatCurrencyWan: formatCurrencyWan,
    formatCurrency: formatCurrency,
    getInputConfig: getInputConfig,
    toCNY: toCNY,
    refreshCurrencyUI: refreshCurrencyUI,
    UNIT_VALUES: UNIT_VALUES,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Currency;
  }
  root.Currency = Currency;
})(typeof window !== "undefined" ? window : this);
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
      result.currentLabel = info.label;
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
      result.currentLabel = APP_SLUGS[appSlug].label;
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
      result.currentLabel = SUPPORT_SLUGS[supSlug].label;
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
      '<button onclick="window.Breadcrumb.goBack()" class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-400 transition-all flex-shrink-0" aria-label="' +
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
/**
 * trust-bar.js — Fixed Top Trust Bar
 * Credibility strip above navigator: FDA, HACCP, 4 factories, capacity, MOQ, global shipping
 *
 * Responsive strategy:
 *   PC (≥1024px): static, 5 items spread evenly across full width
 *   Tablet (768px—1023px): scrolling ticker (same as mobile)
 *   Mobile (<768px): scrolling ticker, single-pass (no content duplication)
 *
 * CSS 已迁移至 performance-optimizations.css (SSG 内联，消除 CLS)
 * z-index: 950 (below header/slide-menu, above other content)
 *
 * ES5 compatible. No external dependencies.
 * @audit-safe — static HTML strings, no user input
 */

(function () {
  "use strict";

  var ITEM_KEYS = [
    { key: "trust_fda", label: "FDA Registered &amp; HACCP Certified" },
    { key: "trust_factories", label: "4 Owned Factories" },
    { key: "trust_capacity", label: "100,000+ Daily Capacity" },
    { key: "trust_moq", label: "Low MOQ: 500 Units" },
    { key: "trust_shipping", label: "Global Shipping to 30+ Countries" },
  ];

  function buildHTML() {
    var itemsHtml = "";
    for (var i = 0; i < ITEM_KEYS.length; i++) {
      itemsHtml +=
        '<span class="trust-bar__item">' +
        '<span class="trust-bar__dot">●</span>' +
        '<span data-i18n="' +
        ITEM_KEYS[i].key +
        '">' +
        ITEM_KEYS[i].label +
        "</span>" +
        "</span>";
    }

    // Duplicate content for seamless infinite scroll
    var trackHtml = itemsHtml + itemsHtml;

    return (
      '<div id="trust-bar" class="trust-bar" role="banner" aria-label="Trust indicators">' +
      '<div class="trust-bar__inner">' +
      '<div class="trust-bar__track">' +
      trackHtml +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function inject() {
    if (document.getElementById("trust-bar")) return;

    var bar = document.createElement("div");
    bar.innerHTML = buildHTML();
    var trustEl = bar.firstElementChild;

    function doInject() {
      var header = document.getElementById("main-header") || document.getElementById("mobile-header");
      if (header) {
        header.insertBefore(trustEl, header.firstChild);
      } else {
        document.body.insertBefore(trustEl, document.body.firstChild);
      }
    }

    var header = document.getElementById("main-header") || document.getElementById("mobile-header");
    if (header && header.children.length > 0) {
      doInject();
    } else {
      var checkTimer = setInterval(function () {
        var h = document.getElementById("main-header") || document.getElementById("mobile-header");
        if (h && h.children.length > 0) {
          clearInterval(checkTimer);
          doInject();
        }
      }, 50);
      setTimeout(function () {
        clearInterval(checkTimer);
        doInject();
      }, 5000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
/**
 * bottom-tab.js — Unified Bottom Navigation Bar
 *
 * Config-driven: reads items from window.SITE_CONFIG.footer.mobileItems / tabletItems
 * Breakpoints:
 *   Mobile (<768px)  → footer.mobileItems
 *   Tablet (768–1023) → footer.tabletItems (falls back to mobileItems if absent)
 *   PC     (≥1280px) → hidden
 *
 * Item type support:
 *   "toggle"   → open slide-menu (via window.SlideMenu.toggle)
 *   "link"     → SPA navigate (window.__spaNavigate) or location.href
 *   "cta"      → highlighted green CTA button (navigates like "link")
 *   "external" → window.open() in new tab (WhatsApp number from config)
 *
 * Feature gate:  window.SITE_CONFIG.features.unifiedBottomNav === true
 * Brand colors:  window.SITE_CONFIG.theme.colors.primary / primaryHover
 * WhatsApp:      window.SITE_CONFIG.contacts.whatsapp / whatsappDefaultMsg
 *
 * ES5 compatible.  No JSX, no ES6 features.
 * @audit-safe — all content from config, no user-input injection
 */
(function () {
  "use strict";

  /* ── Config access (lazy) ──────────────────────────────────── */
  var _cfg, _features, _footer, _colors, _contacts;

  function getCfg() {
    return _cfg || (_cfg = window.SITE_CONFIG || {});
  }
  function getFeatures() {
    return _features || (_features = getCfg().features || {});
  }
  function getFooter() {
    return _footer || (_footer = getCfg().footer || {});
  }
  function getColors() {
    return _colors || (_colors = (getCfg().theme && getCfg().theme.colors) || {});
  }
  function getContacts() {
    return _contacts || (_contacts = getCfg().contacts || {});
  }

  /* ── Feature gate ──────────────────────────────────────────── */
  if (!getFeatures().unifiedBottomNav) return;

  /* ── Design tokens ─────────────────────────────────────────── */
  var PRIMARY = getColors().primary || "#2E7D32";
  var PRIMARY_HOVER = getColors().primaryHover || "#1B5E20";
  var WA_COLOR = "#25D366";
  var BAR_HEIGHT = 64;

  /* ── Breakpoint helpers ────────────────────────────────────── */
  function getBreakpoint() {
    var w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1280) return "tablet";
    return "pc";
  }

  /**
   * Return the item array for the current breakpoint.
   * @returns {Array|null} null → PC / no items
   */
  function getItems() {
    var bp = getBreakpoint();
    if (bp === "pc") return null;
    var footer = getFooter();
    if (bp === "tablet" && footer.tabletItems && footer.tabletItems.length > 0) {
      return footer.tabletItems;
    }
    return footer.mobileItems || [];
  }

  /* ── Item helpers ──────────────────────────────────────────── */

  /**
   * Resolve item type: explicit "type" field wins, otherwise infer.
   */
  function resolveType(item) {
    if (item.type) return item.type;
    // Infer from clues
    if (item.id === "menu" || item.id === "hamburger") return "toggle";
    if (item.href && item.href.indexOf("wa.me") >= 0) return "external";
    if (item.id === "whatsapp") return "external";
    if (item.highlight) return "cta"; // legacy support
    return "link";
  }

  /**
   * Localize a label that may be a plain string or { en, zh-CN… } object.
   */
  function localize(label) {
    if (typeof label === "string") return label;
    if (!label || typeof label !== "object") return "";
    var lang = (getCfg().lang || document.documentElement.lang || "en").toLowerCase();
    if (label[lang]) return label[lang];
    if (label.en) return label.en;
    if (label["zh-CN"]) return label["zh-CN"];
    var keys = Object.keys(label);
    return keys.length > 0 ? label[keys[0]] || "" : "";
  }

  /* ── Icon HTML ─────────────────────────────────────────────── */
  function iconHTML(name) {
    return '<span class="material-symbols-outlined" aria-hidden="true">' + (name || "circle") + "</span>";
  }

  /**
   * Build WhatsApp href from config — ensures correct number + message.
   */
  function buildWhatsAppHref() {
    var c = getContacts();
    var num = c.whatsapp || "";
    var msg = c.whatsappMessage || c.whatsappDefaultMsg || "";
    var href = "https://wa.me/" + num;
    if (msg) href += "?text=" + encodeURIComponent(msg);
    return href;
  }

  /* ── Build bar HTML ────────────────────────────────────────── */
  function buildHTML() {
    var items = getItems();
    if (!items || !items.length) return "";

    var parts = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var type = resolveType(item);
      var label = localize(item.label);
      var icon = iconHTML(item.icon);
      var href = item.href || "#";

      // CSS classes per type
      var cls = "btab-item";
      if (type === "cta") cls += " btab-item--cta";
      if (type === "external") cls += " btab-item--wa";

      var attrs = ' data-btab-type="' + type + '"';
      if (href !== "#") attrs += ' data-btab-href="' + href + '"';
      attrs += ' data-btab-id="' + (item.id || "") + '"';

      parts.push(
        '<button class="' +
          cls +
          '"' +
          attrs +
          ' aria-label="' +
          label +
          '">' +
          icon +
          '<span class="btab-label">' +
          label +
          "</span>" +
          "</button>"
      );
    }

    return (
      '<nav id="bottom-tab-bar" class="btab-bar" role="navigation" aria-label="Bottom navigation">' +
      parts.join("") +
      "</nav>"
    );
  }

  /* ── Click router ──────────────────────────────────────────── */
  function handleClick(e) {
    /** @type {HTMLElement|null} */
    var btn = e.target.closest ? e.target.closest(".btab-item") : null;
    if (!btn) return;

    var type = btn.getAttribute("data-btab-type");
    var href = btn.getAttribute("data-btab-href");

    switch (type) {
      case "toggle":
        e.preventDefault();
        if (window.SlideMenu) {
          var menuPanel = document.getElementById("mobile-menu-panel");
          if (menuPanel) {
            window.SlideMenu.close();
          } else {
            window.SlideMenu.open();
          }
        } else {
          var toggle = document.getElementById("mobile-menu-toggle");
          if (toggle) toggle.click();
        }
        break;

      case "link":
      case "cta":
        if (href && href !== "#") {
          e.preventDefault();
          if (window.__spaNavigate) {
            window.__spaNavigate(href);
          } else {
            window.location.href = href;
          }
        }
        break;

      case "external":
        e.preventDefault();
        var extHref = href;
        // Always rebuild WhatsApp URL from config to ensure correct number
        if (!extHref || extHref === "#" || extHref.indexOf("wa.me") >= 0) {
          extHref = buildWhatsAppHref();
        }
        window.open(extHref, "_blank", "noopener");
        break;

      default:
        break;
    }
  }

  /* ── Styles (minimal — most visual via CSS-injected classes) ─ */
  function injectStyles() {
    // CSS moved to styles.css
  }

  /* ── Inject into DOM ───────────────────────────────────────── */
  function inject() {
    if (document.getElementById("bottom-tab-bar")) return;

    var bp = getBreakpoint();
    if (bp === "pc") return;

    injectStyles();

    var html = buildHTML();
    if (!html) return;

    var wrapper = document.createElement("div");
    /* @audit-safe: config-driven html */
    wrapper.innerHTML = html;
    var bar = wrapper.firstElementChild;
    if (!bar) return;

    document.body.appendChild(bar);
    bar.addEventListener("click", handleClick);

    // Active state management
    updateActiveState();
    window.addEventListener("popstate", updateActiveState);
    document.addEventListener("spa:navigate", updateActiveState);
    document.addEventListener("spa:load", updateActiveState);

    // Resize: hide on PC, re-show on mobile/tablet
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var existing = document.getElementById("bottom-tab-bar");
        var bp2 = getBreakpoint();
        if (bp2 === "pc") {
          if (existing) existing.remove();
        } else if (!existing) {
          inject();
        }
      }, 250);
    });
  }

  /* ── Active state ──────────────────────────────────────── */

  /**
   * Match current URL to a bottom-tab item and highlight it.
   * - Home item: exact /home/ match
   * - Link items: path starts with item href
   * - External/toggle items: never active
   */
  function updateActiveState() {
    var bar = document.getElementById("bottom-tab-bar");
    if (!bar) return;
    var items = bar.querySelectorAll(".btab-item");
    var path = (location.pathname || "").replace(/\/$/, "");

    for (var i = 0; i < items.length; i++) {
      var btn = items[i];
      var type = btn.getAttribute("data-btab-type");
      var href = btn.getAttribute("data-btab-href") || "";
      var itemPath = href.replace(/\/$/, "");

      // External/toggle never active
      if (type === "external" || type === "toggle") {
        btn.classList.remove("btab-item--active");
        continue;
      }

      var isActive = false;

      if (type === "link" || type === "cta") {
        // Home item: only match when on exact /home/ or root /
        if (itemPath === "/home") {
          isActive = path === "" || path === "/home";
        } else {
          // Other items: prefix match (e.g. /products matches /products/coffee/)
          isActive = itemPath.length > 0 && path.indexOf(itemPath) === 0;
        }
      }

      if (isActive) {
        btn.classList.add("btab-item--active");
      } else {
        btn.classList.remove("btab-item--active");
      }
    }
  }

  /* ── Public API ───────────────────────────────────────────── */
  window.BottomTab = {
    updateActive: updateActiveState,
    inject: inject,
  };

  /* ── Bootstrap ─────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
