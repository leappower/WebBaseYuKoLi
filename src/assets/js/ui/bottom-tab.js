/**
 * bottom-tab.js — Unified Bottom Navigation Bar
 *
 * Config-driven: reads items from window.SITE_CONFIG.footer.mobileItems / tabletItems
 * Breakpoints:
 *   Mobile (<768px)  → footer.mobileItems
 *   Tablet (768–1023) → footer.tabletItems (falls back to mobileItems if absent)
 *   PC     (≥1280px) → hidden
 *
 * Item type support:
 *   "toggle"   → open slide-menu (via window.SlideMenu.toggle)
 *   "link"     → SPA navigate (window.__spaNavigate) or location.href
 *   "cta"      → highlighted green CTA button (navigates like "link")
 *   "external" → window.open() in new tab (WhatsApp number from config)
 *
 * Feature gate:  window.SITE_CONFIG.features.unifiedBottomNav === true
 * Brand colors:  window.SITE_CONFIG.theme.colors.primary / primaryHover
 * WhatsApp:      window.SITE_CONFIG.contacts.whatsapp / whatsappDefaultMsg
 *
 * ES5 compatible.  No JSX, no ES6 features.
 * @audit-safe — all content from config, no user-input injection
 */
(function () {
  "use strict";

  /* ── Config access (lazy) ──────────────────────────────────── */
  var _cfg, _features, _footer, _colors, _contacts;

  function getCfg() {
    return _cfg || (_cfg = window.SITE_CONFIG || {});
  }
  function getFeatures() {
    return _features || (_features = getCfg().features || {});
  }
  function getFooter() {
    return _footer || (_footer = getCfg().footer || {});
  }
  function getColors() {
    return _colors || (_colors = (getCfg().theme && getCfg().theme.colors) || {});
  }
  function getContacts() {
    return _contacts || (_contacts = getCfg().contacts || {});
  }

  /* ── Feature gate ──────────────────────────────────────────── */
  if (!getFeatures().unifiedBottomNav) return;

  /* ── Design tokens ─────────────────────────────────────────── */
  var PRIMARY = getColors().primary || "#2E7D32";
  var PRIMARY_HOVER = getColors().primaryHover || "#1B5E20";
  var WA_COLOR = "#25D366";
  var BAR_HEIGHT = 64;

  /* ── Breakpoint helpers ────────────────────────────────────── */
  function getBreakpoint() {
    var w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1280) return "tablet";
    return "pc";
  }

  /**
   * Return the item array for the current breakpoint.
   * @returns {Array|null} null → PC / no items
   */
  function getItems() {
    var bp = getBreakpoint();
    if (bp === "pc") return null;
    var footer = getFooter();
    if (bp === "tablet" && footer.tabletItems && footer.tabletItems.length > 0) {
      return footer.tabletItems;
    }
    return footer.mobileItems || [];
  }

  /* ── Item helpers ──────────────────────────────────────────── */

  /**
   * Resolve item type: explicit "type" field wins, otherwise infer.
   */
  function resolveType(item) {
    if (item.type) return item.type;
    // Infer from clues
    if (item.id === "menu" || item.id === "hamburger") return "toggle";
    if (item.href && item.href.indexOf("wa.me") >= 0) return "external";
    if (item.id === "whatsapp") return "external";
    if (item.highlight) return "cta"; // legacy support
    return "link";
  }

  /**
   * Localize a label that may be a plain string or { en, zh-CN… } object.
   */
  function localize(label) {
    if (typeof label === "string") return label;
    if (!label || typeof label !== "object") return "";
    var lang = (getCfg().lang || document.documentElement.lang || "en").toLowerCase();
    if (label[lang]) return label[lang];
    if (label.en) return label.en;
    if (label["zh-CN"]) return label["zh-CN"];
    var keys = Object.keys(label);
    return keys.length > 0 ? label[keys[0]] || "" : "";
  }

  /* ── Icon HTML ─────────────────────────────────────────────── */
  function iconHTML(name) {
    return '<span class="material-symbols-outlined" aria-hidden="true">' + (name || "circle") + "</span>";
  }

  /**
   * Build WhatsApp href from config — ensures correct number + message.
   */
  function buildWhatsAppHref() {
    var c = getContacts();
    var num = c.whatsapp || "";
    var msg = c.whatsappMessage || c.whatsappDefaultMsg || "";
    var href = "https://wa.me/" + num;
    if (msg) href += "?text=" + encodeURIComponent(msg);
    return href;
  }

  /* ── Build bar HTML ────────────────────────────────────────── */
  function buildHTML() {
    var items = getItems();
    if (!items || !items.length) return "";

    var parts = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var type = resolveType(item);
      var label = localize(item.label);
      var icon = iconHTML(item.icon);
      var href = item.href || "#";

      // CSS classes per type
      var cls = "btab-item";
      if (type === "cta") cls += " btab-item--cta";
      if (type === "external") cls += " btab-item--wa";

      var attrs = ' data-btab-type="' + type + '"';
      if (href !== "#") attrs += ' data-btab-href="' + href + '"';
      attrs += ' data-btab-id="' + (item.id || "") + '"';

      parts.push(
        '<button class="' +
          cls +
          '"' +
          attrs +
          ' aria-label="' +
          label +
          '">' +
          icon +
          '<span class="btab-label">' +
          label +
          "</span>" +
          "</button>"
      );
    }

    return (
      '<nav id="bottom-tab-bar" class="btab-bar" role="navigation" aria-label="Bottom navigation">' +
      parts.join("") +
      "</nav>"
    );
  }

  /* ── Click router ──────────────────────────────────────────── */
  function handleClick(e) {
    /** @type {HTMLElement|null} */
    var btn = e.target.closest ? e.target.closest(".btab-item") : null;
    if (!btn) return;

    var type = btn.getAttribute("data-btab-type");
    var href = btn.getAttribute("data-btab-href");

    switch (type) {
      case "toggle":
        e.preventDefault();
        if (window.SlideMenu) {
          var menuPanel = document.getElementById("mobile-menu-panel");
          if (menuPanel) {
            window.SlideMenu.close();
          } else {
            window.SlideMenu.open();
          }
        } else {
          var toggle = document.getElementById("mobile-menu-toggle");
          if (toggle) toggle.click();
        }
        break;

      case "link":
      case "cta":
        if (href && href !== "#") {
          e.preventDefault();
          if (window.__spaNavigate) {
            window.__spaNavigate(href);
          } else {
            window.location.href = href;
          }
        }
        break;

      case "external":
        e.preventDefault();
        var extHref = href;
        // Always rebuild WhatsApp URL from config to ensure correct number
        if (!extHref || extHref === "#" || extHref.indexOf("wa.me") >= 0) {
          extHref = buildWhatsAppHref();
        }
        window.open(extHref, "_blank", "noopener");
        break;

      default:
        break;
    }
  }

  /* ── Styles (minimal — most visual via CSS-injected classes) ─ */
  function injectStyles() {
    // CSS moved to styles.css
  }

  /* ── Inject into DOM ───────────────────────────────────────── */
  function inject() {
    if (document.getElementById("bottom-tab-bar")) return;

    var bp = getBreakpoint();
    if (bp === "pc") return;

    injectStyles();

    var html = buildHTML();
    if (!html) return;

    var wrapper = document.createElement("div");
    /* @audit-safe: config-driven html */
    wrapper.innerHTML = html;
    var bar = wrapper.firstElementChild;
    if (!bar) return;

    document.body.appendChild(bar);
    bar.addEventListener("click", handleClick);

    // Active state management
    updateActiveState();
    window.addEventListener("popstate", updateActiveState);
    document.addEventListener("spa:navigate", updateActiveState);
    document.addEventListener("spa:load", updateActiveState);

    // Resize: hide on PC, re-show on mobile/tablet
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var existing = document.getElementById("bottom-tab-bar");
        var bp2 = getBreakpoint();
        if (bp2 === "pc") {
          if (existing) existing.remove();
        } else if (!existing) {
          inject();
        }
      }, 250);
    });
  }

  /* ── Active state ──────────────────────────────────────── */

  /**
   * Match current URL to a bottom-tab item and highlight it.
   * - Home item: exact /home/ match
   * - Link items: path starts with item href
   * - External/toggle items: never active
   */
  function updateActiveState() {
    var bar = document.getElementById("bottom-tab-bar");
    if (!bar) return;
    var items = bar.querySelectorAll(".btab-item");
    var path = (location.pathname || "").replace(/\/$/, "");

    for (var i = 0; i < items.length; i++) {
      var btn = items[i];
      var type = btn.getAttribute("data-btab-type");
      var href = btn.getAttribute("data-btab-href") || "";
      var itemPath = href.replace(/\/$/, "");

      // External/toggle never active
      if (type === "external" || type === "toggle") {
        btn.classList.remove("btab-item--active");
        continue;
      }

      var isActive = false;

      if (type === "link" || type === "cta") {
        // Home item: only match when on exact /home/ or root /
        if (itemPath === "/home") {
          isActive = path === "" || path === "/home";
        } else {
          // Other items: prefix match (e.g. /products matches /products/coffee/)
          isActive = itemPath.length > 0 && path.indexOf(itemPath) === 0;
        }
      }

      if (isActive) {
        btn.classList.add("btab-item--active");
      } else {
        btn.classList.remove("btab-item--active");
      }
    }
  }

  /* ── Public API ───────────────────────────────────────────── */
  window.BottomTab = {
    updateActive: updateActiveState,
  };

  /* ── Bootstrap ─────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
