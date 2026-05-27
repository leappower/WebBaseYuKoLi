/**
 * trust-bar.js — Fixed Top Trust Bar
 * Credibility strip above navigator: FDA, HACCP, 4 factories, capacity, MOQ, global shipping
 *
 * Responsive strategy:
 *   PC (≥1024px): static, 5 items spread evenly across full width
 *   Tablet (768px—1023px): scrolling ticker (same as mobile)
 *   Mobile (<768px): scrolling ticker, single-pass (no content duplication)
 *
 * CSS 已迁移至 performance-optimizations.css (SSG 内联，消除 CLS)
 * z-index: 950 (below header/slide-menu, above other content)
 *
 * ES5 compatible. No external dependencies.
 * @audit-safe — static HTML strings, no user input
 */

(function () {
  "use strict";

  var ITEMS = [
    "FDA Registered &amp; HACCP Certified",
    "4 Owned Factories",
    "100,000+ Daily Capacity",
    "Low MOQ: 500 Units",
    "Global Shipping to 30+ Countries",
  ];

  function buildHTML() {
    var itemsHtml = "";
    for (var i = 0; i < ITEMS.length; i++) {
      itemsHtml += '<span class="trust-bar__item">' + '<span class="trust-bar__dot">●</span>' + ITEMS[i] + "</span>";
    }

    // Duplicate content for seamless infinite scroll
    var trackHtml = itemsHtml + itemsHtml;

    return (
      '<div id="trust-bar" class="trust-bar" role="banner" aria-label="Trust indicators">' +
      '<div class="trust-bar__inner">' +
      '<div class="trust-bar__track">' +
      trackHtml +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function inject() {
    if (document.getElementById("trust-bar")) return;

    var bar = document.createElement("div");
    bar.innerHTML = buildHTML();
    var trustEl = bar.firstElementChild;

    function doInject() {
      var header = document.getElementById("main-header") || document.getElementById("mobile-header");
      if (header) {
        header.insertBefore(trustEl, header.firstChild);
      } else {
        document.body.insertBefore(trustEl, document.body.firstChild);
      }
    }

    var header = document.getElementById("main-header") || document.getElementById("mobile-header");
    if (header && header.children.length > 0) {
      doInject();
    } else {
      var checkTimer = setInterval(function () {
        var h = document.getElementById("main-header") || document.getElementById("mobile-header");
        if (h && h.children.length > 0) {
          clearInterval(checkTimer);
          doInject();
        }
      }, 50);
      setTimeout(function () {
        clearInterval(checkTimer);
        doInject();
      }, 5000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
