/**
 * product-grid.test.js — 产品网格模块基础验证
 *
 * 测试围绕 DEV 分支特有的 product-grid.js 的关键路径：
 *  - 模块存在性
 *  - 依赖不缺失
 *  - 基础函数可调用
 *
 * 注意：本测试验证的是模块的静态结构和依赖完整性，
 * 不依赖 DOM 运行时环境（chef/dev 共享的 node test environment）
 */

var fs = require("fs");
var path = require("path");

var MODULE = path.resolve(__dirname, "../../src/assets/js/product-grid.js");

describe("product-grid.js — 产品网格模块", function () {

  test("文件应存在", function () {
    expect(fs.existsSync(MODULE)).toBe(true);
  });

  test("语法应合法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", MODULE]);
    expect(result.status).toBe(0);
  });

  test("应引用 ProductGrid 对象", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content.indexOf("window.ProductGrid") !== -1).toBe(true);
  });

  test("应依赖 PRODUCT_DATA_TABLE", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/PRODUCT_DATA_TABLE/);
  });

  test("应包含 category tab 过滤逻辑", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/data-category/);
  });

  test("应包含 i18n 翻译 key 引用 (nav_products_*)", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/nav_products_/);
  });

});
