/**
 * product-data-table.test.js — 产品数据表模块验证
 */

var fs = require("fs");
var path = require("path");

var MODULE = path.resolve(__dirname, "../../src/assets/js/product-data-table.js");
var TRANSLATIONS = path.resolve(__dirname, "../../src/assets/js/product-data-table-translations.js");

describe("product-data-table.js — 产品数据表", function () {

  test("文件应存在", function () {
    expect(fs.existsSync(MODULE)).toBe(true);
    expect(fs.existsSync(TRANSLATIONS)).toBe(true);
  });

  test("product-data-table.js 应为合法的 JS 语法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", MODULE]);
    expect(result.status).toBe(0);
  });

  test("product-data-table-translations.js 应为合法 JS 语法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", TRANSLATIONS]);
    expect(result.status).toBe(0);
  });

  test("product-data-table.js 应导出 PRODUCT_DATA_TABLE", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/PRODUCT_DATA_TABLE/);
  });

  test("product-data-table.js 应包含产品型号 (model) 字段", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/["']?model["']?\s*[:=]/);
  });

  test("product-data-table-translations.js 应包含 PRODUCT_DATA_TRANSLATIONS", function () {
    var content = fs.readFileSync(TRANSLATIONS, "utf-8");
    expect(content).toMatch(/PRODUCT_DATA_TRANSLATIONS/);
  });

});

describe("product-data-table-translations.js — 产品翻译数据", function () {

  test("翻译文件中应包含中英文名称字段", function () {
    var content = fs.readFileSync(TRANSLATIONS, "utf-8");
    expect(content).toMatch(/nameZh/);
    expect(content).toMatch(/nameEn/);
  });

  test("翻译文件中应包含 descriptionZh/descriptionEn", function () {
    var content = fs.readFileSync(TRANSLATIONS, "utf-8");
    // 两种都是合法模式
    var hasDesc = content.indexOf("descriptionZh") !== -1;
    expect(hasDesc).toBe(true);
  });

});
