/**
 * pre-push-check.test.js — 验证 pre-push-check.sh 完整性
 *
 * 不执行脚本（shell 脚本的集成测试在 CI 中跑），
 * 而是验证：
 *   1. 脚本存在且可执行
 *   2. 关键检查项在脚本文本中存在
 *   3. lefthook.yml 正确引用该脚本
 */

var fs = require("fs");
var path = require("path");

var SCRIPT = path.resolve(__dirname, "../../scripts/pre-push-check.sh");
var LEFTHOOK = path.resolve(__dirname, "../../lefthook.yml");

describe("pre-push-check.sh — 推送前检查脚本", function () {

  test("脚本文件应存在", function () {
    expect(fs.existsSync(SCRIPT)).toBe(true);
  });

  test("脚本应可执行", function () {
    var stat = fs.statSync(SCRIPT);
    expect((stat.mode & 0o111) !== 0).toBe(true);
  });

  var REQUIRED_CHECKS = [
    { pattern: "JS syntax", desc: "JS 语法检查" },
    { pattern: "DOCTYPE", desc: "DOCTYPE 声明检查" },
    { pattern: "HTML structure", desc: "HTML 结构检查 (重复 body/html)" },
    { pattern: "empty <script>", desc: "空 script 标签检查" },
    { pattern: "addEventListener", desc: "重复事件监听检查" },
    { pattern: "Build output integrity", desc: "构建产物完整性检查" },
    { pattern: "Running build", desc: "构建验证" },
  ];

  REQUIRED_CHECKS.forEach(function (check) {
    test("脚本应包含检查: " + check.desc, function () {
      var content = fs.readFileSync(SCRIPT, "utf-8");
      expect(content).toMatch(new RegExp(check.pattern, "i"));
    });
  });

});

describe("lefthook.yml — Git hooks 配置", function () {

  test("lefthook.yml 应存在", function () {
    expect(fs.existsSync(LEFTHOOK)).toBe(true);
  });

  test("lefthook.yml 应引用 pre-push-check.sh", function () {
    var content = fs.readFileSync(LEFTHOOK, "utf-8");
    expect(content).toMatch(/pre-push-check\.sh/);
  });

  test("lefthook.yml 的 pre-commit 应包含 lint-ssg-regex", function () {
    var content = fs.readFileSync(LEFTHOOK, "utf-8");
    expect(content).toMatch(/lint-ssg-regex/);
  });

  test("lefthook.yml 应为合法 YAML（有 pre-commit + pre-push 两级）", function () {
    var content = fs.readFileSync(LEFTHOOK, "utf-8");
    expect(content).toMatch(/^pre-commit:/m);
    expect(content).toMatch(/^pre-push:/m);
  });

});
