/**
 * breadcrumb.js — 面包屑入口层（重构版 v2.0）
 *
 * 职责：事件绑定 + 生命周期管理 + API 暴露
 * 依赖：breadcrumb-data.js → breadcrumb-render.js → breadcrumb.js
 *
 * 生命周期：
 *   1. init(): 根据 DOM 状态 + SPA 事件 + TranslationManager 就绪触发渲染
 *   2. SPA 切换: spa:load → refresh()
 *   3. 语言切换: languageChanged → refresh()
 *   4. PDP 异步品类: product-data-ready → updateCurrent()
 *
 * 公共 API:
 *   window.Breadcrumb.refresh()
 *   window.Breadcrumb.goBack()
 *   window.Breadcrumb.updateCurrent(text)
 *
 * 格式：IIFE（向后兼容静态 <script> 标签 + vm 单元测试）
 * Webpack entry: breadcrumb → 此文件作为 webpack 入口
 *
 * ⚠ 依赖 breadcrumb-data.js（window.BreadcrumbData）和
 *   breadcrumb-render.js（window.BreadcrumbRender）在运行前已加载。
 *   在 webpack 构建中，它们作为独立 entry 先于 breadcrumb.js 执行。
 */

(function () {
  "use strict";

  // ─── 内部状态 ───────────────────────────────────────────────
  var _currentPage = null;
  var _ready = false;

  // ─── SWUP 事件注册（AbortController 安全注销）─────────────
  var _spaRegs = {};

  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  // ─── i18n 包装函数（兼容旧 tl() 调用）───────────────────────
  function tl(key, fallback) {
    if (typeof key === "object") key = key.en || key["zh-CN"] || "";
    if (typeof fallback === "object") fallback = key;
    if (typeof window.__safe !== "undefined" && typeof window.__safe.t === "function") {
      var result = window.__safe.t(key);
      if (result && result !== key) return result;
    }
    return fallback || key;
  }

  // ─── 配置读取 ────────────────────────────────────────────────
  function getConfig() {
    return window.SITE_CONFIG || window._cfg || {};
  }

  function getCategories() {
    return getConfig().categories || {};
  }

  function getCurrentLanguage() {
    if (window.translationManager && window.translationManager.currentLanguage) {
      return window.translationManager.currentLanguage;
    }
    return "zh-CN";
  }

  // ─── 异步就绪 Promise 队列 ─────────────────────────────────
  var _readyPromise = null;

  /**
   * 等待所有依赖就绪
   * @returns {Promise}
   */
  function whenReady() {
    console.info("[Breadcrumb] whenReady — configReady:", !!getConfig().categories, "i18nReady:", typeof window.t === "function");
    if (_readyPromise) return _readyPromise;

    _readyPromise = new Promise(function (resolve) {
      var configReady = function () {
        return !!getConfig().categories;
      };
      var i18nReady = function () {
        return typeof window.t === "function";
      };

      if (configReady() && i18nReady()) {
        resolve();
        return;
      }

      var check = function () {
        if (configReady() && i18nReady()) {
          resolve();
        }
      };

      // 监听 SPA 就绪
      console.info("[Breadcrumb] whenReady: config+i18n not ready, waiting for spa:ready or __safe.whenReady");
      document.addEventListener("spa:ready", check, { once: true });
      // T2.3: 使用 whenReady 替代 setTimeout 兜底
      window.__safe.whenReady(
        function () {
          return configReady() && i18nReady();
        },
        function (ready) {
          resolve();
        },
        500
      );
    });

    return _readyPromise;
  }

  // ─── 获取容器 ────────────────────────────────────────────────
  function getContainer() {
    var container = document.getElementById("breadcrumb-container");
    if (!container) {
      var spa = document.getElementById("spa-content") || document.querySelector("main");
      if (spa) {
        container = document.createElement("div");
        container.id = "breadcrumb-container";
        spa.insertBefore(container, spa.firstChild);
      }
    }
    return container;
  }

  // ─── 域名产品品类映射 ──────────────────────────────────────
  var _slugToKey = {};
  var _keyToSlug = {};

  function initMaps() {
    console.info("[Breadcrumb] initMaps — BreadcrumbData:", typeof window.BreadcrumbData, "categories:", Object.keys(getConfig().categories || {}).length);
    if (typeof window.BreadcrumbData === "undefined" || typeof window.BreadcrumbData.buildCategoryMaps !== "function") {
      // BreadcrumbData not loaded yet — inject dynamically
      injectBreadcrumbScripts();
      return;
    }
    var maps = window.BreadcrumbData.buildCategoryMaps(getCategories());
    _slugToKey = maps.slugToKey;
    _keyToSlug = maps.keyToSlug;
  }

  /**
   * Dynamically inject breadcrumb dependency scripts if not present on the page.
   * This handles SPA navigation where swup replaces #spa-content but not <head> scripts.
   */
  function injectBreadcrumbScripts() {
    var scripts = [
      "/assets/js/breadcrumb-data.js",
      "/assets/js/breadcrumb-render.js",
      "/assets/js/breadcrumb.js",
    ];
    var loaded = 0;
    var total = scripts.length;

    function onReady() {
      if (typeof window.BreadcrumbData !== "undefined" && typeof window.BreadcrumbRender !== "undefined") {
        // Wait for i18n system to be ready before rendering
        // _enqueueRender() uses a 50ms polling loop that gives up after 5s
        _enqueueRender();
      }
    }

    var _renderTimer = null;
    var _renderRetries = 0;
    var _RENDER_MAX_RETRIES = 100; // 100 × 50ms = 5s total

    function _enqueueRender() {
      if (typeof window.t === "function" && typeof window.BreadcrumbData.buildCategoryMaps === "function") {
        var maps = window.BreadcrumbData.buildCategoryMaps(getCategories());
        _slugToKey = maps.slugToKey;
        _keyToSlug = maps.keyToSlug;
        detectAndRender();
        return;
      }
      _renderRetries++;
      if (_renderRetries >= _RENDER_MAX_RETRIES) {
        // Still not ready — render anyway with fallback
        detectAndRender();
        return;
      }
      if (_renderTimer) clearTimeout(_renderTimer);
      _renderTimer = setTimeout(_enqueueRender, 50);
    }

    for (var si = 0; si < scripts.length; si++) {
      (function(src) {
        var s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = onReady;
        s.onerror = function() { console.warn("[Breadcrumb] failed to load:", src); };
        document.head.appendChild(s);
      })(scripts[si]);
    }
  }

  // ─── 渲染入口 ────────────────────────────────────────────────
  function doRender(page) {
    console.info("[Breadcrumb] doRender — page.type:", page.type, "segments:", page.segments && page.segments.length);
    var container = getContainer();
    if (!container) return;

    var categories = getCategories();
    var currentLang = getCurrentLanguage();
    var siblings = page.siblings || [];

    // 构建 section label
    var siblingSectionLabel = "";
    if (page.type === "application" && siblings.length > 1) {
      siblingSectionLabel = tl("cross_sell_other_scenario", "其他场景");
    } else if (page.type === "support" && siblings.length > 1) {
      siblingSectionLabel = tl("cross_sell_other_service", "其他服务");
    } else if (siblings.length > 1) {
      siblingSectionLabel = tl("cross_sell_other_category", "其他品类");
    }

    // 是否跳过同级导航（cross-sell-container 存在时）
    var skipSiblings = !!document.getElementById("cross-sell-container");

    window.BreadcrumbRender.renderAll(container, page.segments, siblings, {
      backLabel: tl("pd_back", "返回"),
      siblingSectionLabel: siblingSectionLabel,
      skipSiblings: skipSiblings,
    });
  }

  // ─── 检测页面并渲染 ─────────────────────────────────────────
  function detectAndRender() {
    console.info("[Breadcrumb] detectAndRender — path:", window.location.pathname);
    var categories = getCategories();
    var currentLang = getCurrentLanguage();
    var page = window.BreadcrumbData.detect(window.location.pathname, categories, { currentLang: currentLang });

    if (page && page.type !== "none") {
      _currentPage = page;
      doRender(page);
      return page;
    }
    return null;
  }

  // ─── PDP 品类异步补全 ──────────────────────────────────────
  function setupPdpCategoryUpdate() {
    window.addEventListener("product-data-ready", function () {
      if (!_currentPage || _currentPage.type !== "pdp") return;
      if (_currentPage.refSlug) return; // 已有品类，无需补全

      if (window.ProductGrid && window.ProductGrid.getAllProducts) {
        var products = window.ProductGrid.getAllProducts();
        var model = _currentPage.slug;
        var found = null;
        for (var i = 0; i < products.length; i++) {
          if (products[i].model === model) {
            found = products[i];
            break;
          }
        }
        if (found && found._category) {
          var catKey = found._category;
          var slug = _keyToSlug[catKey] || "";
          var categories = getCategories();
          if (slug && categories.products) {
            var productSlugs = {};
            for (var j = 0; j < categories.products.length; j++) {
              productSlugs[categories.products[j].slug] = categories.products[j];
            }
            if (productSlugs[slug]) {
              var currentLang = getCurrentLanguage();
              // 重新检测，此时 refSlug 已就绪
              _currentPage.refSlug = slug;
              _currentPage = window.BreadcrumbData.detect(window.location.pathname, categories, {
                currentLang: currentLang,
              });
              doRender(_currentPage);
            }
          }
        }
      }
    });
  }

  // ─── Referrer 跟踪 ──────────────────────────────────────────
  function trackReferrer() {
    var path = (window.location.pathname || "/").replace(/\/$/, "");
    // 在品类页记录 referrer
    var categories = getCategories();
    if (categories && categories.products) {
      var slugs = [];
      for (var i = 0; i < categories.products.length; i++) {
        slugs.push(categories.products[i].slug);
      }
      var productPattern = slugs.join("|");
      var catRegex = new RegExp("^/products/(" + productPattern + ")$");
      if (catRegex.test(path)) {
        try {
          sessionStorage.setItem("pdp_referrer", path);
        } catch (e) {
          /* ignore */
        }
      }
    }
  }

  // ─── 初始化 ──────────────────────────────────────────────────
  function init() {
    initMaps();
    trackReferrer();

    // 等待依赖就绪后渲染
    whenReady().then(function () {
      _ready = true;
      detectAndRender();
    });
  }

  // ─── SPA 事件绑定 ────────────────────────────────────────────
  function bindSpaEvents() {
    // spa:load — SPA 导航完成
    _spaOn(
      window,
      "spa:load",
      function () {
        _ready = false;
        _readyPromise = null;
        trackReferrer();
        // case-detail 和 news-detail 由各自页面脚本处理
        var path = window.location.pathname;
        if (path.indexOf("/cases/") === 0 || path.indexOf("/news/detail") === 0) {
          // 只确保容器存在
          getContainer();
          return;
        }
        init();
      },
      "spa-load"
    );

    // languageChanged — 语言切换
    _spaOn(
      window,
      "languageChanged",
      function () {
        _ready = false;
        _readyPromise = null;
        init();
      },
      "lang-change"
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 公共 API
  // ═══════════════════════════════════════════════════════════════

  window.Breadcrumb = {
    /**
     * 全量重新渲染
     */
    refresh: function () {
      var page = detectAndRender();
      if (page) _currentPage = page;
    },

    /**
     * 返回上一级
     * 优先返回面包屑路径上一级，否则 history.back()
     */
    goBack: function () {
      var referrer = null;
      try {
        referrer = sessionStorage.getItem("pdp_referrer");
      } catch (e) {
        /* ignore */
      }
      var path = window.location.pathname;
      if (referrer && path.indexOf("/products/") === 0 && path !== referrer) {
        window.location.href = referrer;
      } else if (_currentPage && _currentPage.segments && _currentPage.segments.length >= 2) {
        var parent = _currentPage.segments[_currentPage.segments.length - 2];
        if (parent && parent.href) {
          window.location.href = parent.href;
        } else {
          window.history.back();
        }
      } else {
        window.history.back();
      }
    },

    /**
     * 更新当前项（case-detail 动态标题 / PDP 品类补全）
     * @param {string} text
     */
    updateCurrent: function (text) {
      if (!_currentPage) {
        detectAndRender();
      }
      if (!_currentPage || !_currentPage.segments) return;

      var last = _currentPage.segments[_currentPage.segments.length - 1];
      if (last) {
        last.label = text;

        // 更新 DOM
        var el = document.getElementById("breadcrumb-current");
        if (el) el.textContent = text;
        var mobEl = document.getElementById("breadcrumb-current-mobile");
        if (mobEl) mobEl.textContent = text;
      }

      // 如果 PDP 且品类未就绪，此时可能已有品类数据可用
      if (_currentPage.type === "pdp" && !_currentPage.refSlug) {
        var categories = getCategories();
        var currentLang = getCurrentLanguage();
        _currentPage = window.BreadcrumbData.detect(window.location.pathname, categories, { currentLang: currentLang });
        doRender(_currentPage);
      }
    },
  };

  // ─── 启动 ────────────────────────────────────────────────────
  bindSpaEvents();

  if (typeof Boot !== "undefined") {
    Boot.register("breadcrumb", 3, init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
