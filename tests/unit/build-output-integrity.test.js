/**
 * build-output-integrity.test.js — 验证构建产物完整性
 *
 * 确保 build.sh 构建后 dist/ 中包含所有必须的生产文件。
 * 这些文件在 GitHub Pages 静态部署和 Express 服务器中都必不可少。
 */

var fs = require("fs");
var path = require("path");

var DIST = path.resolve(__dirname, "../../dist");

/**
 * 必须的构建产物清单
 * 每项缺失都会导致站点功能异常（白屏/404/域名失效）
 */
var MANDATORY_FILES = [
  { path: "site.config.js",        desc: "站点配置 — navigator/footer 数据源" },
  { path: "sw.js",                 desc: "Service Worker — 离线缓存/版本更新" },
  { path: "CNAME",                 desc: "GitHub Pages 自定义域名" },
  { path: "404.html",              desc: "GitHub Pages 404 错误页" },
  { path: ".nojekyll",             desc: "禁用 GitHub Pages Jekyll 处理", emptyOk: true },
  { path: "VERSION.txt",           desc: "构建版本标识" },
  { path: "index.html",            desc: "SPA Shell — 入口页面" },
];

/**
 * SSG 生成的路由入口文件 (每路由三屏)
 */
// 从 build-ssg.js 的 ROUTES 读取实际存在的路由
var SSG_ROUTES = (function() {
  var ssgPath = path.resolve(__dirname, "../../scripts/build-ssg.js");
  if (!fs.existsSync(ssgPath)) return [];
  var ssgSrc = fs.readFileSync(ssgPath, "utf-8");
  var m = ssgSrc.match(/var ROUTES = \[([\s\S]*?)\];/);
  if (!m) return [];
  var slugs = [];
  m[1].split('\n').forEach(function(line) {
    var sm = line.match(/slug:\s*'([^']+)'/);
    if (sm) slugs.push(sm[1]);
  });
  return slugs.map(function(s) { return s + "/index-pc.html"; });
})();

/**
 * 必须的 JS 资源
 */
var CORE_SCRIPTS = [
  "assets/js/swup-init.js",
  "assets/js/lang-registry.js",
  "assets/js/translations.js",
  "assets/js/ui/navigator.js",
  "assets/js/ui/footer.js",
  "assets/js/vendor/swup.umd.js",
  "assets/js/ui/mega-menu.js",
];

describe("build-output-integrity — 构建产物完整性", function () {

  beforeAll(function () {
    // 未构建时跳过（pre-push 在测试前构建，人工跑 test 可能无 dist）
    if (!fs.existsSync(DIST)) {
      console.warn("  ⚠️  dist/ not found — tests will fail as designed");
    }
  });

  describe("必须文件清单", function () {

    MANDATORY_FILES.forEach(function (item) {
      test(item.desc + " — " + item.path, function () {
        var fp = path.join(DIST, item.path);
        expect(fs.existsSync(fp)).toBe(true);
        var stat = fs.statSync(fp);
        expect(stat.isFile()).toBe(true);
        if (item.emptyOk) { expect(stat.size).not.toBeLessThan(0); }
        else { expect(stat.size).toBeGreaterThan(0); }
      });
    });

  });

  describe("SSG 路由入口", function () {
    SSG_ROUTES.forEach(function (route) {
      test("SSG 页面应存在: " + route, function () {
        var fp = path.join(DIST, route);
        expect(fs.existsSync(fp)).toBe(true);
        var content = fs.readFileSync(fp, "utf-8");
        expect(content).toMatch(/^<!doctype html>/i);
      });
    });

  });

  describe("核心 JS 文件", function () {

    CORE_SCRIPTS.forEach(function (script) {
      test("核心脚本应存在: " + script, function () {
        var fp = path.join(DIST, script);
        expect(fs.existsSync(fp)).toBe(true);
        expect(fs.statSync(fp).size).toBeGreaterThan(100);
      });
    });

  });

  describe("404 页面结构", function () {

    test("dist/404.html 应为合法 HTML (SSG 生成精简版)", function () {
      var fp = path.join(DIST, "404.html");
      var content = fs.readFileSync(fp, "utf-8");
      expect(content).toMatch(/^<!DOCTYPE html>/i);
      expect(content).toMatch(/<script>[\s\S]*<\/script>/);
    });

    test("src/404.html 应包含 navigator 和 footer 占位符", function () {
      var src404 = path.resolve(__dirname, "../../src/404.html");
      if (fs.existsSync(src404)) {
        var srcContent = fs.readFileSync(src404, "utf-8");
        expect(srcContent).toMatch(/data-component="navigator"/);
        expect(srcContent).toMatch(/data-component="footer"/);
      }
    });

    test("404.html 不应有重复的 html/body 标签", function () {
      var fp = path.join(DIST, "404.html");
      var content = fs.readFileSync(fp, "utf-8");
      var htmlTags = content.match(/<html/gi);
      expect(htmlTags ? htmlTags.length : 0).toBe(1);
      var bodyTags = content.match(/<body/gi);
      expect(bodyTags ? bodyTags.length : 0).toBe(1);
    });

  });

  describe("sitemap.xml", function () {

    test("sitemap.xml 应存在且包含至少一条 URL", function () {
      var fp = path.join(DIST, "sitemap.xml");
      expect(fs.existsSync(fp)).toBe(true);
      var content = fs.readFileSync(fp, "utf-8");
      expect(content).toContain("<url>");
      expect(content).toContain("<loc>");
    });

  });

});
