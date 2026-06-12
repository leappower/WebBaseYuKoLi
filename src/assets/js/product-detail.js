/**
 * PDP Renderer - product detail page (SPA-safe)
 * URL: /products/<category>/<model>/
 * Self-contained: creates #product-content and #related-products if missing
 */
(function () {
  "use strict";
  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _spaInitDone = false;
  function _spaOn(tgt, evt, fn) {
    tgt.addEventListener(evt, fn);
  }

  // Category slugs used for product listing — NOT PDP pages
  // Read from SITE_CONFIG.categories.products (config-driven)
  var _pdCfg = window.SITE_CONFIG || {};
  var _pdCats = (_pdCfg.categories || {}).products || [];
  var CATEGORY_SLUGS = _pdCats
    .map(function (c) {
      return c.slug || "";
    })
    .filter(Boolean);

  function isCategorySlug(slug) {
    return CATEGORY_SLUGS.indexOf(slug) >= 0;
  }

  /**
   * 检查当前 URL 是否为产品详情页路由
   * @returns {boolean} 是否匹配 PDP 路径模式
   */
  function isPDPPath() {
    var p = window.location.pathname.replace(/\/+$/, "");
    // /products/<category>/<model>[/]
    if (/^\/products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(p)) return true;
    // /products/detail/<model>[/]  (旧兼容路由)
    if (/^\/products\/detail\//.test(p)) return true;
    return false;
  }

  function esc(str) {
    var d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  function modelToSnake(m) {
    return (m || "")
      .toLowerCase()
      .replace(/\//g, "")
      .replace(/\+/g, "_p")
      .replace(/-/g, "_")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/__+/g, "_")
      .replace(/^_|_$/g, "");
  }

  // Resolve i18n label object to current language string
  function resolveLabel(label) {
    if (!label) return "";
    if (typeof label === "string") return label;
    if (typeof label === "object") {
      var lang = (window.CURRENT_LANG || document.documentElement.lang || "zh-CN").replace("_", "-");
      return label[lang] || label["en"] || label["zh-CN"] || Object.values(label)[0] || "";
    }
    return String(label);
  }

  // i18n-aware product field accessor (used by renderPDP and exposed to window)
  // Moved here so it is defined before renderPDP calls it.
  function getProductField(product, field) {
    if (!product) return "";
    var lang = (window.CURRENT_LANG || document.documentElement.lang || "zh-CN").replace("_", "-");
    if (lang === "zh-CN" || lang === "zh") return product[field] || "";

    var tKey = product.model || product.id;
    var translations = window._productTranslations || {};
    var t = translations[tKey] || translations[product._productId];

    if (!t && window.PRODUCT_DATA_TRANSLATIONS) {
      t = window.PRODUCT_DATA_TRANSLATIONS[tKey];
    }

    if (t && t[field + "En"]) return t[field + "En"];
    if (t && t["nameEn" + field]) return t["nameEn" + field];
    return product[field] || "";
  }

  function getAllProducts() {
    var table = window.PRODUCT_DATA_TABLE || [];
    if (!table.length) return [];
    // Support both flat format (product-data-table.js V2)
    // and grouped format ({category, products: [...]}).
    if (table[0].model !== undefined) {
      // Flat format — each entry is a product
      return table;
    }
    var flat = [];
    for (var i = 0; i < table.length; i++) {
      var ps = table[i].products || [];
      var catName = table[i].categoryName || table[i].category || "";
      for (var j = 0; j < ps.length; j++) {
        var p = ps[j];
        if (!p._categoryName && catName) p._categoryName = catName;
        flat.push(p);
      }
    }
    return flat;
  }

  function findProduct(model) {
    var products = getAllProducts();
    for (var i = 0; i < products.length; i++) {
      if (products[i].model === model) return products[i];
    }
    return null;
  }

  /**
   * Build srcset for related product card images
   */
  function buildRelatedSrcset(imgSrc) {
    var widths = [375, 828, 1200];
    var parts = [];
    widths.forEach(function (w) {
      parts.push(imgSrc.replace(/\.webp$/i, "-" + w + "w.webp") + " " + w + "w");
    });
    return parts.join(", ");
  }

  function buildRelatedCard(rp, idx) {
    var rImg =
      rp.images && rp.images.length > 0
        ? (
            rp.images.find(function (i) {
              return i.isPrimary;
            }) || rp.images[0]
          ).filePath
        : "/assets/images/products/" +
          (rp.category || "default") +
          "/" +
          (rp.id ? rp.id.split("-").pop() : "001") +
          ".webp";
    var gradients = [
      "from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/30",
      "from-emerald-100 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20",
      "from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20",
    ];
    var grad = gradients[idx % gradients.length];
    return (
      '<a href="/products/' +
      encodeURIComponent(rp.category || "all") +
      "/" +
      encodeURIComponent(rp.model) +
      '/" class="group block bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700">' +
      '<div class="h-36 bg-gradient-to-br ' +
      grad +
      ' relative overflow-hidden">' +
      '<img loading="lazy" alt="' +
      esc(rp.model) +
      '" class="w-full h-full object-cover group-hover:scale-105 transition-transform" src="' +
      rImg +
      '" srcset="' +
      buildRelatedSrcset(rImg) +
      '" sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw" onerror="this.style.display=\'none\'">' +
      '</div><div class="p-4"><h4 class="font-bold text-sm mb-1">' +
      esc(rp.model) +
      '</h4><p class="text-xs text-slate-500 dark:text-slate-400 mb-2">' +
      esc(getCategoryName(rp)) +
      '</span><span class="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">' +
      tl("pdp_view_detail") +
      '<span class="material-symbols-outlined text-sm">arrow_forward</span></span></div></a>'
    );
  }

  function renderRelated(product) {
    var allProducts = getAllProducts();
    var el = document.getElementById("related-products");
    if (!el) return;
    var cards = "",
      count = 0,
      max = 8;

    // Plan A: manual related (if configured)
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      var map = {};
      allProducts.forEach(function (p) {
        map[p.model] = p;
      });
      product.relatedProducts.forEach(function (m) {
        if (count >= max) return;
        var rp = map[m];
        if (rp && rp.model !== product.model) {
          cards += buildRelatedCard(rp, count++);
        }
      });
    }
    // Plan B: auto fallback — same category
    if (count < max) {
      var shown = new Set(product.relatedProducts || []);
      shown.add(product.model);
      for (var i = 0; i < allProducts.length && count < max; i++) {
        var rp = allProducts[i];
        if (shown.has(rp.model)) continue;
        if (rp.category === product.category) {
          cards += buildRelatedCard(rp, count++);
          shown.add(rp.model);
        }
      }
    }
    // Plan C: last resort — fill with any remaining products
    if (count < max) {
      var shown2 = new Set(product.relatedProducts || []);
      shown2.add(product.model);
      for (var i = 0; i < allProducts.length; i++) {
        var rp = allProducts[i];
        if (rp.category === product.category) shown2.add(rp.model);
      }
      for (var i = 0; i < allProducts.length && count < max; i++) {
        var rp = allProducts[i];
        if (shown2.has(rp.model)) continue;
        cards += buildRelatedCard(rp, count++);
        shown2.add(rp.model);
      }
    }
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    if (cards) el.innerHTML = cards;

    if (window.i18nBundle && window.i18nBundle.applyTranslations) {
      window.i18nBundle.applyTranslations();
    } else el.parentElement.style.display = "none";
  }

  function ensureContainers() {
    var ce = document.getElementById("product-content");
    var re = document.getElementById("related-products");
    if (!ce || !re) {
      // Products listing page has #products-section; hide it and create PDP containers
      var listing = document.getElementById("products-section") || document.getElementById("product-grid");
      var container = listing
        ? listing.parentElement
        : document.getElementById("app") || document.querySelector("main") || document.body;
      if (listing) listing.style.display = "none";

      if (!ce) {
        ce = document.createElement("div");
        ce.id = "product-content";
        ce.className = "w-full py-10";
        var bcTarget = document.getElementById("breadcrumb-container");
        container.insertBefore(ce, bcTarget ? bcTarget.nextSibling : container.firstChild);
      }
      if (!re) {
        var section = document.createElement("section");
        section.className = "w-full py-12";
        /* @audit-safe: internal-data */
        /* @audit-safe: internal-data */
        section.innerHTML =
          '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
          '<h2 class="text-xl font-bold mb-4 flex items-center gap-2">' +
          '<span class="material-symbols-outlined text-primary">recommend</span> ' +
          tl("pdp_recommend_products") +
          "</h2>" +
          '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" id="related-products"></div>' +
          "</div>";

        if (window.i18nBundle && window.i18nBundle.applyTranslations) {
          window.i18nBundle.applyTranslations();
        }
        // Find the container's parent to append
        var target = ce.parentElement || container;
        target.appendChild(section);
      }
    }
  }

  function renderPDP() {
    // 非 PDP 路径不执行渲染
    if (!isPDPPath()) {
      return;
    }

    // Read model from path: /products/<category>/<model>/
    var path = window.location.pathname.replace(/\/$/, "");
    var model = null;
    var m = path.match(/^\/products\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
    if (m) {
      model = decodeURIComponent(m[2]);
    } else {
      // Fallback: /products/<model>/
      m = path.match(/^\/products\/([^/]+)$/);
      if (m && !isCategorySlug(m[1])) {
        model = decodeURIComponent(m[1]);
      }
    }

    var product = findProduct(model);
    if (!product) {
      ensureContainers();
      var ce = document.getElementById("product-content");
      if (ce)
        /* @audit-safe: internal-data */
        /* @audit-safe: internal-data */
        ce.innerHTML =
          '<div class="max-w-3xl mx-auto px-4 py-16 text-center">' +
          '<div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">' +
          '<span class="material-symbols-outlined text-3xl text-slate-400">search_off</span></div>' +
          '<h2 class="text-xl font-bold mb-3">' +
          tl("pdp_product_not_found") +
          "</h2>" +
          '<p class="text-slate-500 mb-6">' +
          tl("pdp_not_found_desc") +
          "</p>" +
          '<a href="/products/" class="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:shadow-lg transition-all">' +
          '<span class="material-symbols-outlined">arrow_back</span> ' +
          tl("pdp_back_to_products") +
          "</a></div>";

      if (window.i18nBundle && window.i18nBundle.applyTranslations) {
        window.i18nBundle.applyTranslations();
      }
      return;
    }

    // Ensure containers exist (for products listing page)
    ensureContainers();
    // Breadcrumb is handled by breadcrumb.js

    // Image: CMS upload > static
    var imgSrc =
      product._categoryUrl ||
      "/assets/images/products/" +
        (product.category || "default") +
        "/" +
        (product.id ? product.id.split("-").pop() : "001") +
        ".webp";
    if (!imgSrc || imgSrc.indexOf("undefined") !== -1) {
      imgSrc = "/assets/images/products/default.webp";
    }
    if (product.images && product.images.length > 0) {
      var pi =
        product.images.find(function (i) {
          return i.isPrimary;
        }) || product.images[0];
      if (pi && pi.filePath) imgSrc = pi.filePath;
    }
    document.title = product.model + " | " + tl("pdp_site_suffix");

    // Highlight matching category in navigator dropdown
    if (product.category && window.Navigator && typeof window.Navigator.highlightCategory === "function") {
      window.Navigator.highlightCategory(product.category);
    }

    // Spec fields — values use getProductField() for i18n
    var specs = [
      { l: tl("pdp_spec_model"), v: product.model },
      { l: tl("pdp_spec_category"), v: getCategoryName(product) },
      { l: tl("pdp_spec_subcategory"), v: getProductField(product, "sub_category") || product.subCategory },
      { l: tl("pdp_spec_tier"), v: getProductField(product, "tier") || product.tier },
      { l: tl("pdp_spec_power"), v: product.power },
      { l: tl("pdp_spec_capacity"), v: getProductField(product, "throughput") || product.throughput },
      { l: tl("pdp_spec_voltage"), v: product.voltage },
      { l: tl("pdp_spec_frequency"), v: product.frequency },
      { l: tl("pdp_spec_material"), v: getProductField(product, "material") || product.material },
      { l: tl("pdp_spec_dimensions"), v: getProductField(product, "product_dimensions") || product.productDimensions },
      { l: tl("pdp_spec_color"), v: getProductField(product, "color") || product.color },
      { l: tl("pdp_spec_control"), v: getProductField(product, "control_method") || product.controlMethod },
    ];
    // Add specifications as full-width description card if present
    if (product.specifications) {
      specs.unshift({
        l: tl("pdp_spec_configuration"),
        v: getProductField(product, "specifications") || product.specifications,
        full: true,
      });
    }
    var specCards = "";
    for (var s = 0; s < specs.length; s++) {
      if (!specs[s].v) continue;
      if (specs[s].full) {
        specCards +=
          '<div class="md:col-span-2 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">' +
          '<span class="text-sm text-slate-500 dark:text-slate-400 font-medium block mb-1">' +
          esc(specs[s].l) +
          "</span>" +
          '<span class="text-sm font-semibold">' +
          esc(specs[s].v) +
          "</span></div>";
      } else {
        specCards +=
          '<div class="flex justify-between items-start py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">' +
          '<span class="text-sm text-slate-500 dark:text-slate-400 font-medium">' +
          esc(specs[s].l) +
          "</span>" +
          '<span class="text-sm font-semibold text-right">' +
          esc(specs[s].v) +
          "</span></div>";
      }
    }

    var tier = product.tier
      ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">' +
        esc(product.tier) +
        "</span>"
      : "";
    var badge = product.badge
      ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary text-white">' +
        esc(product.badge) +
        "</span>"
      : "";
    var wa = (window.Contacts && window.Contacts.whatsapp) || (_cfg.contacts || {}).whatsapp || "";

    // Video support: product.video or product.videoUrl from CMS
    var videoUrl = product.video || product.videoUrl || "";
    var isVideo = !!videoUrl;
    var isYouTube = /youtu\.?be(\/|\.com\/)/.test(videoUrl);
    var embedUrl = "";
    if (isYouTube) {
      var m = videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      if (m) embedUrl = "https://www.youtube.com/embed/" + m[1] + "?autoplay=1&rel=0";
    }

    var mediaHtml;
    if (isVideo) {
      if (isYouTube) {
        mediaHtml =
          "<div class=\"relative group cursor-pointer\" onclick=\"(function(el){var f=document.createElement('iframe');f.src='" +
          embedUrl +
          "';f.className='absolute inset-0 w-full h-full';f.allow='autoplay;encrypted-media';f.allowFullscreen=true;f.style.border='none';el.querySelector('.pdp-play-btn').style.display='none';el.querySelector('img').style.display='none';el.appendChild(f);})(this)\">" +
          '<img loading="eager" alt="' +
          esc(product.model) +
          '" class="w-full h-full object-contain" src="' +
          imgSrc +
          '"' +
          " onerror=\"this.src='/assets/images/default.webp'\">" +
          '<div class="pdp-play-btn absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">' +
          '<div class="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">' +
          '<span class="material-symbols-outlined text-3xl text-primary ml-1">play_arrow</span>' +
          "</div></div></div>";
      } else {
        mediaHtml =
          "<div class=\"relative group cursor-pointer\" onclick=\"(function(el){var v=document.createElement('video');v.src='" +
          videoUrl +
          "';v.className='absolute inset-0 w-full h-full object-cover';v.controls=true;v.autoplay=true;v.playsInline=true;el.querySelector('.pdp-play-btn').style.display='none';el.querySelector('img').style.display='none';el.appendChild(v);v.play();})(this)\">" +
          '<img loading="eager" alt="' +
          esc(product.model) +
          '" class="w-full h-full object-contain" src="' +
          imgSrc +
          '"' +
          " onerror=\"this.src='/assets/images/default.webp'\">" +
          '<div class="pdp-play-btn absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">' +
          '<div class="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">' +
          '<span class="material-symbols-outlined text-3xl text-primary ml-1">play_arrow</span>' +
          "</div></div></div>";
      }
    } else {
      var srcset_parts = [];
      [375, 828, 1200, 1920].forEach(function (w) {
        srcset_parts.push(imgSrc.replace(/\.webp$/i, "-" + w + "w.webp") + " " + w + "w");
      });
      var imgSrcset = srcset_parts.join(", ");
      var imgSizes = "(max-width: 767px) 100vw, 50vw";
      mediaHtml =
        '<img loading="eager" alt="' +
        esc(product.model) +
        '"' +
        ' class="w-full h-full object-contain" src="' +
        imgSrc +
        '"' +
        ' srcset="' +
        imgSrcset +
        '"' +
        ' sizes="' +
        imgSizes +
        '"' +
        " onerror=\"this.src='/assets/images/default.webp'\">";
      // Check for additional images (gallery)
      if (product.images && product.images.length > 1) {
        mediaHtml += '<div class="absolute bottom-3 left-3 flex gap-1.5">';
        for (var im = 0; im < Math.min(product.images.length, 5); im++) {
          var isActive = product.images[im].isPrimary || im === 0;
          mediaHtml += '<div class="w-2 h-2 rounded-full ' + (isActive ? "bg-white" : "bg-white/50") + '"></div>';
        }
        mediaHtml += "</div>";
      }
    }

    var isMobile = window.innerWidth < 768;
    var isTablet = !isMobile && window.innerWidth < 1280;
    var heroH = isMobile ? 220 : isTablet ? 400 : 600;
    var html =
      // Section 1: Hero — 产品图片 + 基本信息
      '<section class="w-full bg-white dark:bg-slate-950">' +
      '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">' +
      '<div class="flex flex-col lg:flex-row gap-6 lg:gap-12 lg:items-center">' +
      '<div class="w-full lg:w-1/2 relative">' +
      '<div class="relative w-full bg-slate-100 dark:bg-slate-800 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl lg:shadow-2xl border border-white/10" style="height:' +
      heroH +
      'px">' +
      mediaHtml +
      "</div></div>" +
      '<div class="w-full lg:w-1/2 flex flex-col gap-4 lg:gap-5 py-2"><div>' +
      '<div class="flex items-center gap-3 mb-2">' +
      '<span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">' +
      esc(product.subCategory || getCategoryName(product)) +
      "</span>" +
      badge +
      tier +
      "</div>" +
      '<h1 id="detail-title" class="text-2xl lg:text-3xl font-black tracking-tight mb-2">' +
      esc(product.name || product.model) +
      "</h1>" +
      (product.model && product.name && product.name !== product.model
        ? '<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">' +
          tl("pdp_spec_model") +
          ": " +
          esc(product.model) +
          "</p>"
        : "") +
      '<p class="text-base text-slate-500 dark:text-slate-400">' +
      esc(getCategoryName(product)) +
      "</p></div>" +
      '<div class="flex items-center gap-3">' +
      '<a href="/contact/?model=' +
      encodeURIComponent(product.model) +
      '"' +
      ' class="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold' +
      ' flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all text-sm">' +
      '<span class="material-symbols-outlined text-lg">request_quote</span> ' +
      tl("pdp_get_quote") +
      "</a>" +
      '<a href="https://wa.me/' +
      wa +
      "?text=" +
      encodeURIComponent(
        (product.subCategory || getCategoryName(product)
          ? (product.subCategory || getCategoryName(product)) + " "
          : "") + product.model
      ) +
      '" target="_blank"' +
      ' class="flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2' +
      ' border-2 border-slate-300 dark:border-slate-600 hover:border-primary hover:text-primary transition-all text-sm">' +
      '<span class="material-symbols-outlined text-lg">chat</span> ' +
      tl("pdp_contact_sales") +
      "</a></div></div></div></div></section>" +
      // Section 2: Specifications
      '<section class="w-full py-8 lg:py-12 bg-slate-50 dark:bg-slate-900/30">' +
      '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
      '<h2 class="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 flex items-center gap-2">' +
      '<span class="material-symbols-outlined text-primary">specifications</span> ' +
      tl("pdp_product_specs") +
      "</h2>" +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">' +
      specCards +
      "</div></div></section>" +
      // Section 3: CTA
      '<section class="w-full py-8 lg:py-12 bg-primary">' +
      '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-xl p-8 text-center">' +
      '<h2 class="text-xl font-black text-white mb-3">' +
      tl("pdp_need_custom_solution") +
      "</h2>" +
      '<p class="text-white/80 mb-6 text-sm">' +
      tl("pdp_tell_us_needs") +
      "</p>" +
      '<a href="/contact/" class="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all">' +
      '<span class="material-symbols-outlined">arrow_forward</span> ' +
      tl("pdp_get_quote") +
      "</a></div></section>";

    var ce = document.getElementById("product-content");
    if (ce) ce.className = "w-full py-10";
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    if (ce) ce.innerHTML = html;

    if (window.i18nBundle && window.i18nBundle.applyTranslations) {
      window.i18nBundle.applyTranslations();
    }

    // Static specs grid
    var sg = document.getElementById("specs-grid");
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    if (sg) sg.innerHTML = specCards;

    if (window.i18nBundle && window.i18nBundle.applyTranslations) {
      window.i18nBundle.applyTranslations();
    }

    // Related products
    renderRelated(product);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (isPDPPath()) {
      renderPDP();
    }
  });
  // Use EventManager to prevent duplicate product-data-ready listeners in SPA
  var _pdpEM = window.DomUtils && new DomUtils.EventManager();
  (_pdpEM || { on: function () {} }).on(document, "product-data-ready", function () {
    if (isPDPPath()) {
      renderPDP();
    }
  });
  // Multi-language helper: get product field for current language
  // Translate spec labels
  // Multi-language helper: translate spec labels and PDP text
  // Uses window.t() (TranslationManager) for all languages,
  // falls back to English map when TranslationManager not available.
  function tl(key) {
    // Try TranslationManager first (handles all UI json keys)
    if (typeof window.__safe !== "undefined" && typeof window.__safe.t === "function") {
      var translated = window.__safe.t(key);
      if (translated && translated !== key) return translated;
    }
    // Fallback: hardcoded English map
    var map = {
      pdp_spec_model: "Model",
      pdp_spec_category: "Category",
      pdp_spec_subcategory: "Sub-Category",
      pdp_spec_tier: "Tier",
      pdp_spec_power: "Power",
      pdp_spec_capacity: "Capacity",
      pdp_spec_voltage: "Voltage",
      pdp_spec_frequency: "Frequency",
      pdp_spec_material: "Material",
      pdp_spec_dimensions: "Dimensions",
      pdp_spec_color: "Color",
      pdp_spec_control: "Control",
      pdp_spec_configuration: "Specifications",
      pdp_product_specs: "Product Specifications",
      pdp_need_custom_solution: "Need a Custom Solution?",
      pdp_tell_us_needs: "Tell us your needs and we'll provide a tailored solution.",
      pdp_get_quote: "Get Quote",
      pdp_contact_sales: "Contact Sales",
      pdp_product_not_found: "Product Not Found",
      pdp_not_found_desc: "Sorry, this product was not found.",
      pdp_back_to_products: "Back to Products",
      pdp_recommend_products: "Recommended Products",
      pdp_view_detail: "View Details",
      pdp_back: "Back",
      pdp_site_suffix: "OEM/ODM Products",
      nav_product_center: "Products",
    };
    return map[key] || key;
  }

  // Get translated category name (from UI i18n, not product_translations)
  function getCategoryName(product) {
    var cat = product.category || product.categoryName || "";
    if (!cat) return "";
    // Priority: product._categoryName (enriched from parent) > i18n translate > product.categoryName > raw key
    if (product._categoryName) return product._categoryName;
    if (typeof window.__safe !== "undefined" && typeof window.__safe.t === "function") {
      var translated = window.__safe.t(cat);
      if (translated && translated !== cat) return translated;
    }
    return product.categoryName || cat;
  }

  // Usage: getProductField(product, 'name') → returns translated name or fallback to Chinese
  window.getProductField = getProductField;

  // Load translations for a language (called when user switches language)
  window.loadProductTranslations = function (lang, callback) {
    // Always initialize empty object for Chinese
    if (lang === "zh-CN" || lang === "zh") {
      window._productTranslations = {};
      if (callback) callback();
      return;
    }
    // Extract translations from the already-loaded PRODUCT_DATA_TABLE
    var suffix =
      lang.charAt(0).toUpperCase() +
      lang.slice(1).replace(/-([a-z])/g, function (m, c) {
        return c.toUpperCase();
      });
    var products = getAllProducts();
    var map = {};
    var fields = [
      "name",
      "specifications",
      "usage",
      "throughput",
      "material",
      "sub_category",
      "tier",
      "badge",
      "control_method",
      "product_dimensions",
      "color",
    ];
    products.forEach(function (p) {
      var pid = p._productId || p.id;
      if (!pid) return;
      var entry = {};
      fields.forEach(function (f) {
        var val = p[f + suffix];
        if (val) entry[f] = val;
      });
      if (Object.keys(entry).length > 0) map[pid] = entry;
    });
    window._productTranslations = map;
    window._productTranslationsByModel = {};
    products.forEach(function (p) {
      var t = map[p._ProductId || p.id];
      if (t) window._productTranslationsByModel[p.model] = t;
    });
    if (callback) callback();
  };

  _spaOn(window, "languageChanged", function () {
    if (isPDPPath()) {
      renderPDP();
    }
  });
  document.addEventListener("productTranslationsLoaded", function () {
    if (isPDPPath()) {
      renderPDP();
    }
  });
  _spaOn(document, "spa:load", function () {
    var segs = location.pathname.split("/").filter(Boolean);
    // Only render PDP on /products/<category>/<model>/ or /products/<model>/ (non-category)
    if (segs[0] === "products") {
      if (segs[1] === "detail" && segs[2]) {
        renderPDP();
      } else if (segs.length >= 3 && segs[1] && segs[2]) {
        // New route: /products/<category>/<model>/ — always PDP
        renderPDP();
      } else if (segs[1] && segs[1] !== "compare" && !isCategorySlug(segs[1])) {
        renderPDP();
      } else {
      }
    }
  });
  _spaOn(document, "spa:ready", function () {
    var segs = location.pathname.split("/").filter(Boolean);
    if (segs[0] === "products") {
      if (segs[1] === "detail" && segs[2]) {
        renderPDP();
      } else if (segs.length >= 3 && segs[1] && segs[2]) {
        // New route: /products/<category>/<model>/
        renderPDP();
      } else if (segs[1] && segs[1] !== "compare" && !isCategorySlug(segs[1])) {
        renderPDP();
      }
    }
  });

  window.ProductDetail = { init: renderPDP };

  /**
   * Get translated value from TranslationManager for a key
   */
  function getTranslation(key) {
    try {
      if (window.TranslationManager) {
        var val = new window.TranslationManager().resolveTranslationValue(
          key,
          "ui-" + (document.documentElement.lang || "zh-CN")
        );
        if (val && val !== key) return val;
      }
    } catch (e) {}
    return "";
  }
})();
