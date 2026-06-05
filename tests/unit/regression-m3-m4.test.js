/**
 * regression-m3-m4.test.js — M3+M4 回归测试
 *
 * JJC-020 T5c: 验证 M3（lib/ 模块目录 + breadcrumb ESM）和 M4（ui-bundle 拆分 ESM）
 * 的修改不破坏现有功能。
 *
 * 测试范围：
 *   1. webpack publicPath 注入正确
 *   2. lib/ 模块可独立加载（语法正确、IIFE 注册、函数存在）
 *   3. ui/ 组件可独立加载（语法正确、IIFE 注册、API 存在）
 *   4. breadcrumb ESM 模块正确导出
 *   5. template-constants 函数正确返回
 */

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var SRC_JS = path.resolve(__dirname, "../../src/assets/js");

// ═══════════════════════════════════════════════════════════════════
// 全局沙箱构建器
// ═══════════════════════════════════════════════════════════════════

function createSandbox() {
  var win = { location: { pathname: "/", href: "http://localhost/" } };
  win.addEventListener = function () {};
  win.removeEventListener = function () {};

  var doc = {
    addEventListener: function () {},
    removeEventListener: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return {}; },
  };

  return {
    window: win,
    document: doc,
    AbortController: function () {
      this.signal = { aborted: false, addEventListener: function () {} };
      this.abort = function () {};
    },
    location: { pathname: "/", href: "http://localhost/" },
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    navigator: { userAgent: "node" },
  };
}

// 加载 breadcrumb.js 及其依赖（runtime-guard, breadcrumb-data, breadcrumb-render）
function createSandboxForBreadcrumb() {
  var sb = createSandbox();

  var deps = [
    "lib/runtime-guard.js",
    "breadcrumb-data.js",
    "breadcrumb-render.js",
  ];

  deps.forEach(function (rel) {
    var fp = path.join(SRC_JS, rel);
    var code = fs.readFileSync(fp, "utf-8");
    vm.runInNewContext(code, sb, { filename: fp });
  });

  return sb;
}

// ═══════════════════════════════════════════════════════════════════
// 1. webpack publicPath 注入
// ═══════════════════════════════════════════════════════════════════

describe("M3+M4 回归: webpack publicPath 注入", function () {

  test("webpack.config.js 应使用动态 publicPath（BASE_PATH env var 或 '/'）", function () {
    var wpPath = path.resolve(__dirname, "../../webpack.config.js");
    var content = fs.readFileSync(wpPath, "utf-8");
    expect(content).toMatch(/process\.env\.BASE_PATH/);
    expect(content).toMatch(/publicPath:?\s*publicPath/);
  });

  test("DefinePlugin 应注入 window.BASE_PATH", function () {
    var wpPath = path.resolve(__dirname, "../../webpack.config.js");
    var content = fs.readFileSync(wpPath, "utf-8");
    expect(content).toMatch(/DefinePlugin/);
    expect(content).toMatch(/window\.BASE_PATH/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. lib/ 模块独立加载
// ═══════════════════════════════════════════════════════════════════

var LIB_MODULES = [
  { name: "runtime-guard",       file: "lib/runtime-guard.js",       expectGlobal: "__safe",           isEsm: false },
  { name: "i18n-core",           file: "lib/i18n-core.js",           expectGlobal: "i18n",             isEsm: false },
  { name: "dom-utils",           file: "lib/dom-utils.js",           expectGlobal: null,               isEsm: true  },
  { name: "format-utils",        file: "lib/format-utils.js",        expectGlobal: null,               isEsm: true  },
  { name: "async-utils",         file: "lib/async-utils.js",         expectGlobal: null,               isEsm: true  },
  { name: "template-constants",  file: "lib/template-constants.js",  expectGlobal: "TemplateConstants", isEsm: false },
];

describe("M3+M4 回归: lib/ 模块可独立加载", function () {

  LIB_MODULES.forEach(function (mod) {
    describe("lib/" + mod.name + ".js", function () {

      var filePath = path.join(SRC_JS, mod.file);

      test("文件应存在", function () {
        expect(fs.existsSync(filePath)).toBe(true);
      });

      test("语法应合法", function () {
        var cp = require("child_process");
        var result = cp.spawnSync("node", ["--check", filePath]);
        expect(result.status).toBe(0);
      });

      if (!mod.isEsm) {
        test("IIFE 执行后应在 window 上注册全局 API: " + mod.expectGlobal, function () {
          var sandbox = createSandbox();
          var code = fs.readFileSync(filePath, "utf-8");
          vm.runInNewContext(code, sandbox, { filename: filePath });
          expect(sandbox.window[mod.expectGlobal]).toBeDefined();
        });
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. ui/ 组件独立加载
// ═══════════════════════════════════════════════════════════════════

var UI_MODULES = fs.readdirSync(path.join(SRC_JS, "ui"))
  .filter(function (f) { return f.endsWith(".js") && !f.endsWith(".bak"); })
  .map(function (f) { return f.replace(/\.js$/, ""); });

describe("M3+M4 回归: ui/ 组件可独立加载", function () {

  UI_MODULES.forEach(function (name) {
    test("ui/" + name + ".js 语法正确", function () {
      var filePath = path.join(SRC_JS, "ui", name + ".js");
      expect(fs.existsSync(filePath)).toBe(true);
      var cp = require("child_process");
      var result = cp.spawnSync("node", ["--check", filePath]);
      expect(result.status).toBe(0);
    });
  });

  test("所有 ui/ 模块应在 webpack.config.js 中通过 buildUiEntries() 注册", function () {
    var wpContent = fs.readFileSync(
      path.resolve(__dirname, "../../webpack.config.js"),
      "utf-8"
    );
    expect(wpContent).toMatch(/buildUiEntries/);
    expect(wpContent).toMatch(/entries\[`assets\/js\/ui\/\$\{name\}`\]/);
    expect(wpContent).toMatch(/\.\.\.buildUiEntries\(\)/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. breadcrumb ESM 模块正确导出
// ═══════════════════════════════════════════════════════════════════

var BREADCRUMB_MODULES = [
  { name: "breadcrumb-data",   file: "breadcrumb-data.js",   expectGlobal: "BreadcrumbData" },
  { name: "breadcrumb-render", file: "breadcrumb-render.js", expectGlobal: "BreadcrumbRender" },
  { name: "breadcrumb",        file: "breadcrumb.js",        expectGlobal: "Breadcrumb" },
];

describe("M3+M4 回归: breadcrumb ESM 模块正确导出", function () {

  BREADCRUMB_MODULES.forEach(function (mod) {
    describe(mod.name + ".js — 文件存在 & 语法检查", function () {
      var filePath = path.join(SRC_JS, mod.file);

      test("文件应存在", function () {
        expect(fs.existsSync(filePath)).toBe(true);
      });

      test("语法应合法", function () {
        var cp = require("child_process");
        var result = cp.spawnSync("node", ["--check", filePath]);
        expect(result.status).toBe(0);
      });
    });
  });

  test("breadcrumb-data.js 应通过 IIFE 注册到 window.BreadcrumbData", function () {
    var sandbox = createSandbox();
    var code = fs.readFileSync(path.join(SRC_JS, "breadcrumb-data.js"), "utf-8");
    vm.runInNewContext(code, sandbox, { filename: path.join(SRC_JS, "breadcrumb-data.js") });
    expect(sandbox.window.BreadcrumbData).toBeDefined();
  });

  test("breadcrumb-render.js 应通过 IIFE 注册到 window.BreadcrumbRender", function () {
    var sandbox = createSandbox();
    var code = fs.readFileSync(path.join(SRC_JS, "breadcrumb-render.js"), "utf-8");
    vm.runInNewContext(code, sandbox, { filename: path.join(SRC_JS, "breadcrumb-render.js") });
    expect(sandbox.window.BreadcrumbRender).toBeDefined();
  });

  test("breadcrumb.js 应通过 IIFE 注册到 window.Breadcrumb（依赖均已预加载）", function () {
    var sandbox = createSandboxForBreadcrumb();
    var code = fs.readFileSync(path.join(SRC_JS, "breadcrumb.js"), "utf-8");
    vm.runInNewContext(code, sandbox, { filename: path.join(SRC_JS, "breadcrumb.js") });
    expect(sandbox.window.Breadcrumb).toBeDefined();
  });

  test("breadcrumb ESM 模块应在 webpack.config.js 中注册为 entry 入口", function () {
    var wpContent = fs.readFileSync(
      path.resolve(__dirname, "../../webpack.config.js"),
      "utf-8"
    );
    expect(wpContent).toMatch(/breadcrumb-data/);
    expect(wpContent).toMatch(/breadcrumb-render/);
    expect(wpContent).toMatch(/'assets\/js\/breadcrumb'/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. template-constants 函数正确返回
// ═══════════════════════════════════════════════════════════════════

describe("M3+M4 回归: template-constants 函数正确返回", function () {

  var MODULE = path.join(SRC_JS, "lib/template-constants.js");

  function loadTC() {
    var sandbox = { window: {} };
    var code = fs.readFileSync(MODULE, "utf-8");
    vm.runInNewContext(code, sandbox, { filename: MODULE });
    return sandbox.window.TemplateConstants;
  }

  test("materialIcon 应返回带图标的 span", function () {
    var TC = loadTC();
    var result = TC.materialIcon("search");
    expect(result).toMatch(/^<span class="material-symbols-outlined/);
    expect(result).toContain("search");
    expect(result).toMatch(/<\/span>$/);
  });

  test("materialIcon 支持额外 class", function () {
    var TC = loadTC();
    var result = TC.materialIcon("close", "icon-lg");
    expect(result).toContain("material-symbols-outlined icon-lg");
  });

  test("chevronRight 应返回 chevron_right 图标", function () {
    var TC = loadTC();
    var result = TC.chevronRight("nav");
    expect(result).toContain("chevron_right");
    expect(result).toContain("nav-chevron");
  });

  test("chevronRight 无参数时使用默认 prefix 'chevron'", function () {
    var TC = loadTC();
    var result = TC.chevronRight();
    expect(result).toContain("chevron_right");
    expect(result).toContain('chevron">chevron_right');
  });

  test("expandArrow 应返回 expand_more 图标", function () {
    var TC = loadTC();
    var result = TC.expandArrow("nav");
    expect(result).toContain("expand_more");
    expect(result).toContain("nav-dropdown-arrow");
  });

  test("separator 应返回 div", function () {
    var TC = loadTC();
    var result = TC.separator("nav");
    expect(result).toBe('<div class="nav-separator"></div>');
  });

  test("popupHandle 应返回 div", function () {
    var TC = loadTC();
    var result = TC.popupHandle("cs");
    expect(result).toBe('<div class="cs-popup-handle"></div>');
  });

  test("dropdownIcon 应组合 wrapper + materialIcon", function () {
    var TC = loadTC();
    var result = TC.dropdownIcon("nav", "store");
    expect(result).toContain('class="nav-icon"');
    expect(result).toContain("store");
  });

  test("dropdownLabel 应包含 data-i18n 属性", function () {
    var TC = loadTC();
    var result = TC.dropdownLabel("nav", "nav_products", "Products");
    expect(result).toContain('data-i18n="nav_products"');
    expect(result).toContain("Products");
  });

  test("dropdownLabel 当 label 未传入时使用 key 作为 label", function () {
    var TC = loadTC();
    var result = TC.dropdownLabel("nav", "nav_products");
    expect(result).toContain("nav_products");
    expect(result).toContain('data-i18n="nav_products"');
  });

  test("popupSearchInput 应返回 input", function () {
    var TC = loadTC();
    var result = TC.popupSearchInput();
    expect(result).toContain('<input type="text"');
    expect(result).toContain('class="cs-popup-search"');
  });

  test("popupSearchIcon 应返回搜索图标", function () {
    var TC = loadTC();
    var result = TC.popupSearchIcon();
    expect(result).toContain("search");
    expect(result).toContain("cs-popup-search-icon");
  });

  test("ICONS 对象应包含所有预定义图标", function () {
    var TC = loadTC();
    expect(TC.ICONS.cancel).toBeDefined();
    expect(TC.ICONS.store).toBeDefined();
    expect(TC.ICONS.close).toBeDefined();
    expect(TC.ICONS.search).toBeDefined();
    expect(TC.ICONS.expandMore).toBeDefined();
    expect(TC.ICONS.chevronRight).toBeDefined();
    expect(TC.ICONS.checkCircle).toBeDefined();
    expect(TC.ICONS.cancel).toContain("cancel");
  });
});
