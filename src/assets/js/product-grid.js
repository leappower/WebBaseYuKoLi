/**
 * ProductGrid — renders product cards and manages category tabs
 * Supports PC / tablet / mobile layouts via CSS classes
 * Includes product compare integration (cross-page via localStorage)
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

  var STORE_KEY = "PRODUCT_DATA_TABLE";
  var COMPARE_KEY = "YUKOLI_COMPARE_ITEMS";
  var MAX_COMPARE = 3;

  // ─── Compare helpers ───────────────────────────────────────────

  function getCompareItems() {
    try {
      var data = localStorage.getItem(COMPARE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCompareItems(items) {
    try {
      if (items.length === 0) {
        localStorage.removeItem(COMPARE_KEY);
      } else {
        localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
      }
    } catch (e) {}
  }

  function isProductCompared(model) {
    return getCompareItems().some(function (item) {
      return item.model === model;
    });
  }

  function toggleCompareFromCard(model) {
    var products = getAllProducts();
    var product = products.find(function (p) {
      return p.model === model;
    });
    if (!product) return;
    var items = getCompareItems();
    var idx = items.findIndex(function (s) {
      return s.model === model;
    });
    if (idx >= 0) {
      items.splice(idx, 1);
    } else {
      if (items.length >= MAX_COMPARE) {
        showToast("最多只能选择 " + MAX_COMPARE + " 款产品进行对比");
        return;
      }
      items.push(product);
    }
    saveCompareItems(items);
    updateCompareButtons();
    updateFloatingBar();
  }

  function clearCompareItems() {
    saveCompareItems([]);
    updateCompareButtons();
    updateFloatingBar();
  }

  function removeCompareItem(model) {
    var items = getCompareItems().filter(function (s) {
      return s.model !== model;
    });
    saveCompareItems(items);
    updateCompareButtons();
    updateFloatingBar();
  }

  // ─── Compare button state sync ─────────────────────────────────

  function updateCompareButtons() {
    var items = getCompareItems();
    document.querySelectorAll(".compare-btn[data-model]").forEach(function (btn) {
      var model = btn.dataset.model;
      var isSelected = items.some(function (s) {
        return s.model === model;
      });
      btn.classList.toggle("compare-btn-active", isSelected);
      // Update visual
      var icon = btn.querySelector(".compare-icon");
      var article = btn.closest("article") || btn.closest(".product-card-mobile");
      if (isSelected) {
        if (icon) icon.textContent = "check";
        if (article) article.classList.add("compare-selected");
        btn.classList.add("bg-primary", "text-white", "border-primary");
        btn.classList.remove(
          "bg-slate-100",
          "dark:bg-slate-700",
          "text-slate-500",
          "border-slate-200",
          "dark:border-slate-600"
        );
      } else {
        if (icon) icon.textContent = "compare_arrows";
        if (article) article.classList.remove("compare-selected");
        btn.classList.remove("bg-primary", "text-white", "border-primary");
        btn.classList.add(
          "bg-slate-100",
          "dark:bg-slate-700",
          "text-slate-500",
          "border-slate-200",
          "dark:border-slate-600"
        );
      }
    });
  }

  // ─── Toast ─────────────────────────────────────────────────────

  function showToast(msg) {
    var toast = document.createElement("div");
    toast.className =
      "compare-toast fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-xl z-[200] text-sm font-medium transition-all duration-300";
    toast.style.cssText = "opacity:0;transform:translate(-50%,-10px)";
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translate(-50%,0)";
    });
    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%,-10px)";
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 2000);
  }

  // ─── Floating Compare Bar ──────────────────────────────────────

  var floatingBarId = "compare-floating-bar";

  function injectFloatingBarStyles() {
    if (document.getElementById("compare-bar-styles")) return;
    var style = document.createElement("style");
    style.id = "compare-bar-styles";
    style.textContent =
      "#compare-floating-bar { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease; transform: translateY(100%); opacity: 0; pointer-events: none; }" +
      "#compare-floating-bar.visible { transform: translateY(0); opacity: 1; pointer-events: auto; }" +
      ".compare-selected { box-shadow: 0 0 0 2px rgba(236,91,19,0.5); }" +
      ".compare-btn { transition: all 0.2s ease; }" +
      ".compare-btn:hover { opacity: 0.85; }" +
      ".compare-btn-mobile { position: absolute; top: 8px; right: 8px; z-index: 10; }" +
      "@media (max-width: 767px) { body { padding-bottom: 70px; } }";
    document.head.appendChild(style);
  }

  function getDeviceType() {
    var w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1280) return "tablet";
    return "pc";
  }

  function updateFloatingBar() {
    var bar = document.getElementById(floatingBarId);
    if (!bar) return;
    var items = getCompareItems();
    if (items.length === 0) {
      bar.classList.remove("visible");
      return;
    }
    bar.classList.add("visible");
    var device = getDeviceType();
    var container = bar.querySelector(".compare-bar-inner");
    if (!container) return;

    if (device === "tablet") {
      /* @audit-safe: template-func-return */
      /* @audit-safe: template-func-return */
      container.innerHTML = renderTabletBar(items);
    } else if (device === "mobile") {
      /* @audit-safe: template-func-return */
      /* @audit-safe: template-func-return */
      container.innerHTML = renderMobileBar(items);
    } else {
      /* @audit-safe: template-func-return */
      /* @audit-safe: template-func-return */
      container.innerHTML = renderDesktopBar(items);
    }
    bindFloatingBarEvents(container);
  }

  function renderMobileBar(items) {
    var thumbs = items
      .map(function (p) {
        return (
          '<div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1.5 flex-shrink-0">' +
          '<img src="' +
          esc(p._imageUrl) +
          '" class="w-6 h-6 rounded object-cover" onerror="this.src=\'/assets/images/products/default.webp\'">' +
          '<span class="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[56px]">' +
          esc(p.name || p.model) +
          "</span>" +
          '<button class="float-remove flex-shrink-0 text-slate-400 hover:text-red-500" data-model="' +
          esc(p.model) +
          '"><span class="material-symbols-outlined text-sm">close</span></button>' +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="flex items-center gap-2 w-full">' +
      '<div class="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide py-1">' +
      thumbs +
      "</div>" +
      '<div class="flex items-center gap-1.5 flex-shrink-0">' +
      '<button class="float-clear px-3 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">清空</button>' +
      '<a href="/products/compare/" class="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">对比(' +
      items.length +
      ")</a>" +
      "</div>" +
      "</div>"
    );
  }

  function renderTabletBar(items) {
    var thumbs = items
      .map(function (p) {
        return (
          '<div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1.5 flex-shrink-0">' +
          '<img src="' +
          esc(p._imageUrl) +
          '" class="w-7 h-7 rounded object-cover" onerror="this.src=\'/assets/images/products/default.webp\'">' +
          '<span class="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[80px]">' +
          esc(p.name || p.model) +
          "</span>" +
          '<button class="float-remove flex-shrink-0 text-slate-400 hover:text-red-500" data-model="' +
          esc(p.model) +
          '"><span class="material-symbols-outlined text-sm">close</span></button>' +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="flex flex-col gap-2 w-full">' +
      '<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">' +
      thumbs +
      "</div>" +
      '<div class="flex items-center justify-end gap-2">' +
      '<button class="float-clear px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">清空</button>' +
      '<a href="/products/compare/" class="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">对比(' +
      items.length +
      ")</a>" +
      "</div>" +
      "</div>"
    );
  }

  function renderDesktopBar(items) {
    var thumbs = items
      .map(function (p) {
        return (
          '<div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2 flex-shrink-0">' +
          '<img src="' +
          esc(p._imageUrl) +
          '" class="w-8 h-8 rounded-lg object-cover" onerror="this.src=\'/assets/images/products/default.webp\'">' +
          '<div class="min-w-0"><p class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">' +
          esc(p.name || p.model) +
          "</p></div>" +
          '<button class="float-remove flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors" data-model="' +
          esc(p.model) +
          '"><span class="material-symbols-outlined text-base">close</span></button>' +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="flex items-center gap-3 flex-wrap sm:flex-nowrap">' +
      '<div class="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">' +
      '<span class="material-symbols-outlined text-primary">compare_arrows</span>' +
      '<span>已选 <span class="text-primary">' +
      items.length +
      "</span>/3</span>" +
      "</div>" +
      '<div class="flex items-center gap-3 flex-1 overflow-x-auto scrollbar-hide">' +
      thumbs +
      "</div>" +
      '<div class="flex items-center gap-2 flex-shrink-0">' +
      '<button class="float-clear px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-200 dark:border-slate-700 hover:border-red-300">清空</button>' +
      '<a href="/products/compare/" class="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-1"><span>对比</span><span class="material-symbols-outlined text-sm">arrow_forward</span></a>' +
      "</div>" +
      "</div>"
    );
  }

  function bindFloatingBarEvents(container) {
    container.querySelectorAll(".float-remove").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        removeCompareItem(this.dataset.model);
      });
    });
    var clearBtn = container.querySelector(".float-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        clearCompareItems();
      });
    }
  }

  function createFloatingBar() {
    return;
    if (document.getElementById(floatingBarId)) return;
    injectFloatingBarStyles();

    var device = getDeviceType();
    var bar = document.createElement("div");
    bar.id = floatingBarId;

    if (device === "mobile") {
      bar.className =
        "fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3 z-50";
    } else if (device === "tablet") {
      bar.className =
        "fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 px-4 py-3 z-50 w-[calc(100%-2rem)]";
    } else {
      bar.className =
        "fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 px-6 py-4 z-50 max-w-4xl w-[calc(100%-3rem)]";
    }

    /* @audit-safe: constant-html */
    /* @audit-safe: constant-html */
    bar.innerHTML = '<div class="compare-bar-inner"></div>';
    document.body.appendChild(bar);
    updateFloatingBar();
  }

  // Listen for storage events from other tabs
  window.addEventListener("storage", function (e) {
    if (e.key === COMPARE_KEY) {
      updateCompareButtons();
      updateFloatingBar();
    }
  });

  // ─── Data loader (local only, no API dependency) ───────
  // PRODUCT_DATA_TABLE is now loaded inline via product-data-table.js
  // No fetch() to /api/public/products-data needed.
  var _dataLoaded = false;

  function loadFromAPI(callback) {
    if (_dataLoaded) {
      if (callback) callback();
      return;
    }
    // Static data is already in window.PRODUCT_DATA_TABLE (loaded via script tag)
    if (Array.isArray(window.PRODUCT_DATA_TABLE) && window.PRODUCT_DATA_TABLE.length > 0) {
      window[STORE_KEY] = window.PRODUCT_DATA_TABLE;
      _dataLoaded = true;
      window.dispatchEvent(new Event("product-data-ready"));
      if (callback) callback();
    } else {
      console.warn("[ProductGrid] PRODUCT_DATA_TABLE not available; using empty array");
      window[STORE_KEY] = [];
      _dataLoaded = true;
      if (callback) callback();
    }
  }

  function getCategories() {
    var raw = window[STORE_KEY];
    if (!Array.isArray(raw)) return [];

    // If raw is a flat array of products (each has a category field),
    // group them by category for the category-tab and product-grid system.
    // Check first element: if it has a "category" field but no "products" array,
    // it's flat format → convert to grouped format.
    if (raw.length > 0 && raw[0].category && !raw[0].products) {
      var CATEGORY_EMOJI = {};
      var KEY_TO_SLUG = {};
      var cfgCats = ((window.SITE_CONFIG || window._cfg || {}).categories || {}).products || [];
      cfgCats.forEach(function (c) {
        if (c.key) CATEGORY_EMOJI[c.key] = c.emoji || "";
        if (c.slug && c.key) KEY_TO_SLUG[c.slug] = c.key;
      });

      var grouped = {};
      raw.forEach(function (p) {
        var catKey = p.category || "other";
        grouped[catKey] = grouped[catKey] || [];
        grouped[catKey].push(p);
      });

      var result = [];
      for (var cat in grouped) {
        if (!grouped.hasOwnProperty(cat)) continue;
        var first = grouped[cat][0] || {};
        result.push({
          category: cat,
          slug: cat,
          categoryName: first.category || cat,
          products: grouped[cat],
          emoji: CATEGORY_EMOJI[cat] || "",
        });
      }
      return result;
    }

    // Legacy: raw is already grouped format
    return raw;
  }

  function getAllProducts() {
    var result = [];
    getCategories().forEach(function (cat) {
      if (!cat.products || !Array.isArray(cat.products)) return;
      cat.products.forEach(function (p) {
        // Build image URL from category + id sequence, or fall back to p.image
        var img = p.image || "";
        if (!img && p.category) {
          var seq = "001";
          if (p.id) {
            var parts = p.id.split("-");
            seq = parts[parts.length - 1];
          }
          img = "/assets/images/products/" + p.category + "/" + seq + ".webp";
        }
        if (!img) {
          img = "/assets/images/products/default.webp";
        }
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          var primary =
            p.images.find(function (i) {
              return i.isPrimary;
            }) || p.images[0];
          if (primary && primary.filePath) img = primary.filePath;
        }
        result.push(
          (function() { var o = {}; for (var k in p) o[k] = p[k]; o._category = cat.category || cat.slug || ""; o._imageUrl = img; return o; })()
        );
      });
    });
    return result;
  }

  // ─── Accent color lookup ──────────────────────────────────────
  // Maps a product's category to a data-accent value.
  // Reads from SITE_CONFIG.categories.products[].accent; falls back to "coral".
  function getProductAccent(p) {
    if (!p) return "coral";
    var cat = p._category || "";
    var cfgProducts = ((window.SITE_CONFIG || window._cfg || {}).categories || {}).products || [];
    for (var i = 0; i < cfgProducts.length; i++) {
      if (cfgProducts[i].slug === cat || cfgProducts[i].key === cat) {
        return cfgProducts[i].accent || "coral";
      }
    }
    return "coral";
  }

  function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ─── Compare button HTML builder ───────────────────────────────

  function buildCompareBtnHTML(model) {
    return "";
  }

  function buildMobileCompareBtnHTML(model) {
    return "";
  }

  // ─── Card renderers ────────────────────────────────────────────

  function renderPC(p) {
    var cat = esc(p._category);
    var accent = getProductAccent(p);
    var model = esc(p.model || "");
    var name = esc(p.name || model);
    var desc = esc(p.description || p.card_desc || p.highlights || "");
    var img = esc(p._imageUrl);
    var subCatRaw = p.subCategory || cat;
    var subCat = esc(subCatRaw);
    var subCatDataI18n = ' data-i18n="' + esc(subCatRaw) + '"';
    var specs = [];
    if (p.power) specs.push(esc(p.power));
    if (p.throughput) specs.push(esc(p.throughput));
    if (p.averageTime) specs.push(esc(p.averageTime));
    var specHTML = specs
      .map(function (s) {
        return '<span class="spec-badge px-2 py-1 rounded text-xs font-medium text-primary">' + s + "</span>";
      })
      .join("");
    var badge = "";
    if (p.badge) {
      badge =
        '<span class="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">' + esc(p.badge) + "</span>";
    }
    var link = "/products/detail/" + encodeURIComponent(model) + "/";
    var isSelected = isProductCompared(p.model);
    var selectedClass = isSelected ? " compare-selected" : "";
    return (
      '<article class="product-card group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden' +
      selectedClass +
      '" data-accent="' + accent +
      '" data-category="' +
      cat +
      '" data-tier="' +
      esc(p.tier || "") +
      '" data-model="' +
      model +
      '" data-sort-order="' +
      (p.sort_order || 0) +
      '" data-created="' +
      (p.created_at || "") +
      '">' +
      '<div class="relative aspect-[4/3] overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">' +
      '<img loading="lazy" alt="' +
      name +
      '" class="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" src="' +
      img +
      "\" onerror=\"if(!this.dataset.errored){this.dataset.errored='1';this.src='/assets/images/products/default.webp' }\">" +
      (badge ? '<div class="absolute top-4 left-4 flex gap-2">' + badge + "</div>" : "") +
      "</div>" +
      '<div class="p-6 flex-1 flex flex-col">' +
      '<div class="flex items-center gap-2 mb-3"><span class="material-symbols-outlined text-primary text-sm">local_cafe</span><span class="text-xs font-bold text-primary uppercase tracking-wider"' +
      subCatDataI18n +
      ">" +
      subCat +
      "</span></div>" +
      '<h3 class="text-lg font-bold mb-2 text-slate-900 dark:text-white line-clamp-1">' +
      name +
      "</h3>" +
      '<p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">' +
      desc +
      "</p>" +
      (specHTML ? '<div class="flex flex-wrap gap-2 mb-4">' + specHTML + "</div>" : "") +
      '<div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">' +
      '<div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700"><span class="text-xs text-slate-400">\u8D77\u8BA2\u4EF7</span><p class="text-lg font-black text-primary">\u8BE2\u4EF7</p></div>' +
      '<div class="flex items-center gap-2">' +
      '<a href="' +
      link +
      '" class="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition-opacity"><span>\u67E5\u770B\u8BE6\u60C5</span><span class="material-symbols-outlined text-xs">arrow_forward</span></a>' +
      buildCompareBtnHTML(model) +
      "</div>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderTablet(p) {
    var cat = esc(p._category);
    var accent = getProductAccent(p);
    var model = esc(p.model || "");
    var name = esc(p.name || model);
    var desc = esc(p.description || p.card_desc || "");
    var img = esc(p._imageUrl);
    var subCatRaw = p.subCategory || cat;
    var subCat = esc(subCatRaw);
    var subCatDataI18n = ' data-i18n="' + esc(subCatRaw) + '"';
    var badge = "";
    if (p.badge) {
      badge =
        '<span class="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded">' + esc(p.badge) + "</span>";
    }
    var link = "/products/detail/" + encodeURIComponent(model) + "/";
    var isSelected = isProductCompared(p.model);
    var selectedClass = isSelected ? " compare-selected" : "";
    return (
      '<article class="product-card-tablet flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden' +
      selectedClass +
      '" data-accent="' + accent +
      '" data-category="' +
      cat +
      '" data-model="' +
      model +
      '" data-tier="' +
      esc(p.tier || "") +
      '" data-sort-order="' +
      (p.sort_order || 0) +
      '" data-created="' +
      (p.created_at || "") +
      '">' +
      '<div class="relative aspect-[4/3] overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">' +
      '<img loading="lazy" alt="' +
      name +
      '" class="w-full h-full object-contain p-2" src="' +
      img +
      "\" onerror=\"if(!this.dataset.errored){this.dataset.errored='1';this.src='/assets/images/products/default.webp' }\">" +
      (badge ? '<div class="absolute top-3 left-3 flex gap-1.5">' + badge + "</div>" : "") +
      "</div>" +
      '<div class="p-4 flex-1 flex flex-col">' +
      '<div class="flex items-center gap-1.5 mb-2"><span class="material-symbols-outlined text-primary text-sm">local_cafe</span><span class="text-xs font-bold text-primary uppercase tracking-wider"' +
      subCatDataI18n +
      ">" +
      subCat +
      "</span></div>" +
      '<h3 class="text-base font-bold mb-1 text-slate-900 dark:text-white line-clamp-2">' +
      name +
      "</h3>" +
      '<p class="flex-1 text-xs text-slate-500 dark:text-slate-400 mb-0 line-clamp-2">' +
      desc +
      "</p>" +
      '<div class="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">' +
      '<span class="text-base font-black text-primary">询价</span>' +
      '<div class="flex items-center gap-2">' +
      '<a href="' +
      link +
      '" class="flex items-center gap-1 text-primary text-sm font-bold hover:underline"><span>查看详情</span><span class="material-symbols-outlined text-xs">arrow_forward</span></a>' +
      buildCompareBtnHTML(model) +
      "</div>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderMobile(p) {
    var cat = esc(p._category);
    var accent = getProductAccent(p);
    var model = esc(p.model || "");
    var name = esc(p.name || model);
    var desc = esc(p.description || p.card_desc || "");
    var img = esc(p._imageUrl);
    var link = "/products/detail/" + encodeURIComponent(model) + "/";
    var isSelected = isProductCompared(p.model);
    var selectedClass = isSelected ? " compare-selected" : "";
    return (
      '<article class="product-card-mobile bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative' +
      selectedClass +
      '" data-accent="' + accent +
      '" data-category="' +
      cat +
      '" data-model="' +
      model +
      '" data-tier="' +
      esc(p.tier || "") +
      '" data-sort-order="' +
      (p.sort_order || 0) +
      '" data-created="' +
      (p.created_at || "") +
      '">' +
      buildMobileCompareBtnHTML(model) +
      '<a href="' +
      link +
      '" class="flex gap-4 p-3">' +
      '<div class="w-24 h-24 rounded-lg bg-white dark:bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">' +
      '<img loading="lazy" alt="' +
      name +
      '" class="w-full h-full object-contain p-1" src="' +
      img +
      "\" onerror=\"if(!this.dataset.errored){this.dataset.errored='1';this.src='/assets/images/products/default.webp' }\">" +
      "</div>" +
      '<div class="flex-1 min-w-0">' +
      '<h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">' +
      name +
      "</h3>" +
      '<p class="flex-1 text-xs text-slate-500 dark:text-slate-400 mb-0 line-clamp-2">' +
      desc +
      "</p>" +
      '<div class="mt-auto flex items-center justify-between">' +
      '<span class="text-sm font-black text-primary">询价</span>' +
      '<span class="material-symbols-outlined text-slate-400 text-sm">arrow_forward</span>' +
      "</div>" +
      "</div>" +
      "</a>" +
      "</article>"
    );
  }

  // ─── Filter state ────────────────────────────────────────────
  var _activeCategory = "all";
  var _activeTier = "all";

  // ─── Gallery pagination state (data-gallery="true") ───────────
  var _galleryPage = {};

  function isGalleryMode(containerId) {
    var el = document.getElementById(containerId);
    return el && el.getAttribute("data-gallery") === "true";
  }

  function getGalleryPageSize(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return 12;
    var size = parseInt(el.getAttribute("data-gallery-size"), 10);
    if (!isNaN(size) && size > 0) return size;
    // Default per device
    var w = window.innerWidth || 1024;
    if (w >= 1280) return 12;
    if (w >= 768) return 9;
    return 6;
  }

  function getGalleryTotalPages(containerId, totalItems) {
    var pageSize = getGalleryPageSize(containerId);
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }

  function renderGalleryPagination(containerId, totalItems) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var totalPages = getGalleryTotalPages(containerId, totalItems);
    var currentPage = _galleryPage[containerId] || 0;

    var oldNav = container.parentNode ? container.parentNode.querySelector(".gallery-pagination") : null;
    if (oldNav && oldNav.parentNode) oldNav.parentNode.removeChild(oldNav);

    if (totalPages <= 1) return;

    var nav = document.createElement("div");
    nav.className = "gallery-pagination flex items-center justify-center gap-4 mt-8 mb-4";

    var prevBtn = document.createElement("button");
    prevBtn.className = "gallery-prev px-4 py-2 rounded-xl font-bold text-sm transition-all " +
      (currentPage === 0
        ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800");
    prevBtn.disabled = currentPage === 0;
    prevBtn.innerHTML = '<span class="material-symbols-outlined text-base">chevron_left</span>';

    var indicator = document.createElement("span");
    indicator.className = "text-sm font-semibold text-slate-600 dark:text-slate-400";
    indicator.textContent = (currentPage + 1) + " / " + totalPages;

    var nextBtn = document.createElement("button");
    nextBtn.className = "gallery-next px-4 py-2 rounded-xl font-bold text-sm transition-all " +
      (currentPage >= totalPages - 1
        ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800");
    nextBtn.disabled = currentPage >= totalPages - 1;
    nextBtn.innerHTML = '<span class="material-symbols-outlined text-base">chevron_right</span>';

    nav.appendChild(prevBtn);
    nav.appendChild(indicator);
    nav.appendChild(nextBtn);

    container.parentNode.insertBefore(nav, container.nextSibling);

    if (!nav._galleryBound) {
      nav._galleryBound = true;
      nav.addEventListener("click", function (e) {
        var bp = e.target.closest(".gallery-prev");
        var bn = e.target.closest(".gallery-next");
        if (!bp && !bn) return;
        var cur = _galleryPage[containerId] || 0;
        if (bp && cur > 0) {
          _galleryPage[containerId] = cur - 1;
        } else if (bn && cur < totalPages - 1) {
          _galleryPage[containerId] = cur + 1;
        } else {
          return;
        }
        renderGalleryPage(containerId);
      });
    }
  }

  function renderGalleryPage(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var products = getFilteredProducts();
    var pageSize = getGalleryPageSize(containerId);
    var currentPage = _galleryPage[containerId] || 0;
    var start = currentPage * pageSize;
    var end = start + pageSize;
    var pageItems = products.slice(start, end);

    var renderer;
    if (container.classList.contains("md:grid-cols-2")) {
      renderer = renderMobile;
    } else if (window.innerWidth >= 768) {
      renderer = renderTablet;
    } else {
      renderer = renderPC;
    }

    /* @audit-safe: config-driven-render */
    container.innerHTML = pageItems.map(renderer).join("");
    renderGalleryPagination(containerId, products.length);
    updateCompareButtons();
  }

  function getFilteredProducts() {
    var products = getAllProducts();
    if (_activeCategory !== "all") {
      products = products.filter(function (p) {
        return p._category === _activeCategory;
      });
    }
    if (_activeTier !== "all") {
      products = products.filter(function (p) {
        return (p.tier || "") === _activeTier;
      });
    }
    return products;
  }

  // ─── Grid rendering with pagination ──────────────────────────
  var _shownCount = {};

  function getPageSize() {
    var w = window.innerWidth || 1024;
    if (w >= 1280) return 12; // PC: 4 cols × 3 rows
    if (w >= 768) return 9; // Tablet: 3 cols × 3 rows
    return 6; // Mobile: 2 cols × 3 rows
  }

  function renderGrid(containerId, renderer, maxCount) {
    var container = document.getElementById(containerId);
    if (!container) return;

    // Gallery mode: use pagination instead of load-more
    if (isGalleryMode(containerId)) {
      _galleryPage[containerId] = 0;
      renderGalleryPage(containerId);
      createFloatingBar();
      return;
    }

    var products = getFilteredProducts();
    var total = products.length;
    var initial = Math.min(total, getPageSize());
    _shownCount[containerId] = initial;
    /* @audit-safe: template-literal */
    /* @audit-safe: template-literal */
    container.innerHTML = products.slice(0, initial).map(renderer).join("");
    updateLoadMoreBtn(containerId, total, initial);
    bindLoadMore(containerId, renderer, products);
    // Init floating bar after grid render
    createFloatingBar();
  }

  function updateLoadMoreBtn(containerId, total, shown) {
    var loadMore = document.querySelector('[data-i18n="products_load_more"]');
    if (loadMore) loadMore.style.display = total <= shown ? "none" : "";
  }

  function bindLoadMore(containerId, renderer, products) {
    var loadMore = document.querySelector('[data-i18n="products_load_more"]');
    if (!loadMore || loadMore._bound) return;
    loadMore._bound = true;
    loadMore.addEventListener("click", function () {
      var container = document.getElementById(containerId);
      if (!container) return;
      var shown = _shownCount[containerId] || getPageSize();
      var next = Math.min(shown + getPageSize(), products.length);
      _shownCount[containerId] = next;
      // Append new products
      /* @audit-safe: template-literal */
      /* @audit-safe: template-literal */
      container.innerHTML = products.slice(0, next).map(renderer).join("");
      updateLoadMoreBtn(containerId, products.length, next);
      // Re-sync compare button states for newly rendered cards
      updateCompareButtons();
    });
  }

  // ─── Auto render (deduped) ─────────────────────────────────────

  var _renderPending = false;

  function autoRender() {
    if (_renderPending) return;
    var data = window[STORE_KEY];
    var hasData = Array.isArray(data) && data.length > 0;
    if (hasData) {
      _renderPending = false;
      doRender();
    } else {
      _renderPending = true;
      loadFromAPI(function () {
        _renderPending = false;
        doRender();
      });
    }
  }

  function doRender() {
    var cats = getCategories();
    var prods = getAllProducts();
    // Reset loadMore binding so it picks up the current filtered products
    var _loadMoreBtn = document.querySelector('[data-i18n="products_load_more"]');
    if (_loadMoreBtn) _loadMoreBtn._bound = false;
    if (!cats.length) {
      console.warn("[ProductGrid] doRender: no categories, showing empty state");
      var target = document.getElementById("product-list") || document.getElementById("product-grid");
      if (target) {
        target.innerHTML = '<div class="col-span-full text-center py-16 text-gray-400">' +
          '<span class="material-symbols-outlined text-5xl mb-3 block">inventory_2</span>' +
          '<p>No products available yet.</p></div>';
      }
      var overlay = document.getElementById("skeleton-overlay");
      if (overlay) overlay.setAttribute("hidden", "");
      return;
    }
    if (document.getElementById("product-list")) {
      renderGrid("product-list", renderMobile, 100);
    } else if (document.getElementById("product-grid")) {
      var grid = document.getElementById("product-grid");
      // Gallery mode: container already initializes pagination in renderGrid
      if (grid.getAttribute && grid.getAttribute("data-gallery") === "true") {
        renderGrid("product-grid", null, 0);
      } else if (grid && grid.classList.contains("md:grid-cols-2")) {
        renderGrid("product-grid", renderPC, 100);
      } else {
        renderGrid("product-grid", renderTablet, 100);
      }
    }
    initCategoryTabs();

    // Hide skeleton overlay after first successful render
    var overlay = document.getElementById("skeleton-overlay");
    if (overlay) overlay.setAttribute("hidden", "");
    var container = document.getElementById("spa-content");
    if (container) container.style.display = "";
  }

  // ─── Category tabs ─────────────────────────────────────────────

  function initTierFilter() {
    document.querySelectorAll(".filter-chip").forEach(function (chip) {
      if (chip._tierFilterBound) return;
      chip._tierFilterBound = true;
      chip.addEventListener("click", function () {
        document.querySelectorAll(".filter-chip").forEach(function (c) {
          c.classList.remove("active");
        });
        this.classList.add("active");
        _activeTier = this.dataset.filter || "all";
        _shownCount = {};
        doRender();
      });
    });
  }

  function initCategoryTabs() {
    var container = document.querySelector(".category-tab-container");
    if (!container) return;

    // Prevent duplicate init
    if (container._categoryTabsInit) return;
    container._categoryTabsInit = true;

    var categories = [];
    getCategories().forEach(function (cat) {
      var name = cat.categoryName || cat.category;
      if (name) {
        // Translate category if it's an i18n key (e.g. nav_products_coffee)
        var translated = typeof window.t === "function" ? window.t(cat.category) : null;
        var label = translated && translated !== cat.category ? translated : name;
        categories.push({ key: cat.category, name: label });
      }
    });
    if (!categories.length) return;

    // Emoji map for category tabs (config-driven)
    var _cfgCats = (window.SITE_CONFIG || window._cfg || {}).categories || {};
    var CATEGORY_EMOJI = (_cfgCats.products || []).reduce(function (m, c) {
      if (c.key && c.emoji) m[c.key] = c.emoji;
      return m;
    }, {});

    // Build tab buttons
    var allTabs = [];
    var isMobile = window.innerWidth < 768;
    var tabSizeClass = isMobile ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

    // "全部产品" button
    var allBtn = document.createElement("button");
    allBtn.className =
      "category-tab active " +
      tabSizeClass +
      " font-bold whitespace-nowrap rounded-xl";
    allBtn.dataset.category = "all";
    allBtn.textContent = "全部产品";
    allTabs.push(allBtn);

    categories.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className =
        "category-tab " +
        tabSizeClass +
        " font-semibold whitespace-nowrap rounded-xl";
      btn.dataset.category = cat.key;
      var emoji = CATEGORY_EMOJI[cat.key] || "";
      btn.textContent = emoji ? emoji + " " + cat.name : cat.name;
      allTabs.push(btn);
    });

    // "More" toggle button
    var moreBtn = document.createElement("button");
    moreBtn.className =
      "category-tab-more px-3 py-2 text-xs font-bold whitespace-nowrap rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer";

    // Dynamic visible tab count: measures actual tab widths against container
    var dynamicMax = Infinity;
    function calcDynamicMax() {
      if (window.innerWidth >= 1280) {
        dynamicMax = Infinity;
        return;
      }
      var totalAvailable = container.clientWidth || container.offsetWidth;
      if (totalAvailable <= 0) {
        dynamicMax = 3;
        return;
      }
      // Create a temp more-btn to measure its real width
      var tmpMore = moreBtn.cloneNode(true);
      tmpMore.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
      tmpMore.textContent = "+9 更多 \u25BC"; // worst-case width estimate
      container.appendChild(tmpMore);
      var moreBtnWidth = tmpMore.offsetWidth + 8; // +8 for gap
      container.removeChild(tmpMore);

      // Create a hidden wrapper to measure all tab widths
      var measureWrap = document.createElement("div");
      measureWrap.style.cssText = "display:inline-flex;position:absolute;visibility:hidden;pointer-events:none";
      container.appendChild(measureWrap);
      var used = 0;
      var fit = 0;
      for (var i = 0; i < allTabs.length; i++) {
        var clone = allTabs[i].cloneNode(true);
        measureWrap.appendChild(clone);
        var w = clone.offsetWidth + 8; // 8px gap between tabs
        if (used + w > totalAvailable - moreBtnWidth) {
          clone.remove();
          break;
        }
        used += w;
        fit++;
      }
      container.removeChild(measureWrap);
      dynamicMax = Math.max(fit, 2); // at least 2 visible
    }

    var isExpanded = false;

    function getVisibleCount() {
      if (window.innerWidth >= 1280) return Infinity;
      return dynamicMax;
    }

    function renderTabs() {
      /* @audit-safe: constant-html */
      /* @audit-safe: constant-html */
      container.innerHTML = "";
      var maxVis = getVisibleCount();
      var showCount = isExpanded ? allTabs.length : Math.min(maxVis, allTabs.length);
      // Mobile: allow wrap when expanded, prevent when collapsed
      if (isMobile) {
        container.style.flexWrap = isExpanded ? "wrap" : "nowrap";
        container.style.overflow = isExpanded ? "visible" : "hidden";
      }
      for (var i = 0; i < showCount; i++) {
        var tab = allTabs[i];
        // Set active state based on current category
        if ((_activeCategory === "all" && tab.dataset.category === "all") || tab.dataset.category === _activeCategory) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
        container.appendChild(tab);
      }
      if (allTabs.length > maxVis) {
        var remaining = allTabs.length - maxVis;
        moreBtn.textContent = isExpanded ? "收起 \u25B2" : "\u002B" + remaining + " 更多 \u25BC";
        container.appendChild(moreBtn);
      }
    }

    // First render with fallback, then recalculate after fonts + layout settle
    calcDynamicMax();
    renderTabs();
    scheduleRecalc();

    function scheduleRecalc() {
      // Wait for fonts to load, then recalculate with accurate widths
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          requestAnimationFrame(function () {
            calcDynamicMax();
            renderTabs();
          });
        });
      }
      // Also recalculate after a short delay as a safety net (images, etc.)
      setTimeout(function () {
        calcDynamicMax();
        renderTabs();
      }, 300);
    }

    // Recalculate on resize (debounced, auto-cleanup via EventManager)
    var resizeTimer;
    var _tabEM = window.DomUtils && new DomUtils.EventManager();
    (_tabEM || {on:function(){}}).on(window, "resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        calcDynamicMax();
        renderTabs();
      }, 150);
    });

    // More button toggle
    moreBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      isExpanded = !isExpanded;
      renderTabs();
    });

    // Tab click handler
    container.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".category-tab");
      if (!btn) return;
      var cat = btn.dataset.category;

      // Update active state
      container.querySelectorAll(".category-tab").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");

      // Filter products
      var selector =
        "#product-grid .product-card, #product-grid .product-card-tablet, #product-list .product-card-mobile";
      // Update active category and re-render
      _activeCategory = cat;
      _shownCount = {};
      doRender();

      // Notify cross-sell module of category change (for /products/all/ page)
      if (cat === "all") {
        if (window.CrossSell && window.CrossSell.clearCategory) window.CrossSell.clearCategory();
      } else {
        // Map category key back to slug (config-driven)
        var KEY_TO_SLUG = (_cfgCats.products || []).reduce(function (m, c) {
          if (c.key && c.slug) m[c.key] = c.slug;
          return m;
        }, {});
        var slug = KEY_TO_SLUG[cat] || cat;
        if (window.CrossSell && window.CrossSell.setCategory) window.CrossSell.setCategory(slug);
      }
    });

    // Filter chip click handler (moved to initTierFilter)
    initTierFilter();
  }

  // ─── Init ──────────────────────────────────────────────────────

  // Resolve initial category from URL for SSG page loads (e.g. /products/coffee/ → "coffee")
  // This runs before autoRender so the first render filters correctly.
  // Note: _activeCategory stores the raw category slug (matching data.category field),
  // NOT the i18n key. The i18n key → slug mapping is in the site.config categories.
  (function initCategoryFromUrl() {
    var match = window.location.pathname.match(/^\/products\/([^/]+)\/$/);
    if (match) {
      var slug = match[1];
      // Slug is the canonical category identifier (coffee, tea, ...)
      // data.category uses the same slug format
      if (slug) _activeCategory = slug;
    }
  })();

  // Guard: ensure init runs once even if script loads multiple times
  if (window._productGridInited) {
  } else {
    window._productGridInited = true;
    if (document.readyState !== "loading") {
      autoRender();
    } else {
      document.addEventListener("DOMContentLoaded", autoRender);
    }
  }

  // product-data-ready: only useful if data arrives after page scripts run
  window.addEventListener("product-data-ready", function () {
    autoRender();
  });

  // Safety net: if API fails and no cached data, clear skeleton after 5s
  // to prevent permanent skeleton display
  setTimeout(function () {
    var grid = document.getElementById("product-grid");
    var list = document.getElementById("product-list");
    if (grid && grid.querySelector(".sk-product-card")) {
      console.warn("[ProductGrid] Skeleton still present after 5s — clearing");
      var errorMsg =
        typeof window.t === "function"
          ? window.t("products_load_error", "产品加载失败，请刷新页面重试")
          : "产品加载失败，请刷新页面重试";
      var retryText = typeof window.t === "function" ? window.t("products_load_retry", "重新加载") : "重新加载";
      /* @audit-safe: internal-data */
      /* @audit-safe: internal-data */
      grid.innerHTML =
        '<div class="col-span-full text-center py-16"><p class="text-slate-500 dark:text-slate-400 text-lg" data-i18n="products_load_error">' +
        errorMsg +
        '</p><button class="mt-4 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all" data-i18n="products_load_retry" onclick="window.ProductGrid.retryLoad()">' +
        '<span class="material-symbols-outlined text-sm">refresh</span>' +
        retryText +
        "</button></div>";
    }
    if (list && list.querySelector(".sk-product-card")) {
      console.warn("[ProductGrid] Skeleton still present in list after 5s — clearing");
      var errorMsg =
        typeof window.t === "function"
          ? window.t("products_load_error", "产品加载失败，请刷新页面重试")
          : "产品加载失败，请刷新页面重试";
      var retryText = typeof window.t === "function" ? window.t("products_load_retry", "重新加载") : "重新加载";
      /* @audit-safe: internal-data */
      /* @audit-safe: internal-data */
      list.innerHTML =
        '<div class="text-center py-16"><p class="text-slate-500 dark:text-slate-400 text-lg" data-i18n="products_load_error">' +
        errorMsg +
        '</p><button class="mt-4 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all" data-i18n="products_load_retry" onclick="window.ProductGrid.retryLoad()">' +
        '<span class="material-symbols-outlined text-sm">refresh</span>' +
        retryText +
        "</button></div>";
    }
  }, 5000);

  // spa:load: prevent duplicate handler registration
  _spaOn(document, "spa:load", function () {
    _renderPending = false; // reset dedup flag for new page
    // Reset init flag and pagination for SPA navigation
    document.querySelectorAll(".category-tab-container").forEach(function (el) {
      el._categoryTabsInit = false;
    });
    _shownCount = {};
    _galleryPage = {};
    _activeTier = "all";
    var loadMore = document.querySelector('[data-i18n="products_load_more"]');
    if (loadMore) loadMore._bound = false;

    // Init tier filter (independent of category tabs)
    initTierFilter();

    // Auto-select category from URL (e.g. /products/stewing/)
    var categoryFromUrl = "";
    var match = window.location.pathname.match(/^\/products\/([^/]+)\/$/);
    if (match) {
      var slug = match[1];
      var cats = (window.SITE_CONFIG || window._cfg || {}).categories || {};
      var SLUG_MAP = (cats.products || []).reduce(function (m, c) {
        if (c.slug && c.key) m[c.slug] = c.key;
        return m;
      }, {});
      categoryFromUrl = SLUG_MAP[slug] || slug;
    }
    _activeCategory = categoryFromUrl || "all";

    autoRender();
  });

  // Translations may load after product-data-ready; refresh tab labels once ready
  // No spa:ready re-render needed — category labels use data-i18n attributes
  // so applyTranslations() handles them on every spa:load cycle.

  // Public API
  window.ProductGrid = {
    renderPC: function (max) {
      renderGrid("product-grid", renderPC, max);
    },
    renderTablet: function (max) {
      renderGrid("product-grid", renderTablet, max);
    },
    renderMobile: function (max) {
      renderGrid("product-list", renderMobile, max);
    },
    getAll: getAllProducts,
    renderCustom: function (id, renderer, max) {
      renderGrid(id, renderer, max);
    },
    toggleCompare: toggleCompareFromCard,
    getCompareItems: getCompareItems,
    saveCompareItems: saveCompareItems,
    clearCompareItems: clearCompareItems,
    removeCompareItem: removeCompareItem,
    autoRender: autoRender,
    setCategory: function (catKey) {
      _activeCategory = catKey;
    },
    setActiveTier: function (tier) {
      _activeTier = tier;
    },
    retryLoad: function () {
      _dataLoaded = false;
      _fetchPromise = null;
      _renderPending = false;
      delete window[STORE_KEY];
      autoRender();
    },
  };
})();
