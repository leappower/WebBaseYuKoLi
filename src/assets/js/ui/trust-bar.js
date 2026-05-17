/**
 * trust-bar.js — Fixed Top Trust Bar (40px)
 * Shows credibility indicators: FDA, HACCP, 4 factories, capacity, MOQ, global shipping
 * Positioned above the navigator, z-index above normal header.
 *
 * ES5 compatible. No external dependencies.
 * @audit-safe — static HTML strings, no user input
 */

(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────
  /** @type {string[]} Trust indicators (innerHTML-safe, static content) */
  var ITEMS = [
    "FDA Registered &amp; HACCP Certified",
    "4 Owned Factories",
    "100,000+ Daily Capacity",
    "Low MOQ: 500 Units",
    "Global Shipping to 30+ Countries",
  ];

  /** @type {string} Brand primary color background */
  var BG_COLOR = "var(--color-primary, #2E7D32)"; // forest green

  // ── Build HTML ────────────────────────────────────────────────
  /** @returns {string} Trust bar HTML */
  function buildHTML() {
    var itemsHtml = "";
    for (var i = 0; i < ITEMS.length; i++) {
      itemsHtml +=
        '<span class="trust-bar__item">' +
          '<span class="trust-bar__dot">●</span> ' +
          ITEMS[i] +
        "</span>";
    }

    return (
      '<div id="trust-bar" class="trust-bar" role="banner" aria-label="Trust indicators">' +
        '<div class="trust-bar__inner">' +
          '<div class="trust-bar__track">' +
            itemsHtml +
            // Duplicate for seamless scroll
            itemsHtml +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  // ── Inject ────────────────────────────────────────────────────
  function inject() {
    if (document.getElementById("trust-bar")) return; // already injected

    var bar = document.createElement("div");
    bar.innerHTML = buildHTML();
    document.body.insertBefore(bar.firstElementChild, document.body.firstChild);

    // Inject CSS
    var style = document.createElement("style");
    style.id = "trust-bar-style";
    style.textContent =
      ".trust-bar {" +
        "  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;" +
        "  height: 40px; overflow: hidden;" +
        "  background: " + BG_COLOR + ";" +
        "  color: #fff; font-size: 13px; line-height: 40px;" +
        "  white-space: nowrap;" +
        "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" +
        "}" +
        ".trust-bar__inner { height: 100%; overflow: hidden; }" +
        ".trust-bar__track {" +
        "  display: inline-block;" +
        "  animation: trustBarScroll 30s linear infinite;" +
        "}" +
        ".trust-bar__item { display: inline-block; padding: 0 24px; }" +
        ".trust-bar__dot { color: rgba(255,255,255,0.5); margin-right: 6px; }" +
        "@keyframes trustBarScroll {" +
        "  0% { transform: translateX(0); }" +
        "  100% { transform: translateX(-50%); }" +
        "}" +
        /* Pause on hover */
        ".trust-bar:hover .trust-bar__track {" +
        "  animation-play-state: paused;" +
        "}" +
        /* Desktop: static centered, no scroll */
        "@media (min-width: 768px) {" +
        "  .trust-bar__inner { text-align: center; }" +
        "  .trust-bar__track {" +
        "    animation: none; display: flex; justify-content: center;" +
        "  }" +
        "}";
    document.head.appendChild(style);

    // Push navigator down by 40px
    var navStyle = document.createElement("style");
    navStyle.id = "trust-bar-nav-fix";
    navStyle.textContent =
      "#navigator, #mobile-header { top: 40px !important; }" +
      /* Ensure SPA content doesn't hide behind trust bar */
      ".section-passthrough, .hero-overlap { margin-top: 40px; }";
    document.head.appendChild(navStyle);
  }

  // ── Bootstrap ─────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
