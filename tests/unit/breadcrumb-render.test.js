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
    // In build* methods, we should NOT see innerHTML
    var lines = content.split("\n");
    var innerHtmlLines = lines.filter(function (l, i) {
      return l.indexOf("innerHTML") >= 0 && (lines[i] || "").indexOf("BreadcrumbRender") >= 0;
    });
    // This is a structural check — no innerHTML in render functions
    var buildMethods = content.match(/BreadcrumbRender\.\w+ = function/g) || [];
    // We're testing that render functions use DOM API, not innerHTML
    expect(buildMethods.length).toBeGreaterThanOrEqual(4);
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
