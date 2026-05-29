#!/usr/bin/env node
/**
 * check-ssg-regex.js — pre-commit hook
 *
 * 验证 scripts/build-ssg.js 中 generate404 函数输出的
 * <script> 块 JS 代码是否语法合法。防止正则转义错误导致
 * 404 页面 JS 运行时崩溃。
 *
 * 原理：提取纯 JS 行（跳过 JS 模板拼接占位符），用
 * vm.Script 编译验证正则语法。注意因为 build-ssg.js
 * 的 generate404 使用 JS 字符串模板拼接 HTML，其中
 * 的正则字面量被双重转义 (\\/)。我们提取后需做一次
 * 转义还原再编译。
 */

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var filePath = path.resolve(__dirname, "..", "scripts", "build-ssg.js");
if (!fs.existsSync(filePath)) process.exit(0);

var src = fs.readFileSync(filePath, "utf-8");
var fnStart = src.indexOf("function generate404");
if (fnStart < 0) process.exit(0);

var scriptOpen = src.indexOf("'  <script>'", fnStart);
var scriptClose = src.indexOf("'  </script>'", fnStart);
if (scriptOpen < 0 || scriptClose < 0) process.exit(0);

var CLOSE_TAG = "'  </script>'";
var block = src.slice(scriptOpen, scriptClose + CLOSE_TAG.length);
var lines = block.split("\n");
var jsLines = [];

for (var i = 0; i < lines.length; i++) {
  var l = lines[i].trim();
  if (l.indexOf("<script>") !== -1 || l.indexOf("</script>") !== -1) continue;
  // 跳过 JS 模板拼接行 (包含 ' + ... + ' 占位符)
  if (l.match(/' \+/) || l.match(/\+ '/)) continue;
  var m = l.match(/^'(.*)'\s*,\s*$/);
  if (m) {
    // 还原双重转义: 在 build-ssg.js 的字符串模板中，
    // \\/ 实际的运行时值是 \/，我们还原一次以让 vm.Script 正确编译
    jsLines.push(m[1].replace(/\\\\/g, "\\"));
  }
}

var jsCode = jsLines.join("\n").trim();
if (!jsCode) process.exit(0);

try {
  new vm.Script(jsCode);
  console.log("  [OK] generate404 script syntax check passed");
} catch (e) {
  console.log("  [ERR] generate404 script syntax error:");
  console.log("    " + e.message);
  var errMatch = e.stack.match(/:(\d+):(\d+)/);
  if (errMatch) {
    var errLine = parseInt(errMatch[1], 10) - 1;
    if (errLine >= 0 && errLine < jsLines.length) {
      console.log("    Line " + (errLine + 1) + ": " + jsLines[errLine].trim());
    }
  }
  process.exit(1);
}
