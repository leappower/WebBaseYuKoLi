#!/usr/bin/env node
// Dev server — HTTP on 3000, HTTPS on 3443
var http = require('http');
var https = require('https');
var http_or_https = require('http');
var fs = require('fs');
var path = require('path');

var PORT = process.env.PORT || 3000;
var SSL_PORT = 3443;
var ROOT = path.join(__dirname, 'dist');

// Google Apps Script endpoint — set via GOOGLE_FORM_URL env or .env
var GOOGLE_FORM_URL = process.env.GOOGLE_FORM_URL || '';

// .env loader
var envFile = path.join(__dirname, '.env');
try {
  if (fs.existsSync(envFile)) {
    var envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(function(line) {
      var match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        if (match[1] === 'GOOGLE_FORM_URL') GOOGLE_FORM_URL = process.env[match[1]];
      }
    });
  }
} catch(e) {}

// Load product data from embedded static JS for API mock
var PRODUCT_DATA;
try {
  var window = {};
  eval(fs.readFileSync(path.join(ROOT, 'assets/js/product-data-table.js'), 'utf8').replace('"use strict";', ''));
  PRODUCT_DATA = window.PRODUCT_DATA_TABLE || [];
} catch (e) {
  PRODUCT_DATA = [];
}

var MIME = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  ico: 'image/x-icon',
  xml: 'application/xml',
  txt: 'text/plain; charset=utf-8',
  mp4: 'video/mp4',
  webm: 'video/webm',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  pdf: 'application/pdf',
};

function handler(req, res) {
  try {
    var p = req.url.split('?')[0].split('#')[0];

    // ─── Quote Submission API (proxies to Google Apps Script) ──
    if (p === '/api/quote-submit' && req.method === 'POST') {
      if (!GOOGLE_FORM_URL) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Quote service not configured' }));
        return;
      }
      var body = '';
      req.on('data', function(chunk) { body += chunk; });
      req.on('end', function() {
        var opts = require('url').parse(GOOGLE_FORM_URL);
        opts.method = 'POST';
        opts.headers = { 'Content-Type': 'text/plain;charset=utf-8', 'Content-Length': Buffer.byteLength(body) };
        var proto = opts.protocol === 'https:' ? https : http_or_https;
        var proxyReq = proto.request(opts, function(proxyRes) {
          var data = '';
          proxyRes.on('data', function(c) { data += c; });
          proxyRes.on('end', function() {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });
        proxyReq.on('error', function(err) {
          console.error('[dev-server] quote-submit proxy error:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to submit' }));
        });
        proxyReq.write(body);
        proxyReq.end();
      });
      return;
    }

    // ─── API mock endpoints ──────────────────────────────
    if (p === '/api/public/products-data') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(PRODUCT_DATA));
      return;
    }

    // ─── Dev mode: serve i18n language JSON directly from src/ (hot reload) ──
    if (p.startsWith('/assets/lang/') && p.endsWith('.json')) {
      var srcLangDir = path.join(__dirname, 'src/assets/lang');
      var langFile = path.basename(p);
      var srcPath = path.join(srcLangDir, langFile);
      if (fs.existsSync(srcPath)) {
        var ext = 'json';
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        fs.createReadStream(srcPath).pipe(res);
        return;
        return;
      }
    }

    // ─── Static file serving ─────────────────────────────
    var fp = path.join(ROOT, p);

    if (!fs.existsSync(fp)) {
      // API routes should 404, not fallback to SPA shell
      if (p.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found in dev mode' }));
        return;
      }
      // SPA fallback for HTML routes
      fp = path.join(ROOT, 'index.html');
    }

    var stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      var idx = path.join(fp, 'index.html');
      if (fs.existsSync(idx)) { fp = idx; }
      else { fp = path.join(ROOT, 'index.html'); }
    }

    var ext = path.extname(fp).slice(1).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  } catch (e) {
    res.writeHead(500);
    res.end('Internal error');
  }
}

http.createServer(handler).listen(PORT, '0.0.0.0');

var sslOpts;
try {
  sslOpts = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost.pem')),
  };
  https.createServer(sslOpts, handler).listen(SSL_PORT, '0.0.0.0');
  console.log('🔒 https://0.0.0.0:' + SSL_PORT);
} catch (e) {
  console.log('⚠ No SSL certs found, HTTPS not started');
}

console.log('🌐 http://0.0.0.0:' + PORT);
console.log('📁 Serving ' + ROOT);
