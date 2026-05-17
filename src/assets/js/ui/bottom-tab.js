/**
 * bottom-tab.js — Fixed Bottom Tab Bar (mobile <768px)
 * 4 items: MENU (hamburger → slide-menu), SOLUTIONS (link),
 * INQUIRY (highlighted → contact popup), WHATSAPP (direct link)
 *
 * ES5 compatible. Uses window.SlideMenu if available.
 * @audit-safe — static HTML, no user input
 */

(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────
  var TABS = [
    {
      id: "menu",
      icon: "menu",
      label: { en: "Menu", "zh-CN": "菜单" },
      action: "toggle-menu",
    },
    {
      id: "solutions",
      icon: "precision_manufacturing",
      label: { en: "Solutions", "zh-CN": "方案" },
      action: "link",
      href: "/solutions/oem/",
    },
    {
      id: "inquiry",
      icon: "chat",
      label: { en: "Inquiry", "zh-CN": "询盘" },
      action: "link",
      href: "/contact/",
      highlight: true, // larger, amber-gold glow
    },
    {
      id: "whatsapp",
      icon: "chat",
      label: { en: "WhatsApp", "zh-CN": "WhatsApp" },
      action: "whatsapp",
      href: "https://wa.me/8613924828214?text=Hi%20YuKoLi%2C%20I%27m%20interested%20in%20your%20OEM%2FODM%20solutions.",
      whatsapp: true,
    },
  ];

  // ── Icons (Material Symbols outlined, static) ─────────────────
  /** @type {Object.<string,string>} */
  var ICONS = {
    menu: '<span class="material-symbols-outlined" aria-hidden="true">menu</span>',
    precision_manufacturing:
      '<span class="material-symbols-outlined" aria-hidden="true">precision_manufacturing</span>',
    chat: '<span class="material-symbols-outlined" aria-hidden="true">chat</span>',
  };

  /** @type {string} WhatsApp brand color */
  var WHATSAPP_COLOR = "#25D366";

  // ── Build HTML ────────────────────────────────────────────────
  /** @returns {string} Bottom tab bar HTML */
  function buildHTML() {
    var lang =
      (window.SITE_CONFIG && window.SITE_CONFIG.lang) ||
      document.documentElement.lang ||
      "en";

    var itemsHtml = "";
    for (var i = 0; i < TABS.length; i++) {
      var tab = TABS[i];
      var labelText =
        (tab.label[lang] || tab.label.en || tab.label["zh-CN"]);

      var classes = "bottom-tab__item";
      if (tab.highlight) classes += " bottom-tab__item--highlight";
      if (tab.whatsapp) classes += " bottom-tab__item--whatsapp";

      var attrs = "data-tab-action='" + tab.action + "'";
      if (tab.href) attrs += " data-tab-href='" + tab.href + "'";

      var iconHtml = ICONS[tab.icon] || "";

      itemsHtml +=
        '<button class="' + classes + '" ' + attrs + ' aria-label="' + labelText + '">' +
          iconHtml +
          '<span class="bottom-tab__label">' + labelText + "</span>" +
        "</button>";
    }

    return (
      '<div id="bottom-tab-bar" class="bottom-tab" role="navigation" aria-label="Mobile navigation">' +
        itemsHtml +
      "</div>"
    );
  }

  // ── Click handler ─────────────────────────────────────────────
  function handleClick(e) {
    var btn = e.target.closest(".bottom-tab__item");
    if (!btn) return;

    var action = btn.getAttribute("data-tab-action");
    var href = btn.getAttribute("data-tab-href");

    switch (action) {
      case "toggle-menu":
        if (window.SlideMenu) {
          e.preventDefault();
          window.SlideMenu.toggle();
        } else {
          // Fallback: show mobile header menu toggle
          var toggle = document.getElementById("mobile-menu-toggle");
          if (toggle) toggle.click();
        }
        break;

      case "link":
        if (href) {
          e.preventDefault();
          // Use SPA router if available
          if (window.__spaNavigate) {
            window.__spaNavigate(href);
          } else {
            window.location.href = href;
          }
        }
        break;

      case "whatsapp":
        if (href) {
          window.open(href, "_blank");
        }
        break;

      default:
        break;
    }
  }

  // ── Inject ────────────────────────────────────────────────────
  function inject() {
    if (document.getElementById("bottom-tab-bar")) return; // already injected

    // Only inject on mobile
    if (window.innerWidth >= 768) return;

    var bar = document.createElement("div");
    bar.innerHTML = buildHTML();
    document.body.appendChild(bar.firstElementChild);

    // Inject CSS
    var style = document.createElement("style");
    style.id = "bottom-tab-style";
    style.textContent =
      ".bottom-tab {" +
        "  position: fixed; bottom: 0; left: 0; right: 0; z-index: 9998;" +
        "  display: flex; height: 60px;" +
        "  background: #fff; border-top: 1px solid #e0e0e0;" +
        "  box-shadow: 0 -2px 8px rgba(0,0,0,0.08);" +
        "}" +
        ".bottom-tab__item {" +
        "  flex: 1; display: flex; flex-direction: column;" +
        "  align-items: center; justify-content: center;" +
        "  border: none; background: transparent; cursor: pointer;" +
        "  color: #666; font-size: 10px; padding: 6px 0;" +
        "  transition: color 0.2s;" +
        "  -webkit-tap-highlight-color: transparent;" +
        "  position: relative;" +
        "}" +
        ".bottom-tab__item .material-symbols-outlined {" +
        "  font-size: 26px; margin-bottom: 2px;" +
        "}" +
        ".bottom-tab__label { line-height: 1.2; }" +
        /* Highlight: INQUIRY button */
        ".bottom-tab__item--highlight {" +
        "  flex: 1.5; background: var(--color-primary, #2E7D32);" +
        "  color: #fff; border-radius: 30px 30px 0 0;" +
        "  margin-top: -8px; padding-top: 14px;" +
        "  box-shadow: 0 -2px 12px rgba(46,125,50,0.3);" +
        "}" +
        ".bottom-tab__item--highlight .material-symbols-outlined {" +
        "  font-size: 28px;" +
        "}" +
        /* WhatsApp color */
        ".bottom-tab__item--whatsapp { color: " + WHATSAPP_COLOR + "; }" +
        /* Active state */
        ".bottom-tab__item:active { opacity: 0.7; }" +
        /* Hide on desktop */
        "@media (min-width: 768px) {" +
        "  .bottom-tab { display: none !important; }" +
        "}" +
        /* Push body content up by 60px on mobile */
        "@media (max-width: 767px) {" +
        "  body { padding-bottom: 60px; }" +
        "}" +
        /* Footer spacing compensation */
        "@media (max-width: 767px) {" +
        "  footer#footer { padding-bottom: 70px; }" +
        "}";
    document.head.appendChild(style);

    // Add click listener
    var barEl = document.getElementById("bottom-tab-bar");
    barEl.addEventListener("click", handleClick);

    // Add resize listener to show/hide
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth < 768 && !document.getElementById("bottom-tab-bar")) {
          inject();
        }
      }, 300);
    });
  }

  // ── Bootstrap ─────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
