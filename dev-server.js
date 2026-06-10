#!/usr/bin/env node
/**
 * BrewYuKoLi 开发服务器
 * - URL 保持干净（/products/coffee/），不暴露 index-pc/mobile/tablet
 * - 根据设备 UA 返回对应设备文件
 * - 支持 SPA fallback（未匹配路径 → index.html）
 * - 用法: node dev-server.js [port]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const PORT = parseInt(process.argv[2] || '8765', 10);

// 设备检测（与前端 routeToFetchUrl 对齐）
function getDeviceSuffix(ua) {
  if (!ua) return 'index-pc.html';
  const lower = ua.toLowerCase();
  const mobile = /mobile|android|iphone|ipod/i.test(lower) && !/ipad|tablet|silk/i.test(lower);
  const tablet = /ipad|tablet|silk/i.test(lower) || (/android/i.test(lower) && !/mobile/i.test(lower));
  if (mobile) return 'index-mobile.html';
  if (tablet) return 'index-tablet.html';
  return 'index-pc.html';
}

// 路由映射（与前端 routeToFetchUrl 对齐）
function routeToFilePath(urlPath) {
  let p = urlPath.replace(/\/+$/, '') || '/home';
  if (p === '/') p = '/home';

  // /home/ → /home/index-*.html
  if (p === '/home') return { dir: '/home', suffix: true };
  // /products/coffee/ → /products/coffee/index-*.html
  if (/^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)$/.test(p))
    return { dir: p, suffix: true };
  // /pdp/ → /pdp/index-*.html (PDP 模板)
  if (/^\/products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(p))
    return { dir: '/pdp', suffix: true };
  // /cases/<slug>/ → /cases/detail/index-*.html?slug=xxx (需要 query string，这里只返回文件)
  const caseMatch = p.match(/^\/cases\/([a-z0-9-]+)$/);
  if (caseMatch) return { dir: '/cases/detail', suffix: true, query: 'slug=' + caseMatch[1] };
  // 旧路由: /coffee/ → /products/coffee/
  const oldRoute = p.match(/^\/(coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)$/);
  if (oldRoute) return { dir: '/products/' + oldRoute[1], suffix: true };
  // 通用: /solutions/oem/ → /solutions/oem/
  if (/^\/solutions\/(oem|odm|obm|rd|packaging)$/.test(p))
    return { dir: p, suffix: true };
  if (/^\/solutions$/.test(p)) return { dir: '/solutions', suffix: true };
  if (/^\/resources\/(catalog|videos|whitepapers)$/.test(p))
    return { dir: p, suffix: true };
  if (/^\/manufacturing$/.test(p)) return { dir: '/manufacturing', suffix: true };
  if (/^\/compliance$/.test(p)) return { dir: '/compliance', suffix: true };
  // 通用 fallback: 请求的路径
  return { dir: p, suffix: false };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.pdf': 'application/pdf', '.txt': 'text/plain',
};

function serveFile(res, filePath, status) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const data = fs.readFileSync(filePath);
    res.writeHead(status || 200, {
      'Content-Type': mime,
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(data);
  } catch (e) {
    serve404(res, filePath);
  }
}

function serve404(res, url) {
  const fp = path.join(DIST, '404.html');
  if (fs.existsSync(fp)) {
    serveFile(res, fp, 404);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1><p>' + url + '</p>');
  }
}

// 资源文件（静态）: 直接从 dist 返回
function serveStatic(res, urlPath) {
  // 安全检查
  const safe = path.join(DIST, urlPath).replace(/\/+/g, '/');
  if (!safe.startsWith(DIST)) { serve404(res, urlPath); return; }
  
  // 1. 尝试直接路径
  if (fs.existsSync(safe) && !fs.statSync(safe).isDirectory()) {
    serveFile(res, safe);
    return;
  }
  // 2. 目录 → index.html
  if (fs.existsSync(path.join(safe, 'index.html'))) {
    serveFile(res, path.join(safe, 'index.html'));
    return;
  }
  serve404(res, urlPath);
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, 'http://' + req.headers.host);
  const urlPath = decodeURIComponent(urlObj.pathname);

  // 静态资源（有扩展名且不是 .html）直接返回
  const ext = path.extname(urlPath).toLowerCase();
  if (ext && ext !== '.html') {
    serveStatic(res, urlPath);
    return;
  }

  // 无扩展名但有 query string 的静态资源请求（/assets/js/xxx?v=123）
  if (!ext && req.url.includes('?')) {
    serveStatic(res, urlPath);
    return;
  }

  // HTML 请求 → 路由映射 + 设备检测
  const route = routeToFilePath(urlPath);
  const ua = req.headers['user-agent'] || '';
  const deviceFile = route.suffix ? getDeviceSuffix(ua) : 'index-pc.html';
  const filePath = path.join(DIST, route.dir, deviceFile);

  // 带 query string 的 URL（如 /cases/detail/?slug=xxx）
  const queryString = route.query ? ('?' + route.query) : '';

  if (fs.existsSync(filePath)) {
    serveFile(res, filePath);
  } else {
    // fallback: dist/<path>/index.html（设备检测重定向由 index.html 内的 JS 处理）
    const fallback = path.join(DIST, route.dir, 'index.html');
    if (fs.existsSync(fallback)) {
      serveFile(res, fallback);
    } else {
      serve404(res, urlPath);
    }
  }
});

server.listen(PORT, () => {
  console.log(`🚀 BrewYuKoLi dev server at http://localhost:${PORT}`);
  console.log(`   URL 保持干净，设备检测服务端处理`);
});
