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
  var _fallbackCases = []; // populate per project

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
    try {
      return localStorage.getItem("userLanguage") || document.documentElement.lang || "zh-CN";
    } catch (e) {
      return "zh-CN";
    }
  }

  function l10n(c, field) {
    var lang = currentLang();
    if (lang === "zh-CN" || lang === "zh-TW" || lang === "zh") return c[field] || c[field + "_en"] || "";
    // Try TranslationManager first
    if (window.translationManager && window.translationManager.translate) {
      var i18nKey = "cases_detail_" + c.slug + "_" + field;
      try {
        var val = window.translationManager.translate(i18nKey);
        if (val && val !== i18nKey) return val;
      } catch (e) {
        /* fall through */
      }
    }
    return c[field + "_en"] || c[field] || "";
  }

  /* ── Filter option i18n key slugs for data-i18n ── */
  var FILTER_OPT_I18N = {
    industry: {
      品牌方: "brand_owner",
      连锁品牌: "chain_brand",
      跨境电商: "cross_border_e_commerce",
      大健康: "health_&_wellness",
      新消费品牌: "neo_consumer_brand",
    },
    region: {
      东南亚: "se_asia",
      中东: "middle_east",
      欧洲: "europe",
      东亚: "east_asia",
      北美: "north_america",
      大洋洲: "oceania",
      非洲: "africa",
      中国: "china",
    },
    benefit: {
      "Fast Sampling": "fast_sampling",
      "Halal Compliance": "halal_compliance",
      "Multi-Certification": "multi_certification",
      "R&D Strength": "randd_strength",
      "Cold Chain": "cold_chain",
    },
  };

  function benefitColor(benefit) {
    var map = {
      "Fast Sampling": "#3b82f6",
      "Halal Compliance": "#10b981",
      "Multi-Certification": "#8b5cf6",
      "Rapid Delivery": "#f59e0b",
      "High Volume": "#ef4444",
      "Flexible MOQ": "#06b6d4",
      "Precision Nutrition": "#ec4899",
      "Global Logistics": "#6366f1",
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
      '<a href="/cases/' +
      esc(c.slug) +
      '/" class="case-card bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group border border-slate-200 dark:border-slate-700 hover:border-primary/50 flex flex-col block no-underline">' +
      "<!-- 顶部色条 -->" +
      '<div class="w-full h-1 flex-shrink-0" style="background:' +
      esc(barColor) +
      '"></div>' +
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
      '<span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold whitespace-nowrap" data-i18n="cases_' +
      esc(c.slug) +
      '_highlight">' +
      esc(l10n(c, "highlight")) +
      "</span>" +
      '<span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium whitespace-nowrap" data-i18n="cases_' +
      esc(c.slug) +
      '_country">' +
      esc(l10n(c, "country")) +
      "</span>" +
      "</div>" +
      '<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">storefront</span><span data-i18n="cases_' +
      esc(c.slug) +
      '_industry">' +
      esc(l10n(c, "industry")) +
      "</span></span>" +
      '<span class="text-slate-300 dark:text-slate-600">·</span>' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">inventory_2</span><span data-i18n="cases_' +
      esc(c.slug) +
      '_monthly_volume">' +
      esc(l10n(c, "monthly_volume")) +
      "</span></span>" +
      "</div>" +
      '<p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic border-l-4 border-primary-400 pl-3" data-i18n="cases_quote_' +
      esc(c.slug) +
      '">' +
      esc(l10n(c, "quote")) +
      "</p>" +
      '<div class="grid grid-cols-3 gap-2 mt-1">' +
      '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
      '<div class="text-lg font-black text-primary"><span class="material-symbols-outlined text-xl align-middle">schedule</span></div>' +
      '<div class="text-xs text-slate-500 dark:text-slate-400" data-i18n="cases_' +
      esc(c.slug) +
      '_lead_time">' +
      esc(l10n(c, "lead_time")) +
      "</div>" +
      "</div>" +
      '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
      '<div class="text-lg font-black text-slate-700 dark:text-slate-200"><span class="material-symbols-outlined text-xl align-middle">inventory_2</span></div>' +
      '<div class="text-xs text-slate-500 dark:text-slate-400" data-i18n="cases_' +
      esc(c.slug) +
      '_moq_label">' +
      esc(l10n(c, "moq_label")) +
      "</div>" +
      "</div>" +
      '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
      '<div class="text-base font-black text-primary"><span class="material-symbols-outlined text-xl align-middle">verified</span></div>' +
      '<div class="text-xs text-slate-500 dark:text-slate-400" data-i18n="cases_' +
      esc(c.slug) +
      '_cert_label">' +
      esc(l10n(c, "cert_label")) +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="inline-flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all mt-auto pt-1">' +
      '<span data-i18n="cases_read_story">查看详情</span>' +
      '<span class="material-symbols-outlined text-base">arrow_forward</span>' +
      "</div>" +
      "</div>" +
      "</a>"
    );
  }

  /**
   * Render a single case card (Mobile variant — compact)
   */
  function renderCardMobile(c) {
    var barColor = benefitColor(c.benefit);
    return (
      '<a href="/cases/' +
      esc(c.slug) +
      '/" class="case-card bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 block no-underline">' +
      "<!-- 顶部色条 -->" +
      '<div class="w-full h-1 flex-shrink-0" style="background:' +
      esc(barColor) +
      '"></div>' +
      '<div class="w-full aspect-video bg-slate-200 dark:bg-slate-700 overflow-hidden relative">' +
      '<img loading="lazy" alt="' +
      esc(c.title) +
      '" class="w-full h-full object-cover" src="' +
      esc(c.image) +
      '" />' +
      "</div>" +
      '<div class="p-4 flex flex-col gap-2">' +
      '<div class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">storefront</span><span data-i18n="cases_' +
      esc(c.slug) +
      '_industry">' +
      esc(l10n(c, "industry")) +
      "</span></span>" +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">inventory_2</span><span data-i18n="cases_' +
      esc(c.slug) +
      '_monthly_volume">' +
      esc(l10n(c, "monthly_volume")) +
      "</span></span>" +
      "</div>" +
      '<div class="flex flex-wrap items-center gap-1.5">' +
      '<h3 class="font-bold text-base leading-snug" data-i18n="cases_title_' +
      esc(c.slug) +
      '">' +
      esc(c.title) +
      "</h3>" +
      '<span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold whitespace-nowrap" data-i18n="cases_' +
      esc(c.slug) +
      '_highlight">' +
      esc(l10n(c, "highlight")) +
      "</span>" +
      '<span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium whitespace-nowrap" data-i18n="cases_' +
      esc(c.slug) +
      '_country">' +
      esc(l10n(c, "country")) +
      "</span>" +
      "</div>" +
      '<div class="flex items-center gap-2 text-xs">' +
      '<span class="inline-flex items-center gap-1 text-primary font-semibold"><span class="material-symbols-outlined text-sm">schedule</span><span data-i18n="cases_' +
      esc(c.slug) +
      '_lead_time">' +
      esc(l10n(c, "lead_time")) +
      "</span></span>" +
      '<span class="text-slate-300 dark:text-slate-600">|</span>' +
      '<span class="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold"><span class="material-symbols-outlined text-sm">inventory_2</span><span data-i18n="cases_' +
      esc(c.slug) +
      '_moq_label">' +
      esc(l10n(c, "moq_label")) +
      "</span></span>" +
      '<span class="text-slate-300 dark:text-slate-600">|</span>' +
      '<span class="inline-flex items-center gap-1 text-primary font-semibold"><span class="material-symbols-outlined text-sm">verified</span><span data-i18n="cases_' +
      esc(c.slug) +
      '_cert_label">' +
      esc(l10n(c, "cert_label")) +
      "</span></span>" +
      "</div>" +
      '<p class="text-sm text-slate-600 dark:text-slate-400 italic" data-i18n="cases_quote_' +
      c.slug +
      '">' +
      esc(l10n(c, "quote")) +
      "</p>" +
      '<div class="inline-flex items-center gap-1 text-primary font-bold text-sm mt-1">' +
      '<span data-i18n="cases_read_more">Read More</span>' +
      '<span class="material-symbols-outlined text-base">arrow_forward</span>' +
      "</div>" +
      "</div>" +
      "</a>"
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
        '" data-value="" data-i18n="all" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white">全部</button>';
      for (var i = 0; i < f.options.length; i++) {
        var optVal = f.options[i];
        var optI18nKey = "";
        if (key !== "volume") {
          var slug =
            (FILTER_OPT_I18N[key] && FILTER_OPT_I18N[key][optVal]) ||
            optVal.toLowerCase().replace(/ /g, "_").replace(/&/g, "and").replace(/-/g, "_");
          optI18nKey = "cases_filter_opt_" + key + "_" + slug;
        }
        html +=
          '<button data-filter="' +
          key +
          '" data-value="' +
          optVal +
          '"' +
          (optI18nKey ? ' data-i18n="' + optI18nKey + '"' : "") +
          ' class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary">' +
          optVal +
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
        '" data-value="" data-i18n="all" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white">全部</button>';
      for (var i = 0; i < f.options.length; i++) {
        var optVal = f.options[i];
        var optI18nKey = "";
        if (key !== "volume") {
          var slug =
            (FILTER_OPT_I18N[key] && FILTER_OPT_I18N[key][optVal]) ||
            optVal.toLowerCase().replace(/ /g, "_").replace(/&/g, "and").replace(/-/g, "_");
          optI18nKey = "cases_filter_opt_" + key + "_" + slug;
        }
        html +=
          '<button data-filter="' +
          key +
          '" data-value="' +
          optVal +
          '"' +
          (optI18nKey ? ' data-i18n="' + optI18nKey + '"' : "") +
          ' class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary">' +
          optVal +
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
        var optVal = f.options[i];
        var optI18nKey = "";
        if (key !== "volume") {
          var slug =
            (FILTER_OPT_I18N[key] && FILTER_OPT_I18N[key][optVal]) ||
            optVal.toLowerCase().replace(/ /g, "_").replace(/&/g, "and").replace(/-/g, "_");
          optI18nKey = "cases_filter_opt_" + key + "_" + slug;
        }
        html +=
          '<option value="' +
          optVal +
          '"' +
          (optI18nKey ? ' data-i18n="' + optI18nKey + '"' : "") +
          ">" +
          optVal +
          "</option>";
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

    // Wait for translations to be ready before rendering i18n content
    var doRender = function () {
      renderGrid(variant);
      bindFilterButtons();
      // 触发面包屑重新渲染（确保 SPA 导航后面包屑可见）
      if (window.Breadcrumb && typeof window.Breadcrumb.refresh === "function") {
        window.Breadcrumb.refresh();
      }
      // Listen for language changes to re-translate dynamic content
      if (!_langListenerBound && window.translationManager) {
        _langListenerBound = true;
        window.translationManager.on("languageChanged", function () {
          translateAllDynamic();
        });
      }
    };

    if (
      window.translationManager &&
      window.translationManager.translationsCache &&
      window.translationManager.translationsCache.has("ui-" + (window.translationManager.currentLanguage || "zh-CN"))
    ) {
      doRender();
    } else if (window.translationManager && typeof window.translationManager.applyTranslations === "function") {
      window.translationManager
        .applyTranslations()
        .then(function () {
          doRender();
        })
        .catch(function () {
          doRender();
        });
    } else {
      doRender();
    }
  }

  /* ── Auto-init on DOMContentLoaded (full page load) ── */
  var _initCaseGrid = function () {
    var path = window.location.pathname;
    if (/^\/cases(\/|\/index-pc\.html|\/index-mobile\.html|\/index-tablet\.html)?$/.test(path)) {
      var variant = document.body.getAttribute("data-case-variant") || "pc";
      init(variant);
    }
  };
  if (typeof Boot !== "undefined") {
    Boot.register("case-grid", 4, _initCaseGrid);
  } else {
    document.addEventListener("DOMContentLoaded", _initCaseGrid);
  }

  /* ── Auto-init based on data attribute ──────────── */
  window.CaseGrid = { init: init, FILTERS: FILTERS, ROI_CASES: ROI_CASES };
  /* ── SPA navigation: re-init after swup content:replace ── */
  document.addEventListener("spa:load", function () {
    var path = window.location.pathname;
    if (/^\/cases(\/|\/index-pc\.html|\/index-mobile\.html|\/index-tablet\.html)?$/.test(path)) {
      // Only re-init on the listing page, not detail pages
      var variant = document.body.getAttribute("data-case-variant") || "pc";
      // T2.3: 使用 whenReady 替代 setTimeout(50) 等待 DOM
      window.__safe.whenReady(
        "#case-grid",
        function () {
          init(variant);
        },
        300
      );
    } else {
    }
  });
})();
