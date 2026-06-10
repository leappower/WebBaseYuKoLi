/**
 * breadcrumb-data.js — 面包屑纯数据层
 *
 * 纯函数，不依赖 window/DOM。
 * 职责：路由检测 + 面包屑数据模型构建 + i18n 标签解析 + 同级导航 + goBack
 *
 * 依赖（外部传入）：
 *   - categories: site.config.js 中的 categories 对象
 *   - pathname: window.location.pathname
 *
 * 输出：
 *   BreadcrumbData.detect() → { type, segments, refSlug, ... }
 *
 * 格式：IIFE（向后兼容静态 <script> 标签 + vm 单元测试）
 * Webpack entry: breadcrumb-data → 此文件作为 webpack 入口，通过 entry 末尾的 registerOnWindow 注册全局 API
 */

(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════
  // 内部工具函数
  // ═══════════════════════════════════════════════════════════════

  /**
   * 从 items 数组构建 slug → item 映射
   * @param {Array} items
   * @returns {Object}
   */
  function buildSlugMap(items) {
    var map = {};
    if (!items) return map;
    for (var i = 0; i < items.length; i++) {
      map[items[i].slug] = items[i];
    }
    return map;
  }

  /**
   * 从 slugMap 构建正则 pattern
   * @param {Object} slugMap
   * @returns {string}
   */
  function buildSlugPattern(slugMap) {
    var slugs = Object.keys(slugMap);
    if (slugs.length === 0) return "(?!x)x";
    return slugs.join("|");
  }

  /**
   * 解析标签：支持 string / {en, "zh-CN"} object / i18n key 三种格式
   * @param {string|Object} label
   * @param {string} [currentLang]
   * @returns {string}
   */
  function resolveLabel(label, currentLang) {
    if (typeof label === "string") return label;
    if (label && typeof label === "object") {
      var lang = currentLang || "zh-CN";
      return label[lang] || label["zh-CN"] || label.en || "";
    }
    return String(label);
  }

  // ═══════════════════════════════════════════════════════════════
  // 公开 API
  // ═══════════════════════════════════════════════════════════════

  /**
   * 检测当前页面类型，返回面包屑数据模型
   *
   * @param {string} pathname — window.location.pathname
   * @param {Object} categories — site.config.js 中的 categories
   * @param {Object} [options]
   * @param {string} [options.currentLang] — 当前语言（用于对象标签解析）
   * @param {boolean} [options.pdpCategoryFallback] — PDP 品类未就绪时是否 fallback
   * @returns {{ type, segments, refSlug, refCategoryLabel, slug, siblings }}
   */
  function detect(pathname, categories, options) {
    options = options || {};
    var path = (pathname || "/").replace(/\/$/, "");
    var result = {
      type: "none",
      slug: "",
      segments: [],
      refSlug: "",
      refCategoryLabel: "",
      siblings: [],
    };

    // Trim trailing slash — all regex patterns expect no trailing slash
    path = path.replace(/\/+$/, "");

    if (!categories) return result;

    var productSlugs = buildSlugMap(categories.products);
    var appSlugs = buildSlugMap(categories.applications);
    var supportSlugs = buildSlugMap(categories.support);
    var productPattern = buildSlugPattern(productSlugs);
    var appPattern = buildSlugPattern(appSlugs);
    var supportPattern = buildSlugPattern(supportSlugs);

    var currentLang = options.currentLang || "zh-CN";

    // ── /products/all/ ──────────────────────────
    var allMatch = path.match(/^\/products\/all$/);
    if (allMatch) {
      result.type = "category";
      result.slug = "all";
      result.segments = [
        { label: "nav_product_center", href: "/products/" },
        { label: "nav_products_all", href: "/products/all/", current: true },
      ];
      return result;
    }

    // ── /products/<slug>/（品类页）───────────────
    var catMatch = path.match(new RegExp("^/products/(" + productPattern + ")$"));
    if (catMatch) {
      var slug = catMatch[1];
      var info = productSlugs[slug];
      if (info) {
        result.type = "category";
        result.slug = slug;
        result.segments = [
          { label: "nav_product_center", href: "/products/" },
          { label: resolveLabel(info.label, currentLang), href: "/products/" + slug + "/", current: true },
        ];
      }
      return result;
    }

    // ── /products/<slug>/<model>/（PDP）──────────
    var pdpMatch = path.match(/^\/products\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (pdpMatch) {
      var categoryFromUrl = pdpMatch[1];
      var model = pdpMatch[2];
      // 跳过设备文件名（index-pc.html, index-mobile.html, index-tablet.html）
      if (/^index-(?:pc|mobile|tablet)\.html?$/.test(model)) {
        // 降级为品类页
        var slug = categoryFromUrl;
        var info = productSlugs[slug];
        if (info) {
          result.type = "category";
          result.slug = slug;
          result.segments = [
            { label: "nav_product_center", href: "/products/" },
            { label: resolveLabel(info.label, currentLang), href: "/products/" + slug + "/", current: true },
          ];
          result.siblings = buildSiblingList("products", slug, categories, currentLang);
        }
        return result;
      }
      var refSlug = productSlugs[categoryFromUrl] ? categoryFromUrl : "";

      result.type = "pdp";
      result.slug = model;
      result.refSlug = refSlug;

      if (refSlug && productSlugs[refSlug]) {
        result.refCategoryLabel = resolveLabel(productSlugs[refSlug].label, currentLang);
        result.segments = [
          { label: "nav_product_center", href: "/products/" },
          { label: result.refCategoryLabel, href: "/products/" + refSlug + "/" },
          { label: model, href: "", current: true },
        ];
      } else {
        // 品类未就绪，先显示产品中心
        result.segments = [
          { label: "nav_product_center", href: "/products/" },
          { label: model, href: "", current: true },
        ];
      }
      return result;
    }

    // ── /products/compare ────────────────────
    if (path === "/products/compare" || path === "/products/compare/") {
      result.type = "compare";
      result.segments = [
        { label: "nav_product_center", href: "/products/" },
        { label: "products_compare", href: "", current: true },
      ];
      return result;
    }

    // ── /applications/<slug>/ ──────────────────
    var appMatch = path.match(new RegExp("^/applications/(" + appPattern + ")$"));
    if (appMatch) {
      var appSlug = appMatch[1];
      var appInfo = appSlugs[appSlug];
      if (appInfo) {
        result.type = "application";
        result.slug = appSlug;
        result.segments = [
          { label: "nav_applications", href: "/applications/" },
          { label: resolveLabel(appInfo.label, currentLang), href: "", current: true },
        ];
        // 同级导航（同类目下兄弟页面）
        result.siblings = buildSiblingList("applications", appSlug, categories, currentLang);
      }
      return result;
    }

    // ── /support/<slug>/ ──────────────────────
    var supMatch = path.match(new RegExp("^/support/(" + supportPattern + ")$"));
    if (supMatch) {
      var supSlug = supMatch[1];
      var supInfo = supportSlugs[supSlug];
      if (supInfo) {
        result.type = "support";
        result.slug = supSlug;
        result.segments = [
          { label: "nav_support", href: "/support/" },
          { label: resolveLabel(supInfo.label, currentLang), href: "", current: true },
        ];
        result.siblings = buildSiblingList("support", supSlug, categories, currentLang);
      }
      return result;
    }

    // ── /news/detail ──────────────────────────
    var newsMatch = path.match(/^\/news\/detail/);
    if (newsMatch) {
      result.type = "news-detail";
      result.segments = [
        { label: "nav_news", href: "/news/" },
        { label: "", href: "", current: true },
      ];
      return result;
    }

    // ── /cases/<slug>/ ────────────────────────
    var caseMatch = path.match(/^\/cases\/([a-z0-9-]+)$/);
    if (caseMatch) {
      result.type = "case-detail";
      result.slug = caseMatch[1];
      result.segments = [
        { label: "nav_cases", href: "/cases/" },
        { label: "", href: "", current: true },
      ];
      return result;
    }

    return result;
  }

  /**
   * 获取 goBack 导航目标
   *
   * @param {Array} segments — detect() 返回的 segments
   * @param {Object} [options]
   * @param {Object} slugMap — SLUG_TO_CATEGORY_KEY 映射
   * @param {string|null} [sessionReferrer=null] — sessionStorage 中存储的 referrer
   * @returns {{ href, label }}
   */
  function getGoBackTarget(segments, options) {
    options = options || {};
    if (segments && segments.length >= 2) {
      // 优先返回面包屑路径中的上一级
      var parent = segments[segments.length - 2];
      if (parent && parent.href) {
        return { href: parent.href, label: parent.label || "" };
      }
    }
    return { href: "", label: "" };
  }

  /**
   * 构建同级导航列表
   *
   * @param {string} group — "applications" | "support"
   * @param {string} currentSlug
   * @param {Object} categories
   * @param {string} [currentLang]
   * @returns {Array<{href, label, active}>}
   */
  function buildSiblingList(group, currentSlug, categories, currentLang) {
    var list = [];
    currentLang = currentLang || "zh-CN";
    if (!categories || !categories[group]) return list;

    var items = categories[group];
    var slugMap = buildSlugMap(items);

    Object.keys(slugMap).forEach(function (slug) {
      var info = slugMap[slug];
      list.push({
        href: "/" + group + "/" + slug + "/",
        label: resolveLabel(info.label, currentLang),
        active: slug === currentSlug,
      });
    });

    return list;
  }

  /**
   * 构建品类映射（SLUG_TO_CATEGORY_KEY / CATEGORY_KEY_TO_SLUG）
   *
   * @param {Object} categories
   * @returns {{ slugToKey, keyToSlug }}
   */
  function buildCategoryMaps(categories) {
    var slugToKey = {};
    var keyToSlug = {};
    if (!categories || !categories.products) return { slugToKey: slugToKey, keyToSlug: keyToSlug };

    var productSlugs = buildSlugMap(categories.products);
    Object.keys(productSlugs).forEach(function (slug) {
      slugToKey[slug] = productSlugs[slug].key;
      keyToSlug[productSlugs[slug].key] = slug;
    });

    return { slugToKey: slugToKey, keyToSlug: keyToSlug };
  }

  // ═══════════════════════════════════════════════════════════════
  // 注册到 window（向后兼容 <script> 标签 + vm 单元测试）
  // ═══════════════════════════════════════════════════════════════

  var BreadcrumbData = {
    detect: detect,
    getGoBackTarget: getGoBackTarget,
    buildSiblingList: buildSiblingList,
    buildCategoryMaps: buildCategoryMaps,
  };

  window.BreadcrumbData = BreadcrumbData;
})();
