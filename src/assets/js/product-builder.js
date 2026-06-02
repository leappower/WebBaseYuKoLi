/**
 * product-builder.js — YuKoLi Product Brief Builder
 *
 * Interactive form component for Contact page.
 * Replaces the traditional static form with a card-based builder interface.
 *
 * Dependencies:
 *   - form-interactions.js → submitContactForm / validateField
 *   - contacts.js → showNotification
 *   - SITE_CONFIG → brand info
 *
 * Global exports:
 *   window.ProductBuilder → init(), reset(), getBuilderData(), showSuccess()
 */
(function (global) {
  "use strict";

  // i18n helper
  function _t(key) {
    if (
      typeof window !== "undefined" &&
      window.translationManager &&
      typeof window.translationManager.translate === "function"
    ) {
      return window.translationManager.translate(key);
    }
    return key;
  }

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  // ─── Constants ──────────────────────────────────────────────────
  var BRAND_COLOR = "#2E7D32";
  var _cfg = global.SITE_CONFIG || global._cfg || {};

  // Product category definitions (emoji + label for tags)
  var CATEGORIES = [
    { slug: "coffee", emoji: "☕", label: "Coffee Series", labelCn: "咖啡系列" },
    { slug: "tea", emoji: "🍵", label: "Tea & Milk Tea", labelCn: "茶饮系列" },
    { slug: "meal", emoji: "🥤", label: "Meal Replacement", labelCn: "代餐系列" },
    { slug: "beauty", emoji: "✨", label: "Beauty Collagen", labelCn: "胶原养颜" },
    { slug: "weight", emoji: "⚖️", label: "Weight Management", labelCn: "体重管理" },
    { slug: "gut", emoji: "🫘", label: "Gut Health", labelCn: "肠道健康" },
    { slug: "lifestyle", emoji: "🍃", label: "Lifestyle Drinks", labelCn: "功能冲饮" },
    { slug: "legacy", emoji: "📖", label: "Legacy Classics", labelCn: "经典冲饮" },
  ];

  // Mode definitions
  var MODES = [
    {
      id: "oem",
      icon: "precision_manufacturing",
      title: _t("product_builder_mode_oem_title"),
      subtitle: _t("product_builder_mode_oem_sub"),
      desc:
        _t("product_builder_mode_oem_desc") ||
        "You supply the formula & materials, we produce at scale. Recipe confidentiality guaranteed.",
    },
    {
      id: "odm",
      icon: "design_services",
      title: _t("product_builder_mode_odm_title"),
      subtitle: _t("product_builder_mode_odm_sub"),
      desc:
        _t("product_builder_mode_odm_desc") ||
        "We develop custom formulas based on your target market. You add your brand.",
    },
    {
      id: "obm",
      icon: "verified",
      title: _t("product_builder_mode_obm_title"),
      subtitle: _t("product_builder_mode_obm_sub"),
      desc:
        _t("product_builder_mode_obm_desc") ||
        "Full-service brand incubation: strategy, R&D, packaging, and launch support.",
    },
    {
      id: "not-sure",
      icon: "help_outline",
      title: _t("product_builder_mode_not_sure_title"),
      subtitle: _t("product_builder_mode_not_sure_sub"),
      desc:
        _t("product_builder_mode_not_sure_desc") ||
        "No worries! Our team will recommend the best model based on your goals.",
    },
  ];

  // Timeline options
  var TIMELINES = [
    { id: "now", icon: "⚡", label: _t("product_builder_timeline_ready") },
    { id: "1-3", icon: "📅", label: _t("product_builder_timeline_1_3m") },
    { id: "3-6", icon: "🗓", label: _t("product_builder_timeline_3_6m") },
    { id: "research", icon: "🔍", label: _t("product_builder_timeline_researching") },
  ];

  // Quantity slider config
  var QUANTITY_STEPS = [
    { val: 0, label: _t("product_builder_scale_lt_1k") },
    { val: 1000, label: _t("product_builder_scale_1k_5k") },
    { val: 5000, label: _t("product_builder_scale_5k_10k") },
    { val: 10000, label: _t("product_builder_scale_10k_50k") },
    { val: 50000, label: _t("product_builder_scale_50k_plus") },
  ];

  // Smart Match rules
  function getSmartMatch(state) {
    var mode = state.mode || "";
    var cats = state.categories || [];

    if (mode === "oem" && cats.indexOf("coffee") !== -1) {
      return (
        _t("product_builder_smartmatch_oem_coffee") ||
        "Your OEM Coffee inquiry matches our specialty: 200+ coffee recipes, certified organic options."
      );
    }
    if (mode === "odm" && cats.indexOf("meal") !== -1) {
      return (
        _t("product_builder_smartmatch_odm_meal") ||
        "ODM Meal Replacement is our fastest-growing category! We can prepare 3-5 formula samples for your review."
      );
    }
    if (mode === "obm") {
      return (
        _t("product_builder_smartmatch_obm") ||
        "OBM is our premium service. A product specialist will guide you through strategy, formulation, packaging, and launch."
      );
    }
    if (mode === "not-sure") {
      return (
        _t("product_builder_smartmatch_not_sure") ||
        "We'll recommend the best model based on your goals & timeline. Share more details below for a tailored solution."
      );
    }
    if (mode && cats.length > 0) {
      var catLabel = CATEGORIES.filter(function (c) {
        return c.slug === cats[0];
      })[0];
      var isZh = window.translationManager && window.translationManager.currentLanguage !== "en";
      var catName = catLabel
        ? isZh && catLabel.labelCn
          ? catLabel.labelCn
          : catLabel.label
        : _t("product_builder_smartmatch_this_category") || "this category";
      return (
        "Your " +
        (mode.toUpperCase() === "OEM"
          ? (_t("product_builder_mode_oem_title") || "OEM") + " "
          : mode.toUpperCase() === "ODM"
            ? (_t("product_builder_mode_odm_title") || "ODM") + " "
            : "") +
        catName +
        " " +
        (_t("product_builder_smartmatch_reviewed") ||
          "inquiry will be reviewed by our product team. We reply within 24 hours.")
      );
    }
    if (mode) {
      return (
        "Your " +
        mode.toUpperCase() +
        " " +
        (_t("product_builder_smartmatch_specialist") ||
          "inquiry will be reviewed by our specialists. Fill in more details for a targeted quote.")
      );
    }
    return "";
  }

  // Brief Score calculation
  function calcScore(state) {
    var score = 0;
    if (state.mode) score += 25;
    if (state.categories.length > 0) score += 25;
    if (state.quantity > 0) score += 20;
    if (state.timeline) score += 20;
    if (state.message && state.message.trim().length > 0) score += 10;
    return score;
  }

  function formatQuantity(val) {
    var _t =
      typeof window !== "undefined" && window.translationManager && window.translationManager.translate
        ? function (k) {
            return window.translationManager.translate(k);
          }
        : function (k) {
            return k;
          };
    if (val === 0) return _t("product_builder_quantity_under_1k") || "Under 1,000 units/mo";
    if (val === 1000) return _t("product_builder_quantity_1k_5k") || "1,000–5,000 units/mo";
    if (val === 5000) return _t("product_builder_quantity_5k_10k") || "5,000–10,000 units/mo";
    if (val === 10000) return _t("product_builder_quantity_10k_50k") || "10,000–50,000 units/mo";
    if (val >= 50000) return _t("product_builder_quantity_50k_plus") || "50,000+ units/mo";
    return val + " " + (_t("product_builder_units_per_month") || "units/mo");
  }

  // ─── State ──────────────────────────────────────────────────────
  var state = {
    mode: null,
    categories: [],
    quantity: 0,
    timeline: null,
    message: "",
    submitted: false,
  };

  // ─── DOM Cache ──────────────────────────────────────────────────
  var dom = {};

  function cacheDom() {
    dom.builder = document.getElementById("product-builder");
    if (!dom.builder) return false;
    dom.modeCards = dom.builder.querySelectorAll(".mode-card");
    dom.categoryTags = dom.builder.querySelectorAll(".category-tag");
    dom.scaleSlider = dom.builder.querySelector(".scale-slider");
    dom.scaleDisplay = dom.builder.querySelector(".scale-value");
    dom.scaleLabels = dom.builder.querySelectorAll(".scale-label");
    dom.timelineCards = dom.builder.querySelectorAll(".timeline-card");
    dom.briefPanel = dom.builder.querySelector(".brief-panel");
    dom.briefSummary = dom.builder.querySelector(".brief-summary");
    dom.briefMatch = dom.builder.querySelector(".brief-match");
    dom.briefScoreFill = dom.builder.querySelector(".brief-score-fill");
    dom.briefScoreText = dom.builder.querySelector(".brief-score-text");
    dom.promptChips = dom.builder.querySelectorAll(".prompt-chip");
    dom.messageInput = dom.builder.querySelector(".builder-message");
    dom.submitBtn = dom.builder.querySelector(".builder-submit");
    dom.successEl = dom.builder.querySelector(".builder-success");
    dom.builderForm = dom.builder.querySelector(".builder-form-area");
    return true;
  }

  // ─── Render Brief Panel ─────────────────────────────────────────
  function renderBrief() {
    if (!dom.briefPanel) return;

    var modeLabel = "";
    var modeIcon = "";
    var modeTitle = "";
    if (state.mode) {
      for (var i = 0; i < MODES.length; i++) {
        if (MODES[i].id === state.mode) {
          modeLabel = MODES[i].title;
          modeIcon = MODES[i].icon;
          modeTitle =
            MODES[i].title +
            " " +
            (MODES[i].subtitle ? MODES[i].subtitle : _t("product_builder_mode_fallback") || "Manufacturing");
          break;
        }
      }
    }

    var catLabels = [];
    for (var j = 0; j < state.categories.length; j++) {
      for (var k = 0; k < CATEGORIES.length; k++) {
        if (CATEGORIES[k].slug === state.categories[j]) {
          catLabels.push(CATEGORIES[k].emoji + " " + CATEGORIES[k].labelCn);
          break;
        }
      }
    }

    var qtyText = state.quantity > 0 ? formatQuantity(state.quantity) : "";
    var tlText = "";
    if (state.timeline) {
      for (var l = 0; l < TIMELINES.length; l++) {
        if (TIMELINES[l].id === state.timeline) {
          tlText = TIMELINES[l].icon + " " + TIMELINES[l].label;
          break;
        }
      }
    }

    var hasContent = state.mode || catLabels.length > 0 || qtyText || tlText;

    if (!hasContent) {
      dom.briefSummary.innerHTML =
        '<div class="brief-empty-state">' +
          '<span class="material-symbols-outlined">edit_note</span>' +
          _t("product_builder_brief_empty") || "Your selections will appear here</div>";
      dom.briefMatch.style.display = "none";
      dom.briefScoreFill.style.width = "0%";
      dom.briefScoreText.innerHTML =
        _t("product_builder_score_desc") || "Complete the form for a <strong>more accurate quote</strong>";
      return;
    }

    var html = "";
    if (state.mode) {
      html +=
        '<div class="brief-summary-item"><span class="material-symbols-outlined bs-icon">' +
        modeIcon +
        "</span><span>" +
        modeTitle.replace(/"/g, "&quot;") +
        "</span></div>";
    }
    for (var m = 0; m < catLabels.length; m++) {
      html +=
        '<div class="brief-summary-item"><span class="bs-icon">' +
        catLabels[m].charAt(0) +
        "</span><span>" +
        catLabels[m] +
        "</span></div>";
    }
    if (qtyText) {
      html +=
        '<div class="brief-summary-item"><span class="material-symbols-outlined bs-icon">inventory_2</span><span>' +
        qtyText +
        "</span></div>";
    }
    if (tlText) {
      html +=
        '<div class="brief-summary-item"><span class="bs-icon" style="font-size:0.875rem;">' +
        tlText.charAt(0) +
        "</span><span>" +
        tlText +
        "</span></div>";
    }
    dom.briefSummary.innerHTML = html;

    // Smart Match
    var matchText = getSmartMatch(state);
    if (matchText) {
      dom.briefMatch.style.display = "block";
      var matchEl = dom.briefMatch.querySelector(".brief-match-text");
      if (matchEl) matchEl.textContent = matchText;
    } else {
      dom.briefMatch.style.display = "none";
    }

    // Score
    var score = calcScore(state);
    dom.briefScoreFill.style.width = score + "%";
    if (score >= 80) {
      dom.briefScoreText.innerHTML =
        "<strong>" + score + "%</strong> " + (_t("product_builder_score_ready") || "complete — Ready for a quote!");
    } else if (score >= 50) {
      dom.briefScoreText.innerHTML =
        "<strong>" +
        score +
        "%</strong> " +
        (_t("product_builder_score_add_details") || "complete — Add a few more details");
    } else {
      dom.briefScoreText.innerHTML =
        "<strong>" +
        score +
        "%</strong> " +
        (_t("product_builder_score_more_details") || "complete — More details = better quote");
    }
  }

  // ─── Bind Events ────────────────────────────────────────────────
  function bindModeCards() {
    for (var i = 0; i < dom.modeCards.length; i++) {
      (function (card) {
        card.addEventListener("click", function () {
          var modeId = card.getAttribute("data-mode");
          if (!modeId) return;

          // Deselect all
          for (var j = 0; j < dom.modeCards.length; j++) {
            dom.modeCards[j].classList.remove("selected");
          }
          card.classList.add("selected");

          state.mode = modeId;
          renderBrief();
          updateSubmitState();
        });
      })(dom.modeCards[i]);
    }
  }

  function bindCategoryTags() {
    for (var i = 0; i < dom.categoryTags.length; i++) {
      (function (tag) {
        tag.addEventListener("click", function () {
          var slug = tag.getAttribute("data-cat");
          if (!slug) return;

          tag.classList.toggle("selected");
          var idx = state.categories.indexOf(slug);
          if (idx !== -1) {
            state.categories.splice(idx, 1);
          } else {
            state.categories.push(slug);
          }
          renderBrief();
          updateSubmitState();
        });
      })(dom.categoryTags[i]);
    }
  }

  function bindScaleSlider() {
    if (!dom.scaleSlider) return;
    dom.scaleSlider.addEventListener("input", function () {
      var idx = parseInt(this.value, 10);
      if (isNaN(idx)) idx = 0;
      state.quantity = QUANTITY_STEPS[idx].val;

      // Update label highlighting
      for (var i = 0; i < dom.scaleLabels.length; i++) {
        dom.scaleLabels[i].classList.toggle("active", i === idx);
      }
      if (dom.scaleDisplay) {
        dom.scaleDisplay.textContent = formatQuantity(state.quantity);
      }
      renderBrief();
      updateSubmitState();
    });

    // Labels are clickable shortcuts
    for (var j = 0; j < dom.scaleLabels.length; j++) {
      (function (i, label) {
        label.addEventListener("click", function () {
          dom.scaleSlider.value = i.toString();
          var evt = document.createEvent("Event");
          evt.initEvent("input", true, true);
          dom.scaleSlider.dispatchEvent(evt);
        });
      })(j, dom.scaleLabels[j]);
    }
  }

  function bindTimelineCards() {
    for (var i = 0; i < dom.timelineCards.length; i++) {
      (function (card) {
        card.addEventListener("click", function () {
          var tlId = card.getAttribute("data-tl");
          if (!tlId) return;

          for (var j = 0; j < dom.timelineCards.length; j++) {
            dom.timelineCards[j].classList.remove("selected");
          }
          card.classList.add("selected");
          state.timeline = tlId;
          renderBrief();
          updateSubmitState();
        });
      })(dom.timelineCards[i]);
    }
  }

  function bindPromptChips() {
    var COOLDOWN = 3000; // ms
    for (var i = 0; i < dom.promptChips.length; i++) {
      (function (chip) {
        chip.addEventListener("click", function () {
          var last = chip.getAttribute("data-last-click") || 0;
          var now = Date.now();
          if (now - parseInt(last, 10) < COOLDOWN) return; // 3s cooldown
          chip.setAttribute("data-last-click", now);
          var text = chip.getAttribute("data-text") || chip.textContent.trim();
          if (dom.messageInput) {
            var cur = dom.messageInput.value;
            if (cur.length > 0 && !cur.endsWith("\n")) {
              dom.messageInput.value = cur + "\n• " + text;
            } else {
              dom.messageInput.value = "• " + text;
            }
            dom.messageInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
      })(dom.promptChips[i]);
    }
  }

  function bindMessageInput() {
    if (!dom.messageInput) return;
    dom.messageInput.addEventListener("input", function () {
      state.message = dom.messageInput.value;
      renderBrief();
      updateSubmitState();
    });
  }

  function bindSubmit() {
    if (!dom.submitBtn) return;
    dom.submitBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (state.submitted) return;
      submitBuilderForm();
    });
  }

  // ─── Submit State ───────────────────────────────────────────────
  function updateSubmitState() {
    if (!dom.submitBtn) return;
    var hasContact = false;
    var nameEl = dom.builder && dom.builder.querySelector('[name="fullname"]');
    var emailEl = dom.builder && dom.builder.querySelector('[name="email"]');
    if (nameEl && nameEl.value.trim().length > 0) hasContact = true;

    // Only require contact fields for enabling submit
    dom.submitBtn.disabled = !hasContact;
  }

  // ─── Form Submission ────────────────────────────────────────────
  function submitBuilderForm() {
    state.submitted = true;

    // Collect all data
    var nameEl = dom.builder.querySelector('[name="fullname"]');
    var companyEl = dom.builder.querySelector('[name="company"]');
    var countryEl = dom.builder.querySelector('[name="country"]');
    var emailEl = dom.builder.querySelector('[name="email"]');
    var phoneEl = dom.builder.querySelector('[name="phone"]');

    // Inline validation
    var valid = true;
    if (!nameEl || !nameEl.value.trim()) {
      valid = false;
      if (nameEl) nameEl.classList.add("field-error");
    }
    if (!emailEl || !emailEl.value.trim()) {
      valid = false;
      if (emailEl) emailEl.classList.add("field-error");
    }
    if (valid && emailEl && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
      valid = false;
      emailEl.classList.add("field-error");
    }

    if (!valid) {
      state.submitted = false;
      if (global.showNotification)
        global.showNotification(
          _t("product_builder_validation_required") || "Please fill in the required fields.",
          "error"
        );
      return;
    }

    var data = {
      type: "product-builder",
      mode: state.mode,
      categories: state.categories,
      quantity: state.quantity,
      quantityLabel: state.quantity > 0 ? formatQuantity(state.quantity) : "",
      timeline: state.timeline,
      fullname: nameEl ? nameEl.value.trim() : "",
      company: companyEl ? companyEl.value.trim() : "",
      country: countryEl ? countryEl.value : "",
      email: emailEl ? emailEl.value.trim() : "",
      phone: phoneEl ? phoneEl.value.trim() : "",
      message: dom.messageInput ? dom.messageInput.value.trim() : "",
      score: calcScore(state),
      url: global.location ? global.location.href : "",
    };

    // Send directly to Google Apps Script (works on GitHub Pages, no server required)
    showBuilderSuccess();
    state.submitted = false;
    try {
      var gasUrl = (global.SITE_CONFIG && global.SITE_CONFIG.forms && global.SITE_CONFIG.forms.gasUrl) || "";
      if (gasUrl) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", gasUrl, true);
        xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
        xhr.send(JSON.stringify(data));
      }
    } catch (e) {}
  }

  // ─── Success State ──────────────────────────────────────────────
  function showBuilderSuccess() {
    if (dom.builderForm) dom.builderForm.style.display = "none";
    if (dom.successEl) {
      dom.successEl.classList.add("visible");

      // Personalize with name
      var nameEl = dom.builder && dom.builder.querySelector('[name="fullname"]');
      var nameVal = nameEl ? nameEl.value.trim() : "";
      if (nameVal) {
        var greeting = dom.successEl.querySelector(".success-greeting");
        if (greeting) greeting.textContent = _t("product_builder_success_greeting_prefix") + " " + nameVal + "!";
      }
    }
  }

  // ─── Public API ─────────────────────────────────────────────────
  function init() {
    if (!cacheDom()) return;
    bindModeCards();
    bindCategoryTags();
    bindScaleSlider();
    bindTimelineCards();
    bindPromptChips();
    bindMessageInput();
    bindSubmit();

    // Bind contact field change to update submit state
    var fields = dom.builder.querySelectorAll(".contact-field input, .contact-field select");
    for (var i = 0; i < fields.length; i++) {
      (function (f) {
        f.addEventListener("input", updateSubmitState);
        f.addEventListener("change", updateSubmitState);
      })(fields[i]);
    }

    // Initial render
    renderBrief();
    updateSubmitState();
  }

  function reset() {
    state = { mode: null, categories: [], quantity: 0, timeline: null, message: "", submitted: false };

    // Reset UI
    if (dom.builderForm) dom.builderForm.style.display = "";
    if (dom.successEl) dom.successEl.classList.remove("visible");
    if (dom.scaleSlider) dom.scaleSlider.value = "0";
    if (dom.scaleDisplay) dom.scaleDisplay.textContent = formatQuantity(0);

    // Unselect all
    if (dom.modeCards) for (var i = 0; i < dom.modeCards.length; i++) dom.modeCards[i].classList.remove("selected");
    if (dom.categoryTags)
      for (var j = 0; j < dom.categoryTags.length; j++) dom.categoryTags[j].classList.remove("selected");
    if (dom.timelineCards)
      for (var k = 0; k < dom.timelineCards.length; k++) dom.timelineCards[k].classList.remove("selected");
    if (dom.promptChips) for (var l = 0; l < dom.promptChips.length; l++) dom.promptChips[l].classList.remove("used");
    if (dom.messageInput) dom.messageInput.value = "";
    if (dom.scaleLabels)
      for (var m = 0; m < dom.scaleLabels.length; m++) dom.scaleLabels[m].classList.remove("active", m === 0);

    // Clear contact fields
    var fields = dom.builder ? dom.builder.querySelectorAll(".contact-field input, .contact-field select") : [];
    for (var n = 0; n < fields.length; n++) {
      if (fields[n].tagName === "SELECT") {
        if (fields[n].options.length > 0) fields[n].selectedIndex = 0;
      } else {
        fields[n].value = "";
      }
    }

    renderBrief();
    updateSubmitState();
  }

  function getBuilderData() {
    return {
      mode: state.mode,
      categories: state.categories.slice(),
      quantity: state.quantity,
      timeline: state.timeline,
      message: state.message,
    };
  }

  // Export
  global.ProductBuilder = {
    init: init,
    reset: reset,
    getBuilderData: getBuilderData,
    showSuccess: showBuilderSuccess,
  };

  // Auto-init on DOMContentLoaded (only if #product-builder exists)
  function autoInit() {
    if (document.getElementById("product-builder")) {
      global.ProductBuilder.init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }

  // Re-init on SPA navigation
  _spaOn(document, "spa:load", autoInit, "spa:load:builder");
})(window);
