/* ═══════════════════════════════════════════════════
   case-grid.js — 案例列表 + 筛选逻辑 (OEM/ODM)
   Pure frontend, no backend dependency
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Config Bridge ─────────────────────────────── */
  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _casesCfg = _cfg.cases || {};
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ── Fallback Data (OEM/ODM) ──────────────────── */
  var _fallbackCases = [
    {
      slug: "sea-coffee-brand",
      country: "🇵🇭 Philippines",
      region: "东南亚",
      region_en: "SE Asia",
      industry: "品牌方",
      industry_en: "Brand Owner",
      volume: "500-1000",
      benefit: "Fast Sampling",
      highlight: "定制研发快打样",
      highlight_en: "Custom R&D Fast Sampling",
      lead_time: "7天极速打样",
      lead_time_en: "7-Day Fast Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "FDA+HACCP双认证",
      cert_label_en: "FDA & HACCP Certified",
      monthly_volume: "月产80万条",
      monthly_volume_en: "800K Sachets/Month",
      image: "/assets/images/oem/cases/sea-coffee-brand.webp",
      title: "菲律宾咖啡品牌借力定制研发，7天极速打样抢占东南亚市场",
      title_en: "Filipino Coffee Brand Seizes SEA Market via Custom R&D and 7-Day Sampling",
      quote: "YuKoLi的配方调校精准契合本地口味，7天出样让我们快人一步完成本土合规上市。",
      quote_en:
        "YuKoLi's precise flavor tuning perfectly matched our local market. Their 7-day sampling and FDA compliance got us to launch much faster.",
    },
    {
      slug: "mideast-meal-brand",
      country: "🇦🇪 UAE",
      region: "中东",
      region_en: "Middle East",
      industry: "跨境电商",
      industry_en: "Cross-Border E-Commerce",
      volume: "500-1000",
      benefit: "Halal Compliance",
      highlight: "清真合规小包装",
      highlight_en: "Halal Compliant Mini Packs",
      lead_time: "5天极速打样",
      lead_time_en: "5-Day Fast Sampling",
      moq_label: "MOQ 300起",
      moq_label_en: "MOQ from 300",
      cert_label: "Halal+HACCP双认证",
      cert_label_en: "Halal & HACCP Certified",
      monthly_volume: "月产60万杯",
      monthly_volume_en: "600K Cups/Month",
      image: "/assets/images/oem/cases/mideast-meal-brand.webp",
      title: "阿联酋代餐跨境突围：Halal认证与小包装定制双管齐下",
      title_en: "UAE Meal Replacement Brand Expands E-commerce via Halal Certification & Mini Packs",
      quote: "中东市场对合规要求极严，YuKoLi的Halal资质和灵活小包装让我们迅速赢得本地消费者信任。",
      quote_en:
        "The Middle East has strict compliance. YuKoLi's authentic Halal certification and flexible small packaging quickly won local consumers' trust for our e-commerce launch.",
    },
    {
      slug: "eu-collagen-brand",
      country: "🇩🇪 Germany",
      region: "欧洲",
      region_en: "Europe",
      industry: "大健康",
      industry_en: "Health & Wellness",
      volume: "500-1000",
      benefit: "Multi-Certification",
      highlight: "欧盟品控多规格",
      highlight_en: "EU Standard Multi-Specs",
      lead_time: "7天周期打样",
      lead_time_en: "7-Day Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "ISO 22000认证",
      cert_label_en: "ISO 22000 Certified",
      monthly_volume: "月产40万瓶",
      monthly_volume_en: "400K Bottles/Month",
      image: "/assets/images/oem/cases/eu-collagen-brand.webp",
      title: "德国高端胶原蛋白破局欧盟，多规格严苛品控铸就爆款",
      title_en: "German Premium Collagen Brand Conquers EU Market via Multi-Spec & Strict Quality Control",
      quote: "欧盟标准极其严苛，YuKoLi不仅通过了ISO体系认证，还能提供多规格灵活定制，完美匹配我们的高端定位。",
      quote_en:
        "EU standards are extremely strict. YuKoLi not only passed ISO certification but also provided multi-specification flexible customization, perfectly matching our premium brand positioning.",
    },
    {
      slug: "jp-functional-drink",
      country: "🇯🇵 Japan",
      region: "东亚",
      region_en: "East Asia",
      industry: "新消费品牌",
      industry_en: "Neo-Consumer Brand",
      volume: "<200",
      benefit: "R&D Strength",
      highlight: "深度研发严品控",
      highlight_en: "Deep R&D Precision QC",
      lead_time: "6天极速打样",
      lead_time_en: "6-Day Fast Sampling",
      moq_label: "MOQ 100起",
      moq_label_en: "MOQ from 100",
      cert_label: "HACCP+ISO双认证",
      cert_label_en: "HACCP & ISO Certified",
      monthly_volume: "月产90万支",
      monthly_volume_en: "900K Pouches/Month",
      image: "/assets/images/oem/cases/jp-functional-drink.webp",
      title: "日本机能饮品品牌落地，精研配方与品控攻克日标合规壁垒",
      title_en: "Japanese Functional Drink Brand Achieves Local Compliance via Precision R&D and Strict QC",
      quote: "日本市场对成分与品控的挑剔众所周知，YuKoLi的研发深度与精细品控让我们安心实现本土化落地。",
      quote_en:
        "The Japanese market is notoriously picky about ingredients and quality control. YuKoLi's deep R&D and precision manufacturing gave us complete confidence for local compliance.",
    },
    {
      slug: "na-probiotic-brand",
      country: "🇺🇸 USA",
      region: "北美",
      region_en: "North America",
      industry: "大健康",
      industry_en: "Health & Wellness",
      volume: "500-1000",
      benefit: "Multi-Certification",
      highlight: "HACCP冷链保活",
      highlight_en: "HACCP Cold Chain Viability",
      lead_time: "7天专业打样",
      lead_time_en: "7-Day Pro Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "FDA+HACCP认证",
      cert_label_en: "FDA & HACCP Certified",
      monthly_volume: "月产80万盒",
      monthly_volume_en: "800K Units/Month",
      image: "/assets/images/oem/cases/na-probiotic-brand.webp",
      title: "北美益生菌冲饮合规出海，HACCP冷链方案护航月销百万",
      title_en: "NA Probiotic Brand Achieves Compliance & Sales Boost via HACCP Cold Chain",
      quote: "YuKoLi的FDA注册和冷链方案彻底解决了我们的合规与活性难题，让高活菌冲饮顺利入北美。",
      quote_en:
        "YuKoLi's comprehensive FDA registration and cold chain solutions resolved our compliance and probiotic viability challenges, ensuring smooth entry into the North American market.",
    },
    {
      slug: "au-tea-chain",
      country: "🇦🇺 Australia",
      region: "大洋洲",
      region_en: "Oceania",
      industry: "连锁品牌",
      industry_en: "Chain Brand",
      volume: "1000+",
      benefit: "Cold Chain",
      highlight: "千店一味稳供应",
      highlight_en: "Consistent Flavor Supply",
      lead_time: "5天极速打样",
      lead_time_en: "5-Day Rapid Sampling",
      moq_label: "MOQ 300起",
      moq_label_en: "MOQ from 300",
      cert_label: "ISO 22000认证",
      cert_label_en: "ISO 22000 Certified",
      monthly_volume: "月产120万包",
      monthly_volume_en: "1.2M Units/Month",
      image: "/assets/images/oem/cases/au-tea-chain.webp",
      title: "澳洲茶饮连锁口味定制标准化，标签合规助阵百店同频",
      title_en: "Australian Tea Chain Standardizes Flavor & Achieves Label Compliance Across 100 Stores",
      quote: "从口味调校到澳洲标签合规，YuKoLi实现了全部门店风味统一，是连锁品牌最可靠的后盾。",
      quote_en:
        "From flavor tuning to Australian label compliance, YuKoLi ensured consistent taste across all our stores. They are the most reliable supply backbone for chain brands.",
    },
    {
      slug: "af-weight-brand",
      country: "🇳🇬 Nigeria",
      region: "非洲",
      region_en: "Africa",
      industry: "跨境电商",
      industry_en: "Cross-Border E-Commerce",
      volume: "<200",
      benefit: "Fast Sampling",
      highlight: "灵活试错快打样",
      highlight_en: "Flexible MOQ Fast Sampling",
      lead_time: "5天极速打样",
      lead_time_en: "5-Day Rapid Sampling",
      moq_label: "MOQ 100起",
      moq_label_en: "MOQ from 100",
      cert_label: "Halal认证",
      cert_label_en: "Halal Certified",
      monthly_volume: "月产30万瓶",
      monthly_volume_en: "300K Units/Month",
      image: "/assets/images/oem/cases/af-weight-brand.webp",
      title: "非洲跨境电商业绩翻倍：低门槛试错与合规双驱狂奔",
      title_en: "African Cross-border Weight Management Brand Doubles Sales via Flexible MOQ & Compliance",
      quote: "极低的起订量和5天打样让我们敢测新品，YuKoLi的非洲合规指导更帮我们避开了大坑。",
      quote_en:
        "The extremely low MOQ and 5-day sampling gave us the confidence to test new products. YuKoLi's African compliance guidance helped us avoid major pitfalls.",
    },
    {
      slug: "cn-new-consumer",
      country: "🇨🇳 China",
      region: "中国",
      region_en: "China",
      industry: "新消费品牌",
      industry_en: "Neo-Consumer Brand",
      volume: "1000+",
      benefit: "R&D Strength",
      highlight: "创研一体全交付",
      highlight_en: "Co-Creation Full Delivery",
      lead_time: "6天定制打样",
      lead_time_en: "6-Day Custom Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "ISO 22000认证",
      cert_label_en: "ISO 22000 Certified",
      monthly_volume: "月产200万瓶",
      monthly_volume_en: "2M Units/Month",
      image: "/assets/images/oem/cases/cn-new-consumer.webp",
      title: "国潮功能性饮品引爆社媒，配方共创到全链路极速交付",
      title_en: "Chinese Neo-Consumer Functional Beverage Goes Viral via Formula Co-Creation & Full-Link Delivery",
      quote: "从0到1的配方共创和极速交付能力，YuKoLi帮我们在红海中跑出爆款，全面领先。",
      quote_en:
        "From 0 to 1 formula co-creation to rapid full-link delivery, YuKoLi helped us launch a viral hit in a red ocean market, keeping us ahead.",
    },
  ];

  var _fallbackFilters = {
    industry: {
      label: "场景",
      label_en: "Scenario",
      i18n: "cases_filter_industry",
      options: ["品牌方", "连锁品牌", "跨境电商", "大健康", "新消费品牌"],
    },
    volume: {
      label: "月订单量",
      label_en: "Monthly Volume",
      i18n: "cases_filter_volume",
      options: ["<200", "200-500", "500-1000", "1000+"],
    },
    region: {
      label: "地区",
      label_en: "Region",
      i18n: "cases_filter_region",
      options: ["东南亚", "中东", "欧洲", "东亚", "北美", "大洋洲", "非洲", "中国"],
    },
    benefit: {
      label: "核心优势",
      label_en: "Key Benefit",
      i18n: "cases_filter_benefit",
      options: ["Fast Sampling", "Halal Compliance", "Multi-Certification", "R&D Strength", "Cold Chain"],
    },
  };

  /* ── State ──────────────────────────────────────── */
  var ROI_CASES = _casesCfg.grid || _fallbackCases;
  var FILTERS = _casesCfg.filters || _fallbackFilters;

  var activeFilters = { industry: null, volume: null, region: null, benefit: null };

  /* ── Helpers ────────────────────────────────────── */
  function currentLang() {
    try { return localStorage.getItem('userLanguage') || document.documentElement.lang || 'zh-CN'; }
    catch(e) { return 'zh-CN'; }
  }

  function l10n(c, field) {
    var lang = currentLang();
    if (lang !== 'zh-CN' && c[field + '_en']) return c[field + '_en'];
    return c[field] || '';
  }

  function benefitColor(benefit) {
    var map = {
      "Fast Sampling": "#3b82f6",
      "Halal Compliance": "#10b981",
      "Multi-Certification": "#8b5cf6",
      "Rapid Delivery": "#f59e0b",
      "High Volume": "#ef4444",
      "Flexible MOQ": "#06b6d4",
      "Precision Nutrition": "#ec4899",
      "Global Logistics": "#6366f1"
    };
    return map[benefit] || "#6366f1";
  }

  function benefitLabel(key) {
    var map = {
      "Fast Sampling": "快打样",
      "Halal Compliance": "清真合规",
      "Multi-Certification": "多认证",
      "R&D Strength": "研发实力",
      "Cold Chain": "冷链方案",
    };
    return map[key] || key;
  }

  function benefitIcon(key) {
    var map = {
      "Fast Sampling": "bolt",
      "Halal Compliance": "verified",
      "Multi-Certification": "verified",
      "R&D Strength": "science",
      "Cold Chain": "ac_unit",
    };
    return map[key] || "star";
  }

  /* ── Dynamic i18n helper ───────────────────────── */
  function translateDynamic(container) {
    var tm = window.translationManager;
    if (!tm || typeof tm.translate !== "function") return;
    var els = container.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute("data-i18n");
      var text = tm.translate(key);
      if (!text || text === key) continue;
      // Use setElementTranslation for proper segment handling, fallback to textContent
      if (typeof tm.setElementTranslation === "function") {
        tm.setElementTranslation(els[i], text);
      } else {
        // Replace first text node only (preserve child elements like icons)
        for (var j = 0; j < els[i].childNodes.length; j++) {
          if (els[i].childNodes[j].nodeType === 3) {
            els[i].childNodes[j].textContent = text;
            break;
          }
        }
      }
    }
  }

  function translateAllDynamic() {
    var grid = document.getElementById("case-grid");
    var filters = document.getElementById("case-filters");
    if (grid) translateDynamic(grid);
    if (filters) translateDynamic(filters);
  }

  /* ── Rendering ──────────────────────────────────── */

  /**
   * Render a single case card (PC variant — used for PC & Tablet)
   */
  function renderCardPc(c) {
    var barColor = benefitColor(c.benefit);
    return (
      '<div class="case-card bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group border border-slate-200 dark:border-slate-700 hover:border-primary/50 flex flex-col">' +
      "<!-- 顶部色条 -->" +
      '<div class="w-full h-1 flex-shrink-0" style="background:' + esc(barColor) + '"></div>' +
      "<!-- 上方图片 16:9 -->" +
      '<div class="w-full aspect-video bg-slate-200 dark:bg-slate-700 overflow-hidden relative flex-shrink-0">' +
      '<img loading="lazy" alt="' +
      esc(c.title) +
      '" class="w-full h-full object-cover group-hover:scale-105 transition-transform" src="' +
      esc(c.image) +
      '" />' +
      "</div>" +
      "<!-- 下方内容 -->" +
      '<div class="flex-1 p-5 lg:p-6 flex flex-col gap-2.5">' +
      '<div class="flex flex-wrap items-center gap-2">' +
      '<h3 class="font-bold text-lg lg:text-xl leading-snug text-slate-900 dark:text-white" data-i18n="cases_title_' +
      esc(c.slug) +
      '">' +
      esc(c.title) +
      "</h3>" +
      '<span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold whitespace-nowrap">' +
      esc(l10n(c, 'highlight')) +
      "</span>" +
      '<span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium whitespace-nowrap">' +
      esc(l10n(c, 'country')) +
      "</span>" +
      "</div>" +
      '<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">storefront</span>' +
      esc(l10n(c, 'industry')) +
      "</span>" +
      '<span class="text-slate-300 dark:text-slate-600">·</span>' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">inventory_2</span>' +
      esc(l10n(c, 'monthly_volume')) +
      "</span>" +
      "</div>" +
      '<p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic border-l-4 border-primary-400 pl-3" data-i18n="cases_quote_' +
      esc(c.slug) +
      '">' +
      esc(l10n(c, 'quote')) +
      "</p>" +
      '<div class="grid grid-cols-3 gap-2 mt-1">' +
      '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
      '<div class="text-lg font-black text-primary"><span class="material-symbols-outlined text-xl align-middle">schedule</span></div>' +
      '<div class="text-xs text-slate-500 dark:text-slate-400">' +
      esc(l10n(c, 'lead_time')) +
      "</div>" +
      "</div>" +
      '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
      '<div class="text-lg font-black text-slate-700 dark:text-slate-200"><span class="material-symbols-outlined text-xl align-middle">inventory_2</span></div>' +
      '<div class="text-xs text-slate-500 dark:text-slate-400">' +
      esc(l10n(c, 'moq_label')) +
      "</div>" +
      "</div>" +
      '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
      '<div class="text-base font-black text-primary"><span class="material-symbols-outlined text-xl align-middle">verified</span></div>' +
      '<div class="text-xs text-slate-500 dark:text-slate-400">' +
      esc(l10n(c, 'cert_label')) +
      "</div>" +
      "</div>" +
      "</div>" +
      '<a href="/cases/' +
      esc(c.slug) +
      '/" target="_self" class="inline-flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all mt-auto pt-1">' +
      '<span data-i18n="cases_read_story">查看详情</span>' +
      '<span class="material-symbols-outlined text-base">arrow_forward</span>' +
      "</a>" +
      "</div>" +
      "</div>"
    );
  }

  /**
   * Render a single case card (Mobile variant — compact)
   */
  function renderCardMobile(c) {
    var barColor = benefitColor(c.benefit);
    return (
      '<div class="case-card bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">' +
      "<!-- 顶部色条 -->" +
      '<div class="w-full h-1 flex-shrink-0" style="background:' + esc(barColor) + '"></div>' +
      '<div class="w-full aspect-video bg-slate-200 dark:bg-slate-700 overflow-hidden relative">' +
      '<img loading="lazy" alt="' +
      esc(c.title) +
      '" class="w-full h-full object-cover" src="' +
      esc(c.image) +
      '" />' +
      "</div>" +
      '<div class="p-4 flex flex-col gap-2">' +
      '<div class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">storefront</span>' +
      esc(l10n(c, 'industry')) +
      "</span>" +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">inventory_2</span>' +
      esc(l10n(c, 'monthly_volume')) +
      "</span>" +
      "</div>" +
      '<div class="flex flex-wrap items-center gap-1.5">' +
      '<h3 class="font-bold text-base leading-snug" data-i18n="cases_title_' +
      esc(c.slug) +
      '">' +
      esc(c.title) +
      "</h3>" +
      '<span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold whitespace-nowrap">' +
      esc(l10n(c, 'highlight')) +
      "</span>" +
      '<span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium whitespace-nowrap">' +
      esc(l10n(c, 'country')) +
      "</span>" +
      "</div>" +
      '<div class="flex items-center gap-2 text-xs">' +
      '<span class="inline-flex items-center gap-1 text-primary font-semibold"><span class="material-symbols-outlined text-sm">schedule</span>' +
      esc(l10n(c, 'lead_time')) +
      "</span>" +
      '<span class="text-slate-300 dark:text-slate-600">|</span>' +
      '<span class="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold"><span class="material-symbols-outlined text-sm">inventory_2</span>' +
      esc(l10n(c, 'moq_label')) +
      "</span>" +
      '<span class="text-slate-300 dark:text-slate-600">|</span>' +
      '<span class="inline-flex items-center gap-1 text-primary font-semibold"><span class="material-symbols-outlined text-sm">verified</span>' +
      esc(l10n(c, 'cert_label')) +
      "</span>" +
      "</div>" +
      '<p class="text-sm text-slate-600 dark:text-slate-400 italic" data-i18n="cases_quote_' +
      c.slug +
      '">' +
      esc(l10n(c, 'quote')) +
      "</p>" +
      '<a href="/cases/' +
      esc(c.slug) +
      '/" target="_self" class="inline-flex items-center gap-1 text-primary font-bold text-sm mt-1">' +
      '<span data-i18n="cases_read_more">Read More</span>' +
      '<span class="material-symbols-outlined text-base">arrow_forward</span>' +
      "</a>" +
      "</div>" +
      "</div>"
    );
  }

  /**
   * Get filtered cases
   */
  function getFiltered() {
    return ROI_CASES.filter(function (c) {
      for (var key in activeFilters) {
        if (activeFilters[key] && c[key] !== activeFilters[key]) return false;
      }
      return true;
    });
  }

  /**
   * Render all cards into #case-grid
   */
  function renderGrid(variant) {
    var container = document.getElementById("case-grid");
    if (!container) return;
    var cases = getFiltered();
    console.log('[DEBUG/cases] renderGrid: cases.length =', cases.length, ', ROI_CASES.length =', ROI_CASES.length);
    if (cases.length === 0) {
      container.innerHTML =
        '<div class="col-span-full text-center py-16"><p class="text-slate-500 dark:text-slate-400 text-lg" data-i18n="cases_no_results">没有找到匹配的案例，试试调整筛选条件。</p></div>';
      return;
    }
    var html = "";
    for (var i = 0; i < cases.length; i++) {
      html += variant === "mobile" ? renderCardMobile(cases[i]) : renderCardPc(cases[i]);
    }
    container.innerHTML = html;
    translateDynamic(container);

    // Update count
    var countEl = document.getElementById("case-count");
    if (countEl)
      countEl.textContent =
        cases.length +
        " " +
        (
          window._t ||
          function (k) {
            return k;
          }
        )("case_count");
  }

  /* ── Filter UI Builders ─────────────────────────── */

  /**
   * Build horizontal filter bar (PC)
   */
  function buildFiltersPc() {
    var bar = document.getElementById("case-filters");
    if (!bar) return;

    var html = '<div class="flex flex-wrap items-center gap-3">';
    for (var key in FILTERS) {
      var f = FILTERS[key];
      html +=
        '<div class="flex items-center gap-2">' +
        '<span class="text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap" data-i18n="' +
        f.i18n +
        '">' +
        esc(f.label) +
        "</span>" +
        '<div class="flex gap-1">';
      html +=
        '<button data-filter="' +
        key +
        '" data-value="" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white">全部</button>';
      for (var i = 0; i < f.options.length; i++) {
        html +=
          '<button data-filter="' +
          key +
          '" data-value="' +
          f.options[i] +
          '" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary">' +
          f.options[i] +
          "</button>";
      }
      html += "</div></div>";
    }
    html += "</div>";
    bar.innerHTML = html;
    translateDynamic(bar);
  }

  /**
   * Build collapsible filter panel (Tablet)
   */
  function buildFiltersTablet() {
    var bar = document.getElementById("case-filters");
    if (!bar) return;

    var html =
      '<button id="case-filter-toggle" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all">' +
      '<span class="material-symbols-outlined text-primary">tune</span>' +
      '<span data-i18n="cases_filter_toggle">筛选案例</span>' +
      '<span id="case-count" class="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">8</span>' +
      '<span class="material-symbols-outlined ml-auto transition-transform" id="case-filter-arrow">expand_more</span>' +
      "</button>" +
      '<div id="case-filter-panel" class="hidden mt-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg space-y-4">';

    for (var key in FILTERS) {
      var f = FILTERS[key];
      html +=
        "<div>" +
        '<span class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" data-i18n="' +
        f.i18n +
        '">' +
        esc(f.label) +
        "</span>" +
        '<div class="flex flex-wrap gap-1.5">';
      html +=
        '<button data-filter="' +
        key +
        '" data-value="" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white">全部</button>';
      for (var i = 0; i < f.options.length; i++) {
        html +=
          '<button data-filter="' +
          key +
          '" data-value="' +
          f.options[i] +
          '" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary">' +
          f.options[i] +
          "</button>";
      }
      html += "</div></div>";
    }
    html += "</div>";
    bar.innerHTML = html;
    translateDynamic(bar);

    // Toggle logic
    var toggle = document.getElementById("case-filter-toggle");
    var panel = document.getElementById("case-filter-panel");
    var arrow = document.getElementById("case-filter-arrow");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var open = !panel.classList.contains("hidden");
        panel.classList.toggle("hidden");
        if (arrow) arrow.style.transform = open ? "" : "rotate(180deg)";
      });
    }
  }

  /**
   * Build mobile dropdown filters (single-row sticky)
   */
  function buildFiltersMobile() {
    var bar = document.getElementById("case-filters");
    if (!bar) return;

    var html = '<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">';
    for (var key in FILTERS) {
      var f = FILTERS[key];
      html +=
        '<select data-filter-select="' +
        key +
        '"' +
        ' class="case-filter-select flex-shrink-0 px-3 py-2 text-xs font-semibold' +
        " rounded-lg border border-slate-300 dark:border-slate-600" +
        " bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" +
        ' appearance-none cursor-pointer min-w-[110px]"' +
        " style='background-image: url(\"data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22" +
        " width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22" +
        " stroke=%22%2394a3b8%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>\');" +
        " background-repeat: no-repeat; background-position: right 8px center; padding-right: 28px;'>";
      html += '<option value="">' + esc(f.label) + "</option>";
      for (var i = 0; i < f.options.length; i++) {
        html += '<option value="' + f.options[i] + '">' + f.options[i] + "</option>";
      }
      html += "</select>";
    }
    html +=
      '<span id="case-count" class="flex-shrink-0 text-xs font-bold text-primary whitespace-nowrap">8 ' +
      (
        window._t ||
        function (k) {
          return k;
        }
      )("case_count") +
      "</span>";
    html += "</div>";
    bar.innerHTML = html;
    translateDynamic(bar);

    // Bind select change events
    var selects = bar.querySelectorAll(".case-filter-select");
    for (var s = 0; s < selects.length; s++) {
      selects[s].addEventListener("change", function () {
        activeFilters[this.getAttribute("data-filter-select")] = this.value || null;
        renderGrid("mobile");
      });
    }
  }

  /* ── Filter Button Event Binding ────────────────── */
  var _filterClickBound = false;
  function bindFilterButtons() {
    if (_filterClickBound) return;
    _filterClickBound = true;
    var _clickEM = window.DomUtils && new DomUtils.EventManager();
    (_clickEM || { on: function () {} }).on(document, "click", function (e) {
      var btn = e.target.closest(".case-filter-btn");
      if (!btn) return;

      var filterKey = btn.getAttribute("data-filter");
      var value = btn.getAttribute("data-value");

      activeFilters[filterKey] = value || null;

      // Update button states within the same filter group
      var siblings = btn.parentElement.querySelectorAll(".case-filter-btn");
      for (var i = 0; i < siblings.length; i++) {
        siblings[i].className =
          "case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary";
      }
      btn.className =
        "case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white";

      // Determine variant
      var variant = document.body.getAttribute("data-case-variant") || "pc";
      renderGrid(variant);
    });
  }

  /* ── Init ───────────────────────────────────────── */
  var _langListenerBound = false;
  function init(variant) {
    // Auto-detect variant from body attribute (for SPA navigation where variant isn't passed)
    if (!variant) {
      variant = document.body.getAttribute("data-case-variant") || "pc";
    }
    if (variant === "pc") buildFiltersPc();
    else if (variant === "tablet") buildFiltersTablet();
    else buildFiltersMobile();

    renderGrid(variant);
    bindFilterButtons();

    // Listen for language changes to re-translate dynamic content
    if (!_langListenerBound && window.translationManager) {
      _langListenerBound = true;
      window.translationManager.on("languageChanged", function () {
        translateAllDynamic();
      });
    }
  }

  /* ── Auto-init based on data attribute ──────────── */
  window.CaseGrid = { init: init, FILTERS: FILTERS, ROI_CASES: ROI_CASES };
  /* ── SPA navigation: re-init after swup content:replace ── */
  document.addEventListener('spa:load', function() {
    var path = window.location.pathname;
    console.log('[TRACE/cases] spa:load received, path:', path);
    if (/^\/cases\//.test(path) && !/^\/cases\/[a-z0-9-]+\/$/.test(path)) {
      // Only re-init on the listing page, not detail pages
      var variant = document.body.getAttribute('data-case-variant') || 'pc';
      console.log('[TRACE/cases] matched listing page, variant:', variant);
      setTimeout(function() { 
        console.log('[TRACE/cases] calling init, variant:', variant, 'CaseGrid.init:', !!CaseGrid.init);
        init(variant); 
      }, 50);
    } else {
      console.log('[TRACE/cases] NOT a listing page path:', path);
    }
  });

})();
