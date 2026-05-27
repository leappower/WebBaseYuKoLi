#!/usr/bin/env node
// HTTPS dev server for dist/ — mirrors brew-server.js routing logic
// Handles /pages/ SSG structure and device-specific file resolution
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3443;
const ROOT = path.join(__dirname, "dist");
const PAGES = path.join(ROOT, "pages");

const MIME = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  ico: "image/x-icon",
  xml: "application/xml",
  txt: "text/plain; charset=utf-8",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  pdf: "application/pdf",
};

function getDeviceSuffix(ua) {
  if (/mobile|android|iphone/.test(ua) && !/tablet|ipad/.test(ua)) return "index-mobile.html";
  if (/tablet|ipad/.test(ua)) return "index-tablet.html";
  return "index-pc.html";
}

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath)) return false;
  if (fs.statSync(filePath).isDirectory()) return false;
  const ext = path.extname(filePath).slice(1).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function serveSpaShell(res) {
  const fallback = path.join(ROOT, "index.html");
  if (fs.existsSync(fallback)) {
    res.writeHead(200, { "Content-Type": MIME.html });
    fs.createReadStream(fallback).pipe(res);
    return true;
  }
  res.writeHead(404);
  res.end("Not found");
  return false;
}

const certOpts = {
  key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
};

https
  .createServer(certOpts, (req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    const ua = req.headers["user-agent"] || "";
    const suffix = getDeviceSuffix(ua);

    // 1. Exact file match first: /site.config.js, /manifest.json, etc.
    // This handles root-level JS/JSON files that shouldn't hit SPA fallback.
    if (/\.(js|css|json|xml|txt|svg|ico|woff2?|ttf|otf|eot|map)$/i.test(urlPath)) {
      const filePath = path.join(ROOT, urlPath);
      if (serveFile(filePath, res)) return;
    }

    // 2. Static assets: /assets/*, /fonts/*, /robots.txt, favicon, etc.
    if (/^\/(assets|fonts|robots\.txt|favicon|sitemap)/.test(urlPath)) {
      const filePath = path.join(ROOT, urlPath);
      if (serveFile(filePath, res)) return;
    }

    // 2. SSG device file: /products/coffee/index-pc.html → dist/pages/products/coffee/index-pc.html
    const deviceFileMatch = urlPath.match(/^(.+)\/index-(pc|tablet|mobile)\.html$/);
    if (deviceFileMatch) {
      const dirPath = deviceFileMatch[1].replace(/^\/pages\//, "");
      const pagePath = path.join(PAGES, dirPath, "index-" + deviceFileMatch[2] + ".html");
      if (serveFile(pagePath, res)) return;
    }

    // 3. SSG directory route: /products/coffee/ → dist/pages/products/coffee/index-{device}.html
    if (urlPath.endsWith("/") || urlPath === "/") {
      const cleanPath = urlPath.replace(/\/+$/, "") || "/home";
      // Try with device suffix first, then fallback chain
      const candidates = [
        path.join(PAGES, cleanPath, suffix),
        path.join(PAGES, cleanPath, "index-pc.html"),
        path.join(PAGES, cleanPath, "index.html"),
      ];
      for (const fp of candidates) {
        if (serveFile(fp, res)) return;
      }
      // Also try direct path (for / root)
      const rootIdx = path.join(ROOT, cleanPath, "index.html");
      if (serveFile(rootIdx, res)) return;

      // Redirect known collection pages to their first sub-page
      const collectionRedirects = {
        "/solutions": "/solutions/oem/",
      };
      if (collectionRedirects[cleanPath]) {
        res.writeHead(301, { Location: collectionRedirects[cleanPath] });
        res.end();
        return;
      }
    }

    // 4. /pages/* prefix passthrough (direct access to SSG files)
    if (urlPath.startsWith("/pages/")) {
      const filePath = path.join(ROOT, urlPath);
      if (serveFile(filePath, res)) return;
    }

    // 5. SPA fallback — 返回 SPA shell (dist/index.html) 让前端路由决定显示什么
    serveSpaShell(res);
  })
  .listen(PORT, () => {
    console.log(`🔒 HTTPS server running at https://localhost:${PORT}`);
    console.log(`   Serving ${ROOT}`);
    console.log(`   SSG pages from ${PAGES}`);
  });
