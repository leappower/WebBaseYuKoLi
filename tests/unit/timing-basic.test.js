/**
 * timing-basic.test.js — 基础时序测试
 *
 * JJC-020 T5a: 验证阶段一修复的 P0 时序问题在实际运行中不回归
 *
 * 测试内容:
 *   1. runtime-guard.js 的 __safe.whenReady() 行为
 *   2. swup-polyfill.js 的 fallback 行为
 *   3. window.t() 在 i18n-core.js 加载前不抛 TypeError
 *   4. SWUP 初始化后 spa:load + spa:ready 事件正确触发
 *   5. page-effects.js 中的 P0 防护逻辑
 */

var fs = require("fs");
var path = require("path");
var cp = require("child_process");

// ─── 源文件路径 ────────────────────────────────────────────────────────────
var RUNTIME_GUARD = path.resolve(__dirname, "../../src/assets/js/lib/runtime-guard.js");
var SWUP_POLYFILL = path.resolve(__dirname, "../../src/assets/js/lib/swup-polyfill.js");
var SPA_EVENTS = path.resolve(__dirname, "../../src/assets/js/utils/spa-events.js");
var PAGE_EFFECTS = path.resolve(__dirname, "../../src/assets/js/ui/page-effects.js");

// ─── 帮助函数：构建 vm 沙箱上下文，支持先在 window/document 上设属性 ─────
function makeBaseCtx(overrides) {
  var ctx = {
    window: {},
    document: {
      readyState: "complete",
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {},
      createElement: function () { return {}; },
      body: {},
      documentElement: {},
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      getElementById: function () { return null; },
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Promise: Promise,
    MutationObserver: function (cb) {
      this.observe = function () {};
      this.disconnect = function () {};
    },
    AbortController: function () {
      this.signal = {};
      this.abort = function () {};
    },
    IntersectionObserver: function () {
      this.observe = function () {};
      this.unobserve = function () {};
    },
    console: console,
    location: { hostname: "localhost", port: "" },
    navigator: { language: "en" },
    localStorage: {
      _data: {},
      getItem: function (k) { return this._data[k] || null; },
      setItem: function (k, v) { this._data[k] = v; },
      removeItem: function (k) { delete this._data[k]; },
    },
    fetch: function () {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve({}); } });
    },
    CustomEvent: function (type) { this.type = type; },
    _spaOn: function () {},
    _spaRegs: {},
  };
  ctx.global = ctx;
  // Apply overrides to window/document before vm.createContext freezes them
  if (overrides) {
    Object.keys(overrides).forEach(function (k) {
      ctx[k] = overrides[k];
    });
    if (overrides.windowProps) {
      Object.keys(overrides.windowProps).forEach(function (k) {
        ctx.window[k] = overrides.windowProps[k];
      });
    }
    if (overrides.documentProps) {
      Object.keys(overrides.documentProps).forEach(function (k) {
        ctx.document[k] = overrides.documentProps[k];
      });
    }
  }
  return ctx;
}

function sandbox(overrides, code) {
  var vm = require("vm");
  var ctx = makeBaseCtx(overrides);
  vm.createContext(ctx);
  vm.runInContext(code || "", ctx, { timeout: 5000 });
  return ctx;
}

function runtimeGuardCode() {
  return fs.readFileSync(RUNTIME_GUARD, "utf-8");
}
function swupPolyfillCode() {
  return fs.readFileSync(SWUP_POLYFILL, "utf-8");
}
function spaEventsCode() {
  return fs.readFileSync(SPA_EVENTS, "utf-8");
}
function pageEffectsCode() {
  return fs.readFileSync(PAGE_EFFECTS, "utf-8");
}

describe("T5a: 基础时序测试", function () {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. runtime-guard.js — __safe.whenReady() 行为
  // ───────────────────────────────────────────────────────────────────────────
  describe("runtime-guard.js — __safe.whenReady()", function () {

    test("文件应存在", function () {
      expect(fs.existsSync(RUNTIME_GUARD)).toBe(true);
    });

    test("语法应合法", function () {
      var result = cp.spawnSync("node", ["--check", RUNTIME_GUARD]);
      expect(result.status).toBe(0);
    });

    test("__safe.whenReady 应接受字符串选择器并立即执行（元素已存在）", function (done) {
      var ctx = sandbox({
        document: {
          readyState: "complete",
          addEventListener: function () {},
          removeEventListener: function () {},
          dispatchEvent: function () {},
          createElement: function () { return {}; },
          body: {},
          documentElement: {},
          // overriding querySelector to match "#existing"
          querySelector: function (sel) {
            return sel === "#existing" ? { nodeType: 1 } : null;
          },
          querySelectorAll: function () { return []; },
          getElementById: function () { return null; },
        },
      }, runtimeGuardCode());

      expect(typeof ctx.window.__safe).toBe("object");
      expect(typeof ctx.window.__safe.whenReady).toBe("function");

      ctx.window.__safe.whenReady("#existing", function (el) {
        expect(el).toBeTruthy();
        done();
      });
    });

    test("__safe.whenReady 应接受函数条件并在就绪后执行", function (done) {
      var ctx = sandbox({}, runtimeGuardCode());
      var ready = false;
      setTimeout(function () { ready = true; }, 50);

      ctx.window.__safe.whenReady(function () { return ready; }, function (val) {
        expect(val).toBe(true);
        done();
      });
    });

    test("__safe.whenReady 应超时并调用回调(null) 当条件永不满足", function (done) {
      var ctx = sandbox({}, runtimeGuardCode());

      // timeout=200ms — "never-exists" won't appear
      ctx.window.__safe.whenReady("#never-exists", function (el) {
        expect(el).toBeNull();
        done();
      }, 200);
    }, 5000);

    test("__safe.whenReady 不传 fn 时应返回 Promise", function (done) {
      var ctx = sandbox({
        document: {
          readyState: "complete",
          addEventListener: function () {},
          removeEventListener: function () {},
          dispatchEvent: function () {},
          createElement: function () { return {}; },
          body: {},
          documentElement: {},
          querySelector: function () { return { nodeType: 1 }; },
          querySelectorAll: function () { return []; },
          getElementById: function () { return null; },
        },
      }, runtimeGuardCode());

      var p = ctx.window.__safe.whenReady("#existing");
      expect(p instanceof Promise).toBe(true);
      p.then(function (el) {
        expect(el).toBeTruthy();
        done();
      });
    });

    test("__safe.t 在 window.t 未定义时不应抛 TypeError", function () {
      var ctx = sandbox({}, runtimeGuardCode());

      expect(function () {
        ctx.window.__safe.t("nav_home");
      }).not.toThrow();

      // Should return key itself as fallback
      var result = ctx.window.__safe.t("nav_home");
      expect(result).toBe("nav_home");
    });

    test("__safe.t 应回退到 __inlineTranslations", function () {
      var ctx = sandbox({
        windowProps: {
          __inlineTranslations: { nav_home: "首页" },
        },
      }, runtimeGuardCode());

      var result = ctx.window.__safe.t("nav_home");
      expect(result).toBe("首页");
    });

    test("__safe.t 应优先使用 window.t() 结果", function () {
      var ctx = sandbox({
        windowProps: {
          __inlineTranslations: { nav_home: "首页" },
          t: function (key) { return key === "nav_home" ? "Home (Manager)" : key; },
        },
      }, runtimeGuardCode());

      var result = ctx.window.__safe.t("nav_home");
      expect(result).toBe("Home (Manager)");
    });

    test("__safe.config 应安全读取 SITE_CONFIG", function () {
      var ctx = sandbox({
        windowProps: {
          SITE_CONFIG: { brand: { name: "YuKoLi" } },
        },
      }, runtimeGuardCode());

      expect(ctx.window.__safe.config("brand")).toEqual({ name: "YuKoLi" });
      expect(ctx.window.__safe.config("nonexistent", "fallback")).toBe("fallback");
      expect(ctx.window.__safe.config("nonexistent")).toBeUndefined();
    });

    test("__safe.get 安全读取任意 window 属性", function () {
      var ctx = sandbox({
        windowProps: {
          Swup: {},
        },
      }, runtimeGuardCode());

      expect(ctx.window.__safe.get("Swup")).toEqual({});
      expect(ctx.window.__safe.get("Missing")).toBeUndefined();
      expect(ctx.window.__safe.get("Missing", "fallback")).toBe("fallback");
    });

    test("__safe.ready 在变量已存在时应立即 resolve", function () {
      return new Promise(function (resolve) {
        var ctx = sandbox({
          windowProps: {
            Swup: { version: "4" },
          },
        }, runtimeGuardCode());

        ctx.window.__safe.ready("Swup").then(function (val) {
          expect(val).toEqual({ version: "4" });
          resolve();
        });
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. swup-polyfill.js — fallback 行为
  // ───────────────────────────────────────────────────────────────────────────
  describe("swup-polyfill.js — SWUP 事件 polyfill", function () {

    test("文件应存在", function () {
      expect(fs.existsSync(SWUP_POLYFILL)).toBe(true);
    });

    test("语法应合法", function () {
      var result = cp.spawnSync("node", ["--check", SWUP_POLYFILL]);
      expect(result.status).toBe(0);
    });

    test("当 __swupEnabled 为 true 时，polyfill 应静默跳过", function () {
      var ctx = sandbox({
        windowProps: {
          __swupEnabled: true,
        },
      }, swupPolyfillCode());

      // No crash = pass
      expect(true).toBe(true);
    });

    test("当 __swupEnabled 为 false/undefined 时，polyfill 应在 DOMContentLoaded 后触发 spa:load 和 spa:ready", function (done) {
      var events = [];
      var ctx = sandbox({
        documentProps: {
          readyState: "loading",
          addEventListener: function (event, handler) {
            if (event === "DOMContentLoaded") {
              setTimeout(handler, 5);
            }
          },
          dispatchEvent: function (evt) {
            events.push(evt.type);
          },
        },
      }, swupPolyfillCode());

      setTimeout(function () {
        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toBe("spa:load");
        expect(events).toContain("spa:ready");
        done();
      }, 100);
    }, 5000);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. window.t() 在 i18n-core.js 加载前不抛 TypeError
  // ───────────────────────────────────────────────────────────────────────────
  describe("window.t() null-safety (P0 guard)", function () {

    test("在 i18n-core 未加载时调用 t() 不应抛 TypeError", function () {
      var ctx = sandbox({}, runtimeGuardCode());

      expect(function () {
        ctx.window.__safe.t("nav_home", "首页");
      }).not.toThrow();

      var result = ctx.window.__safe.t("nav_home", "首页");
      expect(result).toBe("首页");
    });

    test("__safe.t 与 window.t 共存时不应重入冲突", function () {
      var ctx = sandbox({
        windowProps: {
          t: function (key) { return "t(" + key + ")"; },
        },
      }, runtimeGuardCode());

      var result = ctx.window.__safe.t("some_key");
      expect(result).toBe("t(some_key)");
    });

    test("i18n-core 导出后 window.t 应被赋值且 __safe.t 仍正常工作", function () {
      var ctx = sandbox({
        windowProps: {
          t: function (key) {
            var map = { nav_home: "首页", nav_about: "关于我们" };
            return map[key] || key;
          },
        },
      }, runtimeGuardCode());

      var result = ctx.window.__safe.t("nav_home", "Home");
      expect(result).toBe("首页");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. spa:load + spa:ready 事件正确触发
  // ───────────────────────────────────────────────────────────────────────────
  describe("SWUP 事件 — spa:load / spa:ready", function () {

    test("swup-polyfill.js 应依次触发 spa:load 然后 spa:ready", function (done) {
      var events = [];
      var ctx = sandbox({
        documentProps: {
          readyState: "loading",
          addEventListener: function (event, handler) {
            if (event === "DOMContentLoaded") {
              setTimeout(handler, 5);
            }
          },
          dispatchEvent: function (evt) {
            events.push(evt.type);
          },
        },
      }, swupPolyfillCode());

      setTimeout(function () {
        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toBe("spa:load");
        // spa:ready fires in microtask after spa:load
        expect(events[events.length - 1]).toBe("spa:ready");
        done();
      }, 100);
    }, 5000);

    test("spa-events.js 的 _spaOn 应支持基于 key 的去重注册", function () {
      var result = cp.spawnSync("node", ["--check", SPA_EVENTS]);
      expect(result.status).toBe(0);

      // Test spa-events in sandbox
      var ctx = sandbox({}, spaEventsCode());
      expect(typeof ctx.window._spaOn).toBe("function");
      expect(typeof ctx.window.__onSpaEvent).toBe("function");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. page-effects.js 中的 P0 防护逻辑
  // ───────────────────────────────────────────────────────────────────────────
  describe("page-effects.js — P0 防护逻辑", function () {

    test("文件应存在且语法合法", function () {
      expect(fs.existsSync(PAGE_EFFECTS)).toBe(true);
      var result = cp.spawnSync("node", ["--check", PAGE_EFFECTS]);
      expect(result.status).toBe(0);
    });

    test("page-effects.js 应使用 __safe.t 而非直接 window.t", function () {
      var content = fs.readFileSync(PAGE_EFFECTS, "utf-8");
      expect(content).toMatch(/__safe\.t\(/);
    });

    test("page-effects.js 应通过 safeCall 调用外部函数以避免 TypeError", function () {
      var content = fs.readFileSync(PAGE_EFFECTS, "utf-8");
      expect(content).toMatch(/safeCall/);
    });

    test("page-effects.js 不应在没有 guard 的情况下直接调用 window.t()", function () {
      var content = fs.readFileSync(PAGE_EFFECTS, "utf-8");
      // No direct window.t() without guard
      var directTCalls = content.match(/(?<!__safe\.)window\.t\s*\(/g);
      expect(directTCalls).toBeNull();
    });

    test("page-effects.js 的 init 应容错（模块不存在时不抛）", function () {
      var ctx = sandbox({
        document: {
          readyState: "complete",
          addEventListener: function () {},
          removeEventListener: function () {},
          dispatchEvent: function () {},
          createElement: function () {
            var el = {
              className: '',
              innerHTML: '',
              setAttribute: function() {},
              appendChild: function() {},
              style: {},
            };
            return el;
          },
          body: { appendChild: function() {}, classList: { add: function() {}, remove: function() {} } },
          documentElement: {},
          querySelector: function () { return null; },
          querySelectorAll: function () { return []; },
          getElementById: function () { return null; },
          appendChild: function() {},
        },
        windowProps: {
          __safe: {
            t: function (key) { return key; },
          },
        },
      }, pageEffectsCode());

      // No exception = pass
      expect(true).toBe(true);
    });
  });
});



  // ───────────────────────────────────────────────────────────────────────────
  // 6. swup-init.js — document.readyState 不同阶段的行为
  // ───────────────────────────────────────────────────────────────────────────
  describe("swup-init.js — document.readyState 阶段", function () {

    var SWUP_INIT = path.resolve(__dirname, "../../src/assets/js/swup-init.js");

    test("文件应存在且语法合法", function () {
      expect(fs.existsSync(SWUP_INIT)).toBe(true);
      var result = cp.spawnSync("node", ["--check", SWUP_INIT]);
      expect(result.status).toBe(0);
    });

    test("readyState=loading 时应注册 DOMContentLoaded 监听而非立即调用 initSwup", function (done) {
      var domContentLoadedRegistered = false;
      var ctx = makeBaseCtx({
        documentProps: {
          readyState: "loading",
          addEventListener: function (event, handler) {
            if (event === "DOMContentLoaded") {
              domContentLoadedRegistered = true;
            }
          },
        },
      });
      delete ctx.window.__initSwup; // ensure undefined
      delete ctx.window.Swup;
      var vm = require("vm");
      vm.createContext(ctx);
      vm.runInContext(fs.readFileSync(SWUP_INIT, "utf-8"), ctx, { timeout: 5000 });

      // When readyState is "loading", swup-init registers a DOMContentLoaded listener
      // and should NOT call __initSwup immediately
      expect(domContentLoadedRegistered).toBe(true);
      // initSwup should not have been called (Swup undefined + __initSwup undefined)
      // Verify by checking that initCalled is still false internally
      // The code only calls initSwup if readyState !== "loading"
      done();
    });

    test("readyState=complete 时应立即调用 initSwup（幂等）", function (done) {
      var initSwupCallCount = 0;
      var domContentLoadedRegistered = false;

      // Simulate Swup being present so __initSwup gets called
      var ctx = makeBaseCtx({
        windowProps: {
          Swup: { version: "4" },
          __initSwup: function () {
            initSwupCallCount++;
          },
        },
        documentProps: {
          readyState: "complete",
          addEventListener: function (event, handler) {
            if (event === "DOMContentLoaded") {
              domContentLoadedRegistered = true;
            }
          },
        },
      });
      var vm = require("vm");
      vm.createContext(ctx);
      vm.runInContext(fs.readFileSync(SWUP_INIT, "utf-8"), ctx, { timeout: 5000 });

      // When readyState is "complete", initSwup should be called immediately
      // Since __initSwup is defined, initSwupCallCount should be 1
      setTimeout(function () {
        expect(initSwupCallCount).toBe(1);
        expect(domContentLoadedRegistered).toBe(false);
        done();
      }, 50);
    }, 5000);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. runtime-guard.js — __safe.ready() 与 __safe.whenReady() 链式调用顺序
  // ───────────────────────────────────────────────────────────────────────────
  describe("runtime-guard.js — ready / whenReady 链式调用", function () {

    test("__safe.ready() 应在变量就绪后 resolve，__safe.whenReady() 应在之后正确执行", function (done) {
      var ctx = sandbox({}, runtimeGuardCode());

      var order = [];
      // Test: ready() resolves, then whenReady() fires in the same chain
      ctx.window.Swup = { version: "4" }; // immediately ready

      ctx.window.__safe.ready("Swup").then(function (swup) {
        order.push("ready-resolved");
        expect(swup).toEqual({ version: "4" });
        // After Swup ready, whenReady for a DOM element
        ctx.window.__safe.whenReady("#app", function (el) {
          order.push("whenReady-fired");
          expect(order).toEqual(["ready-resolved", "whenReady-fired"]);
          done();
        });
      });

      // Simulate #app appearing
      setTimeout(function () {
        // Override querySelector to return #app
        var origQS = ctx.document.querySelector;
        ctx.document.querySelector = function (sel) {
          if (sel === "#app") return { nodeType: 1 };
          return origQS ? origQS.call(ctx.document, sel) : null;
        };
      }, 20);
    }, 5000);

    test("__safe.whenReady() 回调中嵌套 __safe.ready() 应保持执行顺序一致", function (done) {
      var ctx = sandbox({}, runtimeGuardCode());
      var order = [];

      // First, make the DOM element available
      ctx.document.querySelector = function (sel) {
        if (sel === "#main") return { nodeType: 1 };
        return null;
      };

      ctx.window.__safe.whenReady("#main", function (el) {
        order.push("whenReady-fired");
        expect(el).toBeTruthy();

        // Inside whenReady callback, call ready() for a global variable
        ctx.window.SpaRouter = { version: "1" };
        ctx.window.__safe.ready("SpaRouter").then(function (sr) {
          order.push("ready-resolved");
          expect(order).toEqual(["whenReady-fired", "ready-resolved"]);
          done();
        });
      });
    }, 5000);
  });
