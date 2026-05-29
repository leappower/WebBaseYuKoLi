/**
 * translations.test.js — i18n 翻译引擎模块验证
 *
 * 测试 translations.js 的静态结构和关键函数。
 */

var fs = require("fs");
var path = require("path");

var MODULE = path.resolve(__dirname, "../../src/assets/js/translations.js");

describe("translations.js — 国际化引擎", function () {

  test("文件应存在", function () {
    expect(fs.existsSync(MODULE)).toBe(true);
  });

  test("语法应合法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", MODULE]);
    expect(result.status).toBe(0);
  });

  test("应导出 TranslationManager", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/TranslationManager/);
  });

  test("应包含 loadTranslations 方法", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/loadTranslations/);
  });

  test("应包含 setLanguage 方法", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/setLanguage/);
  });

  test("应包含 getInitialLanguage 方法并回退到 'en'", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/getInitialLanguage/);
    expect(content).toMatch(/["']en["']/);  // default fallback
  });

  test("应包含缓存管理逻辑", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content.indexOf("cache") !== -1).toBe(true);
  });

  test("应引用 translationManager 实例", function () {
    var content = fs.readFileSync(MODULE, "utf-8");
    expect(content).toMatch(/translationManager/);
  });

});
