#!/usr/bin/env node
// Simple HTTPS dev server for dist/
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3443;
const ROOT = path.join(__dirname, 'dist');

const MIME = {
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

const certOpts = {
  key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'localhost.pem')),
};

https.createServer(certOpts, (req, res) => {
  // Strip query string for file lookup
  const urlPath = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(ROOT, urlPath);

  // Directory → try index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const idx = path.join(filePath, 'index.html');
    if (fs.existsSync(idx)) filePath = idx;
  }

  // SPA fallback: if file not found, serve index.html
  if (!fs.existsSync(filePath)) {
    const fallback = path.join(ROOT, 'index.html');
    if (fs.existsSync(fallback)) {
      res.writeHead(200, { 'Content-Type': MIME.html });
      res.end(fs.readFileSync(fallback));
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  if (fs.statSync(filePath).isDirectory()) {
    const fallback = path.join(ROOT, 'index.html');
    if (fs.existsSync(fallback)) {
      res.writeHead(200, { 'Content-Type': MIME.html });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`🔒 HTTPS server running at https://localhost:${PORT}`);
  console.log(`   Serving ${ROOT}`);
});
