function _t(k){if(typeof window!=='undefined'&&window.translationManager&&typeof window.translationManager.translate==='function'){var r=window.translationManager.translate(k);return r&&r!==k?r:k}return k}
/**
 * home-core-products.js — Dynamic Home Core Products renderer
 *
 * 纯本地加载，无 API 依赖:
 * 数据源: window.PRODUCT_DATA_TABLE (内联在 product-data-table.js)
 * 缓存: sessionStorage (会话级)
 *
 * 不再依赖: /api/public/products-data
 * 移除: _fetchFromNetwork, _refreshInBackground, _loadCachedFallback
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

  var CACHE_KEY = "home_core_products";
  var CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get primary image from product data
   */
  function getPrimaryImage(product) {
    if (!product.images || !product.images.length) return null;
    var primary = product.images.find(function (img) {
      return img.isPrimary;
    });
    return primary ? primary.filePath : product.images[0].filePath;
  }

  /**
   * Build a product link href
   */
  function getProductHref(product) {
    if (product.category) {
      return "/products/?category=" + encodeURIComponent(product.category);
    }
    return "/products/";
  }

  /**
   * Get product detail link (to specific product)
   */
  function getProductDetailHref(product) {
    var cat = product.category || "all";
    return "/products/" + encodeURIComponent(cat) + "/" + encodeURIComponent(product.model) + "/";
  }

  /**
   * Load home core products — 纯本地加载
   * @param {Function} callback - called with (products, source)
   */
  function loadCoreProducts(callback) {
    var now = Date.now();

    // Layer 1: sessionStorage (session-level cache)
    try {
      var sessionData = sessionStorage.getItem(CACHE_KEY);
      if (sessionData) {
        var parsed = JSON.parse(sessionData);
        if (parsed.timestamp && now - parsed.timestamp < CACHE_TTL) {
          setTimeout(function () {
            callback(parsed.data, "session");
          }, 0);
          return;
        }
      }
    } catch (e) {}

    // Layer 2: 从内联的 PRODUCT_DATA_TABLE 加载
    if (Array.isArray(window.PRODUCT_DATA_TABLE) && window.PRODUCT_DATA_TABLE.length > 0) {
      var data = window.PRODUCT_DATA_TABLE;
      // Select featured/home-core products: top 6 from diverse categories
      var cats = {};
      var coreProducts = [];
      for (var i = 0; i < data.length && coreProducts.length < 6; i++) {
        var p = data[i];
        if (!cats[p.category]) {
          cats[p.category] = true;
          coreProducts.push(p);
        }
      }
      _saveCache(coreProducts);
      setTimeout(function () { callback(coreProducts, "local"); }, 0);
    } else {
      var container = document.querySelector('[id^="home-core-products"]');
      if (container) {
        /* @audit-safe: constant-html */
        container.innerHTML = '<div class="text-center text-slate-400 py-8"><span data-i18n="home_no_core_products">暂无核心产品</span></div>';
      }
      setTimeout(function () { callback([], "local"); }, 0);
    }
  }

  /**
   * Save to sessionStorage
   */
  function _saveCache(products) {
    var entry = { timestamp: Date.now(), data: products };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch (e) {}
  }

  /**
   * ─── Renderers for each device type ───────────────────────
   */

  /**
   * PC: 4-column grid with full product cards
   */
  window.renderHomeCorePC = function (containerId) {
    var container = document.getElementById(containerId);
    if (!container) {
      return;
    }


    loadCoreProducts(function (products) {
      if (!products || !products.length) {
        /* @audit-safe: constant-html */
        container.innerHTML = '<div class="text-center text-slate-400 py-8"><span data-i18n="home_no_core_products">暂无核心产品</span></div>';
        return;
      }

      var html = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">';

      var gradients = [
        "from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/30",
        "from-emerald-100 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20",
        "from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20",
        "from-rose-100 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/20",
        "from-violet-100 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/20",
        "from-cyan-100 to-sky-50 dark:from-cyan-900/30 dark:to-sky-900/20",
      ];

      for (var i = 0; i < Math.min(products.length, 6); i++) {
        var p = products[i];
        var img = p.image || "/assets/images/products/coffee/001.webp";
        var catLabel = p.category || "";
        var grad = gradients[i % gradients.length];
        html +=
          '<a href="' +
          getProductHref(p) +
          '" class="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700">' +
          '<div class="h-48 bg-gradient-to-br ' +
          grad +
          ' relative overflow-hidden">' +
          '<img loading="lazy" alt="' +
          (p.name || p.model || "Product") +
          '" class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" src="' +
          img +
          '" onerror="this.style.display=\'none\'">' +
          '</div><div class="p-5"><div class="text-xs text-primary font-bold mb-1 uppercase tracking-wider">' +
          catLabel +
          '</div><h3 class="font-bold text-sm leading-snug mb-2 line-clamp-2">' +
          (p.name || p.model || "") +
          '</h3><span class="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">' + (_t("cta_learn_more") || "Learn More") + '<span class="material-symbols-outlined text-sm">arrow_forward</span></span></div></a>';
      }
      html += "</div>";

      /* @audit-safe: config-driven-render */
      container.innerHTML = html;
    });
  };

  /**
   * Tablet: 3-column grid with simplified cards
   */
  window.renderHomeCoreTablet = function (containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    loadCoreProducts(function (products) {
      if (!products || !products.length) {
        /* @audit-safe: constant-html */
        container.innerHTML = '<div class="text-center text-slate-400 py-8"><span data-i18n="home_no_core_products">暂无核心产品</span></div>';
        return;
      }

      var html = '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">';
      var gradients = [
        "from-primary/10 to-blue-100",
        "from-emerald-100 to-teal-50",
        "from-amber-100 to-orange-50",
        "from-rose-100 to-pink-50",
        "from-violet-100 to-purple-50",
        "from-cyan-100 to-sky-50",
      ];

      for (var i = 0; i < Math.min(products.length, 6); i++) {
        var p = products[i];
        var img = p.image || "/assets/images/products/coffee/001.webp";
        var grad = gradients[i % gradients.length];
        html +=
          '<a href="' +
          getProductHref(p) +
          '" class="group block bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow border border-slate-100 dark:border-slate-700">' +
          '<div class="h-40 bg-gradient-to-br ' +
          grad +
          ' relative overflow-hidden">' +
          '<img loading="lazy" alt="' +
          (p.name || p.model || "") +
          '" class="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" src="' +
          img +
          '" onerror="this.style.display=\'none\'">' +
          '</div><div class="p-4"><h3 class="font-bold text-sm mb-1 line-clamp-2">' +
          (p.name || p.model || "") +
          '</h3><span class="text-xs text-primary font-bold">' + (_t("cta_learn_more") || "Learn More") + ' →</span></div></a>';
      }
      html += "</div>";
      /* @audit-safe: config-driven-render */
      container.innerHTML = html;
    });
  };

  /**
   * Mobile: horizontal scroll with compact cards
   */
  window.renderHomeCoreMobile = function (containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    loadCoreProducts(function (products) {
      if (!products || !products.length) {
        /* @audit-safe: constant-html */
        container.innerHTML = '<div class="text-center text-slate-400 py-4"><span data-i18n="home_no_core_products">暂无核心产品</span></div>';
        return;
      }

      var html = '<div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">';
      var gradients = [
        "from-primary/10 to-blue-100",
        "from-emerald-100 to-teal-50",
        "from-amber-100 to-orange-50",
        "from-rose-100 to-pink-50",
        "from-violet-100 to-purple-50",
        "from-cyan-100 to-sky-50",
      ];

      for (var i = 0; i < Math.min(products.length, 6); i++) {
        var p = products[i];
        var img = p.image || "/assets/images/products/coffee/001.webp";
        var grad = gradients[i % gradients.length];
        html +=
          '<a href="' +
          getProductHref(p) +
          '" class="snap-start flex-shrink-0 w-48 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow border border-slate-100 dark:border-slate-700">' +
          '<div class="h-32 bg-gradient-to-br ' +
          grad +
          ' relative overflow-hidden">' +
          '<img loading="lazy" alt="' +
          (p.name || p.model || "") +
          '" class="w-full h-full object-contain p-2" src="' +
          img +
          '" onerror="this.style.display=\'none\'">' +
          '</div><div class="p-3"><h3 class="font-bold text-xs mb-1 line-clamp-2">' +
          (p.name || p.model || "") +
          '</h3><span class="text-xs text-primary font-bold">→</span></div></a>';
      }
      html += "</div>";
      /* @audit-safe: config-driven-render */
      container.innerHTML = html;
    });
  };

  /**
   * SPA re-render on navigation
   * Remove old event listeners for each container and add new ones
   */
  _spaOn(document, "spa:load", function () {
    var pc = document.getElementById("home-core-products-pc");
    var tab = document.getElementById("home-core-products-tablet");
    var mob = document.getElementById("home-core-products-mobile");

    if (pc && pc.dataset.rendered !== "1") {
      window.renderHomeCorePC("home-core-products-pc");
      pc.dataset.rendered = "1";
    }
    if (tab && tab.dataset.rendered !== "1") {
      window.renderHomeCoreTablet("home-core-products-tablet");
      tab.dataset.rendered = "1";
    }
    if (mob && mob.dataset.rendered !== "1") {
      window.renderHomeCoreMobile("home-core-products-mobile");
      mob.dataset.rendered = "1";
    }
  }, "spa-home-core-products");

  // Allow manual re-render
  window.refreshHomeCoreProducts = function () {
    ;["home-core-products-pc", "home-core-products-tablet", "home-core-products-mobile"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.dataset.rendered = "0";
    });
    _spaOn.fire("spa:load");
  };
})();
