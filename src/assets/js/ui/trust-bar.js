/**
 * trust-bar.js — Fixed Top Trust Bar
 * Credibility strip above navigator: FDA, HACCP, 4 factories, capacity, MOQ, global shipping
 *
 * Responsive strategy:
 *   PC (≥1024px): static, 5 items spread evenly across full width
 *   Tablet (768px—1023px): scrolling ticker (same as mobile)
 *   Mobile (<768px): scrolling ticker, single-pass (no content duplication)
 *
 * z-index: 950 (below header/slide-menu, above other content)
 *
 * ES5 compatible. No external dependencies.
 * @audit-safe — static HTML strings, no user input
 */

(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────
  var ITEMS = [
    "FDA Registered &amp; HACCP Certified",
    "4 Owned Factories",
    "100,000+ Daily Capacity",
    "Low MOQ: 500 Units",
    "Global Shipping to 30+ Countries",
  ];

  var BG_COLOR = "var(--color-primary, #2E7D32)";
  var Z_TRUST_BAR = 950; // below slide-menu (2010) and header (2000), above content

  // ── Build HTML ────────────────────────────────────────────────
  function buildHTML() {
    var itemsHtml = "";
    for (var i = 0; i < ITEMS.length; i++) {
      itemsHtml +=
        '<span class="trust-bar__item">' +
          '<span class="trust-bar__dot">●</span>' +
          ITEMS[i] +
        "</span>";
    }

    return (
      '<div id="trust-bar" class="trust-bar" role="banner" aria-label="Trust indicators">' +
        '<div class="trust-bar__inner">' +
          '<div class="trust-bar__track">' +
            itemsHtml +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  // ── Inject ────────────────────────────────────────────────────
  function inject() {
    if (document.getElementById("trust-bar")) return;

    var bar = document.createElement("div");
    bar.innerHTML = buildHTML();
    document.body.insertBefore(bar.firstElementChild, document.body.firstChild);

    var width = window.innerWidth;
    var barHeight = width >= 768 ? 40 : 36;

    // ── CSS (mobile-first: ticker, tablet: same ticker bigger, desktop: static evenly-spread) ──
    var css =
      ".trust-bar {" +
        "  position: fixed; top: 0; left: 0; right: 0; z-index: " + Z_TRUST_BAR + ";" +
        "  height: 36px;" +
        "  background: " + BG_COLOR + ";" +
        "  color: #fff; overflow: hidden; white-space: nowrap;" +
        "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" +
        "  font-size: 11px; line-height: 36px;" +
      "}" +
      ".trust-bar__inner { width: 100%; height: 100%; overflow: hidden; }" +

      // Mobile + Tablet: ticker (single-pass, no duplication)
      ".trust-bar__track {" +
        "  display: inline-block;" +
        "  animation: trustBarScroll 18s linear infinite;" +
      "}" +
      ".trust-bar__item { display: inline-block; padding: 0 16px; }" +
      ".trust-bar__dot { color: rgba(255,255,255,0.45); margin-right: 4px; }" +
      "/* Pause on hover (mobile/tablet) */" +
      ".trust-bar:hover .trust-bar__track { animation-play-state: paused; }" +
      "@keyframes trustBarScroll {" +
        "  0%   { transform: translateX(100vw); }" +
        "  100% { transform: translateX(-100%); }" +
      "}" +

      // Tablet: larger text + spacing
      "@media (min-width: 768px) and (max-width: 1023px) {" +
        ".trust-bar {" +
        "  height: 40px; font-size: 12px; line-height: 40px;" +
        "}" +
        ".trust-bar__item { padding: 0 20px; }" +
        ".trust-bar__dot { color: rgba(255,255,255,0.35); }" +
      "}" +

      // Desktop: static, evenly spread across full width
      "@media (min-width: 1024px) {" +
        ".trust-bar {" +
        "  font-size: 13px;" +
        "}" +
        ".trust-bar__inner { text-align: center; }" +
        ".trust-bar__track {" +
        "  animation: none;" +
        "  display: flex; justify-content: space-evenly;" +
        "}" +
        ".trust-bar__item { padding: 0 24px; }" +
        ".trust-bar__dot { color: rgba(255,255,255,0.35); }" +
      "}";

    var style = document.createElement("style");
    style.id = "trust-bar-style";
    style.textContent = css;
    document.head.appendChild(style);

    // Push navigator down by trust bar height
    var navStyle = document.createElement("style");
    navStyle.id = "trust-bar-nav-fix";
    navStyle.textContent =
      "#main-header, #mobile-header { top: " + barHeight + "px !important; }" +
      ".section-passthrough, .hero-overlap { margin-top: " + barHeight + "px; }" +
      ":root { --trust-bar-height: " + barHeight + "px; }";
    document.head.appendChild(navStyle);
  }

  // ── Bootstrap ─────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
