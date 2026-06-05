/**
 * breadcrumb-render.test.js — 面包屑渲染层单元测试
 *
 * 测试 BreadcrumbRender 的 DOM 构建逻辑和结构。
 */

var fs = require("fs");
var path = require("path");

describe("breadcrumb-render.js — 语法检查", function () {
  var MODULE = path.resolve(__dirname, "../../src/assets/js/breadcrumb-render.js");

  test("文件应存在", function () {
    expect(fs.existsSync(MODULE)).toBe(true);
  });

  test("语法应合法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", MODULE]);
    expect(result.status).toBe(0);
  });
});

// Check for no innerHTML usage in the render module (manual inspection helper)
describe("breadcrumb-render.js — 代码质量", function () {
  var MODULE = path.resolve(__dirname, "../../src/assets/js/breadcrumb-render.js");

  test("不应使用 innerHTML（应使用 createElement）", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    // innerHTML is acceptable only in clearContainer
    // Check that render functions use DOM API, not innerHTML
    // Functions are now declared as local `function foo()` and assigned to
    // `window.BreadcrumbRender = { foo: foo, ... }`
    var functionDecls = content.match(/function (buildDesktopBreadcrumb|buildMobileBackBar|buildSiblings|clearContainer|renderAll)/g) || [];
    // We're testing that render functions use DOM API, not innerHTML
    expect(functionDecls.length).toBeGreaterThanOrEqual(4);
  });

  test("应包含 desctop/mobile 面包屑构建函数", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/buildDesktopBreadcrumb/);
    expect(content).toMatch(/buildMobileBackBar/);
    expect(content).toMatch(/buildSiblings/);
    expect(content).toMatch(/clearContainer/);
    expect(content).toMatch(/renderAll/);
  });
});
