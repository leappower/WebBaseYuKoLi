/* ═══════════════════════════════════════════════════
   case-detail.js — 案例详情页渲染 (OEM/ODM)
   Dynamic rendering: extracts slug from URL, loads data, renders all sections
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Config Helpers ───────────────────────────── */
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ── Fallback Data (from cases-generated.json) ── */
  var _casesData = []; // populate per project

  /* ── State ──────────────────────────────────────── */
  var _currentSlug = window.CASE_SLUG || "";
  var _currentCase = null;
  var _langListenerBound = false;

  /* ── Helpers ────────────────────────────────────── */

  /**
   * Extract slug from URL path
   * /cases/sea-coffee-brand/ → "sea-coffee-brand"
   * /cases/sea-coffee-brand → "sea-coffee-brand"
   */
  function extractSlug() {
    var path = window.location.pathname.replace(/\/$/, "");
    var parts = path.split("/");
    // Last non-empty segment
    for (var i = parts.length - 1; i >= 0; i--) {
      if (parts[i] && parts[i] !== "cases" && parts[i] !== "detail") {
        return parts[i];
      }
    }
    return "";
  }

  /**
   * Find case data by slug. Checks:
   * 1. window.CASE_DETAILS_DATA (injected JSON in HTML)
   * 2. window._caseDetailData (fallback)
   * 3. _casesData (internal fallback)
   */
  function findCase(slug) {
    // Try external data first
    var external = window.CASE_DETAILS_DATA || window._caseDetailData;
    if (external && Array.isArray(external)) {
      for (var i = 0; i < external.length; i++) {
        if (external[i].slug === slug) return external[i];
      }
    }
    // Fallback to internal data
    for (var j = 0; j < _casesData.length; j++) {
      if (_casesData[j].slug === slug) return _casesData[j];
    }
    return null;
  }

  /**
   * Translate helper (uses translationManager if available)
   */
  function t(key) {
    if (window.translationManager && typeof window.translationManager.translate === "function") {
      var text = window.translationManager.translate(key);
      if (text && text !== key) return text;
    }
    return key;
  }

  /**
   * Get current language from translationManager
   */
  function getLang() {
    if (window.translationManager && window.translationManager.currentLanguage) {
      return window.translationManager.currentLanguage;
    }
    var stored;
    try {
      stored = localStorage.getItem("userLanguage");
    } catch (e) {}
    if (stored) return stored;
    var htmlLang = document.documentElement && document.documentElement.lang;
    if (htmlLang) return htmlLang;
    return "zh-CN";
  }

  function isZh() {
    var lang = getLang();
    return lang === "zh-CN" || lang === "zh-TW" || lang === "zh";
  }

  /**
   * Get localized text for a case field.
   * Priority:
   *   1. TranslationManager i18n key: cases_detail_<slug>_<field>
   *   2. English suffix: c[field + "_en"]
   *   3. Original field: c[field]
   */
  function getLocalizedText(c, field) {
    if (!c) return "";
    var slug = c.slug || "";
    // Try TranslationManager first
    if (window.translationManager && window.translationManager.translate) {
      var i18nKey = "cases_detail_" + slug + "_" + field;
      if (field === "title") i18nKey = "cases_detail_" + slug;
      try {
        var val = window.translationManager.translate(i18nKey);
        if (val && val !== i18nKey) {
          // Parse array fields (solutions/results/pain_points)
          if (field === "solutions" || field === "results" || field === "pain_points") {
            return parseTranslatedArray(val, field);
          }
          return val;
        }
      } catch (e) {
        // fall through
      }
    }
    // Fallback: _en for non-Chinese, original for Chinese
    var lang = getLang();
    var isZhLang = lang === "zh-CN" || lang === "zh-TW" || lang === "zh";
    var fallback = isZhLang ? c[field] || c[field + "_en"] : c[field + "_en"] || c[field];
    // If fallback is an array/object (from original data), return as-is
    if (Array.isArray(fallback)) return fallback;
    if (fallback && typeof fallback === "object") return fallback;
    return fallback || "";
  }

  /**
   * Parse pipe-separated translated string back into array objects
   * solutions: "icon_name:desc|icon_name:desc|..."
   * results:    "icon_name:title:desc|icon_name:title:desc|..."
   * pain_points: "item1|item2|item3"
   */
  function parseTranslatedArray(val, field) {
    if (!val || typeof val !== "string") return val;
    var parts = val.split("|");
    if (field === "pain_points") {
      return parts.map(function (p) {
        return p.trim();
      });
    }
    if (field === "solutions") {
      return parts.map(function (p) {
        var idx = p.indexOf(":");
        return idx > 0
          ? { icon: p.substring(0, idx).trim(), title: "", desc: p.substring(idx + 1).trim() }
          : { icon: "check_circle", title: "", desc: p.trim() };
      });
    }
    if (field === "results") {
      return parts.map(function (p) {
        var idx1 = p.indexOf(":");
        var idx2 = idx1 > 0 ? p.indexOf(":", idx1 + 1) : -1;
        if (idx2 > idx1) {
          return {
            icon: p.substring(0, idx1).trim(),
            title: p.substring(idx1 + 1, idx2).trim(),
            desc: p.substring(idx2 + 1).trim(),
          };
        }
        return { icon: "check", title: "", desc: p.trim() };
      });
    }
    return parts;
  }

  /* ── Rendering ──────────────────────────────────── */

  /**
   * Build meta badges (country, industry, highlight)
   */
  function renderBadges(c) {
    var html = "";
    html +=
      '<span class="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 text-sm font-semibold text-slate-700 dark:text-slate-200 backdrop-blur-sm border border-slate-200 dark:border-slate-600">' +
      esc(c.country) +
      "</span>";
    html +=
      '<span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">' +
      esc(getLocalizedText(c, "industry")) +
      "</span>";
    return html;
  }

  /**
   * Build hero metrics strip (lead time, moq, cert, volume)
   */
  function renderHeroMetrics(c) {
    var items = [
      { icon: "schedule", text: getLocalizedText(c, "lead_time") },
      { icon: "inventory_2", text: getLocalizedText(c, "moq_label") },
      { icon: "verified", text: getLocalizedText(c, "cert_label") },
      { icon: "bar_chart", text: getLocalizedText(c, "monthly_volume") },
    ];
    var html = "";
    for (var i = 0; i < items.length; i++) {
      html +=
        '<div class="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm">' +
        '<span class="material-symbols-outlined text-primary text-base">' +
        items[i].icon +
        "</span>" +
        "<span>" +
        esc(items[i].text) +
        "</span>" +
        "</div>";
    }
    return html;
  }

  /**
   * Render pain point cards
   */
  function renderPainPoints(c) {
    var pains = getLocalizedText(c, "pain_points") || [];
    if (typeof pains === "string") pains = [pains];
    if (!pains.length) return '<p class="text-slate-500">No data available.</p>';
    var html = "";
    for (var i = 0; i < pains.length; i++) {
      html +=
        '<div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">' +
        '<div class="flex items-start gap-3">' +
        '<span class="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center text-sm font-black">' +
        (i + 1) +
        "</span>" +
        '<p class="text-slate-600 dark:text-slate-300 leading-relaxed">' +
        esc(pains[i]) +
        "</p>" +
        "</div></div>";
    }
    return html;
  }

  /**
   * Render solution cards (4-column)
   */
  function renderSolutions(c) {
    var sols = getLocalizedText(c, "solutions") || [];
    if (typeof sols === "string") sols = [sols];
    if (!sols.length) return '<p class="text-slate-500">No data available.</p>';
    var html = "";
    var lang = getLang();
    var isZhLang = lang === "zh-CN" || lang === "zh-TW" || lang === "zh";
    for (var i = 0; i < sols.length; i++) {
      var s = sols[i];
      // Parsed from TranslationManager: title already empty, desc is translated
      // Original data: use title/title_en, desc as-is (desc is already locale-specific)
      var title = "",
        desc = "";
      if (s.title !== undefined && s.title !== "") {
        title = isZhLang ? s.title : s.title_en || s.title;
      }
      desc = s.desc || "";
      html +=
        '<div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">' +
        '<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">' +
        '<span class="material-symbols-outlined text-primary">' +
        esc(s.icon || "check_circle") +
        "</span></div>" +
        (title ? '<h3 class="font-bold text-sm mb-1">' + esc(title) + "</h3>" : "") +
        '<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">' +
        esc(desc) +
        "</p>" +
        "</div>";
    }
    return html;
  }

  /**
   * Render key metrics (4 metric cards for colored section)
   */
  function renderMetrics(c) {
    var metrics = c.metrics || [];
    if (!metrics.length) {
      metrics = [
        { value: getLocalizedText(c, "lead_time"), label: isZh() ? "打样周期" : "Sampling", label_en: "Sampling" },
        {
          value: getLocalizedText(c, "monthly_volume"),
          label: isZh() ? "月产能" : "Monthly Output",
          label_en: "Monthly Output",
        },
        { value: getLocalizedText(c, "moq_label"), label: isZh() ? "起订量" : "MOQ", label_en: "MOQ" },
        {
          value: getLocalizedText(c, "cert_label"),
          label: isZh() ? "认证" : "Certification",
          label_en: "Certification",
        },
      ];
    }
    var html = "";
    for (var i = 0; i < metrics.length; i++) {
      var m = metrics[i];
      var label = isZh() ? m.label || "" : m.label_en || m.label || "";
      var value = isZh() ? m.value : m.value_en || m.value;
      html +=
        '<div class="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm">' +
        '<div class="text-2xl font-black mb-1">' +
        esc(value) +
        "</div>" +
        '<div class="text-sm text-white/70">' +
        esc(label) +
        "</div>" +
        "</div>";
    }
    return html;
  }

  /**
   * Render results cards (3-column)
   */
  function renderResults(c) {
    var results = getLocalizedText(c, "results") || [];
    if (typeof results === "string") results = [results];
    if (!results.length) return '<p class="text-slate-500">No data available.</p>';
    var html = "";
    var lang = getLang();
    var isZhLang = lang === "zh-CN" || lang === "zh-TW" || lang === "zh";
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var title = "",
        desc = "";
      if (r.title !== undefined && r.title !== "") {
        title = isZhLang ? r.title : r.title_en || r.title;
      }
      desc = r.desc || "";
      html +=
        '<div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">' +
        '<div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">' +
        '<span class="material-symbols-outlined text-green-600">' +
        esc(r.icon || "check") +
        "</span></div>" +
        (title ? '<h3 class="font-bold text-sm mb-1">' + esc(title) + "</h3>" : "") +
        '<p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">' +
        esc(desc) +
        "</p>" +
        "</div>";
    }
    return html;
  }

  /* ── SEO / Metadata ───────────────────────────── */

  function updateSEO(c) {
    var title = getLocalizedText(c, "title") + " | " + ((_cfg || {}).brand || {}).name || "BRAND";
    setTextOrAttr("page-title", "innerText", title);
    document.title = title;
    setTextOrAttr("meta-description", "content", getLocalizedText(c, "quote") || getLocalizedText(c, "title"));

    var slug = c.slug;
    var baseUrl = window.location.origin + "/cases/" + slug + "/";
    setTextOrAttr("canonical-url", "href", baseUrl);
    setTextOrAttr("hreflang-zh", "href", baseUrl);
    setTextOrAttr("hreflang-en", "href", baseUrl);
    setTextOrAttr("hreflang-x-default", "href", baseUrl);
    setTextOrAttr("og-url", "content", baseUrl);

    var ogTitle = getLocalizedText(c, "title") + " | Case Study";
    setTextOrAttr("og-title", "content", ogTitle);
    setTextOrAttr("og-description", "content", getLocalizedText(c, "quote") || getLocalizedText(c, "title"));

    // Device alt links
    var altPc = "/cases/" + slug + "/index-pc.html";
    var altMobile = "/cases/" + slug + "/index-mobile.html";
    var altTablet = "/cases/" + slug + "/index-tablet.html";
    setTextOrAttr("alt-pc", "href", altPc);
    setTextOrAttr("alt-mobile", "href", altMobile);
    setTextOrAttr("alt-tablet", "href", altTablet);
  }

  function setTextOrAttr(id, property, value) {
    var el = document.getElementById(id);
    if (!el) return;
    if (property === "innerText" || property === "textContent") {
      el[property] = value;
    } else {
      el.setAttribute(property, value);
    }
  }

  /* ── Main Render ───────────────────────────────── */

  function renderAll(c) {
    if (!c) {
      // Show "not found" message inside breadcrumb-container, don't destroy #spa-content
      var bc = document.getElementById("breadcrumb-container");
      if (bc)
        bc.innerHTML =
          '<div class="py-20 text-center"><h2 class="text-2xl font-bold mb-4">Case Not Found</h2><p class="text-slate-500 mb-6">The case study you are looking for could not be found.</p><a href="/cases/" data-no-swup class="text-primary font-bold">&larr; Back to Cases</a></div>';
      return;
    }

    // Hero
    setTextOrAttr("case-hero-title", "innerText", getLocalizedText(c, "title"));
    setTextOrAttr("case-hero-quote", "innerText", getLocalizedText(c, "quote") || "");
    setInnerHTML("case-hero-badges", renderBadges(c));
    setInnerHTML("case-hero-metrics", renderHeroMetrics(c));

    // Breadcrumb — 由 breadcrumb.js 渲染骨架，只需更新当前案例标题
    // 如果骨架不存在（SPA导航时breadcrumb-container为空），先创建骨架
    var bcCurrent = document.getElementById("breadcrumb-current");
    if (!bcCurrent && window.Breadcrumb && typeof window.Breadcrumb.refresh === "function") {
      window.Breadcrumb.refresh();
      bcCurrent = document.getElementById("breadcrumb-current");
    }
    setTextOrAttr("breadcrumb-current", "innerText", getLocalizedText(c, "title"));
    setTextOrAttr("breadcrumb-current-mobile", "innerText", getLocalizedText(c, "title"));

    // Background
    setTextOrAttr("case-background-content", "innerText", getLocalizedText(c, "background") || "");

    // Pain Points
    setInnerHTML("case-pain-points-grid", renderPainPoints(c));

    // Solutions
    setInnerHTML("case-solution-grid", renderSolutions(c));

    // Metrics
    setInnerHTML("case-metrics-grid", renderMetrics(c));

    // Results
    setInnerHTML("case-results-grid", renderResults(c));

    // Testimonial
    setTextOrAttr("case-testimonial-text", "innerText", getLocalizedText(c, "quote") || "");
    setTextOrAttr("case-testimonial-author", "innerText", c.country || "");

    // SEO
    updateSEO(c);

    // Apply i18n translations to newly injected content
    if (window.translationManager && typeof window.translationManager.applyTranslations === "function") {
      window.translationManager.applyTranslations();
    }
  }

  function setInnerHTML(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ── Init ───────────────────────────────────────── */

  function init(variant) {
    // Extract slug
    var slug = _currentSlug || extractSlug();
    if (!slug) {
      slug = window.location.hash.replace("#", "") || "";
    }
    _currentSlug = slug;

    // Find case data
    _currentCase = findCase(slug);
    if (!_currentCase) {
      console.warn("[CaseDetail] No case found for slug:", slug);
      renderAll(null);
      return;
    }

    // Wait for translations to be ready before rendering i18n content
    var doRender = function () {
      renderAll(_currentCase);
      // 触发面包屑重新渲染（仅在 breadcrumb-container 不存在时创建）
      if (window.Breadcrumb && typeof window.Breadcrumb.refresh === "function") {
        var bc = document.getElementById("breadcrumb-container");
        if (!bc || !bc.innerHTML.trim()) {
          window.Breadcrumb.refresh();
        }
      }
    };

    if (
      window.translationManager &&
      window.translationManager.translationsCache &&
      window.translationManager.translationsCache.has("ui-" + (window.translationManager.currentLanguage || "zh-CN"))
    ) {
      // Translations already loaded, render immediately
      doRender();
    } else if (window.translationManager && typeof window.translationManager.applyTranslations === "function") {
      // Translations not loaded yet — applyTranslations returns a Promise
      window.translationManager
        .applyTranslations()
        .then(function () {
          doRender();
        })
        .catch(function () {
          doRender();
        });
    } else {
      // translationManager not available (e.g. static page), render now
      doRender();
    }

    // Listen for language changes
    if (!_langListenerBound && window.translationManager) {
      _langListenerBound = true;
      window.translationManager.on("languageChanged", function () {
        if (_currentCase) renderAll(_currentCase);
      });
    }
  }

  /* ── Public API ─────────────────────────────────── */
  window.CaseDetail = {
    init: init,
    getCurrentCase: function () {
      return _currentCase;
    },
    getSlug: function () {
      return _currentSlug;
    },
    data: _casesData,
  };

  /* ── Auto-init (works for both full page load & swup script injection) ── */
  function tryInit() {
    var path = window.location.pathname.replace(/\/+$/, "");
    if (/^\/cases\/[a-z0-9-]+(\/index-(pc|mobile|tablet)\.html)?$/.test(path)) {
      var variant = document.body.getAttribute("data-case-variant") || "pc";
      init(variant);
      return true;
    }
    return false;
  }
  if (!tryInit()) {
    if (typeof Boot !== "undefined") {
      Boot.register("case-detail", 4, tryInit);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        tryInit();
      });
    }
  }
})();
