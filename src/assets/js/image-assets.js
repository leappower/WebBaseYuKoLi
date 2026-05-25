/**
 * image-assets.js — Image path mapping (IIFE build for src/ static HTML)
 * Synced from: src/assets/image-assets.js
 * Global: window.ImageAssets
 *
 * ⚠️  NOTE: In the original src/ build, this module imports image-manifest.json
 *     at webpack build time to auto-discover product images. In this static
 *     version, product images from the manifest are NOT auto-populated.
 *
 *     If you need product images in src/, either:
 *       a) Manually add keys to productImages below, OR
 *       b) Fetch /images/image-manifest.json at runtime and call
 *          window.ImageAssets.loadFromManifest() after page load.
 *
 * Usage: <script src="../../assets/js/image-assets.js"></script>
 * Then:  window.ImageAssets.IMAGE_ASSETS.logo  // → "images/logo-main.webp"
 *        window.ImageAssets.resolveImage('logo-main')  // → "images/logo-main.webp"
 */
(function (global) {
  "use strict";

  var IMAGE_PATH_PREFIX = "images";

  /** Return WebP image path for a key */
  function resolveImage(key) {
    return IMAGE_PATH_PREFIX + "/" + key + ".webp";
  }

  // ─── Static image assets (non-product, paths are fixed) ──────────────────────
  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _images = _cfg.images || {};

  /* Static image assets — fallback when site.config not loaded */
  var IMAGE_ASSETS = {
    logo: IMAGE_PATH_PREFIX + "/logo-main.webp",
    logo_dark: IMAGE_PATH_PREFIX + "/logo-main-dark.webp",
    hero_bg: IMAGE_PATH_PREFIX + "/workshop-bg.webp",
    hero_main: IMAGE_PATH_PREFIX + "/hero-main.webp",
    factory_video_poster: IMAGE_PATH_PREFIX + "/factory-video-poster.webp",
    factory_gallery_1: IMAGE_PATH_PREFIX + "/factory-gallery-1.webp",
    factory_gallery_2: IMAGE_PATH_PREFIX + "/factory-gallery-2.webp",
    factory_gallery_3: IMAGE_PATH_PREFIX + "/factory-gallery-3.webp",
    factory_gallery_4: IMAGE_PATH_PREFIX + "/factory-gallery-4.webp",
    cert_1: IMAGE_PATH_PREFIX + "/cert-1.webp",
    cert_2: IMAGE_PATH_PREFIX + "/cert-2.webp",
    cert_3: IMAGE_PATH_PREFIX + "/cert-3.webp",
    cert_4: IMAGE_PATH_PREFIX + "/cert-4.webp",
    cert_5: IMAGE_PATH_PREFIX + "/cert-5.webp",
    cert_6: IMAGE_PATH_PREFIX + "/cert-6.webp",
    product_compact: IMAGE_PATH_PREFIX + "/product-compact.webp",
    product_professional: IMAGE_PATH_PREFIX + "/product-professional.webp",
    product_industrial: IMAGE_PATH_PREFIX + "/product-industrial.webp",
    // Product images are populated at runtime via loadFromManifest()
    // See the ⚠️ note at the top of this file for details.
  };

  /**
   * Load product image keys from /images/image-manifest.json at runtime.
   * Call this after the page has loaded if you need product images:
   *   window.ImageAssets.loadFromManifest().then(() => { ... });
   */
  function loadFromManifest() {
    var NON_PRODUCT_KEYS = new Set([
      "logo-main",
      "logo-main-dark",
      "workshop-bg",
      "hero-main",
      "factory-video-poster",
      "factory-gallery-1",
      "factory-gallery-2",
      "factory-gallery-3",
      "factory-gallery-4",
      "cert-1",
      "cert-2",
      "cert-3",
      "cert-4",
      "cert-5",
      "cert-6",
      "product-compact",
      "product-professional",
      "product-industrial",
    ]);

    return fetch("/images/image-manifest.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load image-manifest.json");
        return res.json();
      })
      .then(function (manifest) {
        var images = manifest.images || [];
        images.forEach(function (key) {
          if (!NON_PRODUCT_KEYS.has(key)) {
            IMAGE_ASSETS[key] = IMAGE_PATH_PREFIX + "/" + key + ".webp";
          }
        });
      })
      .catch(function (err) {
        console.warn("[ImageAssets] Could not load image-manifest.json:", err.message);
      });
  }

  /**
   * Resolve a product image path by category and sequence.
   * e.g. ImageAssets.resolveProductImage("coffee", "001") → "/assets/images/products/coffee/001.webp"
   */
  function resolveProductImage(category, seq) {
    return "/assets/images/products/" + category + "/" + seq + ".webp";
  }

  /**
   * Resolve a product image using product ID from product-data-table.
   * e.g. ImageAssets.resolveByProductId("coffee-001") → "/assets/images/products/coffee/001.webp"
   */
  function resolveByProductId(productId) {
    if (!productId) return "";
    var parts = productId.split("-");
    if (parts.length < 2) return "";
    var category = parts[0];
    // Only known product categories
    var VALID_CATEGORIES = {"coffee":1,"tea":1,"beauty":1,"weight":1,"gut":1};
    if (!VALID_CATEGORIES[category]) return "";
    var seq = parts[parts.length - 1];
    return "/assets/images/products/" + category + "/" + seq + ".webp";
  }

  window.ImageAssets = {
    IMAGE_ASSETS: IMAGE_ASSETS,
    resolveImage: resolveImage,
    loadFromManifest: loadFromManifest,
    resolveProductImage: resolveProductImage,
    resolveByProductId: resolveByProductId,
  };
})(window);
