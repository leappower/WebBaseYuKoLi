// SW_VERSION 由 build.sh 在 production 构建时自动注入（毫秒时间戳）
// dev 模式保留此默认值
var SW_VERSION = "v1-0-1";

self.addEventListener("install", function() {
  self.skipWaiting();
  self.CURRENT_CACHE_PREFIX = "scaffold-v" + SW_VERSION + "-";
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) {
        if (n.indexOf("scaffold-") === 0 && n.indexOf(self.CURRENT_CACHE_PREFIX) !== 0) {
          console.log("[SW] Deleting old cache:", n);
          return caches.delete(n);
        }
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function(e) {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
