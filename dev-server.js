#!/usr/bin/env node
// Dev server — HTTP on 3000, HTTPS on 3443
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');

var PORT = process.env.PORT || 3000;
var SSL_PORT = 3443;
var ROOT = path.join(__dirname, 'dist');

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

    // ─── API mock endpoints ──────────────────────────────
    if (p === '/api/public/products-data') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(PRODUCT_DATA));
      return;
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

http.createServer(handler).listen(PORT);

var sslOpts;
try {
  sslOpts = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost.pem')),
  };
  https.createServer(sslOpts, handler).listen(SSL_PORT);
  console.log('🔒 https://localhost:' + SSL_PORT);
} catch (e) {
  console.log('⚠ No SSL certs found, HTTPS not started');
}

console.log('🌐 http://localhost:' + PORT);
console.log('📁 Serving ' + ROOT);
