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

function serveFile(fp, res, req) {
  if (fs.existsSync(fp)) {
    res.send(fs.readFileSync(fp, 'utf8').replace(/%DOMAIN%/g, 'https://192.168.3.181:' + PORT));
  } else {
    res.send(SPA_HTML);
  }
}

// Trailing slash: /solutions/oem → 301 /solutions/oem/
app.use(function(req, res, next) {
  if (req.path === '/' || req.path.endsWith('/')) return next();
  var dirPath = path.join(DIST, 'pages', req.path);
  try {
    if (require('fs').statSync(dirPath).isDirectory()) {
      return res.redirect(301, req.path + '/' + (req.url.slice(req.path.length) || ''));
    }
  } catch(e) {}
  next();
});

// Route 1: 通用 SSG 目录路由 — /manufacturing/ → dist/pages/manufacturing/index-pc.html
app.get(/^\/([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]+)*)\/$/, function(req, res) {
  var suff = getSuffix(req);
  var fp = path.join(DIST, 'pages', req.params[0], 'index-' + suff);
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', req.params[0], 'index-pc.html');
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', req.params[0], 'index.html');
  serveFile(fp, res, req);
});

// Route 2: index-{device}.html 设备特定文件路由
// /manufacturing/index-pc.html → dist/pages/manufacturing/index-pc.html
// 解决 SPA/SWUP 生成的 index-{device}.html 直接访问问题
app.get(/^\/([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]+)*)\/index-(pc|tablet|mobile)\.html$/, function(req, res) {
  var fp = path.join(DIST, 'pages', req.params[0], 'index-' + req.params[1] + '.html');
  serveFile(fp, res, req);
});

// Route 3: flat-file 模式 — /news/detail/ → dist/pages/news/detail-pc.html
app.get(/^\/([a-z][a-z0-9-]+)\/([a-z][a-z0-9-]+)\/$/, function(req, res) {
  var suff = getSuffix(req);
  var fp = path.join(DIST, 'pages', req.params[0], req.params[1] + '-' + suff);
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', req.params[0], req.params[1] + '-pc.html');
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', req.params[0], req.params[1] + '.html');
  serveFile(fp, res, req);
});

// Route 4: flat-file device 路径 — /news/detail-pc.html → dist/pages/news/detail-pc.html
app.get(/^\/([a-z][a-z0-9-]+)\/([a-z][a-z0-9-]+)-(pc|tablet|mobile)\.html$/, function(req, res) {
  var fp = path.join(DIST, 'pages', req.params[0], req.params[1] + '-' + req.params[2] + '.html');
  serveFile(fp, res, req);
});

// Route 5: 静态资源
app.use(express.static(DIST, { maxAge: '1h' }));

// Route 6: SPA fallback（仅无扩展名路径）
app.use(function(req, res) {
  if (req.path.indexOf('.') === -1) {
    res.send(SPA_HTML);
  } else {
    res.status(404).send('Not found');
  }
});

https.createServer({
  key: fs.readFileSync('./server-key.pem'),
  cert: fs.readFileSync('./server.pem'),
}).on('request', app).listen(PORT, '0.0.0.0', function() {
  process.stdout.write('BREW_HTTPS ' + PORT + '\n');
});
