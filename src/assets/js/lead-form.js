/**
 * Lead Form Gate
 * Intercepts PDF download buttons with a lead capture modal.
 * ES5 / IIFE — no let/const/arrow/template-literal.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "lead_form_data";
  var BRAND_COLOR = "#2E7D32";
  var GAS_FORM_URL = window.SITE_CONFIG && window.SITE_CONFIG.forms && window.SITE_CONFIG.forms.gasUrl;

  /* ---- helpers ---- */

  function getLeads() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  function saveLead(lead) {
    var leads = getLeads();
    leads.push(lead);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch (_) {
      /* quota exceeded – silent */
    }

    // Send directly to Google Sheets (works on GitHub Pages, no server required)
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", GAS_FORM_URL, true);
      xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
      xhr.send(
        JSON.stringify({
          type: "lead_whitepaper",
          fullname: lead.name,
          company: lead.company,
          email: lead.email,
          message: lead.pageUrl || "",
          pageUrl: lead.pageUrl || "",
        })
      );
    } catch (_) {}
  }

  /** i18n helper */

  function hasSubmitted(email) {
    var leads = getLeads();
    for (var i = 0; i < leads.length; i++) {
      if (leads[i].email && leads[i].email.toLowerCase() === email.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ---- modal DOM ---- */

  var overlay = null;
  var currentPdfUrl = null;

  function createOverlay() {
    /* If overlay variable is non-null but the DOM node has been removed
       (e.g. by SPA page swap), reset so we rebuild from scratch. */
    if (overlay && !document.body.contains(overlay)) {
      overlay = null;
    }
    if (overlay) {
      return;
    }

    overlay = document.createElement("div");
    overlay.id = "yk-lead-overlay";
    overlay.style.cssText =
      "display:none;position:fixed;inset:0;z-index:99999;" +
      "background:rgba(0,0,0,0.55);" +
      "justify-content:center;align-items:center;" +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    var box = document.createElement("div");
    box.style.cssText =
      "background:#fff;border-radius:16px;padding:32px 28px;" +
      "width:90%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.25);" +
      "position:relative;animation:ykFadeIn .25s ease;";

    box.innerHTML =
      '<button id="yk-lead-close" style="position:absolute;top:12px;right:16px;' +
      "background:none;border:none;font-size:24px;cursor:pointer;color:#888;" +
      'line-height:1;">&times;</button>' +
      '<h3 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#1a1a1a;">' +
      __safe.t("form_lead_title") +
      "</h3>" +
      '<p style="margin:0 0 20px;font-size:14px;color:#666;">' +
      __safe.t("form_lead_subtitle") +
      "</p>" +
      '<form id="yk-lead-form" novalidate>' +
      '<label style="display:block;margin-bottom:14px;">' +
      '<span style="display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:4px;">' +
      __safe.t("form_lead_name_label") +
      "</span>" +
      '<input type="text" name="name" required placeholder="' +
      __safe.t("form_lead_name_placeholder") +
      '" ' +
      'style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;' +
      'font-size:14px;outline:none;box-sizing:border-box;transition:border .2s;" />' +
      "</label>" +
      '<label style="display:block;margin-bottom:14px;">' +
      '<span style="display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:4px;">' +
      __safe.t("form_lead_company_label") +
      "</span>" +
      '<input type="text" name="company" required placeholder="' +
      __safe.t("form_lead_company_placeholder") +
      '" ' +
      'style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;' +
      'font-size:14px;outline:none;box-sizing:border-box;transition:border .2s;" />' +
      "</label>" +
      '<label style="display:block;margin-bottom:20px;">' +
      '<span style="display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:4px;">' +
      __safe.t("form_lead_email_label") +
      "</span>" +
      '<input type="email" name="email" required placeholder="' +
      __safe.t("form_lead_email_placeholder") +
      '" ' +
      'style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;' +
      'font-size:14px;outline:none;box-sizing:border-box;transition:border .2s;" />' +
      "</label>" +
      '<div id="yk-lead-error" style="display:none;color:#d32f2f;font-size:13px;margin-bottom:12px;"></div>' +
      '<button type="submit" style="width:100%;padding:12px;background:' +
      BRAND_COLOR +
      ";" +
      "color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;" +
      'cursor:pointer;transition:background .2s;">' +
      __safe.t("form_lead_btn") +
      "</button>" +
      "</form>";

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    /* close button + click-outside via event delegation on overlay */
    overlay.addEventListener("click", function (e) {
      if (e.target.id === "yk-lead-close" || e.target === overlay) {
        closeModal();
      }
    });

    /* focus styling for inputs */
    var inputs = box.querySelectorAll("input");
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener("focus", function () {
        this.style.borderColor = BRAND_COLOR;
      });
      inputs[i].addEventListener("blur", function () {
        this.style.borderColor = "#ddd";
      });
    }

    /* submit handler */
    document.getElementById("yk-lead-form").onsubmit = handleSubmit;
  }

  function openModal(pdfUrl) {
    currentPdfUrl = pdfUrl;
    createOverlay();
    document.getElementById("yk-lead-error").style.display = "none";
    document.getElementById("yk-lead-form").reset();
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    /* focus first field */
    var firstInput = overlay.querySelector('input[name="name"]');
    if (firstInput) {
      setTimeout(function () {
        firstInput.focus();
      }, 100);
    }
  }

  function closeModal() {
    if (overlay) {
      overlay.style.display = "none";
      document.body.style.overflow = "";
    }
    currentPdfUrl = null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = document.getElementById("yk-lead-form");
    var errorEl = document.getElementById("yk-lead-error");
    var name = form.elements.name.value.trim();
    var company = form.elements.company.value.trim();
    var email = form.elements.email.value.trim();

    if (!name || !company || !email) {
      errorEl.textContent = __safe.t("form_lead_required") || "Please fill in all fields.";
      errorEl.style.display = "block";
      return;
    }
    if (!isValidEmail(email)) {
      errorEl.textContent = __safe.t("form_lead_email") || "Please enter a valid email address.";
      errorEl.style.display = "block";
      return;
    }

    saveLead({
      name: name,
      company: company,
      email: email,
      pdf: currentPdfUrl,
      ts: Date.now(),
      language: navigator.language,
      pageUrl: window.location.href,
    });
    var pdfToDownload = currentPdfUrl;
    closeModal();
    triggerDownload(pdfToDownload);
    showThankYou();
  }

  function triggerDownload(url) {
    if (!url) {
      return;
    }
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function showThankYou() {
    var toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
      "background:" +
      BRAND_COLOR +
      ";color:#fff;padding:14px 28px;border-radius:10px;" +
      "font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);" +
      "z-index:100000;animation:ykFadeIn .3s ease;max-width:90%;text-align:center;";
    toast.textContent = __safe.t("form_lead_download_success") || "\u2713 Thank you! Your download has started.";
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transition = "opacity .4s ease";
      setTimeout(function () {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 400);
    }, 3000);
  }

  /* ---- inject animation keyframes ---- */

  (function injectStyles() {
    var s = document.createElement("style");
    s.textContent =
      "@keyframes ykFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(s);
  })();

  /* ---- public API: bind download buttons ---- */

  window.LeadForm = {
    init: function (selector) {
      selector = selector || "[data-lead-pdf]";
      var buttons = document.querySelectorAll(selector);
      for (var i = 0; i < buttons.length; i++) {
        (function (btn) {
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var pdfUrl = btn.getAttribute("data-lead-pdf") || btn.getAttribute("href");
            if (!pdfUrl) {
              return;
            }
            openModal(pdfUrl);
          });
        })(buttons[i]);
      }
    },
  };

  /* auto-init on DOMContentLoaded */
  if (typeof Boot !== "undefined") {
    Boot.register("lead-form", 4, function () {
      window.LeadForm.init();
    });
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      window.LeadForm.init();
    });
  } else {
    window.LeadForm.init();
  }
})();
