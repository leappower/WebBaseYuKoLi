/**
 * product-detail.test.js — 产品详情模块基础验证
 *
 * 测试 dev 业务独有的 product-detail.js 的关键路径：
 */

var fs = require("fs");
var path = require("path");

var MODULE = path.resolve(__dirname, "../../src/assets/js/product-detail.js");

describe("product-detail.js — 产品详情模块", function () {

  test("文件应存在", function () {
    expect(fs.existsSync(MODULE)).toBe(true);
  });

  test("语法应合法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", MODULE]);
    expect(result.status).toBe(0);
  });

  test("应包含 renderPDP 函数", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/function renderPDP/);
  });

  test("应引用 CATEGORY_SLUG", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/CATEGORY_SLUG/);
  });

  test("应引用 PRODUCT_DATA_TABLE", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/PRODUCT_DATA_TABLE/);
  });

  test("应引用 getProductField 作为 i18n 翻译帮助函数", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/getProductField/);
  });

  test("应包含 breadcrumb 相关逻辑", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/breadcrumb/);
  });

});
