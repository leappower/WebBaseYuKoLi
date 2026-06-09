/**
 * page-effects.js — Scroll animation, progressive disclosure, toast, page transition
 * Extracted from page-interactions.js; self-initializes on DOMContentLoaded.
 *
 * CSS: All styles live in styles.css — no runtime injection.
 * Depends on (may be loaded after this file):
 *   contacts.js → used via safeCall() at runtime
 */
(function (global) {
  "use strict";

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  // ─── Helpers (from PiHelpers) ─────────────────────────────────────────
  var _h = window.PiHelpers || {};
  var safeCall =
    _h.safeCall ||
    function (fnName, args) {
      if (typeof global[fnName] === "function") return global[fnName].apply(null, args || []);
      console.warn("[PageEffects] " + fnName + " not found.");
    };
  var directText =
    _h.directText ||
    function (el) {
      var t = "";
      el.childNodes.forEach(function (n) {
        if (n.nodeType === 3) t += n.nodeValue;
      });
      return t.trim();
    };
  var findByText =
    _h.findByText ||
    function (tag, text) {
      var els = document.querySelectorAll(tag),
        r = [],
        l = text.toLowerCase();
      els.forEach(function (el) {
        if (directText(el).toLowerCase().indexOf(l) !== -1) r.push(el);
      });
      return r;
    };

  // ─── F1. Scroll-in Animation — IntersectionObserver fade-in-up ──────────────
  /**
   * 为页面内带有 [data-animate] 属性、或常见 section / .card / .grid > div 元素
   * 添加 fade-in-up 进入动画。
   * CSS classes (.animate-hidden / .animate-visible / .animate-delay-*) defined in styles.css.
   */
  function initScrollAnimation() {
    if (!("IntersectionObserver" in global)) return; // graceful degradation

    var targets = [].slice.call(
      document.querySelectorAll(
        "[data-animate], section, .feature-card, article, " +
          ".grid > div, .flex.flex-col.gap-8 > div, .flex.flex-col.gap-6 > div"
      )
    );

    // Avoid marking tiny utility wrappers (< 60px tall)
    // Also skip sections that contain .solutions-grid (cards section is above-the-fold)
    targets = targets.filter(function (el) {
      if (el.querySelector && el.querySelector(".solutions-grid")) return false;
      return el.offsetHeight > 60;
    });

    targets.forEach(function (el, idx) {
      if (!el.classList.contains("animate-hidden")) {
        el.classList.add("animate-hidden");
        if (idx % 3 === 1) el.classList.add("animate-delay-1");
        if (idx % 3 === 2) el.classList.add("animate-delay-2");
      }
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ─── F3. Progressive Disclosure ──────────────────────────────────────────────
  /**
   * 为带有 [data-expand] 属性（或 "Show More" / "Read More" 文本）的按钮
   * 实现展开/收起逻辑。目标内容由 data-expand-target 指向，或紧跟的 .expandable 容器。
   * CSS classes (.expandable / .expandable.expanded) defined in styles.css.
   */
  function initProgressiveDisclosure() {
    // 1. Buttons with data-expand attribute
    document.querySelectorAll("[data-expand]").forEach(function (btn) {
      wireExpandBtn(btn);
    });

    // 2. Buttons whose text contains "show more" / "read more" / "view more"
    var textMatches = ["show more", "read more", "view more", "learn more", "see more"];
    document.querySelectorAll("button, a").forEach(function (el) {
      var txt = el.textContent.trim().toLowerCase();
      for (var i = 0; i < textMatches.length; i++) {
        if (txt.indexOf(textMatches[i]) !== -1 && !el.dataset.expandBound) {
          wireExpandBtn(el);
          break;
        }
      }
    });

    function wireExpandBtn(btn) {
      if (btn.dataset.expandBound) return;
      btn.dataset.expandBound = "1";

      // Find target: data-expand-target id → nextElementSibling → parent's next sibling
      var targetId = btn.dataset.expandTarget || btn.getAttribute("data-expand");
      var target = targetId ? document.getElementById(targetId) : null;
      if (!target) target = btn.nextElementSibling;
      if (!target) return;

      if (!target.classList.contains("expandable")) {
        target.classList.add("expandable");
      }

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var isExpanded = target.classList.contains("expanded");
        target.classList.toggle("expanded", !isExpanded);
        btn.setAttribute("aria-expanded", String(!isExpanded));
        var origText = btn.dataset.origText || btn.textContent.trim();
        if (!btn.dataset.origText) btn.dataset.origText = origText;
        btn.textContent = isExpanded ? origText : __safe.t("ui_show_less") || "Show Less";
      });
    }
  }

  // ─── F6. Toast / Notification System ─────────────────────────────────────────
  /**
   * 轻量级 Toast 通知系统，覆盖 window.showNotification。
   * 支持 type: 'success' | 'error' | 'info'（默认 success）。
   * 自动 3 s 后消失，最多同时显示 3 条。
   * CSS classes (#toast-container / .toast-item) defined in styles.css.
   */
  function initToastSystem() {
    var container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    var ICON_MAP = { success: "check_circle", error: "error", info: "info" };

    function showToast(message, type) {
      type = type || "success";
      // Cap at 3 toasts
      while (container.children.length >= 3) {
        container.removeChild(container.firstChild);
      }
      var toast = document.createElement("div");
      toast.className = "toast-item " + type;
      /* @audit-safe: user-facing notification text */
      toast.innerHTML =
        '<span class="material-symbols-outlined" style="font-size:18px;">' +
        (ICON_MAP[type] || "check_circle") +
        "</span>" +
        message;
      container.appendChild(toast);
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 3100);
    }

    // Override / set window.showNotification
    window.showNotification = showToast;
  }

  // ─── F7. Page Transition (fade between pages) ─────────────────────────────────
  /**
   * 页面 fade-in/fade-out 过渡动画。
   * CSS classes (.page-fade-in / .page-fade-out) and keyframes defined in styles.css.
   *
   * Navigation is handled entirely by Swup/SpaRouter.
   * When a SPA router is present, do NOT register a document click handler —
   * doing so creates two systems fighting over the same navigation event.
   * If no SPA router is present (e.g. legacy page), fall back to fade+redirect.
   */
  function initPageTransition() {
    // Fade in on load
    document.body.classList.add("page-fade-in");

    // Let SWUP or SpaRouter handle navigation transitions
    if (window.Swup || window.SpaRouter) return;

    document.addEventListener("click", function (e) {
      var link = e.target.closest("a[href]");
      if (!link) return;

      var href = link.getAttribute("href");
      if (
        !href ||
        href.charAt(0) === "#" ||
        href.indexOf("://") !== -1 ||
        href.indexOf("mailto:") === 0 ||
        href.indexOf("tel:") === 0
      )
        return;
      if (link.target === "_blank") return;

      // If another handler already handled this click, don't interfere.
      if (e.defaultPrevented) return;

      e.preventDefault();
      document.body.classList.add("page-fade-out");
      setTimeout(function () {
        window.location.href = href;
      }, 200);
    });
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────────
  function init() {
    initToastSystem(); // must be first — others may use it
    initScrollAnimation();
    initProgressiveDisclosure();
    initPageTransition();
  }

  if (typeof Boot !== "undefined") {
    Boot.register("page-effects", 3, init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  _spaOn(document, "spa:load", init, "spa:load:init");
})(window);
