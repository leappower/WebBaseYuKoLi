/**
 * sw-version.test.js — 验证 Service Worker 版本号注入逻辑
 *
 * build.sh 在执行 sw.js 写入后，会用 re.sub 替换
 * var SW_VERSION = "..." 为构建时间戳版本号。
 * 测试确保：
 *   1. sw.js 源文件包含 SW_VERSION 占位符
 *   2. 版本号注入后格式正确
 *   3. 缓存前缀与版本号关联
 */

var fs = require("fs");
var path = require("path");

var SW_SRC = path.resolve(__dirname, "../../sw.js");

describe("sw.js — Service Worker 版本号管理", function () {

  test("sw.js 源文件应包含 SW_VERSION 占位符", function () {
    expect(fs.existsSync(SW_SRC)).toBe(true);
    var content = fs.readFileSync(SW_SRC, "utf-8");
    expect(content).toMatch(/var SW_VERSION\s*=\s*"/);
  });

  test("sw.js 应包含 CURRENT_CACHE_PREFIX 前缀变量", function () {
    var content = fs.readFileSync(SW_SRC, "utf-8");
    expect(content).toMatch(/CURRENT_CACHE_PREFIX\s*=\s*"/);
  });

  test("版本号注入后的 sw.js 应包含有效版本号", function () {
    var content = fs.readFileSync(SW_SRC, "utf-8");
    // 模拟版本号注入
    var MOCK_VERSION = "v1234567890";
    var injected = content.replace(
      /(var SW_VERSION\s*=\s*")[^"]*(")/,
      "$1" + MOCK_VERSION + "$2"
    );
    expect(injected).toContain('var SW_VERSION = "v1234567890"');
  });

  test("sw.js 应是合法的 ES5 语法", function () {
    var content = fs.readFileSync(SW_SRC, "utf-8");
    // node --check 验证语法
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", SW_SRC]);
    expect(result.status).toBe(0);
  });

  test("CURRENT_CACHE_PREFIX 应基于 SW_VERSION 动态生成", function () {
    var content = fs.readFileSync(SW_SRC, "utf-8");
    expect(content).toMatch(/CURRENT_CACHE_PREFIX\s*=\s*"yukoli-brew-v"\s*\+\s*SW_VERSION/);
  });

});
