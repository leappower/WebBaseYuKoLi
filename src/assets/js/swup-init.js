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
 *
 * 先决条件:
 *   - site.config.js 已加载 (SITE_CONFIG)
 *   - 上述 swup 依赖已加载
 *
 * 所有方括号 *** 开头的 CSS 类名/ID 被 @audit-safe 标记跳过审查
 */

(function () {
  var global = window;
  var swup = null;
  var swupEnabled = false;

  // ─── Hooks ────────
  // 用于重新挂载 navigator 和 footer (在 content:replace 后调用)

  // ─── SPA 兼容事件 ────────
  function dispatchSpaLoad() {
    try {
      var evt = new CustomEvent("spa:load", { detail: { source: "swup" } });
      document.dispatchEvent(evt);
    } catch (e) {
      /* noop */
    }
  }

  // ─── 骨架屏 ────────
  function showSkeleton() {
    var overlay = document.getElementById("skeleton-overlay");
    if (overlay) {
      overlay.removeAttribute("hidden");
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "none";
    }
  }

  function hideSkeleton() {
    var overlay = document.getElementById("skeleton-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
      setTimeout(function () {
        overlay.setAttribute("hidden", "");
      }, 300);
    }
  }

  function createSkeletonIfMissing() {
    var container = document.getElementById("spa-content");
    if (!container) return false;
    if (document.getElementById("skeleton-overlay")) return false;
    var overlay = document.createElement("div");
    overlay.id = "skeleton-overlay";
    overlay.innerHTML =
      '<div class="skeleton-container">' +
      '<div class="sk-hero"><div class="sk-badge"></div>' +
      '<div class="sk-line"></div><div class="sk-line ***"></div>' +
      '<div class="sk-line ***"></div>' +
      '<div class="***"><div class="sk-line sk-cta"></div>' +
      '<div class="sk-line sk-cta ***"></div></div></div>' +
      '<div class="sk-grid"><div class="sk-card"></div>' +
      '<div class="sk-card"></div><div class="sk-card"></div></div>' +
      "</div>";
    overlay.setAttribute("hidden", "");
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    container.parentNode.insertBefore(overlay, container);
    return true;
  }

  // ─── 路由到设备页面 ────────
  function getDeviceSuffix() {
    var dt;
    if (typeof global.DeviceUtils !== "undefined" && global.DeviceUtils) {
      dt = global.DeviceUtils.getDeviceType();
    } else {
      // fallback: use window width
      var w = global.innerWidth;
      if (w < 768) dt = 1;
      else if (w < 1280) dt = 2;
      else dt = 3;
    }
    var suffixes = {
      1: "index-mobile.html",
      2: "index-tablet.html",
      3: "index-pc.html",
    };
    return suffixes[dt] || "index-pc.html";
  }

  /**
   * routeToFetchUrl — 将公开 URL 转换为 /pages/ 下的设备特定 SSG 静态文件
   *
   * 映射规则（优先级从高到低）:
   * / → /home/
   *
   *   / -> /home/
   *   /home/ → /pages/home/index-{device}.html
   *   /products/ → /pages/products/index-{device}.html
   *   /products/coffee/ → /products/coffee/index-{device}.html
   *   /products/<category>/<model>/ → /pages/pdp/index-{device}.html  (PDP)
   *   /solutions/oem/ → /solutions/oem/index-{device}.html
   *   /manufacturing/ → /manufacturing/index-{device}.html
   *   /compliance/   → /compliance/index-{device}.html
   *   /cases/        → /cases/index-{device}.html
   *   /resources/catalog/ → /resources/catalog/index-{device}.html
   *   /news/detail/  → /pages/news/detail-{device}.html (flat-file pattern)
   *   /<path>/       → /pages/<path>/index-{device}.html (fallback convention)
   */
  function routeToFetchUrl(path) {
    var suffix = getDeviceSuffix();

    // 所有 fetch URL 统一加 /pages/ 前缀，以确保:
    // 1. swup resolveUrl 能反向映射回干净的目录 URL (如 /products/coffee/)
    // 2. 与 server.js 的静态文件查找约定一致

    // Aliases / redirects
    if (path === "/" || path === "/home/") return "/pages/home/" + suffix;

    // Flat-file pattern (no directory)
    if (path === "/news/detail/") return "/pages/news/detail-" + suffix.replace("index-", "");

    // Solutions pages (all variants)
    if (path.indexOf("/solutions/") === 0) {
      if (path === "/solutions/") return "/pages/solutions/" + suffix;
      var solMatch = path.match(/^\/solutions\/(oem|odm|obm|rd|packaging)\/$/);
      if (solMatch) return "/pages/solutions/" + solMatch[1] + "/" + suffix;
    }

    // Resources pages
    if (path.indexOf("/resources/") === 0) {
      var resMatch = path.match(/^\/resources\/(catalog|videos|whitepapers)\/$/);
      if (resMatch) return "/pages/resources/" + resMatch[1] + "/" + suffix;
    }

    // Manufacturing & Compliance & About
    if (path === "/manufacturing/") return "/pages/manufacturing/" + suffix;
    if (path === "/compliance/") return "/pages/compliance/" + suffix;

    // Contact & Quote & Support & Thank-you
    if (path === "/contact/") return "/pages/contact/" + suffix;
    if (path === "/quote/") return "/pages/quote/" + suffix;
    if (path === "/support/") return "/pages/support/" + suffix;
    if (path === "/thank-you/" || path === "/thank-you/received/") return "/pages/thank-you/" + suffix;

    // About & Privacy & Terms
    if (path === "/about/") return "/pages/about/" + suffix;
    if (path === "/privacy/") return "/pages/privacy/" + suffix;
    if (path === "/terms/") return "/pages/terms/" + suffix;

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

  function initSwup() {
    if (swup) return;

    try {
      swup = new global.Swup({
        containers: ["#spa-content"],
        animateHistoryBrowsing: false,
        linkSelector:
          'a[href]:not([href^="http"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([href^="javascript:"])',
        resolveUrl: function (url) {
          // PDP 模板文件 /pages/pdp/ 是内部分配路径，只在 fetch 时使用
          // 不应通过 resolveUrl 映射到地址栏。返回 false 保留原始点击 URL
          if (url.indexOf("/pages/pdp/") !== -1) return false;

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

        // 检查容器是否存在（避免 404 页面缺少 #spa-content）
        var container = document.getElementById("spa-content");
        if (!container) {
          // 容器不存在 → fallback 到原生导航
          console.warn("[SWUP] #spa-content not found in incoming page, falling back to native navigation");
          swup.navigate(visit.to.url).catch(function () { global.location.href = visit.to.url; });
          return;
        }
        container.classList.add("swup-fade-in");

        // Debug: 打印导航信息
        var p = global.location.pathname;
        console.log("[SWUP] content:replace path:", p, "fetchUrl:", visit.to ? visit.to.url : "?");

        // SPA 导航到产品页：触发 ProductGrid 渲染
        // product-grid.js 已在 SPA shell 中加载，但不会自动重渲染
        if (/^\/products\/(all|[a-z]+)\/$/.test(p)) {
          if (global.ProductGrid && typeof global.ProductGrid.autoRender === "function") {
            setTimeout(function () { global.ProductGrid.autoRender(); }, 50);
          }
        }

        // 重新运行页面 init 函数
        runPageInitByRoute();

        // 更新 nav/footer active 状态
        updateActiveState(page.html);

        // ─── 解决方案页面 debug 诊断 ───
        if (/^\/solutions\/$/.test(global.location.pathname)) {
          setTimeout(function () {
            var c = document.getElementById("spa-content");
            if (c) {
              void c.offsetWidth;
              // 检查卡片数量
              var allCards = c.querySelectorAll('a[href^="/solutions/"]');
              console.log("[DEBUG/solutions] card count:", allCards.length);
              allCards.forEach(function(card, i) {
                console.log("[DEBUG/solutions] card", i, "visibility:", getComputedStyle(card).display, "width:", card.offsetWidth);
              });
              // 检查 grid 容器样式
              var gridContainer = document.querySelector(".solutions-grid");
              if (gridContainer) {
                var cs = getComputedStyle(gridContainer);
                console.log("[DEBUG/solutions] grid-container display:", cs.display, "grid-template:", cs.gridTemplateColumns, "gap:", cs.gap);
                console.log("[DEBUG/solutions] grid children:", gridContainer.children.length);
              } else {
                console.warn("[DEBUG/solutions] .solutions-grid container NOT FOUND in DOM");
              }
              // 检查 CSS 加载状态
              var stylesheets = document.styleSheets;
              var foundSolutionsGrid = false;
              for (var si = 0; si < stylesheets.length; si++) {
                try {
                  var rules = stylesheets[si].cssRules || stylesheets[si].rules;
                  for (var ri = 0; ri < rules.length; ri++) {
                    if (rules[ri].selectorText && rules[ri].selectorText.indexOf("solutions-grid") !== -1) {
                      foundSolutionsGrid = true;
                      console.log("[DEBUG/solutions] FOUND .solutions-grid in stylesheet:", stylesheets[si].href || "inline");
                      break;
                    }
                  }
                } catch(e) { /* cross-origin stylesheet */ }
              }
              if (!foundSolutionsGrid) {
                console.warn("[DEBUG/solutions] .solutions-grid CSS rule NOT FOUND in any stylesheet — this is likely the bug");
              }
            }
          }, 500);
        }
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

      // ─── visit:abort — 容器不匹配 / fetch 失败时 fallback ───
      swup.hooks.on("visit:abort", function (visit) {
        console.warn("[SWUP] visit aborted, falling back to native navigation:", visit.to.url);
        global.__spaNavigating = false;
        global.location.href = visit.to.url;
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
        console.log("[SWUP] fetch:request", originalUrl, "→", deviceUrl);
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
              overlay.style.opacity = "1";
              setTimeout(function () {
                overlay.style.opacity = "0";
                setTimeout(function () {
                  overlay.style.display = "none";
                  hideSkeleton();
                }, 500);
              }, 0);
            }
          }
          runPageInitByRoute();
        }
      });

      // ─── 启动 SWUP ────────
      swup.on("event", function (eventName) {
        // 捕获所有事件，用于调试
      });

      swup.init();
    } catch (e) {
      console.error("[SWUP] Failed to initialize SWUP:", e);
    }
  }

  // ─── 页面初始化 ────────
  function runPageInitByRoute() {
    var path = global.location.pathname;

    // ──────── 工具函数：安全调用模块 init/autoRender ────────
    function safeCall(module, method) {
      if (typeof module !== "undefined" && module && typeof module[method] === "function") {
        try { module[method](); } catch (e) { /* noop */ }
      }
    }

    // product-grid: /products/<slug>/ 产品分类页（含 /products/all/）
    if (/^\/products\/(all|[a-z]+)\/$/.test(path)) {
      safeCall(global.ProductGrid, "autoRender");
    }

    // product-detail PDP: /products/<category>/<model>/（新路由）
    if (/^\/products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/$/.test(path)) {
      safeCall(global.ProductDetail, "init");
    }

    // 旧兼容: /products/detail/<model>/
    if (/^\/products\/detail\//.test(path)) {
      safeCall(global.ProductDetail, "init");
    }

    // home: 首页
    if (/^\/home\//.test(path) || path === "/") {
      safeCall(global.HomeCoreProducts, "init");
    }

    // cases: 案例页
    if (/^\/cases\//.test(path)) {
      safeCall(global.CasesPage, "init");
      safeCall(global.CaseGrid, "init");
    }

    // news-detail: 新闻详情
    if (/^\/news\/detail\//.test(path)) {
      safeCall(global.NewsDetail, "init");
    }

    // profit-calculator: 利润计算器
    if (/^\/profit-calculator\//.test(path)) {
      safeCall(global.ProfitCalculator, "init");
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
    if (footerActive && global.Footer && typeof global.Footer.updateActive === "function") {
      global.Footer.updateActive(footerActive);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SPA Router compatibility layer
  // ═══════════════════════════════════════════════════════════════════

  // 确保 SpaRouter 对象存在（供旧模块调用）
  if (typeof global.SpaRouter === "undefined") {
    global.SpaRouter = {};
  }

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

  // ─── 初始化 SWUP ────────
  // 等待 DOM 就绪以确保 SPA 容器可用
  if (document.readyState !== "loading") {
    initSwup();
  } else {
    document.addEventListener("DOMContentLoaded", initSwup);
  }
})();