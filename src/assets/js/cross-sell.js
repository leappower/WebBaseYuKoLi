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
 * cross-sell.js — Cross-sell recommendations & scene entry links
 *
 * Renders on product category pages:
 *   - "搭配推荐" cross-sell cards (3-4 per category)
 *   - "适用场景" scene entry links (3 per category, with descriptions)
 *
 * Also populates PDP category navigation (#product-category-nav).
 *
 * Responsive layout:
 *   PC (≥1280px): 4 cols cross-sell, 3 cols scene
 *   Tablet (768-1279px): 2-3 cols
 *   Mobile (<768px): horizontal scroll or stacked cards
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

  function tl(key, fallback) {
    if (typeof key !== "string") {
      // If key is an object like {en: "...", "zh-CN": "..."}, resolve it
      if (key && typeof key === "object") {
        var lang = document.documentElement.lang || "zh-CN";
        key = key[lang] || key.en || key["zh-CN"] || fallback || "";
      } else {
        return fallback || "";
      }
    }
    if (typeof window.__safe !== "undefined" && typeof window.__safe.t === "function") {
      var result = window.__safe.t(key);
      if (result && result !== key) return result;
    }
    return fallback || key;
  }

  // ─── Category data ────────────────────────────────────────────

  // ── Config-driven category data ──
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
  var _crossSell = _cfg.crossSell || {};
  var APP_LABELS = _crossSell.appLabels || {};

  // Build reverse map from slug to category key
  var CATEGORY_KEY_TO_SLUG = {};

  function getAppLabel(slug) {
    return tl(APP_LABELS[slug] || slug, APP_LABELS[slug] || slug);
  }
  Object.keys(PRODUCT_SLUGS).forEach(function (slug) {
    CATEGORY_KEY_TO_SLUG[PRODUCT_SLUGS[slug].key] = slug;
  });

  // ─── Cross-sell: read from site.config.js ────────────────
  var _fallbackCrossSell = {
    coffee: [
      { slug: "tea", reason: "Coffee + Tea — complete beverage line", highlight: "+100% beverage line" },
      { slug: "beauty", reason: "Coffee + Beauty — internal wellness", highlight: "+50% avg. ticket" },
      { slug: "meal", reason: "Coffee + Meal — healthy one-stop", highlight: "Scene expansion" },
      { slug: "lifestyle", reason: "Coffee + Lifestyle — brand upgrade", highlight: "Brand upgrade" },
    ],
    tea: [
      { slug: "coffee", reason: "Tea + Coffee — dual beverage lines", highlight: "+80% audience" },
      { slug: "weight", reason: "Tea + Weight — popular combo", highlight: "+60% repurchase" },
      { slug: "gut", reason: "Tea + Gut — probiotic tea trend", highlight: "New trend" },
    ],
    meal: [
      { slug: "coffee", reason: "Meal + Coffee — breakfast combo", highlight: "Breakfast scene" },
      { slug: "weight", reason: "Meal + Weight — core line", highlight: "Core category" },
      { slug: "gut", reason: "Meal + Probiotics — balanced nutrition", highlight: "Balanced nutrition" },
    ],
    beauty: [
      { slug: "coffee", reason: "Beauty + Coffee — collagen coffee", highlight: "Hot combo" },
      { slug: "tea", reason: "Beauty + Herbal — natural beauty", highlight: "Natural concept" },
      { slug: "weight", reason: "Beauty + Slim — dual solution", highlight: "Dual effect" },
      { slug: "gut", reason: "Beauty + Gut — skin from within", highlight: "Inside-out" },
    ],
    weight: [
      { slug: "meal", reason: "Weight + Meal — golden combo", highlight: "Gold pairing" },
      { slug: "coffee", reason: "Weight + Black Coffee — boost metabolism", highlight: "Accelerate metabolism" },
      { slug: "beauty", reason: "Weight + Beauty — slim & glow", highlight: "Slim & beauty" },
      { slug: "lifestyle", reason: "Weight + Lifestyle — sustainable", highlight: "Sustainable" },
    ],
    gut: [
      { slug: "meal", reason: "Gut + Meal — dual improvement", highlight: "Dual improvement" },
      { slug: "tea", reason: "Gut + Tea — refreshing gut care", highlight: "Fresh gut care" },
      { slug: "beauty", reason: "Gut + Beauty — skin health", highlight: "Skin improvement" },
    ],
    lifestyle: [
      { slug: "coffee", reason: "Lifestyle + Coffee — daily essential", highlight: "Daily essential" },
      { slug: "tea", reason: "Lifestyle + Tea — slow living", highlight: "Slow living" },
      { slug: "weight", reason: "Lifestyle + Weight — health loop", highlight: "Health loop" },
    ],
  };

  var _fallbackScenes = {
    coffee: [
      {
        href: "/applications/brand-creation/",
        slug: "brand-creation",
        icon: "storefront",
        desc: "Build your coffee brand from 0 to 1 with OEM one-stop delivery",
      },
      {
        href: "/applications/chain-retail/",
        slug: "chain-retail",
        icon: "store",
        desc: "Chain store consistent quality, standardized delivery",
      },
      {
        href: "/applications/healthy-food/",
        slug: "healthy-food",
        icon: "eco",
        desc: "Health food brand, functional coffee customization",
      },
    ],
    tea: [
      {
        href: "/applications/brand-creation/",
        slug: "brand-creation",
        icon: "storefront",
        desc: "Tea brand from formula to packaging, full chain",
      },
      {
        href: "/applications/healthy-food/",
        slug: "healthy-food",
        icon: "eco",
        desc: "Healthy tea series with natural functional customization",
      },
      {
        href: "/applications/chain-retail/",
        slug: "chain-retail",
        icon: "store",
        desc: "Chain tea standardized output with stable supply chain",
      },
    ],
    meal: [
      {
        href: "/applications/healthy-food/",
        slug: "healthy-food",
        icon: "eco",
        desc: "Healthy meal replacement with scientific nutrition formula",
      },
      {
        href: "/applications/chain-retail/",
        slug: "chain-retail",
        icon: "store",
        desc: "Chain convenience store meal products, standardized mass production",
      },
      {
        href: "/applications/brand-creation/",
        slug: "brand-creation",
        icon: "storefront",
        desc: "Meal replacement brand from formula to market launch",
      },
    ],
    beauty: [
      {
        href: "/applications/brand-creation/",
        slug: "brand-creation",
        icon: "storefront",
        desc: "Beauty food brand customization from concept to mass production",
      },
      {
        href: "/applications/healthy-food/",
        slug: "healthy-food",
        icon: "eco",
        desc: "Oral beauty line with collagen and functional foods",
      },
      {
        href: "/applications/chain-retail/",
        slug: "chain-retail",
        icon: "store",
        desc: "Beauty chain brand standardized supply",
      },
    ],
    weight: [
      {
        href: "/applications/healthy-food/",
        slug: "healthy-food",
        icon: "eco",
        desc: "Weight management food with low-calorie scientific formula",
      },
      {
        href: "/applications/brand-creation/",
        slug: "brand-creation",
        icon: "storefront",
        desc: "Fat loss brand OEM with differentiated formula",
      },
      {
        href: "/applications/chain-retail/",
        slug: "chain-retail",
        icon: "store",
        desc: "Gym/convenience store standardized products",
      },
    ],
    gut: [
      {
        href: "/applications/healthy-food/",
        slug: "healthy-food",
        icon: "eco",
        desc: "Probiotic food with viability assurance technology",
      },
      {
        href: "/applications/brand-creation/",
        slug: "brand-creation",
        icon: "storefront",
        desc: "Gut health brand with differentiated strain solutions",
      },
      {
        href: "/applications/chain-retail/",
        slug: "chain-retail",
        icon: "store",
        desc: "Chain pharmacy/health food store supply",
      },
    ],
    lifestyle: [
      {
        href: "/applications/brand-creation/",
        slug: "brand-creation",
        icon: "storefront",
        desc: "Lifestyle brand customization, full-category health foods",
      },
      {
        href: "/applications/chain-retail/",
        slug: "chain-retail",
        icon: "store",
        desc: "Chain retail health food standardized supply",
      },
      {
        href: "/applications/healthy-food/",
        slug: "healthy-food",
        icon: "eco",
        desc: "Healthy living food series, daily nutrition supplement",
      },
    ],
  };

  var CROSS_SELL_MAP =
    (_cfg.crossSell || {}).map && Object.keys(_cfg.crossSell.map).length > 0 ? _cfg.crossSell.map : _fallbackCrossSell;
  var SCENE_ENTRY_MAP =
    (_cfg.crossSell || {}).scenes && Object.keys(_cfg.crossSell.scenes).length > 0
      ? _cfg.crossSell.scenes
      : _fallbackScenes;

  // ─── Solutions cross-sell data ─────────────────────────────────
  // Solutions pages recommend complementary services, NOT products
  var SOLUTIONS_CROSS_SELL = {
    oem: [
      { slug: "rd", label: "R&D Lab", reason: "OEM + R&D for precision formula development", highlight: "R&D enabled" },
      {
        slug: "packaging",
        label: _t("cross_sell_packaging") || "Custom Packaging",
        reason: "OEM + custom packaging for unified branding",
        highlight: "Brand unity",
      },
      {
        slug: "obm",
        label: "OBM Full Service",
        reason: "Upgrade OEM to OBM, from contract to own brand",
        highlight: "Brand upgrade",
      },
    ],
    odm: [
      {
        slug: "rd",
        label: "R&D Lab",
        reason: "ODM deep R&D collaboration for differentiated design",
        highlight: "Deep customization",
      },
      {
        slug: "packaging",
        label: _t("cross_sell_packaging") || "Custom Packaging",
        reason: "ODM + exclusive packaging for competitive edge",
        highlight: "Differentiation",
      },
      {
        slug: "oem",
        label: "OEM Manufacturing",
        reason: "ODM to OEM mass production scale-up",
        highlight: "Mass production guarantee",
      },
    ],
    obm: [
      { slug: "rd", label: "R&D Lab", reason: "OBM core strength from continuous R&D", highlight: "Core driver" },
      {
        slug: "oem",
        label: "OEM Manufacturing",
        reason: "OBM + OEM flexible capacity supplement",
        highlight: "Capacity flexibility",
      },
      {
        slug: "odm",
        label: "ODM Design",
        reason: "OBM line expansion via ODM proven solutions",
        highlight: "Fast expansion",
      },
    ],
    rd: [
      {
        slug: "oem",
        label: "OEM Manufacturing",
        reason: "R&D results scaled via OEM production",
        highlight: "R&D realized",
      },
      {
        slug: "packaging",
        label: _t("cross_sell_packaging") || "Custom Packaging",
        reason: "New R&D products with innovative packaging",
        highlight: "Product innovation",
      },
      {
        slug: "odm",
        label: "ODM Design",
        reason: "R&D + design synergy for faster launch",
        highlight: "Synergy acceleration",
      },
    ],
    packaging: [
      {
        slug: "oem",
        label: "OEM Manufacturing",
        reason: "Packaging design + OEM for end-to-end delivery",
        highlight: "End-to-end delivery",
      },
      {
        slug: "odm",
        label: "ODM Design",
        reason: "Packaging integrated with product design",
        highlight: "Design unity",
      },
      {
        slug: "rd",
        label: "R&D Lab",
        reason: "Functional packaging requires R&D support",
        highlight: "Technical support",
      },
    ],
  };

  // Solutions scene links (service deep-dives)
  var SOLUTIONS_SCENE_MAP = {
    oem: [
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "ISO/HACCP/Halal multi-certification, fully traceable quality",
      },
    ],
    odm: [
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "ODM products pass strict QC, guaranteed every batch",
      },
    ],
    obm: [
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "OBM brand quality endorsement, full certification coverage",
      },
    ],
    rd: [
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "R&D lab meets international standards, safe and compliant",
      },
    ],
    packaging: [
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Packaging materials pass food-grade safety testing",
      },
    ],
  };

  // ─── Product Detail cross-sell data ───────────────────────────
  // PDP pages recommend same-category products, NOT services
  var PDP_CROSS_SELL = {};
  // Will be populated dynamically from PRODUCT_SLUGS — same category only
  Object.keys(CROSS_SELL_MAP).forEach(function (catSlug) {
    PDP_CROSS_SELL[catSlug] = CROSS_SELL_MAP[catSlug];
  });

  // ─── Products page scene links (services) ─────────────────────
  // Product category pages show service scene links
  var PRODUCTS_SERVICE_SCENE = {
    coffee: [
      {
        href: "/solutions/oem/",
        slug: "oem",
        icon: "precision_manufacturing",
        desc: "Private Label OEM service for coffee brands",
      },
      {
        href: "/solutions/packaging/",
        slug: "packaging",
        icon: "inventory_2",
        desc: "Custom packaging design for coffee",
      },
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Halal / ISO / HACCP international quality certification",
      },
    ],
    tea: [
      {
        href: "/solutions/oem/",
        slug: "oem",
        icon: "precision_manufacturing",
        desc: "Private Label OEM for tea brands",
      },
      {
        href: "/solutions/packaging/",
        slug: "packaging",
        icon: "inventory_2",
        desc: "Custom packaging design for tea",
      },
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Halal / ISO / HACCP international quality certification",
      },
    ],
    meal: [
      {
        href: "/solutions/oem/",
        slug: "oem",
        icon: "precision_manufacturing",
        desc: "Private Label OEM for meal replacement brands",
      },
      {
        href: "/solutions/packaging/",
        slug: "packaging",
        icon: "inventory_2",
        desc: "Custom portable packaging for meal replacement",
      },
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Halal / ISO / HACCP international quality certification",
      },
    ],
    beauty: [
      {
        href: "/solutions/oem/",
        slug: "oem",
        icon: "precision_manufacturing",
        desc: "Private Label OEM for beauty food",
      },
      {
        href: "/solutions/packaging/",
        slug: "packaging",
        icon: "inventory_2",
        desc: "Custom premium packaging for beauty products",
      },
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Halal / ISO / HACCP international quality certification",
      },
    ],
    weight: [
      {
        href: "/solutions/oem/",
        slug: "oem",
        icon: "precision_manufacturing",
        desc: "Private Label OEM for weight management",
      },
      {
        href: "/solutions/packaging/",
        slug: "packaging",
        icon: "inventory_2",
        desc: "Custom packaging for weight management",
      },
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Halal / ISO / HACCP international quality certification",
      },
    ],
    gut: [
      {
        href: "/solutions/oem/",
        slug: "oem",
        icon: "precision_manufacturing",
        desc: "Private Label OEM for probiotics",
      },
      {
        href: "/solutions/packaging/",
        slug: "packaging",
        icon: "inventory_2",
        desc: "Custom active packaging for probiotics",
      },
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Halal / ISO / HACCP international quality certification",
      },
    ],
    lifestyle: [
      {
        href: "/solutions/oem/",
        slug: "oem",
        icon: "precision_manufacturing",
        desc: "Private Label OEM for lifestyle foods",
      },
      {
        href: "/solutions/packaging/",
        slug: "packaging",
        icon: "inventory_2",
        desc: "Custom packaging for lifestyle brands",
      },
      {
        href: "/solutions/quality/",
        slug: "quality",
        icon: "verified",
        desc: "Halal / ISO / HACCP international quality certification",
      },
    ],
  };

  // Service labels for solutions cross-sell
  var SOLUTION_LABELS = {
    oem: "OEM Manufacturing",
    odm: "ODM Design",
    obm: "OBM Full Service",
    rd: "R&D Lab",
    packaging: _t("cross_sell_packaging") || "Custom Packaging",
    quality: "Quality Certified",
  };

  // ─── Detect current page type ──────────────────────────────────

  var PAGE_TYPE = { SOLUTIONS: "solutions", PRODUCTS: "products", DETAIL: "detail", OTHER: "other" };

  function getPagePath() {
    return (window.location.pathname || "/").replace(/\/$/, "");
  }

  function isSolutionsPage() {
    var path = getPagePath();
    return /^\/solutions\/(oem|odm|obm|rd|packaging)(\/)?$/.test(path);
  }

  function getSolutionsSlug() {
    var path = getPagePath();
    var m = path.match(/^\/solutions\/([^/]+)/);
    return m ? m[1] : null;
  }

  function isProductsCategoryPage() {
    var path = getPagePath();
    return /^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle)(\/)?$/.test(path);
  }

  function detectCategorySlug() {
    var path = getPagePath();
    var match = path.match(/^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle)$/);
    return match ? match[1] : null;
  }

  function isPdpPage() {
    var path = getPagePath();
    return /^\/products\/(detail\/?(?:\?model=([^&]+))?|([^/]+))$/.test(path);
  }

  function detectPageType() {
    if (isSolutionsPage()) return PAGE_TYPE.SOLUTIONS;
    if (isPdpPage()) return PAGE_TYPE.DETAIL;
    if (isProductsCategoryPage()) return PAGE_TYPE.PRODUCTS;
    return PAGE_TYPE.OTHER;
  }

  // ─── Helpers ───────────────────────────────────────────────────

  function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ─── Cross-sell renderer ──────────────────────────────────────

  // ─── Solutions cross-sell renderer ──────────────────────────────

  function renderSolutionsCrossSell(slug) {
    var items = SOLUTIONS_CROSS_SELL[slug];
    if (!items || !items.length) return "";

    var currentLabel = SOLUTION_LABELS[slug] || slug;
    var html = '<div class="text-center mb-8">';
    html +=
      '<h3 class="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2">' +
      tl("cross_sell_title", "搭配推荐") +
      "</h3>";
    html +=
      '<p class="text-sm text-slate-500 dark:text-slate-400">' +
      tl("cross_sell_subtitle", "选择" + currentLabel + "的客户还关注了").replace("{cat}", esc(currentLabel)) +
      "</p>";
    html += "</div>";

    var gridCols = items.length >= 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3";
    html += '<div class="grid ' + gridCols + ' gap-3 lg:gap-6">';

    items.forEach(function (item) {
      var label = item.label || SOLUTION_LABELS[item.slug] || item.slug;
      var icon = "business_center";
      var href = "/solutions/" + item.slug + "/";

      html +=
        '<a href="' +
        href +
        '" class="group relative flex items-center gap-3 p-3 md:p-5 lg:p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">';

      html += '<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">';
      html += '<span class="material-symbols-outlined text-primary text-lg">' + icon + "</span>";
      html += "</div>";

      html += '<div class="flex-1 min-w-0">';
      html +=
        '<div class="flex items-center justify-between gap-2">' +
        '<span class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">' +
        esc(label) +
        "</span>";
      html +=
        '<span class="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all text-lg shrink-0">arrow_forward</span>';
      html += "</div>";
      html +=
        '<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 truncate">' +
        esc(item.reason) +
        "</p>";
      html += "</div>";

      html +=
        '<span class="hidden md:inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold shrink-0">' +
        esc(item.highlight) +
        "</span>";

      html += "</a>";
    });
    html += "</div>";
    return html;
  }

  // ─── Solutions scene renderer ──────────────────────────────────

  function renderSolutionsScene(slug) {
    var scenes = SOLUTIONS_SCENE_MAP[slug];
    if (!scenes || !scenes.length) return "";

    var html = '<div class="mt-10 lg:mt-12">';
    html += '<div class="text-center mb-8">';
    html +=
      '<h3 class="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2">' +
      tl("scene_entry_title", "适用场景") +
      "</h3>";
    html +=
      '<p class="text-sm text-slate-500 dark:text-slate-400">' + tl("scene_entry_subtitle", "相关服务推荐") + "</p>";
    html += "</div>";

    html += '<div class="grid grid-cols-1 md:grid-cols-1 gap-4 lg:gap-6">';

    scenes.forEach(function (scene) {
      var label = SOLUTION_LABELS[scene.slug] || getAppLabel(scene.slug);

      html +=
        '<a href="' +
        scene.href +
        '" class="group relative block p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden">';

      html +=
        '<div class="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>';

      html += '<div class="relative">';

      html += '<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">';
      html += '<span class="material-symbols-outlined text-primary text-xl">' + scene.icon + "</span>";
      html += "</div>";

      html +=
        '<h4 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">' +
        esc(label) +
        "</h4>";

      html += '<p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">' + esc(scene.desc) + "</p>";

      html +=
        '<div class="flex items-center gap-1 mt-4 text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">';
      html += "<span>" + tl("scene_view_detail", "查看方案") + "</span>";
      html +=
        '<span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-all">arrow_forward</span>';
      html += "</div>";

      html += "</div>";
      html += "</a>";
    });
    html += "</div>";
    html += "</div>";
    return html;
  }

  // ─── Products page service scene renderer ──────────────────────

  function renderProductsServiceScene(slug) {
    var scenes = PRODUCTS_SERVICE_SCENE[slug];
    if (!scenes || !scenes.length) return SCENE_ENTRY_MAP[slug] ? renderSceneEntry(slug) : "";

    var html = '<div class="mt-10 lg:mt-12">';
    html += '<div class="text-center mb-8">';
    html +=
      '<h3 class="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2">' +
      tl("scene_entry_title", "配套服务") +
      "</h3>";
    html +=
      '<p class="text-sm text-slate-500 dark:text-slate-400">' + tl("scene_entry_subtitle", "全链路服务支持") + "</p>";
    html += "</div>";

    html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">';

    scenes.forEach(function (scene) {
      var label = SOLUTION_LABELS[scene.slug] || getAppLabel(scene.slug);

      html +=
        '<a href="' +
        scene.href +
        '" class="group relative block p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden">';

      html +=
        '<div class="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>';

      html += '<div class="relative">';

      html += '<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">';
      html += '<span class="material-symbols-outlined text-primary text-xl">' + scene.icon + "</span>";
      html += "</div>";

      html +=
        '<h4 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">' +
        esc(label) +
        "</h4>";

      html += '<p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">' + esc(scene.desc) + "</p>";

      html +=
        '<div class="flex items-center gap-1 mt-4 text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">';
      html += "<span>" + tl("scene_view_detail", "查看方案") + "</span>";
      html +=
        '<span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-all">arrow_forward</span>';
      html += "</div>";

      html += "</div>";
      html += "</a>";
    });
    html += "</div>";
    html += "</div>";
    return html;
  }

  // ─── Cross-sell renderer ──────────────────────────────────────

  function renderCrossSell(slug) {
    var items = CROSS_SELL_MAP[slug];
    if (!items || !items.length) return "";

    var catLabel = tl(PRODUCT_SLUGS[slug].label, PRODUCT_SLUGS[slug].label);
    var html = '<div class="text-center mb-8">';
    html +=
      '<h3 class="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2">' +
      tl("cross_sell_title", "搭配推荐") +
      "</h3>";
    html +=
      '<p class="text-sm text-slate-500 dark:text-slate-400">' +
      tl("cross_sell_subtitle", "买了" + catLabel + "的客户还配了").replace("{cat}", esc(catLabel)) +
      "</p>";
    html += "</div>";

    // Responsive grid: 1 col mobile (single row, no squeeze), 2 cols tablet, 4 cols PC
    var gridCols = items.length >= 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2";
    html += '<div class="grid ' + gridCols + ' gap-3 lg:gap-6">';

    items.forEach(function (item) {
      var info = PRODUCT_SLUGS[item.slug];
      var label = tl(info.label, info.label);

      html +=
        '<a href="/products/' +
        item.slug +
        '/" class="group relative flex items-center gap-3 p-3 md:p-5 lg:p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">';

      // Icon
      html += '<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">';
      html += '<span class="material-symbols-outlined text-primary text-lg">' + info.icon + "</span>";
      html += "</div>";

      // Text content (name + description)
      html += '<div class="flex-1 min-w-0">';
      html +=
        '<div class="flex items-center justify-between gap-2">' +
        '<span class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">' +
        esc(label) +
        "</span>";
      html +=
        '<span class="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all text-lg shrink-0">arrow_forward</span>';
      html += "</div>";
      html +=
        '<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 truncate">' +
        esc(item.reason) +
        "</p>";
      html += "</div>";

      // Highlight badge (hidden on mobile, shown md+)
      html +=
        '<span class="hidden md:inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold shrink-0">' +
        esc(item.highlight) +
        "</span>";

      html += "</a>";
    });
    html += "</div>";
    return html;
  }

  // ─── Scene entry renderer ─────────────────────────────────────

  function renderSceneEntry(slug) {
    var scenes = SCENE_ENTRY_MAP[slug];
    if (!scenes || !scenes.length) return "";

    var html = '<div class="mt-10 lg:mt-12">';
    html += '<div class="text-center mb-8">';
    html +=
      '<h3 class="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2">' +
      tl("scene_entry_title", "适用场景") +
      "</h3>";
    html +=
      '<p class="text-sm text-slate-500 dark:text-slate-400">' +
      tl("scene_entry_subtitle", "看看这些场景怎么用") +
      "</p>";
    html += "</div>";

    html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">';

    scenes.forEach(function (scene) {
      var label = getAppLabel(scene.slug);

      html +=
        '<a href="' +
        scene.href +
        '" class="group relative block p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden">';

      // Decorative gradient blob
      html +=
        '<div class="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>';

      html += '<div class="relative">';

      // Icon
      html += '<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">';
      html += '<span class="material-symbols-outlined text-primary text-xl">' + scene.icon + "</span>";
      html += "</div>";

      // Label
      html +=
        '<h4 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">' +
        esc(label) +
        "</h4>";

      // Description
      html += '<p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">' + esc(scene.desc) + "</p>";

      // Arrow indicator
      html +=
        '<div class="flex items-center gap-1 mt-4 text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">';
      html += "<span>" + tl("scene_view_detail", "查看方案") + "</span>";
      html +=
        '<span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-all">arrow_forward</span>';
      html += "</div>";

      html += "</div>";
      html += "</a>";
    });
    html += "</div>"; // close grid
    html += "</div>"; // close mt-10 wrapper
    return html;
  }

  // ─── PDP category nav ─────────────────────────────────────────

  function updatePdpCategoryNav() {
    if (!isPdpPage()) return;
    var nav = document.getElementById("product-category-nav");
    if (!nav) return;

    var referrer;
    try {
      referrer = sessionStorage.getItem("pdp_referrer");
    } catch (e) {
      referrer = null;
    }
    referrer = referrer || "";
    var refSlug = referrer.replace(/\/$/, "").split("/").pop();
    if (refSlug && PRODUCT_SLUGS[refSlug]) {
      showPdpNav(nav, refSlug);
      return;
    }

    window.addEventListener("product-data-ready", function onReady() {
      window.removeEventListener("product-data-ready", onReady);
      if (window.ProductGrid && window.ProductGrid.getAllProducts) {
        var path = (window.location.pathname || "/").replace(/\/$/, "");
        var pdpMatch = path.match(/^\/products\/(detail\/?(?:\?model=([^&]+))?|([^/]+))$/);
        var model = pdpMatch ? pdpMatch[2] || pdpMatch[3] || "" : "";
        var products = window.ProductGrid.getAllProducts();
        var found = products.find(function (p) {
          return p.model === model;
        });
        if (found && found._category) {
          var slug = CATEGORY_KEY_TO_SLUG[found._category] || "";
          if (slug) showPdpNav(nav, slug);
        }
      }
    });
  }

  function showPdpNav(nav, slug) {
    var info = PRODUCT_SLUGS[slug];
    if (!info) return;
    var label = tl(info.label, info.label);
    var catLink = nav.querySelector("#pdp-category-link");
    if (catLink) {
      catLink.href = "/products/" + slug + "/";
      catLink.textContent = label;
      catLink.setAttribute("data-i18n", info.key);
    }
    nav.classList.remove("hidden");
  }

  // ─── Referrer tracking ─────────────────────────────────────────

  function trackPdpReferrer() {
    var path = (window.location.pathname || "/").replace(/\/$/, "");
    if (/^\/products\/(coffee|tea|meal|beauty|weight|gut|lifestyle)$/.test(path)) {
      try {
        sessionStorage.setItem("pdp_referrer", path);
      } catch (e) {}
    }
  }

  // ─── Init ─────────────────────────────────────────────────────

  // ─── Render helper (always available) ─────────────────────────
  var _externalSlug = null;

  function renderCrossSellForCurrentPage(overrideSlug) {
    var pageType = detectPageType();
    var slug = overrideSlug || _externalSlug || detectCategorySlug();
    var solSlug = getSolutionsSlug();

    var crossSellContainer = document.getElementById("cross-sell-container");
    var sceneEntryContainer = document.getElementById("scene-entry-container");

    if (pageType === PAGE_TYPE.SOLUTIONS && solSlug) {
      // Solutions pages: recommend complementary services, NOT products
      if (crossSellContainer) {
        var solCrossHtml = renderSolutionsCrossSell(solSlug);
        if (solCrossHtml) {
          crossSellContainer.innerHTML = solCrossHtml;
        }
      }
      if (sceneEntryContainer) {
        var solSceneHtml = renderSolutionsScene(solSlug);
        if (solSceneHtml) {
          sceneEntryContainer.innerHTML = solSceneHtml;
        }
      }
      return;
    }

    if (pageType === PAGE_TYPE.DETAIL) {
      // PDP: recommend same-category products, NOT services
      // Slug comes from product data or referrer
      var pdpSlug = resolvePdpSlug();
      if (!pdpSlug) return;
      if (crossSellContainer) {
        var pdpCrossHtml = renderCrossSell(pdpSlug);
        if (pdpCrossHtml) {
          crossSellContainer.innerHTML = pdpCrossHtml;
        }
      }
      // No scene links on PDP
      return;
    }

    // Products category pages
    if (!slug) return;
    if (slug !== "all") {
      if (crossSellContainer) {
        var crossSellHtml = renderCrossSell(slug);
        if (crossSellHtml) {
          crossSellContainer.innerHTML = crossSellHtml;
        }
      }
    }
    if (sceneEntryContainer) {
      var sceneHtml = renderProductsServiceScene(slug);
      if (sceneHtml) {
        sceneEntryContainer.innerHTML = sceneHtml;
      }
    }
  }

  // ─── Resolve PDP slug from product data or referrer ──────────

  function resolvePdpSlug() {
    // Try referrer first
    var referrer;
    try {
      referrer = sessionStorage.getItem("pdp_referrer");
    } catch (e) {
      referrer = null;
    }
    referrer = referrer || "";
    var refSlug = referrer.replace(/\/$/, "").split("/").pop();
    if (refSlug && PRODUCT_SLUGS[refSlug]) return refSlug;

    // Try product data
    if (window.ProductGrid && window.ProductGrid.getAllProducts) {
      var path = getPagePath();
      var pdpMatch = path.match(/^\/products\/(detail\/?(?:\?model=([^&]+))?|([^/]+))$/);
      var model = pdpMatch ? pdpMatch[2] || pdpMatch[3] || "" : "";
      var products = window.ProductGrid.getAllProducts();
      var found = products.find(function (p) {
        return p.model === model;
      });
      if (found && found._category) {
        var catSlug = CATEGORY_KEY_TO_SLUG[found._category] || "";
        if (catSlug) return catSlug;
      }
    }
    return null;
  }

  // ─── Init ─────────────────────────────────────────────────────

  function init() {
    trackPdpReferrer();
    updatePdpCategoryNav();
    renderCrossSellForCurrentPage();
  }

  // ─── Public API: allow external category control (e.g. /products/all/ Tab switching) ──
  window.CrossSell = {
    setCategory: function (slug) {
      _externalSlug = slug;
      renderCrossSellForCurrentPage(slug);
    },
    clearCategory: function () {
      _externalSlug = null;
      var cc = document.getElementById("cross-sell-container");
      var sc = document.getElementById("scene-entry-container");
      /* @audit-safe: constant-html */
      /* @audit-safe: constant-html */
      if (cc) cc.innerHTML = "";
      /* @audit-safe: constant-html */
      /* @audit-safe: constant-html */
      if (sc) sc.innerHTML = "";
    },
  };

  // Initial render
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // SPA navigation — always registered, always re-renders for category pages
  _spaOn(document, "spa:load", function () {
    trackPdpReferrer();
    updatePdpCategoryNav();
    // Delay render slightly to ensure DOM is settled after content swap
    setTimeout(function () {
      renderCrossSellForCurrentPage();
    }, 50);
  });
})();
