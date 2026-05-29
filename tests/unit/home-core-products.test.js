/**
 * home-core-products.test.js — 首页核心产品模块验证
 */

var fs = require("fs");
var path = require("path");

var MODULE = path.resolve(__dirname, "../../src/assets/js/home-core-products.js");

describe("home-core-products.js — 首页核心产品", function () {

  test("文件应存在", function () {
    expect(fs.existsSync(MODULE)).toBe(true);
  });

  test("语法应合法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", MODULE]);
    expect(result.status).toBe(0);
  });

  test("应导出 HomeCoreProducts 对象", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/HomeCoreProducts/);
  });

  test("应包含 loadCoreProducts 方法", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/loadCoreProducts/);
  });

  test("应引用 PRODUCT_DATA_TABLE 作为数据源", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/PRODUCT_DATA_TABLE/);
  });

  test("应包含三屏渲染函数 (PC/Tablet/Mobile)", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/renderHomeCorePC/);
    expect(content).toMatch(/renderHomeCoreTablet/);
    expect(content).toMatch(/renderHomeCoreMobile/);
  });

});
