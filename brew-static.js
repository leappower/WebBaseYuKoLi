const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const PORT = 3097;
const DIST = path.join(__dirname, 'dist');
const SPA_HTML = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

// 纯静态：先静态文件，SSG 目录页，SPA fallback
app.use(express.static(DIST, { maxAge: '1h' }));

// SSG 目录路由
app.get(/^\/([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]+)*)\/$/, function(req, res) {
  var rp = req.params[0];
  var ua = (req.headers['user-agent'] || '').toLowerCase();
  var suff = /mobile|android|iphone/.test(ua) && !/tablet|ipad/.test(ua) ? 'index-mobile.html'
           : /tablet|ipad/.test(ua) ? 'index-tablet.html' : 'index-pc.html';
  var fp = path.join(DIST, 'pages', rp, 'index-' + suff);
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', rp, 'index-pc.html');
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'pages', rp, 'index.html');
  if (fs.existsSync(fp)) {
    res.send(fs.readFileSync(fp, 'utf8').replace(/%DOMAIN%/g, 'https://192.168.3.181:' + PORT));
  } else {
    res.send(SPA_HTML);
  }
});

// index-{device}.html 直接路径
app.get(/^\/([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]+)*)\/index-(pc|tablet|mobile)\.html$/, function(req, res) {
  var fp = path.join(DIST, 'pages', req.params[0], 'index-' + req.params[1] + '.html');
  if (fs.existsSync(fp)) {
    res.send(fs.readFileSync(fp, 'utf8').replace(/%DOMAIN%/g, 'https://192.168.3.181:' + PORT));
  } else {
    res.send(SPA_HTML);
  }
});

app.use(function(req, res) { res.send(SPA_HTML); });

https.createServer({
  key: fs.readFileSync('./server-key.pem'),
  cert: fs.readFileSync('./server.pem'),
}).on('request', app).listen(PORT, '0.0.0.0', function() {
  process.stdout.write('STATIC ' + PORT + '\n');
});
