/**
 * swup-init.js — SWUP 页面过渡引擎 (替换 spa-router.js 的路由功能)
 *
 * SWUP v4.9.0 + 插件体系取代手工 SPA 路由.
 * spa-router.js 保留为临时回退，但不再加载.
 *
 * 收益:
 *   - SWUP 原生处理: 内容替换, popstate, head 更新, scroll 恢复
 *   - scripts-plugin optin 模式: data-swup-reload-script 标签自动重执行
 *   - persist 属性: navigator / footer 保留 (data-swup-persist)
 *   - 更短的维护成本, 更成熟的社区支持
 *
 * 兼容性:
 *   - window.SpaRouter 保留 (有限方法, 供旧模块调用)
 *   - 继续派发 document "spa:load" 事件
 *   - 保留骨架屏逻辑
 *   - 保留 __spaNavigating 标志 (供 device-utils 检测)
 *   - spa-router.js 不再加载 (index.html 中注释掉)
 *
 * 依赖 (必须在此之前加载):
 *   <script defer src="/assets/js/vendor/swup.umd.js"></script>
 *   <script defer src="/assets/js/vendor/swup-head-plugin.umd.js"></script>
 *   <script defer src="/assets/js/vendor/swup-scroll-plugin.umd.js"></script>
 *   <script defer src="/assets/js/vendor/swup-scripts-plugin.umd.js"></script>
 *   <script defer src="/assets/js/vendor/swup-debug-plugin.umd.js"></script>
 */

(function (global) {
  "use strict";

  if (typeof global.Swup === "undefined") {
    console.warn("[SWUP] Swup library not loaded. Skipping SWUP, relying on SPA Router fallback.");
    return;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 骨架屏 — CSS 过渡版
  // ═══════════════════════════════════════════════════════════════════
  //
  // display:none → opacity transition (需要 skeleton.css 升级)
  // - skeleton.css: #skeleton-overlay { transition: opacity 350ms ease-out }
  // - skeleton.css: #skeleton-overlay[hidden] { opacity:0; pointer-events:none }
  //
  // 过渡时序:
  //   0ms     → 骨架 fadeOut (opacity: 1→0, 350ms ease-out)
  //   350ms   → 骨架不可见, 内容 fadeIn (opacity: 0→1)
  //   700ms   → 过渡完成

  function hideSkeleton() {
    clearTimeout(global._skDebugTimer);
    var overlay = document.getElementById("skeleton-overlay");
    var container = document.getElementById("spa-content");
    if (overlay && !overlay.hasAttribute("hidden")) {
      overlay.setAttribute("hidden", "");
      if (container && container.innerHTML.trim()) {
        container.classList.add("swup-fade-in");
      }
    } else {
      // 即使已经隐藏，也要确保内容可见
      if (container && container.innerHTML.trim()) {
        container.classList.add("swup-fade-in");
      }
    }
  }

  function showSkeleton() {
    var overlay = document.getElementById("skeleton-overlay");
    if (overlay && overlay.hasAttribute("hidden")) {
      // 跳过过渡：先禁用 transition, 显示, 再恢复
      overlay.style.transition = "none";
      overlay.removeAttribute("hidden");
      void overlay.offsetHeight; // 强制重绘
      overlay.style.transition = "";
    }
  }

  function ensureSkeletonHidden() {
    var overlay = document.getElementById("skeleton-overlay");
    if (overlay && !overlay.hasAttribute("hidden")) {
      overlay.setAttribute("hidden", "");
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 页面级 JS 初始化函数映射 (SPA 导航后重运行)
  // ═══════════════════════════════════════════════════════════════════

  function runPageInitByRoute() {
    var path = global.location.pathname;

    // product-grid: /products/<slug>/ 产品分类页
    var prodMatch = path.match(/^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)\//);
    if (prodMatch) {
      if (typeof global.ProductGrid !== "undefined" && global.ProductGrid && global.ProductGrid.init) {
        try { global.ProductGrid.init(); } catch (e) { /* noop */ }
      }
    }

    // home-core-products: 首页
    if (/^\/home\//.test(path) || path === "/") {
      if (typeof global.HomeCoreProducts !== "undefined" && global.HomeCoreProducts && global.HomeCoreProducts.init) {
        try { global.HomeCoreProducts.init(); } catch (e) { /* noop */ }
      }
    }

    // product-detail: 产品详情
    if (/^\/products\/detail\//.test(path)) {
      if (typeof global.ProductDetail !== "undefined" && global.ProductDetail && global.ProductDetail.init) {
        try { global.ProductDetail.init(); } catch (e) { /* noop */ }
      }
    }

    // cases: 案例页
    if (/^\/cases\//.test(path)) {
      if (typeof global.CasesPage !== "undefined" && global.CasesPage && global.CasesPage.init) {
        try { global.CasesPage.init(); } catch (e) { /* noop */ }
      }
      if (typeof global.CaseGrid !== "undefined" && global.CaseGrid && global.CaseGrid.init) {
        try { global.CaseGrid.init(); } catch (e) { /* noop */ }
      }
    }

    // news-detail: 新闻详情
    if (/^\/news\/detail\//.test(path)) {
      if (typeof global.NewsDetail !== "undefined" && global.NewsDetail && global.NewsDetail.init) {
        try { global.NewsDetail.init(); } catch (e) { /* noop */ }
      }
    }

    // profit-calculator
    if (/^\/profit-calculator\//.test(path)) {
      if (typeof global.ProfitCalculator !== "undefined" && global.ProfitCalculator && global.ProfitCalculator.init) {
        try { global.ProfitCalculator.init(); } catch (e) { /* noop */ }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Navigator/Footer active 状态 (从 incoming HTML 提取)
  // ═══════════════════════════════════════════════════════════════════

  function extractActiveNav(html) {
    var m = html && html.match(/<navigator[\s\S]*?data-component="navigator"[\s\S]*?>/i);
    if (!m) return null;
    var v = m[0].match(/data-active="([^"]*)"/i);
    return v ? v[1] : null;
  }

  function extractActiveFooter(html) {
    var m = html && html.match(/<footer[\s\S]*?data-component="footer"[\s\S]*?>/i);
    if (!m) return null;
    var v = m[0].match(/data-active="([^"]*)"/i);
    return v ? v[1] : null;
  }

  function updateActiveState(html) {
    var navActive = extractActiveNav(html);
    if (navActive && global.Navigator && typeof global.Navigator.updateActive === "function") {
      global.Navigator.updateActive(navActive);
    }

    var footerActive = extractActiveFooter(html);
    if (!footerActive) {
      var path = global.location.pathname.replace(/\/$/, "");
      var map = {
        "/home": "home", "/products": "products", "/solutions": "solutions",
        "/manufacturing": "manufacturing", "/compliance": "compliance",
        "/contact": "contact", "/cases": "cases", "/about": "about",
        "/news": "news", "/quote": "quote",
        "/support": "support", "/profit-calculator": "profit-calculator",
        "/resources": "resources",
      };
      var best = "";
      for (var k in map) {
        if (path.indexOf(k) === 0 && k.length > best.length) best = k;
      }
      footerActive = map[best] || "home";
    }
    if (global.Footer && typeof global.Footer.updateActive === "function") {
      global.Footer.updateActive(footerActive);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // spa:load 兼容事件派发
  // ═══════════════════════════════════════════════════════════════════

  function dispatchSpaLoad() {
    document.dispatchEvent(new CustomEvent("spa:load", { bubbles: true }));
  }

  // ═══════════════════════════════════════════════════════════════════
  // 设备感知页面路径映射 (适配 dev 的 88 个 SSG 页面)
  // ═══════════════════════════════════════════════════════════════════

  function getDeviceSuffix() {
    if (typeof DeviceUtils !== "undefined" && DeviceUtils && DeviceUtils.getDevicePagePath) {
      // 使用项目统一的设备检测
      var device = DeviceUtils.getDeviceType ? DeviceUtils.getDeviceType() : "pc";
      if (device === "mobile") return "index-mobile.html";
      if (device === "tablet") return "index-tablet.html";
      return "index-pc.html";
    }
    // fallback: viewport width
    var w = window.innerWidth;
    if (w < 768) return "index-mobile.html";
    if (w < 1280) return "index-tablet.html";
    return "index-pc.html";
  }

  /**
   * 将 SPA 路由路径转换为设备特定页面的 fetch URL.
   * 映射关系（对齐 dev 的 SpaRouter.routes + 文件约定）:
   * /              → /home/index-pc.html
   * /home/         → /home/index-pc.html
   * /products/     → /products/index-pc.html
   * /products/coffee/ → /products/coffee/index-pc.html
   * /products/<model>/ → /products/detail/index-pc.html  (PDP)
   * /solutions/oem/ → /solutions/oem/index-pc.html
   * /manufacturing/ → /manufacturing/index-pc.html
   * /compliance/   → /compliance/index-pc.html
   * /cases/        → /cases/index-pc.html
   * /resources/catalog/ → /resources/catalog/index-pc.html
   * /news/detail/  → /news/detail-pc.html (flat-file pattern)
   */
  function routeToFetchUrl(path) {
    var suffix = getDeviceSuffix();

    // 所有 fetch URL 统一加 /pages/ 前缀，以确保:
    // 1. swup resolveUrl 能反向映射回干净的目录 URL (如 /products/coffee/)
    // 2. 防止 swup 从 response.url 提取的 /products/coffee/index-mobile.html 污染地址栏

    // Aliases / redirects
    if (path === "/" || path === "/home/") return "/pages/home/" + suffix;

    // Flat-file pattern (no directory)
    if (path === "/news/detail/") return "/pages/news/detail-" + suffix.replace("index-", "");

    // Solutions pages (all variants)
    if (path.indexOf("/solutions/") === 0) {
      var solMatch = path.match(/^\/solutions\/(oem|odm|obm|rd|packaging)\/$/);
      if (solMatch) return "/pages/solutions/" + solMatch[1] + "/" + suffix;
    }

    // Resources pages
    if (path.indexOf("/resources/") === 0) {
      var resMatch = path.match(/^\/resources\/(catalog|videos|whitepapers)\/$/);
      if (resMatch) return "/pages/resources/" + resMatch[1] + "/" + suffix;
    }

    // Manufacturing & Compliance
    if (path === "/manufacturing/") return "/pages/manufacturing/" + suffix;
    if (path === "/compliance/") return "/pages/compliance/" + suffix;

    // 动态产品分类页: /products/<slug>/
    var prodMatch = path.match(/^\/(products\/)?(all|coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)\/$/);
    if (prodMatch) {
      var slug = prodMatch[2];
      return "/pages/products/" + slug + "/" + suffix;
    }

    // 产品详情 PDP: /products/<model>/
    if (/^\/products\/[^/]+\/$/.test(path) &&
        !/^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle|legacy|detail|compare)\/$/.test(path)) {
      return "/pages/products/detail/" + suffix;
    }

    // 旧路由兼容: /beauty/ → /products/beauty/
    var redirectMatch = path.match(/^\/(coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)\/$/);
    if (redirectMatch) return "/pages/products/" + redirectMatch[1] + "/" + suffix;

    // 通用约定: /<path>/ → /pages/<path>/index-{device}.html
    var clean = path.replace(/\/+$/, "");
    return "/pages" + clean + "/" + suffix;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 创建 SWUP 实例
  // ═══════════════════════════════════════════════════════════════════

  var swup = null;
  var swupEnabled = false;

  function initSwup() {
    try {
      swup = new global.Swup({
        containers: ["#spa-content"],
        animateHistoryBrowsing: false,
        linkSelector: 'a[href]:not([href^="http"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([href^="javascript:"])',
        resolveUrl: function (url) {
          // 将 /pages/<section>/<sub>/.../index-mobile.html → /<section>/<sub>/.../
          var m = url.match(/^\/pages(.+)\/index(?:-[a-z0-9-]+)?\.html$/i);
          if (m && m[1]) return m[1] + "/";
          // flat-file: /pages/news/detail-pc.html → /news/detail/
          var fm = url.match(/^\/pages\/news\/detail(?:-[a-z0-9-]+)?\.html$/i);
          if (fm) return "/news/detail/";
          return url;
        },
        ignoreVisit: function (url, _a) {
          var el = _a ? _a.el : null;
          if (!el) return false;
          if (el.getAttribute("target") === "_blank") return true;
          if (el.getAttribute("download") !== null) return true;
          // 跳过后端/外部路径
          if (url.match(/^(https?:|mailto:|tel:|javascript:)/)) return true;
          return false;
        },
        cache: false,
        plugins: [
          new global.SwupHeadPlugin({
            persistTags: "style[id], style[data-swup-persist], link[rel=stylesheet], link[rel=icon], meta[property], link[rel=canonical], link[rel=alternate], script[src]", persistAssets: true,
            awaitAssets: true,
            attributes: ["lang", "dir", "class"],
          }),
          new global.SwupScrollPlugin({
            animateScroll: {
              betweenPages: false,
              samePageWithHash: true,
              samePage: false,
            },
            doScrollingRightAway: true,
            offset: 0,
          }),
          new global.SwupScriptsPlugin({
            head: false,
            body: false,
            optin: true,
          }),
        ],
      });

      // ─── content:replace — 骨架屏 + 状态更新 + 页面重初始化 ───
      swup.hooks.on("content:replace", function (visit, _a) {
        var page = _a ? _a.page : null;
        if (!page) return;

        hideSkeleton();

        var container = document.getElementById("spa-content");
        if (container) {
          container.classList.add("swup-fade-in");
        }

        // SPA 导航时不重新执行 SSG 页面中的 defer 脚本，
        // 确保页面级 JS（如 ProductGrid、PRODUCT_DATA_TABLE）已加载
        var p = global.location.pathname;
        if (/^\/products\/[a-z]+\/$/.test(p) && !global.ProductGrid) {
          (function () {
            if (!global.PRODUCT_DATA_TABLE) {
              var d = document.createElement("script");
              d.src = "/assets/js/product-data-table.js?v=" + (global.BUILD_VERSION || "202605271233");
              d.onload = function () {
                if (!global.ProductGrid) {
                  var s = document.createElement("script");
                  s.src = "/assets/js/product-grid.js?v=" + (global.BUILD_VERSION || "202605271233");
                  s.onload = function () {
                    if (global.ProductGrid && global.ProductGrid.init) global.ProductGrid.init();
                  };
                  document.body.appendChild(s);
                }
              };
              document.body.appendChild(d);
            } else {
              var s = document.createElement("script");
              s.src = "/assets/js/product-grid.js?v=" + (global.BUILD_VERSION || "202605271233");
              s.onload = function () {
                if (global.ProductGrid && global.ProductGrid.init) global.ProductGrid.init();
              };
              document.body.appendChild(s);
            }
          })();
        }

        // 重新运行页面 init 函数
        runPageInitByRoute();

        // 更新 nav/footer active 状态
        updateActiveState(page.html);
      });

      // ─── page:view — spa:load 兼容事件 ───
      swup.hooks.on("page:view", function () {
        dispatchSpaLoad();
      });

      // ─── visit:start — 显示骨架屏 ───
      swup.hooks.on("visit:start", function () {
        global.__spaNavigating = true;
        showSkeleton();

        var container = document.getElementById("spa-content");
        if (container) {
          container.classList.remove("swup-fade-in");
        }
      });

      // ─── visit:end — 清除导航标志 ───
      swup.hooks.on("visit:end", function () {
        setTimeout(function () { global.__spaNavigating = false; }, 100);
      });

      // ─── fetch:request — 将 SPA URL 转换为设备特定页面 ───
      swup.hooks.replace("fetch:request", function (visit, _a, defaultFetch) {
        var originalUrl = _a.url;
        var deviceUrl = routeToFetchUrl(originalUrl);
        return defaultFetch(visit, {
          url: deviceUrl,
          options: _a.options,
        });
      });

      // ─── enable — 首次加载：空容器→navigate 或 hideSkeleton ───
      swup.hooks.on("enable", function () {
        swupEnabled = true;
        var container = document.getElementById("spa-content");
        var isEmpty = !container || !container.innerHTML.trim();
        if (isEmpty) {
          // SPA shell 模式: 容器为空, 加载当前路由
          var currentUrl = window.location.pathname;
          if (currentUrl === "/" || currentUrl === "/index.html") {
            currentUrl = "/home/";
          }
          swup.navigate(currentUrl, { history: "replace" });
        } else {
          // SSG 模式: 页面上已有内容, 渐隐骨架
          hideSkeleton();
          // 运行页面级 JS 初始化（如 product-grid, home-core-products 等）
          // 这确保 SSG 页面首次加载时渲染动态内容
          setTimeout(function () {
            runPageInitByRoute();
          }, 0);
        }
      });
    } catch (e) {
      console.error("[SWUP] Failed to initialize SWUP:", e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SpaRouter 向前兼容层 (供旧模块调用)
  // ═══════════════════════════════════════════════════════════════════

  // 如果 spa-router.js 先加载了 SpaRouter, 我们替换其 navigate 方法
  // 否则创建新的兼容对象
  if (!global.SpaRouter) {
    global.SpaRouter = {};
  }

  // 保存旧引用（如果有的话）
  var _oldNavigate = global.SpaRouter.navigate;
  var _oldReplace = global.SpaRouter.replace;
  var _oldGetPath = global.SpaRouter.getCurrentPath;

  global.SpaRouter.navigate = function (path) {
    var url = path;
    if (url && url.charAt(0) !== "/") url = "/" + url;
    if (swup && swupEnabled) {
      swup.navigate(url);
      return;
    }
    global.location.href = url;
  };

  global.SpaRouter.replace = function (path) {
    var url = path;
    if (url && url.charAt(0) !== "/") url = "/" + url;
    if (swup && swupEnabled) {
      swup.navigate(url, { history: "replace" });
      return;
    }
    global.location.replace(url);
  };

  global.SpaRouter.getCurrentPath = function () {
    var path = global.location.pathname;
    if (path.endsWith(".html")) {
      var ls = path.lastIndexOf("/");
      if (ls > 0) path = path.substring(0, ls + 1);
    }
    if (!path.endsWith("/")) path = path + "/";
    return path;
  };

  global.SpaRouter._pendingScroll = null;

  // ═══════════════════════════════════════════════════════════════════
  // 启动
  // ═══════════════════════════════════════════════════════════════════

  // 处理根路径重定向
  var path = global.location.pathname;
  if (path === "/" || path === "/index.html") {
    history.replaceState(null, "", "/home/");
  }

  var redirectParam = new URLSearchParams(global.location.search).get("redirect");
  if (redirectParam) {
    history.replaceState(null, "", redirectParam);
  }

  // 初始化 SWUP
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSwup);
  } else {
    initSwup();
  }

})(window);
