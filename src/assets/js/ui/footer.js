/**
 * footer.js — Footer component (bottom nav & page footer)
 *
 * Mobile (<768px): 4 items — 首页/产品/解决方案/WhatsApp
 * Tablet (768-1279px): 6 items — 首页/产品/解决方案/制造/关于/WhatsApp
 * PC (>=1280px): Full site footer (4-column) with legal links
 *
 * ⚠️ Bottom navigation can be delegated to bottom-tab.js when
 *    SITE_CONFIG.features.unifiedBottomNav === true.
 */
(function (window) {
  "use strict";

  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _features = _cfg.features || {};

  /* ── Guard: unifiedBottomNav 开启时，bottom tab bar 由 bottom-tab.js 接管 ── */
  /* PC (>=1280px) 需要 PC footer，不受影响 */
  /* <1280px: 只渲染 compact footer（不含 bottom bar），bottom bar 由 bottom-tab.js 负责 */
  var _unifiedBottomNav = _features.unifiedBottomNav;

  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (key == null) key = evt + ":" + (++_spaRegs.__k || (_spaRegs.__k = 1));
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  var resizeTimer;

  /** @type {string} 上次挂载的宽度桶（"pc"/"tablet"/"mobile"），用于 SPA 过渡时避免重复重建 */
  var _lastFooterMountWidthBucket = null;

  /* ─── Mobile items (4) ─── */
  var mobileItems = [
    { id: "home", icon: "home", key: "nav_home", href: "/home/", fill: true },
    { id: "products", icon: "local_cafe", key: "nav_products", href: "/products/", fill: false },
    { id: "solutions", icon: "business_center", key: "nav_solutions", href: "/solutions/", fill: false },
    { id: "whatsapp", icon: "chat", key: "nav_whatsapp", href: "", fill: false, isWhatsApp: true },
  ];

  /* ─── Tablet items (6) ─── */
  var tabletItems = [
    { id: "home", icon: "home", key: "nav_home", href: "/home/", fill: true },
    { id: "products", icon: "local_cafe", key: "nav_products", href: "/products/", fill: false },
    { id: "solutions", icon: "business_center", key: "nav_solutions", href: "/solutions/", fill: false },
    {
      id: "manufacturing",
      icon: "precision_manufacturing",
      key: "nav_manufacturing",
      href: "/manufacturing/",
      fill: false,
    },
    { id: "about", icon: "info", key: "nav_about", href: "/about/", fill: false },
    { id: "whatsapp", icon: "chat", key: "nav_whatsapp", href: "", fill: false, isWhatsApp: true },
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getItemsForVariant(variant) {
    return variant === "tablet" ? tabletItems : mobileItems;
  }

  function buildItemHtml(item, activeId) {
    var isActive = item.id === activeId;
    var colorClass = isActive ? "text-primary" : "text-slate-400 dark:text-slate-500";
    var fillStyle = isActive && item.fill ? " style=\"font-variation-settings: 'FILL' 1;\"" : "";
    var label = item.key
      ? '<p class="text-[10px] font-bold uppercase tracking-wider text-center" data-i18n="' +
        esc(item.key) +
        '">' +
        esc(item.key) +
        "</p>"
      : "";
    var waHref =
      "https://wa.me/" +
      ((window.Contacts && window.Contacts.whatsapp) || (_cfg.contacts || {}).whatsapp || "8618565718814");

    if (item.isWhatsApp) {
      return (
        '<a class="whatsapp-tab-item relative flex flex-1 flex-col items-center justify-center gap-1 text-[#25d366]" ' +
        'href="' +
        waHref +
        '" data-wa-message-key="wa_msg_contact" data-wa-source="footer-tab" ' +
        'target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">' +
        '<span class="material-symbols-outlined relative" style="font-size:26px">' +
        esc(item.icon) +
        "</span>" +
        label +
        "</a>"
      );
    }

    return (
      '<a class="relative flex flex-1 flex-col items-center justify-center gap-1 ' +
      colorClass +
      '" href="' +
      esc(item.href) +
      '">' +
      '<span class="material-symbols-outlined relative"' +
      fillStyle +
      ">" +
      esc(item.icon) +
      "</span>" +
      label +
      "</a>"
    );
  }

  function buildBarHtml(variant, activeId) {
    var items = getItemsForVariant(variant);
    var tabletClass = variant === "tablet" ? " max-w-3xl mx-auto" : "";
    var pbSafe = variant === "tablet" ? " pb-3" : " pb-6";

    var itemsHtml = items
      .map(function (item) {
        return buildItemHtml(item, activeId);
      })
      .join("\n");

    return (
      '<div class="fixed bottom-0 left-0 right-0 z-[var(--z-footer)]">' +
      '<div class="flex gap-2 border-t border-slate-200 dark:border-slate-800 ' +
      "bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4" +
      pbSafe +
      " pt-2" +
      tabletClass +
      '">' +
      itemsHtml +
      "</div></div>"
    );
  }

  /* ─── Mobile/Tablet Site Footer (compact) ─── */
  function buildMobileFooterHtml() {
    return (
      '<div class="bg-slate-900 text-white pb-20 mx-auto mt-8" style="max-width:1920px">' +
      '<div class="section-content mx-auto px-3 sm:px-5 py-4 sm:py-6">' +
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">' +
      /* Products */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 text-center" data-i18n="footer_products_title">Products</h4>' +
      '<ul class="list-none space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/products/all/" class="hover:text-white transition-colors" data-i18n="nav_products">All Products</a></li>' +
      '<li><a href="/products/coffee/" class="hover:text-white transition-colors" data-i18n="nav_products_coffee">Coffee</a></li>' +
      '<li><a href="/products/tea/" class="hover:text-white transition-colors" data-i18n="nav_products_tea">Tea &amp; Milk Tea</a></li>' +
      '<li><a href="/products/meal/" class="hover:text-white transition-colors" data-i18n="nav_products_meal">Meal Replacement</a></li>' +
      '<li><a href="/products/beauty/" class="hover:text-white transition-colors" data-i18n="nav_products_beauty">Beauty</a></li>' +
      '<li><a href="/products/weight/" class="hover:text-white transition-colors" data-i18n="nav_products_weight">Weight Management</a></li>' +
      '<li><a href="/products/gut/" class="hover:text-white transition-colors" data-i18n="nav_products_gut">Gut Health</a></li>' +
      '<li><a href="/products/lifestyle/" class="hover:text-white transition-colors" data-i18n="nav_products_lifestyle">Lifestyle</a></li>' +
      "</ul></div>" +
      /* Solutions */
      '<div class="block text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 text-center" data-i18n="footer_solutions_title">Solutions</h4>' +
      '<ul class="list-none space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/solutions/oem/" class="hover:text-white transition-colors" data-i18n="nav_solutions_oem">OEM</a></li>' +
      '<li><a href="/solutions/odm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_odm">ODM</a></li>' +
      '<li><a href="/solutions/obm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_obm">OBM</a></li>' +
      '<li><a href="/solutions/rd/" class="hover:text-white transition-colors" data-i18n="nav_solutions_rd">R&amp;D</a></li>' +
      '<li><a href="/solutions/packaging/" class="hover:text-white transition-colors" data-i18n="nav_solutions_packaging">Packaging</a></li>' +
      "</ul></div>" +
      /* Support (shown on md+) */
      '<div class="hidden md:block">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2" data-i18n="footer_support_title">Support</h4>' +
      '<ul class="list-none space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/cases/" class="hover:text-white transition-colors" data-i18n="nav_cases">Case Studies</a></li>' +
      '<li><a href="/resources/catalog/" class="hover:text-white transition-colors" data-i18n="nav_resources">Resources</a></li>' +
      '<li><a href="/contact/" class="hover:text-white transition-colors" data-i18n="nav_contact">Contact</a></li>' +
      '<li><a href="/about/" class="hover:text-white transition-colors" data-i18n="nav_about">About</a></li>' +
      "</ul></div>" +
      /* Legal (shown on md+) */
      '<div class="hidden md:block">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2" data-i18n="footer_legal_title">Legal</h4>' +
      '<ul class="list-none space-y-1 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/privacy/" class="hover:text-white transition-colors" data-i18n="footer_legal_privacy_policy">Privacy Policy</a></li>' +
      '<li><a href="/terms/" class="hover:text-white transition-colors" data-i18n="footer_legal_user_agreement">User Agreement</a></li>' +
      "</ul></div>" +
      "</div>" +
      /* Legal + Copyright */
      '<div class="border-t border-white/20 pt-3 sm:pt-4 flex flex-col items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400">' +
      '<div class="flex gap-3 sm:gap-4">' +
      '<a href="/privacy/" class="hover:text-white transition-colors" data-i18n="footer_legal_privacy_policy">Privacy Policy</a>' +
      '<a href="/terms/" class="hover:text-white transition-colors" data-i18n="footer_legal_user_agreement">User Agreement</a>' +
      "</div>" +
      '<p data-i18n="footer_copyright"></p>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  /* ─── PC Footer ─── */
  function buildPCFooterHtml() {
    return (
      '<div class="bg-slate-900 text-white mx-auto mt-8" style="max-width:1920px">' +
      '<div class="section-content mx-auto px-3 sm:px-5 xl:px-10 pt-8 sm:pt-12 pb-6 sm:pb-8">' +
      '<div class="grid grid-cols-4 gap-4 lg:gap-8">' +
      /* Products */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_products_title">Products</h4>' +
      '<ul class="list-none space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/products/all/" class="hover:text-white transition-colors" data-i18n="nav_products">All Products</a></li>' +
      '<li><a href="/products/coffee/" class="hover:text-white transition-colors" data-i18n="nav_products_coffee">Coffee Series</a></li>' +
      '<li><a href="/products/tea/" class="hover:text-white transition-colors" data-i18n="nav_products_tea">Tea &amp; Milk Tea</a></li>' +
      '<li><a href="/products/meal/" class="hover:text-white transition-colors" data-i18n="nav_products_meal">Meal Replacement</a></li>' +
      '<li><a href="/products/beauty/" class="hover:text-white transition-colors" data-i18n="nav_products_beauty">Beauty &amp; Collagen</a></li>' +
      '<li><a href="/products/weight/" class="hover:text-white transition-colors" data-i18n="nav_products_weight">Weight Management</a></li>' +
      '<li><a href="/products/gut/" class="hover:text-white transition-colors" data-i18n="nav_products_gut">Gut Health</a></li>' +
      '<li><a href="/products/lifestyle/" class="hover:text-white transition-colors" data-i18n="nav_products_lifestyle">Lifestyle</a></li>' +
      "</ul>" +
      "</div>" +
      /* Solutions */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_solutions_title">Solutions</h4>' +
      '<ul class="list-none space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/solutions/oem/" class="hover:text-white transition-colors" data-i18n="nav_solutions_oem">OEM Services</a></li>' +
      '<li><a href="/solutions/odm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_odm">ODM Services</a></li>' +
      '<li><a href="/solutions/obm/" class="hover:text-white transition-colors" data-i18n="nav_solutions_obm">OBM Services</a></li>' +
      '<li><a href="/solutions/rd/" class="hover:text-white transition-colors" data-i18n="nav_solutions_rd">R&amp;D Capabilities</a></li>' +
      '<li><a href="/solutions/packaging/" class="hover:text-white transition-colors" data-i18n="nav_solutions_packaging">Packaging Solutions</a></li>' +
      "</ul>" +
      "</div>" +
      /* Support */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_support_title">Support</h4>' +
      '<ul class="list-none space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/cases/" class="hover:text-white transition-colors" data-i18n="nav_cases">Case Studies</a></li>' +
      '<li><a href="/resources/catalog/" class="hover:text-white transition-colors" data-i18n="nav_resources">Resources</a></li>' +
      '<li><a href="/contact/" class="hover:text-white transition-colors" data-i18n="nav_contact">Contact Us</a></li>' +
      '<li><a href="/about/" class="hover:text-white transition-colors" data-i18n="nav_about">About YuKoLi</a></li>' +
      "</ul>" +
      "</div>" +
      /* Legal */
      '<div class="text-center">' +
      '<h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-4" data-i18n="footer_legal_title">Legal</h4>' +
      '<ul class="list-none space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-300">' +
      '<li><a href="/privacy/" class="hover:text-white transition-colors" data-i18n="footer_legal_privacy_policy">Privacy Policy</a></li>' +
      '<li><a href="/terms/" class="hover:text-white transition-colors" data-i18n="footer_legal_user_agreement">User Agreement</a></li>' +
      "</ul>" +
      "</div>" +
      "</div>" +
      '<div class="border-t border-white/20 mt-6 pt-6 text-center text-xs sm:text-sm text-slate-400">' +
      '<p data-i18n="footer_copyright"></p>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function mount() {
    var footers = document.querySelectorAll('footer[data-component="footer"]');

    // ── Early exit: if width bucket hasn't changed and footer already exists, skip rebuild ──
    var w = window.innerWidth;
    var widthBucket = w >= 1280 ? "pc" : w >= 768 ? "tablet" : "mobile";
    if (_lastFooterMountWidthBucket === widthBucket) {
      // Footer DOM already correct for this device — just update active state
      if (window.translationManager && typeof window.translationManager.applyTranslations === "function") {
        window.translationManager.applyTranslations();
      }
      return;
    }
    _lastFooterMountWidthBucket = widthBucket;

    // Defensive: if no footer placeholder exists, create one
    if (footers.length === 0) {
      var f = document.createElement("footer");
      f.setAttribute("data-component", "footer");
      f.setAttribute("data-active", "");
      document.body.appendChild(f);
      footers = [f];
    }

    for (var i = 0; i < footers.length; i++) {
      var footer = footers[i];
      var _variant = footer.getAttribute("data-variant") || "mobile";
      var activeId = footer.getAttribute("data-active") || "";

      // PC (>=1280px) → render full site footer
      if (w >= 1280) {
        footer.style.display = "";
        footer.innerHTML = buildPCFooterHtml();
        continue;
      }

      // Use tablet items for 768-1279, mobile items for <768
      var resolvedVariant = w >= 768 ? "tablet" : "mobile";

      footer.style.display = "";
      // unifiedBottomNav: bottom-tab.js 接管底栏，footer.js 只渲染紧凑 footer
      if (_unifiedBottomNav) {
        footer.innerHTML = buildMobileFooterHtml();
      } else {
        footer.innerHTML = buildMobileFooterHtml() + buildBarHtml(resolvedVariant, activeId);
      }
    }

    // Fade-in animation (unifiedBottomNav 模式没有 .fixed.bottom-0 bar)
    var bar = document.querySelector(".fixed.bottom-0");
    if (bar) {
      bar.style.opacity = "0";
      bar.style.transition = "opacity 0.15s ease-out";
    }

    // Apply translations
    if (window.translationManager && typeof window.translationManager.applyTranslations === "function") {
      window.translationManager.applyTranslations();
    }

    window.requestAnimationFrame(function () {
      if (bar) bar.style.opacity = "1";
    });
  }

  /* ─── Handle bfcache (back/forward) ─── */
  _spaOn(
    window,
    "pageshow",
    function (e) {
      if (!e.persisted) return;
      var needsRemount = false;
      var footers = document.querySelectorAll('footer[data-component="footer"]');
      for (var i = 0; i < footers.length; i++) {
        if (!footers[i].querySelector || !footers[i].querySelector(".fixed.bottom-0")) {
          needsRemount = true;
          break;
        }
      }
      if (!document.querySelector(".fixed.bottom-0")) needsRemount = true;
      if (needsRemount) mount();
    },
    "footer:pageshow"
  );

  /* ─── Public API ─── */
  window.Footer = {
    mount: mount,
    updateActive: function (newActiveId) {
      newActiveId = newActiveId || "";
      var allItems = mobileItems.concat(tabletItems);
      var links = document.querySelectorAll(".fixed.bottom-0 a[href]");
      if (links.length === 0) return;

      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var href = link.getAttribute("href") || "";
        // Skip external links
        if (href.startsWith("http") || href.indexOf("wa.me") >= 0) continue;

        var matched = null;
        for (var j = 0; j < allItems.length; j++) {
          var itemHref = allItems[j].href;
          var linkHref = href;
          if (itemHref.endsWith("/")) itemHref = itemHref.slice(0, -1);
          if (linkHref.endsWith("/")) linkHref = linkHref.slice(0, -1);
          if (itemHref === linkHref) {
            matched = allItems[j];
            break;
          }
        }

        var isActive = matched && matched.id === newActiveId;
        var icon = link.querySelector(".material-symbols-outlined");

        if (isActive) {
          link.className = "flex flex-1 flex-col items-center justify-center gap-1 text-primary";
          if (icon && matched.fill) icon.setAttribute("style", "font-variation-settings: 'FILL' 1;");
        } else {
          link.className = "flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500";
          if (icon) icon.removeAttribute("style");
        }
      }
    },
  };

  /* ─── Init ─── */
  function init() {
    mount();
  }

  if (typeof Boot !== "undefined") {
    Boot.register("footer", 1, init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ─── Resize handler ─── */
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(mount, 200);
  });
})(window);
