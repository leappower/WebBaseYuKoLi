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
    if (typeof window.t === "function") {
      var result = window.t(key);
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
      { slug: "tea", reason: "咖啡+茶饮，打造完整饮品线", highlight: "饮品线 +100%" },
      { slug: "beauty", reason: "咖啡+美容食品，健康内调外养", highlight: "客单价 +50%" },
      { slug: "meal", reason: "咖啡+代餐，轻食健康一站式", highlight: "场景拓展" },
      { slug: "lifestyle", reason: "咖啡+生活方式，品牌差异化升级", highlight: "品牌升级" },
    ],
    tea: [
      { slug: "coffee", reason: "茶+咖啡，双饮品线覆盖更多客群", highlight: "客群 +80%" },
      { slug: "weight", reason: "茶+体重管理，减肥茶饮热卖组合", highlight: "复购 +60%" },
      { slug: "gut", reason: "茶+肠道健康，益生菌茶饮新趋势", highlight: "新趋势" },
    ],
    meal: [
      { slug: "coffee", reason: "代餐+咖啡，白领早餐首选组合", highlight: "早餐场景" },
      { slug: "weight", reason: "代餐+减脂，体重管理核心产品线", highlight: "核心品类" },
      { slug: "gut", reason: "代餐+益生菌，营养均衡肠道养护", highlight: "营养均衡" },
    ],
    beauty: [
      { slug: "coffee", reason: "美容+咖啡，胶原蛋白咖啡热卖", highlight: "爆品组合" },
      { slug: "tea", reason: "美容+花茶，天然植物美容新概念", highlight: "天然概念" },
      { slug: "weight", reason: "美容+纤体，内调外养双效方案", highlight: "双效方案" },
      { slug: "gut", reason: "美容+肠道，肠道健康改善肤质", highlight: "由内而外" },
    ],
    weight: [
      { slug: "meal", reason: "减脂+代餐，体重管理黄金搭档", highlight: "黄金搭档" },
      { slug: "coffee", reason: "减脂+黑咖啡，加速代谢燃脂组合", highlight: "加速代谢" },
      { slug: "beauty", reason: "减脂+美容，瘦身美颜一站式", highlight: "瘦身美颜" },
      { slug: "lifestyle", reason: "减脂+生活方式，健康减重可持续", highlight: "可持续" },
    ],
    gut: [
      { slug: "meal", reason: "益生菌+代餐，肠道+营养双改善", highlight: "双改善" },
      { slug: "tea", reason: "益生菌+茶，肠道养护清爽饮品", highlight: "清爽养肠" },
      { slug: "beauty", reason: "益生菌+美容食品，肠道健康显现在肌肤", highlight: "肌肤改善" },
    ],
    lifestyle: [
      { slug: "coffee", reason: "生活方式+咖啡，日常健康饮品标配", highlight: "日常标配" },
      { slug: "tea", reason: "生活方式+茶，慢生活健康理念", highlight: "慢生活" },
      { slug: "weight", reason: "生活方式+体重管理，健康管理闭环", highlight: "健康闭环" },
    ],
  };

  var _fallbackScenes = {
    coffee: [
      { href: "/applications/brand-creation/", slug: "brand-creation", icon: "storefront", desc: "从0到1打造咖啡品牌，OEM一站式交付" },
      { href: "/applications/chain-retail/", slug: "chain-retail", icon: "store", desc: "连锁门店统一出品，品质标准化交付" },
      { href: "/applications/healthy-food/", slug: "healthy-food", icon: "eco", desc: "健康食品品牌，功能性咖啡定制" },
    ],
    tea: [
      { href: "/applications/brand-creation/", slug: "brand-creation", icon: "storefront", desc: "茶饮品牌定制，从配方到包装全链路" },
      { href: "/applications/healthy-food/", slug: "healthy-food", icon: "eco", desc: "健康茶饮系列，天然成分功能定制" },
      { href: "/applications/chain-retail/", slug: "chain-retail", icon: "store", desc: "连锁茶饮标准化出品，稳定供应链" },
    ],
    meal: [
      { href: "/applications/healthy-food/", slug: "healthy-food", icon: "eco", desc: "健康代餐定制，营养配比科学配方" },
      { href: "/applications/chain-retail/", slug: "chain-retail", icon: "store", desc: "连锁便利店代餐产品，标准化量产" },
      { href: "/applications/brand-creation/", slug: "brand-creation", icon: "storefront", desc: "代餐品牌从配方到上市全流程" },
    ],
    beauty: [
      { href: "/applications/brand-creation/", slug: "brand-creation", icon: "storefront", desc: "美容食品品牌定制，从概念到量产" },
      { href: "/applications/healthy-food/", slug: "healthy-food", icon: "eco", desc: "口服美容产品线，胶原蛋白等功能食品" },
      { href: "/applications/chain-retail/", slug: "chain-retail", icon: "store", desc: "美容连锁品牌标准化供货" },
    ],
    weight: [
      { href: "/applications/healthy-food/", slug: "healthy-food", icon: "eco", desc: "体重管理食品定制，科学配比低卡配方" },
      { href: "/applications/brand-creation/", slug: "brand-creation", icon: "storefront", desc: "减脂品牌OEM定制，差异化配方" },
      { href: "/applications/chain-retail/", slug: "chain-retail", icon: "store", desc: "健身房/便利店渠道标准化产品" },
    ],
    gut: [
      { href: "/applications/healthy-food/", slug: "healthy-food", icon: "eco", desc: "益生菌食品定制，活性保障技术方案" },
      { href: "/applications/brand-creation/", slug: "brand-creation", icon: "storefront", desc: "肠道健康品牌定制，差异化菌种方案" },
      { href: "/applications/chain-retail/", slug: "chain-retail", icon: "store", desc: "连锁药房/健康食品店供货" },
    ],
    lifestyle: [
      { href: "/applications/brand-creation/", slug: "brand-creation", icon: "storefront", desc: "生活方式品牌定制，全品类健康食品" },
      { href: "/applications/chain-retail/", slug: "chain-retail", icon: "store", desc: "连锁零售渠道健康食品标准化供货" },
      { href: "/applications/healthy-food/", slug: "healthy-food", icon: "eco", desc: "健康生活食品系列，日常营养补充" },
    ],
  };

  var CROSS_SELL_MAP = ((_cfg.crossSell || {}).map && Object.keys(_cfg.crossSell.map).length > 0) ? _cfg.crossSell.map : _fallbackCrossSell;
  var SCENE_ENTRY_MAP = ((_cfg.crossSell || {}).scenes && Object.keys(_cfg.crossSell.scenes).length > 0) ? _cfg.crossSell.scenes : _fallbackScenes;

  // ─── Solutions cross-sell data ─────────────────────────────────
  // Solutions pages recommend complementary services, NOT products
  var SOLUTIONS_CROSS_SELL = {
    oem: [
      { slug: 'rd', label: 'R&D 研发', reason: 'OEM 配合专业研发，配方定制更精准', highlight: '研发赋能' },
      { slug: 'packaging', label: 'Custom Packaging', reason: 'OEM + 定制包装，品牌视觉一体化', highlight: '品牌一体' },
      { slug: 'obm', label: 'OBM 全案', reason: 'OEM 升级为 OBM，从代工到自有品牌', highlight: '品牌升级' }
    ],
    odm: [
      { slug: 'rd', label: 'R&D 研发', reason: 'ODM 深度研发合作，差异化产品设计', highlight: '深度定制' },
      { slug: 'packaging', label: 'Custom Packaging', reason: 'ODM + 专属包装，产品差异化竞争', highlight: '差异化' },
      { slug: 'oem', label: 'OEM 代工', reason: 'ODM 经典方案转 OEM 批量生产', highlight: '量产保障' }
    ],
    obm: [
      { slug: 'rd', label: 'R&D 研发', reason: 'OBM 核心竞争力来自持续研发投入', highlight: '核心驱动' },
      { slug: 'oem', label: 'OEM 代工', reason: 'OBM 品牌可灵活切换 OEM 产能补充', highlight: '产能弹性' },
      { slug: 'odm', label: 'ODM 设计', reason: 'OBM 产品线扩充借助 ODM 成熟方案', highlight: '快速扩展' }
    ],
    rd: [
      { slug: 'oem', label: 'OEM 代工', reason: '研发成果通过 OEM 高效量产落地', highlight: '研发落地' },
      { slug: 'packaging', label: 'Custom Packaging', reason: '研发新品搭配创新包装设计', highlight: '产品创新' },
      { slug: 'odm', label: 'ODM 设计', reason: '研发与设计协同，加速产品上市', highlight: '协同加速' }
    ],
    packaging: [
      { slug: 'oem', label: 'OEM 代工', reason: '包装设计配合 OEM 生产，全链路交付', highlight: '全链交付' },
      { slug: 'odm', label: 'ODM 设计', reason: '包装方案融入产品设计语言', highlight: '设计统一' },
      { slug: 'rd', label: 'R&D 研发', reason: '功能性包装需研发技术支撑', highlight: '技术支撑' }
    ]
  };

  // Solutions scene links (service deep-dives)
  var SOLUTIONS_SCENE_MAP = {
    oem: [
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'ISO/HACCP/ halal 多体系认证，品质全程可追溯' }
    ],
    odm: [
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'ODM 出品经过严格质检流程，保障每一批次' }
    ],
    obm: [
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'OBM 品牌品质背书，认证体系全面覆盖' }
    ],
    rd: [
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: '研发实验室符合国际标准，安全合规' }
    ],
    packaging: [
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: '包装材料通过食品级安全检测' }
    ]
  };

  // ─── Product Detail cross-sell data ───────────────────────────
  // PDP pages recommend same-category products, NOT services
  var PDP_CROSS_SELL = {};
  // Will be populated dynamically from PRODUCT_SLUGS — same category only
  Object.keys(CROSS_SELL_MAP).forEach(function(catSlug) {
    PDP_CROSS_SELL[catSlug] = CROSS_SELL_MAP[catSlug];
  });

  // ─── Products page scene links (services) ─────────────────────
  // Product category pages show service scene links
  var PRODUCTS_SERVICE_SCENE = {
    coffee: [
      { href: '/solutions/oem/', slug: 'oem', icon: 'precision_manufacturing', desc: 'Private Label 服务，咖啡品牌 OEM 一站式代工' },
      { href: '/solutions/packaging/', slug: 'packaging', icon: 'inventory_2', desc: 'Custom Packaging 咖啡专属包装定制设计' },
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'Halal / ISO / HACCP 国际认证品质保障' }
    ],
    tea: [
      { href: '/solutions/oem/', slug: 'oem', icon: 'precision_manufacturing', desc: 'Private Label 茶饮品牌 OEM 定制代工' },
      { href: '/solutions/packaging/', slug: 'packaging', icon: 'inventory_2', desc: 'Custom Packaging 茶叶包装设计与打样' },
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'Halal / ISO / HACCP 国际认证品质保障' }
    ],
    meal: [
      { href: '/solutions/oem/', slug: 'oem', icon: 'precision_manufacturing', desc: 'Private Label 代餐品牌 OEM 定制生产' },
      { href: '/solutions/packaging/', slug: 'packaging', icon: 'inventory_2', desc: 'Custom Packaging 代餐包装便携设计方案' },
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'Halal / ISO / HACCP 国际认证品质保障' }
    ],
    beauty: [
      { href: '/solutions/oem/', slug: 'oem', icon: 'precision_manufacturing', desc: 'Private Label 美容食品 OEM 配方定制' },
      { href: '/solutions/packaging/', slug: 'packaging', icon: 'inventory_2', desc: 'Custom Packaging 美容产品高端包装定制' },
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'Halal / ISO / HACCP 国际认证品质保障' }
    ],
    weight: [
      { href: '/solutions/oem/', slug: 'oem', icon: 'precision_manufacturing', desc: 'Private Label 减脂食品 OEM 配方开发' },
      { href: '/solutions/packaging/', slug: 'packaging', icon: 'inventory_2', desc: 'Custom Packaging 减脂产品包装定制' },
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'Halal / ISO / HACCP 国际认证品质保障' }
    ],
    gut: [
      { href: '/solutions/oem/', slug: 'oem', icon: 'precision_manufacturing', desc: 'Private Label 益生菌 OEM 菌种定制' },
      { href: '/solutions/packaging/', slug: 'packaging', icon: 'inventory_2', desc: 'Custom Packaging 益生菌活性包装方案' },
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'Halal / ISO / HACCP 国际认证品质保障' }
    ],
    lifestyle: [
      { href: '/solutions/oem/', slug: 'oem', icon: 'precision_manufacturing', desc: 'Private Label 生活方式食品 OEM 定制' },
      { href: '/solutions/packaging/', slug: 'packaging', icon: 'inventory_2', desc: 'Custom Packaging 生活方式品牌包装方案' },
      { href: '/solutions/quality/', slug: 'quality', icon: 'verified', desc: 'Halal / ISO / HACCP 国际认证品质保障' }
    ]
  };

  // Service labels for solutions cross-sell
  var SOLUTION_LABELS = {
    oem: 'OEM 代工',
    odm: 'ODM 设计',
    obm: 'OBM 全案',
    rd: 'R&D 研发',
    packaging: 'Custom Packaging',
    quality: 'Quality 认证'
  };

  // ─── Detect current page type ──────────────────────────────────

  var PAGE_TYPE = { SOLUTIONS: 'solutions', PRODUCTS: 'products', DETAIL: 'detail', OTHER: 'other' };

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
      var icon = 'business_center';
      var href = '/solutions/' + item.slug + '/';

      html +=
        '<a href="' + href + '" class="group relative flex items-center gap-3 p-3 md:p-5 lg:p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">';

      html += '<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">';
      html += '<span class="material-symbols-outlined text-primary text-lg">' + icon + '</span>';
      html += "</div>";

      html += '<div class="flex-1 min-w-0">';
      html +=
        '<div class="flex items-center justify-between gap-2">' +
        '<span class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">' +
        esc(label) +
        '</span>';
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
      '<p class="text-sm text-slate-500 dark:text-slate-400">' +
      tl("scene_entry_subtitle", "相关服务推荐") +
      "</p>";
    html += "</div>";

    html += '<div class="grid grid-cols-1 md:grid-cols-1 gap-4 lg:gap-6">';

    scenes.forEach(function (scene) {
      var label = SOLUTION_LABELS[scene.slug] || getAppLabel(scene.slug);

      html +=
        '<a href="' + scene.href + '" class="group relative block p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden">';

      html += '<div class="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>';

      html += '<div class="relative">';

      html += '<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">';
      html += '<span class="material-symbols-outlined text-primary text-xl">' + scene.icon + '</span>';
      html += "</div>";

      html +=
        '<h4 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">' +
        esc(label) +
        '</h4>';

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
      '<p class="text-sm text-slate-500 dark:text-slate-400">' +
      tl("scene_entry_subtitle", "全链路服务支持") +
      "</p>";
    html += "</div>";

    html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">';

    scenes.forEach(function (scene) {
      var label = SOLUTION_LABELS[scene.slug] || getAppLabel(scene.slug);

      html +=
        '<a href="' + scene.href + '" class="group relative block p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200 dark:border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden">';

      html += '<div class="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>';

      html += '<div class="relative">';

      html += '<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">';
      html += '<span class="material-symbols-outlined text-primary text-xl">' + scene.icon + '</span>';
      html += "</div>";

      html +=
        '<h4 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">' +
        esc(label) +
        '</h4>';

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
    try { referrer = sessionStorage.getItem("pdp_referrer"); } catch(e) { referrer = null; }
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
      try { sessionStorage.setItem("pdp_referrer", path); } catch(e) {}
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
    try { referrer = sessionStorage.getItem("pdp_referrer"); } catch(e) { referrer = null; }
    referrer = referrer || "";
    var refSlug = referrer.replace(/\/$/, "").split("/").pop();
    if (refSlug && PRODUCT_SLUGS[refSlug]) return refSlug;

    // Try product data
    if (window.ProductGrid && window.ProductGrid.getAllProducts) {
      var path = getPagePath();
      var pdpMatch = path.match(/^\/products\/(detail\/?(?:\?model=([^&]+))?|([^/]+))$/);
      var model = pdpMatch ? (pdpMatch[2] || pdpMatch[3] || "") : "";
      var products = window.ProductGrid.getAllProducts();
      var found = products.find(function (p) { return p.model === model; });
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
    renderCrossSellForCurrentPage();
  });
})();
