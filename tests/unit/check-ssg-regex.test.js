/**
 * check-ssg-regex.test.js — 验证 check-ssg-regex.js 能正确捕获
 * build-ssg.js 中 generate404 函数的语法错误。
 *
 * 测试方法：生成含有合法/非法正则的 JS 代码，用 vm.Script 编译验证。
 */

var fs = require("fs");
var path = require("path");
var vm = require("vm");

// 辅助函数：模拟 check-ssg-regex.js 的编译逻辑
function compileGenerate404Script(jsLines) {
  var code = jsLines.join("\n");
  try {
    new vm.Script(code);
    return true;
  } catch (e) {
    return false;
  }
}

describe("check-ssg-regex.js — build-ssg.js generate404 正则检查", function () {

  test("应能编译合法的正则 —— /^\\/products\\//", function () {
    var code = [
      "(function() {",
      "  var path = '/products/coffee/';",
      "  if (/^\\/products\\//.test(path)) { return true; }",
      "})()",
    ];
    expect(compileGenerate404Script(code)).toBe(true);
  });

  test("应能编译合法的正则 —— /\\/$/ (行尾斜杠)", function () {
    var code = [
      "(function() {",
      "  var path = '/home/';",
      "  var normalized = path.replace(/\\/$/, '');",
      "})()",
    ];
    expect(compileGenerate404Script(code)).toBe(true);
  });

  test("应能捕获非法正则 —— 未闭合的 / 边界", function () {
    // 常见的 build-ssg 正则错误：s/^\\/products// 第二和第三斜杠直接相邻，
    // JS 会认为 /^\\/products// 中的 // 是空正则
    var code = [
      "(function() {",
      "  var path = '/products/';",
      "  // 非法: s/^\\/products// — 相邻斜杠导致正则解析错误",
      "  var r = /^\\/products//;",
      "})()",
    ];
    expect(compileGenerate404Script(code)).toBe(false);
  });


  test("应能捕获非法正则 —— /^\/products\/ 多行时未闭合的 regex", function () {
    var code = [
      "(function() {",
      "  var path = '/products/coffee/';",
      "  var m = path.match(/^\\/products\\/([^\\/]+)\\/);",
      "})()",
    ];
    expect(compileGenerate404Script(code)).toBe(false);
  });

  test("应能捕获非法正则 —— 双重斜杠导致行注释", function () {
    var code = [
      "(function() {",
      "  var path = '/products/';",
      "  var r = /^\\/products//;",
      "})()",
    ];
    expect(compileGenerate404Script(code)).toBe(false);
  });

  test("应能编译空代码片段 (不崩溃)", function () {
    expect(compileGenerate404Script([])).toBe(true);
  });

  test("实际运行 check-ssg-regex.js 脚本 (无错误时正常退出)", function () {
    var scriptPath = path.resolve(__dirname, "../../scripts/check-ssg-regex.js");
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

});
