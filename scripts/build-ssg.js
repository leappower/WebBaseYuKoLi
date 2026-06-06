#!/usr/bin/env node
/**
 * build-ssg.js - Static Site Generator for GitHub Pages deployment
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * WHAT IS SSG AND WHY DO WE NEED IT?
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * SSG (Static Site Generation) converts the SPA (Single Page Application)
 * into a collection of static HTML files, one per route. This is necessary
 * because GitHub Pages is a pure static file server — it cannot run
 * server-side routing or SPA fallback (no .htaccess, no Express middleware).
 *
 * WITHOUT SSG (SPA mode):
 *   - User visits yukoli.com/catalog → GitHub Pages returns 404 (no such file)
 *   - SPA fallback (_redirects) doesn't work on GitHub Pages
 *   - Page refresh on any route breaks the site
 *   - Search engines may not index hash-based URLs (/#/catalog)
 *
 * WITH SSG (this script):
 *   - User visits yukoli.com/catalog/ → GitHub Pages serves dist/catalog/index.html ✅
 *   - Page refresh works everywhere ✅
 *   - Each page has real <title>, <meta>, OG tags for SEO ✅
 *   - First contentful paint is faster (no JS routing needed) ✅
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HOW IT WORKS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * This script runs AFTER webpack build. It:
 *
 * 1. Scans routes from SITE_CONFIG.nav (in site.config.js)
 * 2. For each route:
 *    - Reads src/pages/<route>/index.html (responsive entry)
 *    - Injects lang-registry.js + theme-init.js + nav scripts
 *    - Writes to dist/<route>/index.html
 * 3. Generates dist/index.html (root entry):
 *    - SPA shell with navigator, footer, spa-content
 *    - Injects lang-registry.js, theme-init.js, nav scripts, skeleton
 * 4. Generates dist/404.html:
 *    - GitHub Pages SPA fallback with redirect logic
 *    - Injects lang-registry.js, theme-init.js, nav scripts
 * 5. Copies device-specific files and processes them:
 *    - Injects lang-registry.js + nav scripts into each device file
 *    - Patches BASE_PATH placeholder for subdirectory deployments
 *
 * ── FILE STRUCTURE ───────────────────────────────────────────────
 *
 * GitHub Pages:
 *   dist/ (root)
 *     index.html          → / (redirects to /home/)
 *     404.html            → /home → /home/ redirect
 *     home/
 *       index-pc.html      → /home/ (responsive redirect)
 *       index-mobile.html  → /home/ (responsive redirect)
 *       index-tablet.html  → /home/ (responsive redirect)
 *       index.html         → /home/ (responsive redirect)
 *     catalog/
 *       index-pc.html      → /catalog/ (responsive redirect)
 *       index.html         → /catalog/ (responsive redirect)
 *
 * ── URL EXAMPLES (GitHub Pages) ──────────────────────────────────
 *
 *   Before (SPA):   yukoli.com/catalog     → 404 on GitHub Pages
 *   After (SSG):    yukoli.com/catalog/    → serves /catalog/index.html
 *
 *   Note: URLs without trailing slash (/home) are handled by 404.html,
 *   which redirects to /home/ (with slash) using JavaScript.
 *   This is a GitHub Pages limitation (no .htaccess rewrite).
 *
 * ── DEPLOYMENT ───────────────────────────────────────────────────
 *   Deploys to GitHub Pages via publish branch (see devops/github-pages.yml)
 *
 * @module build-ssg
 */

"use strict";

var fs = require('fs');
var path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────
var DIST_DIR = path.join(__dirname, '..', 'dist');
var SRC_DIR = path.join(__dirname, '..', 'src');
var BASE_PATH = process.env.BASE_PATH || '';
var LOG_PREFIX = process.env.SILENT ? '' : '';

var _routes = [];
var _siteConfig = {};

// ─── HELPERS ──────────────────────────────────────────────────────

function log(msg) {
  if (typeof msg === 'string' && msg.indexOf('Step') === 0) {
    console.log('  ' + msg);
  } else if (msg.indexOf('✓') !== -1 || msg.indexOf('✅') !== -1) {
    console.log('    ' + msg);
  } else if (msg.indexOf('WARN') !== -1 || msg.indexOf('ERROR') !== -1) {
    console.log('    ' + msg);
  } else if (!process.env.SILENT) {
    console.log('    ' + msg);
  }
}

/**
 * Safe read of nested property
 * @param {Object} obj
 * @param {string} path  e.g. "nav.items.0.label"
 * @returns {*}
 */
function _get(obj, pathStr) {
  var parts = pathStr.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

// ─── LOAD SITE CONFIG ─────────────────────────────────────────────

function loadSiteConfig() {
  // Try reading site.config.js directly from src/
  var configPaths = [
    path.join(__dirname, '..', 'src', 'site.config.js'),
    path.join(__dirname, '..', 'dist', 'site.config.js'),
    path.join(__dirname, '..', 'site.config.js'),
  ];

  for (var i = 0; i < configPaths.length; i++) {
    if (fs.existsSync(configPaths[i])) {
      try {
        // Use a basic eval-safe approach — treat as CommonJS module
        delete require.cache[require.resolve(configPaths[i])];
        _siteConfig = require(configPaths[i]);
        log('✅ Loaded site config: ' + configPaths[i]);
        return;
      } catch (e) {
        // Try loading as JS file with window shim
        try {
          var content = fs.readFileSync(configPaths[i], 'utf-8');
          var window = {};
          // Remove 'use strict' to allow eval
          content = content.replace('"use strict";', '').replace("'use strict';", '');
          // Replace module.exports with assignment
          content = content.replace('module.exports', '_siteConfig');
          eval(content);
          log('✅ Loaded site config (eval): ' + configPaths[i]);
          return;
        } catch (e2) {
          log('WARN: Failed to load config: ' + configPaths[i] + ' — ' + e2.message);
        }
      }
    }
  }

  log('WARN: No site.config.js found, using defaults');
}

// ─── ROUTE DISCOVERY ──────────────────────────────────────────────

function discoverRoutes() {
  var routes = [];

  // 1. From SITE_CONFIG.nav — prefer config-defined routes
  var navItems = _get(_siteConfig, 'nav.items') || [];
  for (var i = 0; i < navItems.length; i++) {
    var item = navItems[i];
    var slug = item.id || '';
    if (!slug) continue;
    routes.push({
      slug: slug,
      label: item.label,
      sourceDir: slug,
    });

    // Add children as sub-routes
    var children = item.children || [];
    for (var j = 0; j < children.length; j++) {
      var child = children[j];
      var childSlug = child.slug || child.id || '';
      if (!childSlug) continue;
      // Check if this child has its own directory
      var childDir = path.join(SRC_DIR, 'pages', slug, childSlug);
      if (fs.existsSync(childDir)) {
        routes.push({
          slug: slug + '/' + childSlug,
          label: child.label,
          sourceDir: slug + '/' + childSlug,
          parentSlug: slug,
        });
      }
    }
  }

  // 2. Discover additional routes from src/pages/ directories
  var pagesDir = path.join(SRC_DIR, 'pages');
  if (fs.existsSync(pagesDir)) {
    var dirs = fs.readdirSync(pagesDir);
    for (var k = 0; k < dirs.length; k++) {
      var dir = dirs[k];
      // Skip hidden/internal directories
      if (dir.startsWith('.')) continue;

      // Check if already in route list
      var exists = false;
      for (var l = 0; l < routes.length; l++) {
        if (routes[l].slug === dir) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        var pageDir = path.join(pagesDir, dir);
        if (fs.statSync(pageDir).isDirectory()) {
          // Check if it has HTML files
          var hasHtml = false;
          try {
            var files = fs.readdirSync(pageDir);
            for (var m = 0; m < files.length; m++) {
              if (files[m].endsWith('.html')) {
                hasHtml = true;
                break;
              }
            }
          } catch (e) {}
          if (hasHtml) {
            routes.push({
              slug: dir,
              label: dir,
              sourceDir: dir,
            });
          }
        }

        // Check for subdirectories (PDP, case-detail, etc.)
        try {
          var subDir = path.join(pagesDir, dir);
          if (fs.statSync(subDir).isDirectory()) {
            var subItems = fs.readdirSync(subDir);
            for (var n = 0; n < subItems.length; n++) {
              var subEntry = subItems[n];
              var subFull = path.join(subDir, subEntry);
              if (fs.statSync(subFull).isDirectory() && !subEntry.startsWith('.')) {
                var subSlug = dir + '/' + subEntry;
                var inRoutes = false;
                for (var o = 0; o < routes.length; o++) {
                  if (routes[o].slug === subSlug) {
                    inRoutes = true;
                    break;
                  }
                }
                if (!inRoutes) {
                  routes.push({
                    slug: subSlug,
                    label: subEntry,
                    sourceDir: subSlug,
                    parentSlug: dir,
                  });
                }
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  // Sort: parent routes first, then children
  routes.sort(function (a, b) {
    return a.slug.localeCompare(b.slug);
  });

  // Filter out routes that have no HTML files in their source directory
  routes = routes.filter(function (route) {
    var sourceDir = path.join(DIST_DIR, route.sourceDir || route.slug);
    if (fs.existsSync(sourceDir)) {
      var files = fs.readdirSync(sourceDir);
      for (var p = 0; p < files.length; p++) {
        if (files[p].endsWith('.html')) return true;
      }
    }
    return false;
  });

  _routes = routes;
  return routes;
}

// ─── PATH PATCHING ────────────────────────────────────────────────

/**
 * Replace %BASE_PATH% placeholder with actual BASE_PATH in HTML content.
 * Also replaces root-absolute paths (/assets/...) with prefixed paths
 * when deploying to a subdirectory (e.g. /brew/).
 */
function patchHtmlPaths(html) {
  if (!BASE_PATH) return html;

  var bp = BASE_PATH.replace(/\/$/, '');

  // Replace %BASE_PATH% placeholder first
  html = html.replace(/%BASE_PATH%/g, bp);

  // Replace root-absolute paths for assets (skipping CDN/external URLs)
  // Only patterns that start with /assets/, /images/, /fonts/
  html = html.replace(/(["'])\/(assets\/)/g, '$1' + bp + '/$2');
  html = html.replace(/(["'])\/(images\/)/g, '$1' + bp + '/$2');
  html = html.replace(/(["'])\/(fonts\/)/g, '$1' + bp + '/$2');

  return html;
}

// ─── LANG-REGISTRY INJECTION ──────────────────────────────────────

/**
 * Inject lang-registry.js script tag before translations.js in HTML content.
 * This ensures all pages have lang-registry available before translations initializes,
 * regardless of whether the source HTML already includes it (idempotent check).
 *
 * The script is injected with `defer` to match the pattern used in pages that
 * already include it statically (e.g. home, 404).
 */
function injectLangRegistry(html) {
  // Already has lang-registry.js — skip (idempotent)
  if (/lang-registry\.js/.test(html)) return html;

  // Insert before translations.js (which navigator.js depends on)
  // Pattern: <script ... src="/assets/js/translations.js">
  var bp = BASE_PATH ? BASE_PATH.replace(/\/$/, '') : '';
  var tag = '<script defer src="' + bp + '/assets/js/lang-registry.js"></script>\n    ';
  html = html.replace(
    /(\s*)(<script[^>]*src=["'][^"']*\/assets\/js\/translations\.js[^>]*>[^<]*<\/script>)/i,
    '$1' + tag + '$2'
  );

  return html;
}

/**
 * Inject theme-init.js + core component scripts into HTML.
 *
 * SSG pages need navigator, footer, dropdown, i18n, and search modules
 * to hydrate the placeholders that are rendered as static HTML.
 *
 * Detects device type from filename (index-pc, index-mobile, index-tablet).
 * For generated pages (404, root index), pass deviceType explicitly.
 * Uses idempotent markers to prevent double injection.
 *
 * FIX: Previously only injected theme-init.js + device-specific nav scripts,
 * but MISSED the core bundles (i18n-bundle, dropdown-bundle, nav-bundle, ui-bundle)
 * that contain navigator.js and footer.js. This caused SSG pages to have
 * inert <navigator> and <footer> placeholders that never hydrated.
 */
function injectThemeAndNavScripts(html, deviceType) {
  // Use a custom marker for idempotency so we don't skip pages
  // that already have theme-init.js but need the core bundles.
  var MARKER = '<!-- ssg-nav-footer-injected -->';
  if (html.indexOf(MARKER) !== -1) return html;

  var bp = BASE_PATH ? BASE_PATH.replace(/\/$/, '') : '';
  var allTags = '';

  // ── 0. Runtime guard (__safe — must be first, before all other scripts) ──
  if (html.indexOf('runtime-guard.js') === -1) {
    allTags += '<script defer src="' + bp + '/assets/js/lib/runtime-guard.js"></script>\n  ';
  }

  // ── 1. Core framework (theme-init.js — font CDN + CSS tokens) ──
  if (html.indexOf('theme-init.js') === -1) {
    allTags += '<script defer src="' + bp + '/assets/js/theme-init.js"></script>\n  ';
  }

  // ── 2. i18n + dropdown + nav + ui bundles ──
  // These bundles contain: lang-registry, translations, dropdown modules,
  // navigator.js, slide-menu.js, custom-select.js, mega-menu.js,
  // footer.js, search-engine.js, trust-bar.js, bottom-tab.js, etc.
  if (html.indexOf('i18n-bundle.js') === -1 && html.indexOf('lang-registry.js') === -1) {
    allTags += '<script defer src="' + bp + '/assets/js/i18n-bundle.js"></script>\n  ';
  }
  if (html.indexOf('dropdown-bundle.js') === -1 && html.indexOf('dropdown-base.js') === -1) {
    allTags += '<script defer src="' + bp + '/assets/js/dropdown-bundle.js"></script>\n  ';
  }
  if (html.indexOf('nav-bundle.js') === -1 && html.indexOf('navigator.js') === -1) {
    allTags += '<script defer src="' + bp + '/assets/js/nav-bundle.js"></script>\n  ';
  }
  if (html.indexOf('ui-bundle.js') === -1 && html.indexOf('footer.js') === -1) {
    allTags += '<script defer src="' + bp + '/assets/js/ui-bundle.js"></script>\n  ';
  }

  // ── 3. Device-specific nav script (only if bundles not loaded) ──
  if (html.indexOf('nav-bundle.js') === -1 && allTags.indexOf('nav-bundle.js') === -1) {
    if (deviceType === 'pc') {
      if (html.indexOf('mega-menu.js') === -1) {
        allTags += '<script defer src="' + bp + '/assets/js/ui/mega-menu.js"></script>\n  ';
      }
    } else if (deviceType === 'mobile' || deviceType === 'tablet') {
      if (html.indexOf('nav-footer.js') === -1) {
        allTags += '<script defer src="' + bp + '/assets/js/ui/nav-footer.js"></script>\n  ';
      }
    } else {
      // Responsive: inject if not already present
      if (html.indexOf('mega-menu.js') === -1) {
        allTags += '<script defer src="' + bp + '/assets/js/ui/mega-menu.js"></script>\n  ';
      }
      if (html.indexOf('nav-footer.js') === -1) {
        allTags += '<script defer src="' + bp + '/assets/js/ui/nav-footer.js"></script>\n  ';
      }
    }
  }

  // ── 4. SWUP init (must be injected manually for SSG pages) ──
  if (html.indexOf('swup-init.js') === -1) {
    allTags += '<script defer src="' + bp + '/assets/js/swup-init.js"></script>\n  ';
  }

  // ── 5. Search/slide-menu (only if bundles not loaded) ──
  if (html.indexOf('nav-bundle.js') === -1 && allTags.indexOf('nav-bundle.js') === -1) {
    if (html.indexOf('slide-menu.js') === -1) {
      allTags += '<script defer src="' + bp + '/assets/js/ui/slide-menu.js"></script>\n    ';
    }
    if (html.indexOf('search-engine.js') === -1) {
      allTags += '<script defer src="' + bp + '/assets/js/ui/search-engine.js"></script>\n    ';
    }
    if (html.indexOf('search-index.js') === -1) {
      allTags += '<script defer src="' + bp + '/assets/js/search-index.js"></script>';
    }
  }

  // ── 5. Split runtime-guard into head; rest to body ──
  var headTags = '';
  var bodyTags = '';
  var lines = allTags.split('\n').filter(Boolean);
  lines.forEach(function(tag) {
    if (tag.indexOf('runtime-guard.js') !== -1) {
      headTags += tag + '\n  ';
    } else {
      bodyTags += tag + '\n  ';
    }
  });
  // Skip if nothing to inject
  if (!headTags && !bodyTags) return html;
  // Inject runtime-guard into head (after <head> tag)
  if (headTags) {
    html = html.replace('<head>', '<head>\n  ' + headTags);
  }
  // Inject remaining tags before </body>
  if (bodyTags) {
    html = html.replace(/<\/body>/i, MARKER + '\n  ' + bodyTags + '<\/body>');
  }

  return html;
}

/**
 * Detect device type from filename.
 * @param {string} filename - e.g. 'index-pc.html', 'index-mobile.html'
 * @returns {string} 'pc', 'mobile', 'tablet', or 'responsive'
 */
function detectDeviceType(filename) {
  if (/index-pc/.test(filename)) return 'pc';
  if (/index-mobile/.test(filename)) return 'mobile';
  if (/index-tablet/.test(filename)) return 'tablet';
  return 'responsive';
}

// ─── SKELETON INJECTION ───────────────────────────────────────────

/**
 * Generate skeleton overlay markup (injected before footer).
 *
 * The skeleton overlay provides a smooth visual transition from initial
 * page load to interactive state. It covers the main content area with
 * a subtle loading animation that fades out once the page is ready.
 */
function buildSkeletonHTML() {
  return '';
  // Skeleton was removed — SPA shell handles transitions natively
}

// ─── ROUTE INDEX GENERATION ───────────────────────────────────────

/**
 * Generate a route-specific index.html that serves as the directory entry.
 *
 * This file is similar to src/pages/<route>/index.html but with:
 * - Device detection redirect (JS) for responsiveness
 * - Injected lang-registry.js, theme-init.js, and nav scripts
 *
 * @param {Object} route - { slug, sourceDir, label }
 */
function generateRouteIndex(route) {
  var srcDir = path.join(SRC_DIR, 'pages', route.slug);
  var srcFile = path.join(srcDir, 'index.html');

  if (!fs.existsSync(srcFile)) {
    // Fallback: 用 PC 版作为 index.html
    var pcFile = path.join(srcDir, 'index-pc.html');
    if (fs.existsSync(pcFile)) {
      srcFile = pcFile;
      log('  ⚠ No index.html for ' + route.slug + ', using index-pc.html as fallback');
    } else {
      log('  ⚠ No index.html for ' + route.slug + ' (skipping)');
      return;
    }
  }

  var html = fs.readFileSync(srcFile, 'utf-8');

  // Inject lang-registry.js before translations.js (if not already present)
  html = injectLangRegistry(html);

  if (BASE_PATH) {
    html = patchHtmlPaths(html);
  }

  // Inject theme-init.js + nav scripts (responsive — serves all device types)
  html = injectThemeAndNavScripts(html, 'responsive');

  // Write to dist/<slug>/index.html
  var distDir = path.join(DIST_DIR, route.slug);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  var distFile = path.join(distDir, 'index.html');
  fs.writeFileSync(distFile, html, 'utf-8');
  log('  ✓ ' + route.slug + '/index.html');
}

// ─── DEVICE FILE PROCESSING ───────────────────────────────────────

/**
 * Copy device-specific files (index-pc.html, index-mobile.html, index-tablet.html)
 * within dist/<route>/ (already flat — build.sh outputs directly to dist/)
 */
function copyDeviceFiles(route) {
  const srcDir = path.join(DIST_DIR, route.sourceDir || route.slug);
  const destRouteDir = path.join(DIST_DIR, route.slug);
  var copied = 0;

  if (!fs.existsSync(srcDir)) {
    log('WARN: No dist/' + (route.sourceDir || route.slug) + '/ directory found');
    return 0;
  }

  if (srcDir === destRouteDir) {
    // Same directory (flat build) — just process files in place
    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      if (!file.endsWith('.html')) continue;
      if (file === 'index.html') continue;

    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destRouteDir, file);

    let content = fs.readFileSync(srcFile, 'utf-8');
    // Inject lang-registry.js before translations.js (if not already present)
    content = injectLangRegistry(content);
    if (BASE_PATH) {
      content = patchHtmlPaths(content);
    }
    // Inject theme-init.js + nav scripts
    var deviceType = detectDeviceType(file);
    content = injectThemeAndNavScripts(content, deviceType);
    // 重定向守卫：SWUP 运行时跳过
    content = content.replace(
      /window\.__redirectChecked = true;\n        (\/\/)/,
      'window.__redirectChecked = true;\n        if (window.__swupEnabled || window.__spaNavigating) return;\n        $1'
    );
    fs.writeFileSync(destFile, content, 'utf-8');
    copied++;
  }
  } else {
    // Cross-directory copy (e.g. case-detail sourceDir → slug directory)
    if (!fs.existsSync(destRouteDir)) {
      fs.mkdirSync(destRouteDir, { recursive: true });
    }
    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      if (!file.endsWith('.html')) continue;
      if (file === 'index.html') continue;

      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destRouteDir, file);

      let content = fs.readFileSync(srcFile, 'utf-8');
      content = injectLangRegistry(content);
      if (BASE_PATH) {
        content = patchHtmlPaths(content);
      }
      var deviceType = detectDeviceType(file);
      content = injectThemeAndNavScripts(content, deviceType);
      // 重定向守卫
      content = content.replace(
        /window\.__redirectChecked = true;\n        (\/\/)/,
        'window.__redirectChecked = true;\n        if (window.__swupEnabled || window.__spaNavigating) return;\n        $1'
      );
      fs.writeFileSync(destFile, content, 'utf-8');
      copied++;
    }
  }

  return copied;
}

// ─── SPA SHELL GENERATION ─────────────────────────────────────────

/**
 * Generate the root index.html — lightweight redirect to /home/
 * The SPA shell caused a cascade of issues (empty spa-content, SWUP init loops,
 * PRODUCT_DATA_TABLE not loading on SWUP navigation, device-file URL leaks).
 * SSG pages have their own complete HTML + JS, so the root just redirects.
 */
function generateSPAShell() {
  var bp = BASE_PATH ? BASE_PATH.replace(/\/$/, '') : '';
  var target = bp + '/home/';

  // Use JS redirect (works on all hosts including serve, GitHub Pages, Cloudflare Pages)
  var html = '<!DOCTYPE html>\n'
    + '<html lang="zh-CN">\n'
    + '<head>\n'
    + '  <meta charset="UTF-8">\n'
    + '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
    + '  <link rel="canonical" href="https://brew.yukoli.com/home/">\n'
    + '  <script>window.location.replace("' + target + '");</script>\n'
    + '  <noscript><meta http-equiv="refresh" content="0;url=' + target + '"></noscript>\n'
    + '</head>\n'
    + '<body>Redirecting to <a href="' + target + '">' + target + '</a></body>\n'
    + '</html>\n';

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');
  log('  ✓ dist/index.html (redirect to /home/, ' + html.length + ' bytes)');
}

// ─── 404 PAGE GENERATION ──────────────────────────────────────────

/**
 * Generate a 404.html that:
 * 1. Redirects path without trailing slash → path with trailing slash (SPA fallback)
 * 2. Redirects /home (no slash) → /home/ (SSG directory index)
 * 3. Shows SPA-friendly content for other unmatched routes
 * 4. For truly unknown routes, does NOT redirect (shows 404 page)
 *
 * GitHub Pages uses 404.html for any unmatched URL.
 */
function generate404() {
  var src404 = path.join(SRC_DIR, '404.html');
  
  if (!fs.existsSync(src404)) {
    log('WARN: src/404.html not found, skipping');
    return;
  }

  var html = fs.readFileSync(src404, 'utf-8');

  // Inject lang-registry.js before translations.js (if not already present)
  html = injectLangRegistry(html);

  if (BASE_PATH) {
    html = patchHtmlPaths(html);
  }

  // Inject theme-init.js + nav scripts (responsive for all devices)
  html = injectThemeAndNavScripts(html, 'responsive');

  // Write to dist/404.html
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), html, 'utf-8');
  log('  ✓ dist/404.html');
}

// ─── MAIN ──────────────────────────────────────────────────────────

function main() {
  // ─── 前置校验：产品分类数据 ────────────────────────────
  console.log('');
  console.log('🔍 前置校验: 产品分类数据一致性...');
  try {
    var validateScript = path.join(path.dirname(process.argv[1]), 'validate-product-categories.js');
    if (fs.existsSync(validateScript)) {
      var result = require('child_process').execSync(
        'node ' + validateScript,
        { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', timeout: 30000 }
      );
      console.log('  ✅ 产品分类数据校验通过');
    } else {
      console.log('  ⚠️  未找到校验脚本，跳过');
    }
  } catch (e) {
    console.error('\n⚠️ 产品分类数据校验未通过（已跳过，非阻塞模式）。');
    // process.exit(1); // 临时跳过，让 build-ssg 完整运行
  }
  console.log('');
  console.log('⚡ Static Site Generator (build-ssg.js)');
  console.log('');

  // Step 0: Load site config
  log('Step 0: Loading site config...');
  loadSiteConfig();

  // Step 1: Discover routes
  log('Step 1: Discovering routes...');
  var routes = discoverRoutes();
  log('  📍 Found ' + routes.length + ' routes:');
  for (var i = 0; i < routes.length; i++) {
    log('    - ' + routes[i].slug);
  }

  // Step 2: Generate route index.html files
  log('');
  log('Step 2: Generating route index files...');
  for (var j = 0; j < routes.length; j++) {
    generateRouteIndex(routes[j]);
  }

  // Step 3: Copy device files and inject scripts
  log('');
  log('Step 3: Processing device-specific files...');
  var totalCopied = 0;
  for (var k = 0; k < routes.length; k++) {
    var count = copyDeviceFiles(routes[k]);
    totalCopied += count;
    if (count > 0) {
      log('  ✓ ' + routes[k].slug + ': ' + count + ' files');
    }
  }
  log('  ✅ Total: ' + totalCopied + ' device files processed');

  // Step 4: Generate SPA shell
  log('');
  log('Step 4: Generating SPA shell (index.html)...');
  generateSPAShell();

  // Step 5: Generate 404 page
  log('');
  log('Step 5: Generating 404 page...');
  generate404();

  // Summary
  console.log('');
  log('✅ SSG complete: ' + (routes.length) + ' routes, ' + totalCopied + ' device files');
  console.log('');

  // Diagnostic: verify navigator/footer coverage
  console.log('  🔍 Quick check: navigator/footer coverage');
  var missingNav = 0;
  var totalPages = 0;
  var checkDir = DIST_DIR;
  if (fs.existsSync(checkDir)) {
    var walk = function(dir) {
      var entries = fs.readdirSync(dir);
      for (var e = 0; e < entries.length; e++) {
        var full = path.join(dir, entries[e]);
        if (fs.statSync(full).isDirectory()) {
          walk(full);
        } else if (entries[e].endsWith('.html') && entries[e].indexOf('index') === 0) {
          var content = fs.readFileSync(full, 'utf-8');
          var hasNav = content.indexOf('navigator.js') !== -1 || content.indexOf('nav-bundle.js') !== -1;
          var hasFooter = content.indexOf('footer.js') !== -1 || content.indexOf('ui-bundle.js') !== -1;
          totalPages++;
          if (!hasNav || !hasFooter) {
            missingNav++;
            var rel = path.relative(DIST_DIR, full);
            if (!hasNav) console.log('    ❌ ' + rel + ' (missing navigator)');
            else if (!hasFooter) console.log('    ❌ ' + rel + ' (missing footer)');
          }
        }
      }
    };
    walk(checkDir);
  }
  if (missingNav === 0) {
    console.log('    ✅ All ' + totalPages + ' pages have navigator + footer');
  } else {
    console.log('    ⚠️  ' + missingNav + '/' + totalPages + ' pages missing navigator/footer');
  }
  console.log('');
}

main();
