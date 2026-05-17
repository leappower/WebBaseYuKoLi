/*!
 * BrewYuKoLi — GA4 Analytics Integration
 * IIFE, ES5-compatible
 * Reads config from window.SITE_CONFIG.analytics
 */
(function () {
  "use strict";

  var config = (typeof window !== "undefined" && window.SITE_CONFIG && window.SITE_CONFIG.analytics) ? window.SITE_CONFIG.analytics : null;

  if (!config || !config.enabled || !config.ga4Id) {
    return; // GA4 disabled or no ID provided
  }

  var GA_ID = config.ga4Id;
  var EVENT_MAP = config.events || {};

  // ─── Inject gtag.js if not already present ───
  function injectGtag() {
    if (window.dataLayer && window.gtag) {
      return; // Already loaded
    }

    window.dataLayer = window.dataLayer || [];

    // Define gtag stub
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    // Set default consent
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      send_page_view: false // We handle page views manually for SPA
    });

    // Inject the GA4 script
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    var firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }
  }

  // ─── Send page view ───
  function sendPageView(path) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: path || (window.location.pathname + window.location.search + window.location.hash)
    });
  }

  // ─── Track conversion event ───
  function trackEvent(eventName, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, params || {});
  }

  // ─── Auto-bind elements with data-ga-event ───
  function bindDataGaEvents() {
    var elements = document.querySelectorAll("[data-ga-event]");
    if (!elements || !elements.length) return;

    for (var i = 0; i < elements.length; i++) {
      (function (el) {
        var eventName = el.getAttribute("data-ga-event");
        if (!eventName) return;

        // Avoid double-binding
        if (el.__gaBound) return;
        el.__gaBound = true;

        // Attach click handler
        if (el.addEventListener) {
          el.addEventListener("click", function (e) {
            var label = el.getAttribute("data-ga-label") || el.textContent || "";
            trackEvent(eventName, {
              event_category: "engagement",
              event_label: label.trim().substring(0, 100)
            });
          });
        }
      })(elements[i]);
    }
  }

  // ─── Observe DOM for dynamically added elements ───
  function observeDynamicElements() {
    if (typeof MutationObserver === "undefined") return;

    var observer = new MutationObserver(function (mutations) {
      var shouldRebind = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {
          shouldRebind = true;
          break;
        }
      }
      if (shouldRebind) {
        bindDataGaEvents();
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ─── Track SPA route changes ───
  function trackSPA() {
    // hashchange
    if (window.addEventListener) {
      window.addEventListener("hashchange", function () {
        sendPageView(window.location.pathname + window.location.hash);
      });

      // popstate (History API)
      window.addEventListener("popstate", function () {
        sendPageView(window.location.pathname + window.location.search + window.location.hash);
      });
    }
  }

  // ─── Initialize ───
  function init() {
    injectGtag();
    sendPageView();
    bindDataGaEvents();
    observeDynamicElements();
    trackSPA();
  }

  // Run on DOMContentLoaded or immediately if DOM is ready
  if (document.readyState === "loading") {
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", init);
    }
  } else {
    init();
  }
})();
