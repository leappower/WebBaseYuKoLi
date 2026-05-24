const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const PORT = 3098;
const DIST = path.join(__dirname, 'dist');
const SPA_HTML = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

function getSuffix(req) {
  var ua = (req.headers['user-agent'] || '').toLowerCase();
  if (/mobile|android|iphone/.test(ua) && !/tablet|ipad/.test(ua)) return 'index-mobile.html';
  if (/tablet|ipad/.test(ua)) return 'index-tablet.html';
  return 'index-pc.html';
}

function serveFile(fp, res) {
  if (fs.existsSync(fp)) {
    res.send(fs.readFileSync(fp, 'utf8').replace(/%DOMAIN%/g, 'https://192.168.3.181:' + PORT));
  } else {
    res.send(SPA_HTML);
  }
}

// ─────────────────────────────────────────────────────────────
// Middleware A: Trailing slash redirect — /products → /products/
// ─────────────────────────────────────────────────────────────
app.use(function(req, res, next) {
  if (req.path === '/' || req.path.endsWith('/')) return next();
  // Check if this path is a SSG page directory under dist/pages/
  var dirPath = path.join(DIST, 'pages', req.path);
  try {
    if (fs.statSync(dirPath).isDirectory()) {
      return res.redirect(301, req.path + '/' + (req.url.slice(req.path.length) || ''));
    }
  } catch(e) {}
  // Also check if it's a top-level flat-file page
  // e.g. /news → need to check if dist/pages/news exists
  next();
});

// ─────────────────────────────────────────────────────────────
// Middleware B: index-{device}.html → 301 clean directory URL
// /products/tea/index-pc.html  → 301 /products/tea/
// /about/index-mobile.html    → 301 /about/
// /solutions/oem/index-tablet.html → 301 /solutions/oem/
// ─────────────────────────────────────────────────────────────
app.use(function(req, res, next) {
  var p = req.path;
  var m = p.match(/^\/(.+)index-(pc|tablet|mobile)\.html$/);
  if (m) {
    return res.redirect(301, '/' + m[1].replace(/\/+$/, '') + '/');
  }
  next();
});

// ─────────────────────────────────────────────────────────────
// Middleware C: flat-file device HTML → 301 clean URL
// /news/detail-pc.html → 301 /news/detail/
// ─────────────────────────────────────────────────────────────
app.use(function(req, res, next) {
  var p = req.path;
  var m = p.match(/^\/([a-z][a-z0-9-]+)\/([a-z][a-z0-9-]+)-(pc|tablet|mobile)\.html$/);
  if (m) {
    return res.redirect(301, '/' + m[1] + '/' + m[2] + '/');
  }
  next();
});

// ─────────────────────────────────────────────────────────────
// Route 1: SSG 目录 — /manufacturing/ → dist/pages/manufacturing/index-pc.html
// 匹配所有 /{path}/ 格式的 URL
// ─────────────────────────────────────────────────────────────
app.get(/^\/([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]+)*)\/$/, function(req, res) {
  var suffix = getSuffix(req);
  var fp = path.join(DIST, 'pages', req.params[0], 'index-' + suffix);
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', req.params[0], 'index-pc.html');
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', req.params[0], 'index.html');
  serveFile(fp, res);
});

// ─────────────────────────────────────────────────────────────
// Route 2: flat-file 模式 — /news/detail/ → dist/pages/news/detail-pc.html
// 覆盖 Route 1 不能处理的 single-level flat-file
// 只有当路径不是目录时才触发
// ─────────────────────────────────────────────────────────────
app.get(/^\/([a-z][a-z0-9-]+)\/([a-z][a-z0-9-]+)\/$/, function(req, res) {
  var suffix = getSuffix(req);
  var base = path.join(DIST, 'pages', req.params[0]);
  // Check if this is a directory-based page first
  var dirPage = path.join(base, req.params[1], 'index-' + suffix);
  if (fs.existsSync(dirPage)) {
    // Directory-based — Route 1 already handles this, shouldn't reach here
    serveFile(dirPage, res);
    return;
  }
  // Flat-file fallback
  var fp = path.join(base, req.params[1] + '-' + suffix);
  if (!fs.existsSync(fp)) fp = path.join(base, req.params[1] + '-pc.html');
  if (!fs.existsSync(fp)) fp = path.join(base, req.params[1] + '.html');
  serveFile(fp, res);
});

// ─────────────────────────────────────────────────────────────
// Route 3: 静态资源
// ─────────────────────────────────────────────────────────────
app.use(express.static(DIST, { maxAge: '1h' }));

// ─────────────────────────────────────────────────────────────
// Route 4: SPA fallback — 仅无扩展名路径
// ─────────────────────────────────────────────────────────────
app.use(function(req, res) {
  if (req.path.indexOf('.') === -1) {
    res.send(SPA_HTML);
  } else {
    res.status(404).send('Not found');
  }
});

// ─────────────────────────────────────────────────────────────
// Start HTTPS server
// ─────────────────────────────────────────────────────────────
https.createServer({
  key: fs.readFileSync('./server-key.pem'),
  cert: fs.readFileSync('./server.pem'),
}).on('request', app).listen(PORT, '0.0.0.0', function() {
  process.stdout.write('BREW_HTTPS ' + PORT + '\n');
});
