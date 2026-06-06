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

  /**
   * Generate srcset attribute for product .webp images.
   * Converts '/assets/images/products/xxx/001.webp' to:
   *   '/assets/images/products/xxx/001-375w.webp 375w, .../001-828w.webp 828w'
   * Returns empty string for non-webp images.
   */
  function _makeSrcset(imgSrc) {
    if (!imgSrc || !imgSrc.match(/\.webp$/)) return "";
    var base = imgSrc.replace(/\.webp$/, "");
    return base + "-375w.webp 375w, " + base + "-828w.webp 828w";
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
          p.name,
          displayName,
          p.model,
          displayCategory,
          p.category,
          p.brand,
          displayDescription,
          p.description,
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
              ? '<img src="' +
                esc(item.image) +
                '" alt="" srcset="' +
                _makeSrcset(item.image) +
                '" sizes="(max-width: 767px) 375px, 828px" loading="lazy" decoding="async">'
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
              ? '<img src="' +
                esc(imgSrc) +
                '" alt="" srcset="' +
                _makeSrcset(imgSrc) +
                '" sizes="(max-width: 767px) 375px, 828px" loading="lazy" decoding="async">'
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
      '<a class="ios-search-view-all" href="/products/all/" data-no-swup>' +
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
      items[j].addEventListener("click", function () {
        hidePanel();
      });
    }

    // View all link
    var viewAllLink = panel.querySelector(".ios-search-view-all");
    if (viewAllLink) {
      viewAllLink.addEventListener("click", function (e) {
        e.preventDefault();
        hidePanel();
        window.location.href = "/products/all/";
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
              window.location.href = "/products/";
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
