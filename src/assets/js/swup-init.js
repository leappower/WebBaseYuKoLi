/**
 * swup-init.js — SWUP 页面过渡引擎 (替换 spa-router.js 的路由功能)
 *
 * SWUP v4.9.0 + 插件体系取代手工 SPA 路由.
 * spa-router.js 保留为临时回退，但不再加载.
 *
 * 收益:
 *   - SWUP 原生处理: 内容替换, popstate, head 更新, scroll 恢复
 *   - persist 属性: navigator / footer 保留 (data-swup-persist)
 *   - 更短的维护成本, 更成熟的社区支持
 *
 * 脚本热重载 (替代 ScriptsPlugin optin 模式):
 *   - ScriptsPlugin 设为 { head: false, body: false } 基本禁用
 *   - content:replace hook 中自动提取新页面 HTML 的 <script src> 标签
 *   - 跳过 SPA shell 已加载的全局脚本（_globalScriptPatterns）
 *   - 跳过已注入过的脚本（查重）
 *   - 按批次（3个/批）注入到 <head>，使用 requestIdleCallback
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

  function createSkeletonIfMissing() {
    if (document.getElementById("skeleton-overlay")) return true;
    var container = document.getElementById("spa-content");
    if (!container) return false;
    var overlay = document.createElement("div");
    overlay.id = "skeleton-overlay";
    overlay.innerHTML =
      '<div class="skeleton-container">' +
      '<div class="sk-hero"><div class="sk-badge"></div>' +
      '<div class="sk-line"></div><div class="sk-line sk-line--short"></div>' +
      '<div class="sk-line sk-line--desc"></div>' +
      '<div class="sk-cta-group"><div class="sk-line sk-cta"></div>' +
      '<div class="sk-line sk-cta sk-cta--outline"></div></div></div>' +
      '<div class="sk-grid"><div class="sk-card"></div>' +
      '<div class="sk-card"></div><div class="sk-card"></div></div>' +
      "</div>";
    overlay.setAttribute("hidden", "");
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    // 插入到 main#spa-content 内部作为第一个子元素，相对定位
    container.insertBefore(overlay, container.firstChild);
    return true;
  }

  function showSkeleton() {
    createSkeletonIfMissing();
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
    console.log("[TRACE] runPageInitByRoute called, path:", path);

    // product-grid: /products/<slug>/ 产品分类页
    var prodMatch = path.match(/^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)\//);
    if (prodMatch) {
      if (typeof global.ProductGrid !== "undefined" && global.ProductGrid) {
        try {
          if (typeof global.ProductGrid.autoRender === "function") {
            global.ProductGrid.autoRender();
          } else if (typeof global.ProductGrid.init === "function") {
            global.ProductGrid.init();
          }
        } catch (e) {
          /* noop */
        }
      }
    }

    // home-core-products: 首页
    if (/^\/home\//.test(path) || path === "/") {
      if (typeof global.HomeCoreProducts !== "undefined" && global.HomeCoreProducts && global.HomeCoreProducts.init) {
        try {
          global.HomeCoreProducts.init();
        } catch (e) {
          /* noop */
        }
      }
    }

    // product-detail PDP: /products/<category>/<model>/（新路由）+ 旧兼容
    if (/^\/products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/$/.test(path) || /^\/products\/detail\//.test(path)) {
      if (typeof global.ProductDetail !== "undefined" && global.ProductDetail && global.ProductDetail.init) {
        try {
          global.ProductDetail.init();
        } catch (e) {
          /* noop */
        }
      }
    }

    // cases: 案例页
    if (/^\/cases/.test(path)) {
      // Detail page (e.g. /cases/sea-coffee-brand/) — deferred: ScriptsPlugin loads case-detail.js after content:replace
      if (/^\/cases\/[a-z-]+/.test(path)) {
        setTimeout(function () {
          if (
            typeof global.CaseDetail !== "undefined" &&
            global.CaseDetail &&
            typeof global.CaseDetail.init === "function"
          ) {
            try {
              global.CaseDetail.init();
            } catch (e) {
              /* noop */
            }
          }
        }, 100);
      } else {
        // List page (/cases/)
        if (typeof global.CasesPage !== "undefined" && global.CasesPage && global.CasesPage.init) {
          try {
            global.CasesPage.init();
          } catch (e) {
            /* noop */
          }
        }
        if (typeof global.CaseGrid !== "undefined" && global.CaseGrid && global.CaseGrid.init) {
          try {
            global.CaseGrid.init();
          } catch (e) {
            /* noop */
          }
        }
      }
    }

    // news-detail: 新闻详情
    if (/^\/news\/detail\//.test(path)) {
      if (typeof global.NewsDetail !== "undefined" && global.NewsDetail && global.NewsDetail.init) {
        try {
          global.NewsDetail.init();
        } catch (e) {
          /* noop */
        }
      }
    }

    // profit-calculator
    if (/^\/profit-calculator\//.test(path)) {
      if (typeof global.ProfitCalculator !== "undefined" && global.ProfitCalculator && global.ProfitCalculator.init) {
        try {
          global.ProfitCalculator.init();
        } catch (e) {
          /* noop */
        }
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
    // SPA 导航后同步更新手机菜单高亮
    if (global.SlideMenu && typeof global.SlideMenu.updateActive === "function") {
      global.SlideMenu.updateActive();
    }

    var footerActive = extractActiveFooter(html);
    if (!footerActive) {
      var path = global.location.pathname.replace(/\/$/, "");
      var map = {
        "/home": "home",
        "/products": "products",
        "/solutions": "solutions",
        "/manufacturing": "manufacturing",
        "/compliance": "compliance",
        "/contact": "contact",
        "/cases": "cases",
        "/about": "about",
        "/news": "news",
        "/quote": "quote",
        "/support": "support",
        "/profit-calculator": "profit-calculator",
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
   * /products/<category>/<model>/ → /pages/pdp/index-pc.html  (PDP)
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
      // 首页
      if (path === "/solutions/") return "/pages/solutions/" + suffix;
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

    // 产品详情 PDP: /products/<category>/<model>/
    if (/^\/products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/$/.test(path)) {
      return "/pages/pdp/" + suffix;
    }

    // 产品详情 PDP: /products/<model>/
    if (
      /^\/products\/[^/]+\/$/.test(path) &&
      !/^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle|legacy|detail|compare)\/$/.test(path)
    ) {
      return "/pages/pdp/" + suffix;
    }

    // 案例详情页: /cases/<slug>/ → 共享模板 /pages/cases/detail/
    if (/^\/cases\/[a-z-]+/.test(path)) {
      return "/pages/cases/detail/" + suffix;
    }

    // 旧路由兼容: /beauty/ → /products/beauty/
    var redirectMatch = path.match(/^\/(coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)\/$/);
    if (redirectMatch) return "/pages/products/" + redirectMatch[1] + "/" + suffix;

    // 通用约定: /<path>/ → /pages/<path>/index-{device}.html
    var clean = path.replace(/\/+$/, "");
    return "/pages" + clean + "/" + suffix;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SPA shell 全局脚本列表 (不重复加载)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 定义哪些 JS 文件已由 src/index.html 的 SPA shell 加载。
   * SPA 导航时自动注入页面特有脚本，跳过这些全局脚本。
   * 匹配模式: 正则 test() 对 script src 路径进行匹配。
   *
   * 更新: 添加新的全局 JS 文件时，在此列表追加即可。
   */
  var _globalScriptPatterns = window._BREW_GLOBAL_PATTERNS ||
    /(?:^|[/])(?:device-utils|swup(?:-head-plugin|-scroll-plugin|-scripts-plugin)?[.-]|swup-init|lang-registry|translations|translations-dropdown-template|dropdown-styles|dropdown-base|products-dropdown|solutions-dropdown|applications-dropdown|support-dropdown|about-dropdown|nav-dropdown|mega-menu|custom-select|navigator|slide-menu|search-engine|footer|floating-actions|contacts|product-grid|product-detail|home-core-products|case-grid|currency|breadcrumb|trust-bar|bottom-tab|search-index|page-init|dom-utils)\.js/;

  /**
   * 用于缓存当前 SPA 导航周期中已动态注入的 script 元素。
   * 后续导航会清除旧注入，避免累积。
   */
  var _dynamicScripts = [];

  /**
   * 从新页面 document 中提取 <script src> 标签，
   * 过滤掉全局脚本和已加载/已注入的脚本，
   * 按批次（3个/批）注入到 <head>。
   *
   * @param {Document|null} newDoc - 新页面的 document (visit.to.document)
   */
  function reloadPageScripts(newDoc) {
    if (!newDoc) return;

    // 清除上一轮注入的脚本
    for (var d = 0; d < _dynamicScripts.length; d++) {
      try {
        if (_dynamicScripts[d].parentNode) {
          _dynamicScripts[d].parentNode.removeChild(_dynamicScripts[d]);
        }
      } catch (e) {
        // ignore: removeChild may fail if parent was modified by SPA
      }
    }
    _dynamicScripts = [];

    // 从新页面的 head 和 body 提取所有 <script src> 标签
    var headScripts = newDoc.head.querySelectorAll("script[src]");
    var bodyScripts = newDoc.body.querySelectorAll("script[src]");
    var allNewScripts = Array.prototype.slice.call(headScripts).concat(Array.prototype.slice.call(bodyScripts));

    // 构建当前页面已加载的 script src 集合（去版本号）
    var currentScripts = document.querySelectorAll("script[src]");
    var currentSrcs = {};
    for (var c = 0; c < currentScripts.length; c++) {
      var curKey = currentScripts[c].getAttribute("src").replace(/\?.*$/, "");
      currentSrcs[curKey] = true;
    }

    // 筛选需要注入的脚本
    var toInject = [];
    for (var i = 0; i < allNewScripts.length; i++) {
      var src = allNewScripts[i].getAttribute("src");
      if (!src) continue;
      var srcKey = src.replace(/\?.*$/, "");
      // 跳过全局脚本（SPA shell 已加载）
      if (_globalScriptPatterns.test(srcKey)) continue;
      // 跳过当前页面已存在的脚本
      if (currentSrcs[srcKey]) continue;
      toInject.push(src);
      currentSrcs[srcKey] = true;
    }

    // 按批次注入（防阻塞）
    function injectBatch(idx) {
      var batchSize = 3;
      var end = Math.min(idx + batchSize, toInject.length);
      for (var j = idx; j < end; j++) {
        var newScript = document.createElement("script");
        newScript.src = toInject[j];
        newScript.async = true;
        document.head.appendChild(newScript);
        _dynamicScripts.push(newScript);
      }
      if (end < toInject.length) {
        (window.requestIdleCallback || window.setTimeout)(function () {
          injectBatch(end);
        });
      }
    }

    if (toInject.length > 0) {
      console.log("[SWUP] reloadPageScripts: injecting", toInject.length, "page-specific scripts");
      (window.requestIdleCallback || window.setTimeout)(function () {
        injectBatch(0);
      });
    }
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
        linkSelector:
          'a[href]:not([href^="http"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([href^="javascript:"])',
        resolveUrl: function (url) {
          // PDP 模板 /pages/pdp/ 和 cases detail /pages/cases/detail/ 是内部分配路径
          // 不应通过 resolveUrl 映射到地址栏
          if (url.indexOf("/pages/pdp/") !== -1 || url.indexOf("/pages/cases/detail/") !== -1) return window.location.pathname;

          // 将 /pages/<section>/<sub>/.../index-mobile.html → /<section>/<sub>/.../
          var m = url.match(/^\/pages(.+)\/index(?:-[a-z0-9-]+)?\.html$/i);
          if (m && m[1]) return m[1] + "/";
          // 无 /pages/ 前缀的响应 URL: /products/index-mobile.html → /products/
          var dm = url.match(/^\/([^/].*)\/index(?:-[a-z0-9-]+)?\.html$/i);
          if (dm && dm[1]) return "/" + dm[1] + "/";
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
            persistTags:
              "style, link[rel=stylesheet], link[rel=icon], meta[property], link[rel=canonical], link[rel=alternate], script[src]",
            persistAssets: true,
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
          // ScriptsPlugin 基本禁用 (head/body: false)，
          // 脚本热重载由 content:replace 中的 reloadPageScripts() 负责。
          new global.SwupScriptsPlugin({
            head: false,
            body: false,
            optin: true,
          }),
        ],
      });

      // ─── content:replace — 骨架屏 + 脚本热重载 + 状态更新 + 页面重初始化 ───
      swup.hooks.on("content:replace", function (visit, _a) {
        var page = _a ? _a.page : null;
        if (!page) return;

        console.log("[TRACE] content:replace START, path:", global.location.pathname);

        hideSkeleton();

        // 检查容器是否存在（避免 404 页面缺少 #spa-content）
        var container = document.getElementById("spa-content");
        if (!container) {
          // 容器不存在 → fallback 到原生导航
          console.warn("[SWUP] #spa-content not found in incoming page, falling back to native navigation");
          swup.navigate(visit.to.url).catch(function () {
            global.location.href = visit.to.url;
          });
          return;
        }
        container.classList.add("swup-fade-in");

        var p = global.location.pathname;

        // SPA 导航到产品分类页（非 PDP）：触发 ProductGrid 渲染
        if (/^\/products\/(all|[a-z]+)\/$/.test(p)) {
          console.log("[TRACE] product page detected, ProductGrid exists:", !!global.ProductGrid);
          if (global.ProductGrid && typeof global.ProductGrid.retryLoad === "function") {
            console.log("[TRACE] calling ProductGrid.retryLoad");
            global.ProductGrid.retryLoad();
          } else if (global.ProductGrid && typeof global.ProductGrid.autoRender === "function") {
            setTimeout(function() { global.ProductGrid.autoRender(); }, 100);
          } else {
            // product-grid.js not loaded — wait for spa:load to handle it
            console.log("[TRACE] ProductGrid not available, waiting for spa:load");
          }
        }

        // ─── 脚本热重载：提取新页面特有脚本并注入 ───
        // 替代 ScriptsPlugin optin 模式，解决 data-swup-reload-script 遗漏问题
        var newDoc = visit.to && visit.to.document ? visit.to.document : null;
        if (newDoc) {
          reloadPageScripts(newDoc);
        }

        // 重新运行页面 init 函数
        runPageInitByRoute();

        // 更新 nav/footer active 状态
        updateActiveState(page.html);

        // ─── 全局：SPA 导航后重新触发所有 lazy 图片加载 ───
        // swup 通过 innerHTML 替换内容时，浏览器不会为
        // loading="lazy" 的图片重新触发 IntersectionObserver
        setTimeout(function () {
          var container = document.getElementById("spa-content");
          if (!container) return;
          var imgs = container.querySelectorAll('img[loading="lazy"]');
          for (var i = 0; i < imgs.length; i++) {
            var src = imgs[i].getAttribute('src');
            if (src) {
              imgs[i].removeAttribute('src');
              void imgs[i].offsetWidth;
              imgs[i].setAttribute('src', src);
            }
          }
        }, 100);
        });

      // ─── page:view — 派发 spa:load 兼容事件（页面完全渲染后）───
      swup.hooks.on("page:view", function () {
        console.log("[TRACE] page:view -> dispatchSpaLoad, path:", global.location.pathname);
        dispatchSpaLoad();
      });

      // ─── visit:start — 显示骨架屏并设置导航标志 ───
      swup.hooks.on("visit:start", function () {
        global.__spaNavigating = true;
        showSkeleton();
        var container = document.getElementById("spa-content");
        if (container) {
          container.classList.remove("swup-fade-in");
        }
      });

      // ─── visit:abort — 容器不匹配 / fetch 失败时 404 ───
      swup.hooks.on("visit:abort", function (visit) {
        global.__spaNavigating = false;
        // 跳转到 404 页面（保留当前 URL 用 replaceState 设 404）
        global.location.replace("/404?from=" + encodeURIComponent(visit.to.url));
      });

      // ─── visit:end — 清除导航标志 ───
      swup.hooks.on("visit:end", function () {
        setTimeout(function () {
          global.__spaNavigating = false;
        }, 100);
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
        window.__swupEnabled = true;
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
          // SSG 模式: 页面上已有内容
          // 如果页面有骨架元素（通过 SSG 构建注入），渐变过渡
          // 否则直接显示内容
          if (document.getElementById("skeleton-overlay")) {
            hideSkeleton();
          } else {
            // 无骨架：创建骨架并人工设置初始状态，然后渐隐
            createSkeletonIfMissing();
            var overlay = document.getElementById("skeleton-overlay");
            if (overlay) {
              // 立即显示骨架，然后在下一帧设置 fade-out
              overlay.style.transition = "none";
              overlay.removeAttribute("hidden");
              overlay.style.opacity = "1";
              // 强制重绘后触发过渡
              overlay.offsetWidth;
              overlay.style.transition = "opacity 350ms ease-out";
              overlay.setAttribute("hidden", "");
              container.classList.add("swup-fade-in");
            }
          }
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
      var navResult = swup.navigate(url);
      if (navResult && typeof navResult.catch === "function") {
        navResult.catch(function () {
          global.location.href = url;
        });
      } else {
        // swup navigate 及时返回 undefined 或非 Promise:
        // 用 setTimeout 确认 content:replace 已触发
      }
      return;
    }
    global.location.href = url;
  };

  global.SpaRouter.replace = function (path) {
    var url = path;
    if (url && url.charAt(0) !== "/") url = "/" + url;
    if (swup && swupEnabled) {
      var navResult = swup.navigate(url, { history: "replace" });
      if (navResult && typeof navResult.catch === "function") {
        navResult.catch(function () {
          global.location.replace(url);
        });
      }
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
  // __spaNavigate — 统一 SPA 导航入口（供 bottom-tab 等模块调用）
  // ═══════════════════════════════════════════════════════════════════

  global.__spaNavigate = function (url) {
    if (swup && swupEnabled) {
      swup.navigate(url);
    } else {
      global.location.href = url;
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 启动
  // ═══════════════════════════════════════════════════════════════════

  // ② 初始化 SWUP
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSwup);
  } else {
    initSwup();
  }
})(window);
