/**
 * roi-data.js — ROI reference data (config-driven)
 *
 * All data now sourced from site.config.js → window.SITE_CONFIG.roi
 * Falls back to embedded defaults if config not loaded.
 *
 * Exports: window.RoiData, window.ROI_EXCHANGE_RATES, window.ROI_CASES
 */
(function () {
  "use strict";

  var _cfg = window.SITE_CONFIG || window._cfg || {};

  // ── Fallback defaults (used when site.config.js is not loaded) ──
  var FALLBACK_SAVINGS = {
    hiring_difficulty: { min: 0.3, mid: 0.52, max: 0.7 },
    high_labor_cost: { min: 0.35, mid: 0.6, max: 0.78 },
    inconsistent_quality: { min: 0.25, mid: 0.45, max: 0.62 },
    slow_service: { min: 0.28, mid: 0.48, max: 0.65 },
    limited_space: { min: 0.22, mid: 0.42, max: 0.58 },
  };

  var FALLBACK_SALARIES = {
    Philippines: { monthly: 25000, currency: "PHP", symbol: "₱" },
    Indonesia: { monthly: 4800000, currency: "IDR", symbol: "Rp" },
    Vietnam: { monthly: 7000000, currency: "VND", symbol: "₫" },
    Thailand: { monthly: 15000, currency: "THB", symbol: "฿" },
    Malaysia: { monthly: 2500, currency: "MYR", symbol: "RM" },
  };

  var FALLBACK_EQUIPMENT = {
    smart_wok: { min: 3000, max: 8000 },
    rice_cooker: { min: 1500, max: 4000 },
    dishwasher: { min: 2000, max: 5000 },
    induction_cooker: { min: 500, max: 2000 },
    deep_fryer: { min: 1000, max: 3000 },
  };

  var FALLBACK_RATES = {
    base: "USD",
    rates: { PHP: 56.2, IDR: 15800, VND: 25300, THB: 35.5, MYR: 4.7, CNY: 7.24, USD: 1 },
    updatedAt: "2026-05-01",
  };

  var FALLBACK_CASES = {
    cases: [],
    total: 0,
    filters: { industries: [], volumes: [], countries: [], benefits: [] },
  };

  var FALLBACK_TEMPLATES = {
    "small-restaurant": "Hi, I run a small restaurant (approx __ orders/day). I want to know the price for your smart cooking machines.",
    "central-kitchen": "Hi, I am setting up a central kitchen. I need equipment for large volume production.",
    canteen: "Hi, I manage a canteen serving __ people daily. I need high-volume cooking equipment.",
    global: "Hi, I'm interested in your commercial equipment. Please help me find the right machine.",
  };

  // ── Resolve from config with fallback ──
  var roi = _cfg.roi || {};
  var brand = _cfg.brand || {};

  // Replace {brand} placeholders in templates
  function resolveTemplates(tpl) {
    if (!tpl) return FALLBACK_TEMPLATES;
    var brandName = brand.name || "Brand";
    var resolved = {};
    for (var key in tpl) {
      if (tpl.hasOwnProperty(key)) {
        resolved[key] = tpl[key].replace(/\{brand\}/g, brandName);
      }
    }
    return resolved;
  }

  var ROI_SAVINGS_TABLE = roi.savingsTable || FALLBACK_SAVINGS;
  var ROI_DEFAULT_SALARIES = roi.salaries || FALLBACK_SALARIES;
  var ROI_EQUIPMENT_COST = roi.equipmentCost || FALLBACK_EQUIPMENT;

  window.ROI_EXCHANGE_RATES = roi.exchangeRates || FALLBACK_RATES;
  window.ROI_CASES = roi.cases || FALLBACK_CASES;
  var ROI_WHATSAPP_TEMPLATES = resolveTemplates(roi.whatsappTemplates);

  // ── Export ────────────────────────────────────────────────────
  window.RoiData = {
    savingsTable: ROI_SAVINGS_TABLE,
    salaries: ROI_DEFAULT_SALARIES,
    equipmentCost: ROI_EQUIPMENT_COST,
    exchangeRates: window.ROI_EXCHANGE_RATES,
    cases: window.ROI_CASES,
    whatsappTemplates: ROI_WHATSAPP_TEMPLATES,
  };
})();
