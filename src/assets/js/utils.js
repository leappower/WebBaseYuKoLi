// @deprecated — Only used by webpack bundle (optional dev server).
// Static HTML pages load product-grid.js directly and never reference this file.
// Callers (search-engine.js, profit-calculator.js) already have null checks.
// TODO: Remove once webpack build is fully deprecated or product-grid.js
//       provides a public buildProductCatalog() equivalent.
//
// utils.js - AppUtils IIFE (image assets + product catalog helpers)
// Depends on: window.PRODUCT_SERIES, window.PRODUCT_DEFAULTS, window.ImageAssets
// Outputs: window.AppUtils

(function attachAppUtils(global) {
  "use strict";
  function _extend(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src) {
        for (var k in src) {
          if (src.hasOwnProperty(k)) target[k] = src[k];
        }
      }
    }
    return target;
  }

  /**
   * 产品分类名 → i18n key 中的 ASCII slug 映射表
   */
  var CATEGORY_SLUG_MAP = {
    中小型智能炒菜机: "smart_cooker_mid",
    其他烹饪设备: "other_cooking",
    团餐专用炒菜机: "catering_cooker",
    多功能搅拌炒锅: "mixing_wok",
    大型商用炒菜机: "commercial_large",
    智能全自动炒菜机: "auto_cooker",
    智能喷料炒菜机: "spray_cooker",
    智能油炸炉系列: "fryer_series",
    "智能煮面/饭炉系列": "noodle_rice_series",
    智能电磁滚筒炒菜机: "drum_induction",
    智能触屏滚筒炒菜机: "drum_touchscreen",
    行星搅拌炒菜机: "planetary_mixer",
  };

  function getCategoryI18nKey(category) {
    // Support both i18n keys (nav_products_coffee) and Chinese category names
    if (!category) return "filter_unknown";
    // If it's already an i18n key (nav_products_xxx), use directly
    if (category.indexOf("nav_products_") === 0 || category.indexOf("nav_") === 0) return category;
    // Legacy: Chinese name → slug mapping
    var slug = CATEGORY_SLUG_MAP[category];
    return slug ? "filter_" + slug : "filter_" + category;
  }

  function getImageAssets() {
    return (window.ImageAssets && window.ImageAssets.IMAGE_ASSETS) || {};
  }

  function getProductSeries() {
    return window.PRODUCT_SERIES || [];
  }

  function getProductDefaults() {
    return window.PRODUCT_DEFAULTS || {};
  }

  function isProductActive(product) {
    return product && product.isActive !== false;
  }

  function resolveImage(imageKey) {
    return getImageAssets()[imageKey] || "";
  }

  function applyImageAssets(root) {
    if (!root) root = document;
    root.querySelectorAll("[data-image-key]").forEach(function (img) {
      var src = resolveImage(img.dataset.imageKey);
      if (src) img.src = src;
    });
    root.querySelectorAll("[data-poster-key]").forEach(function (video) {
      var poster = resolveImage(video.dataset.posterKey);
      if (poster) video.poster = poster;
    });
    root.querySelectorAll("[data-bg-image-key]").forEach(function (el) {
      var bg = resolveImage(el.dataset.bgImageKey);
      if (bg) el.style.backgroundImage = "url('" + bg + "')";
    });
  }

  function buildProductCatalog() {
    var PRODUCT_SERIES = getProductSeries();
    var PRODUCT_DEFAULTS = getProductDefaults();
    var nextId = 1;
    var result = [];
    PRODUCT_SERIES.forEach(function (series) {
      series.products.filter(isProductActive).forEach(function (product) {
        var category = series.category;
        var imageKey = product.imageRecognitionKey || "product_" + category;
        var imageUrl = product.imageUrl || resolveImage(imageKey);
        result.push(
          _extend(
            {},
            PRODUCT_DEFAULTS,
            {
              id: nextId++,
              category: category,
              filterKey: category,
              imageRecognitionKey: imageKey,
              imageKey: imageKey,
              productImageKey: imageKey,
              imageUrl: imageUrl,
              productImage: imageUrl,
            },
            product
          )
        );
      });
    });
    return result;
  }

  window.AppUtils = {
    get IMAGE_ASSETS() {
      return getImageAssets();
    },
    get PRODUCT_SERIES() {
      return getProductSeries();
    },
    resolveImage: resolveImage,
    applyImageAssets: applyImageAssets,
    buildProductCatalog: buildProductCatalog,
    getCategoryI18nKey: getCategoryI18nKey,
  };
})(window);
