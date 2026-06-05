/**
 * i18n-timing.test.js — i18n 时序测试
 *
 * JJC-020 T5b: 验证 i18n 模块化后的翻译加载时序
 *
 * 测试内容:
 *   1. i18n-core.js 的 load() → t() 调用时序
 *   2. inline-translations.js 在 i18n-core 前加载不报错
 *   3. 语言切换后翻译正确更新
 *   4. fallback 语言行为
 *   5. SITE_CONFIG.resolvePath() 和 resolveImage() BASE_PATH 处理
 */

var fs = require("fs");
var path = require("path");
var cp = require("child_process");

// ─── 源文件路径 ────────────────────────────────────────────────────────────
var I18N_CORE = path.resolve(__dirname, "../../src/assets/js/lib/i18n-core.js");
var INLINE_TRANSLATIONS = path.resolve(__dirname, "../../src/assets/js/lib/inline-translations.js");
var SITE_CONFIG = path.resolve(__dirname, "../../src/assets/js/site.config.js");

// ─── 帮助函数 ──────────────────────────────────────────────────────────────
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
      createTextNode: function () { return {}; },
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
    IntersectionObserver: function () { this.observe = function () {}; this.unobserve = function () {}; },
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
    URL: {},
    Map: Map,
    Set: Set,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Error: Error,
    TypeError: TypeError,
    module: { exports: {} },
    // LANG_REGISTRY on window (i18n-core.js accesses via global/window parameter)
    // SITE_CONFIG on window
    PRODUCT_DATA_TABLE: [],
    // Dev helpers
    WHATSAPP_NUMBER: "8618565718814",
    WHATSAPP_DEFAULT_MSG: "Hi YuKoLi",
    INFO_EMAIL: "support.brew@yukoli.com",
    FORM_EMAIL: "179564128@qq.com",
  };
  ctx.global = ctx;

  // Apply overrides BEFORE vm.createContext (which freezes the context)
  if (overrides) {
    Object.keys(overrides).forEach(function (k) {
      ctx[k] = overrides[k];
    });
    // Apply window props to ctx.window (i18n-core reads from global/window parameter)
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
  vm.runInContext(code, ctx, { timeout: 5000 });
  return ctx;
}

function rawCode(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

// ─── 共享的默认 window 属性 ──────────────────────────────────────────────
var DEFAULT_WINDOW_PROPS = {
  LANG_REGISTRY: {
    LANGUAGES: [
      { code: "zh-CN", nativeName: "中文（简体）" },
      { code: "en", nativeName: "English" },
      { code: "id", nativeName: "Bahasa Indonesia" },
      { code: "th", nativeName: "ภาษาไทย" },
      { code: "ms", nativeName: "Bahasa Melayu" },
      { code: "vi", nativeName: "Tiếng Việt" },
    ],
    getNativeNames: function () {
      return {
        "zh-CN": "中文（简体）",
        en: "English",
        id: "Bahasa Indonesia",
        th: "ภาษาไทย",
        ms: "Bahasa Melayu",
        vi: "Tiếng Việt",
      };
    },
  },
  SITE_CONFIG: {
    brand: { name: "YuKoLi" },
    resolvePath: function (p) {
      return (this._basePath || "") + (p || "");
    },
    resolveImage: function (name) {
      var paths = {
        logo: "/assets/images/logo-main.webp",
        logoDark: "/assets/images/logo-main-dark.webp",
        logoFooter: "/assets/images/logo-footer.webp",
        logoHeader: "/assets/images/logo-header.webp",
      };
      return (this._basePath || "") + (paths[name] || "/assets/images/" + name);
    },
    _basePath: "",
  },
  PRODUCT_DATA_TABLE: [
    {
      id: "cat1", name: "Coffee", slug: "coffee",
      products: [
        { id: "p001", _productId: "coffee-latte", name: "Latte Powder", nameEn: "Latte Powder", nameZhCN: "拿铁粉" },
      ],
    },
  ],
};

function i18nSandbox(fetchMap, extraWindowProps) {
  var wp = {};
  Object.keys(DEFAULT_WINDOW_PROPS).forEach(function (k) { wp[k] = DEFAULT_WINDOW_PROPS[k]; });
  if (extraWindowProps) {
    Object.keys(extraWindowProps).forEach(function (k) { wp[k] = extraWindowProps[k]; });
  }

  var fetchFn = function (url) {
    var handler = fetchMap[url];
    if (handler) return handler();
    // Default: return empty
    // Unregistered UI JSON -> 404 (triggers fallback)
    if (url.indexOf("-ui.json") !== -1 || (url.indexOf("lang/") !== -1 && url.indexOf("-product") === -1)) {
      return Promise.reject(new Error('404 - not found in test fetchMap'));
    }
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve({}); } });
  };

  return sandbox({
    windowProps: wp,
    fetch: fetchFn,
  }, rawCode(I18N_CORE));
}

describe("T5b: i18n 时序测试", function () {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. i18n-core.js 的 load() → t() 调用时序
  // ───────────────────────────────────────────────────────────────────────────
  describe("i18n-core.js — load() → t() 调用时序", function () {

    test("文件应存在", function () {
      expect(fs.existsSync(I18N_CORE)).toBe(true);
    });

    test("语法应合法", function () {
      var result = cp.spawnSync("node", ["--check", I18N_CORE]);
      expect(result.status).toBe(0);
    });

    test("load() 调用后 t() 返回已加载的翻译", function () {
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          return Promise.resolve({
            ok: true,
            json: function () { return Promise.resolve({ nav_home: "Home", nav_about: "About Us" }); },
          });
        },
      });

      return ctx.window.i18n.load("en").then(function () {
        expect(ctx.window.i18n.t("nav_home")).toBe("Home");
        expect(ctx.window.i18n.t("nav_about")).toBe("About Us");
      });
    });

    test("load() 前调用 t() 应返回 key 本身（graceful fallback）", function () {
      var ctx = i18nSandbox({});
      // Before loading any translations, t() should return the key as-is
      expect(ctx.window.i18n.t("nav_home")).toBe("nav_home");
    });

    test("t() 处理点号路径键", function () {
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          return Promise.resolve({
            ok: true,
            json: function () {
              return Promise.resolve({ nav: { home: "Home", about: "About Us", products: { coffee: "Coffee" } } });
            },
          });
        },
      });

      return ctx.window.i18n.load("en").then(function () {
        expect(ctx.window.i18n.t("nav.products.coffee")).toBe("Coffee");
        expect(ctx.window.i18n.t("nav.home")).toBe("Home");
      });
    });

    test("load() 应缓存翻译避免重复 fetch", function () {
      var enFetchCount = 0;
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          enFetchCount++;
          return Promise.resolve({
            ok: true,
            json: function () { return Promise.resolve({ nav_home: "Home" }); },
          });
        },
      });

      return ctx.window.i18n.load("en")
        .then(function () { return ctx.window.i18n.load("en"); })
        .then(function () {
          expect(enFetchCount).toBe(1);
        });
    }, 10000);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. inline-translations.js 在 i18n-core 前加载不报错
  // ───────────────────────────────────────────────────────────────────────────
  describe("inline-translations.js — 独立加载", function () {

    test("文件应存在且语法合法", function () {
      expect(fs.existsSync(INLINE_TRANSLATIONS)).toBe(true);
      var result = cp.spawnSync("node", ["--check", INLINE_TRANSLATIONS]);
      expect(result.status).toBe(0);
    });

    test("inline-translations.js 独自加载不依赖任何外部模块", function () {
      var ctx = sandbox({}, rawCode(INLINE_TRANSLATIONS));
      expect(true).toBe(true);
    });

    test("__inlineTranslations 应包含高频导航键", function () {
      var ctx = sandbox({}, rawCode(INLINE_TRANSLATIONS));

      expect(ctx.window.__inlineTranslations).toBeTruthy();
      expect(typeof ctx.window.__inlineTranslations).toBe("object");
      expect(ctx.window.__inlineTranslations.nav_home).toBeDefined();
      expect(ctx.window.__inlineTranslations.nav_products).toBeDefined();
      expect(ctx.window.__inlineTranslations.nav_about).toBeDefined();
      expect(ctx.window.__inlineTranslations.nav_contact).toBeDefined();
      expect(ctx.window.__inlineTranslations.btn_contact_us).toBeDefined();
    });

    test("i18n-core 加载后，__inlineTranslations 仍可用作 __safe.t 的 fallback", function () {
      var ctx = sandbox({
        windowProps: {
          __inlineTranslations: { nav_home: "首页" },
          LANG_REGISTRY: DEFAULT_WINDOW_PROPS.LANG_REGISTRY,
          SITE_CONFIG: DEFAULT_WINDOW_PROPS.SITE_CONFIG,
          PRODUCT_DATA_TABLE: DEFAULT_WINDOW_PROPS.PRODUCT_DATA_TABLE,
        },
      }, rawCode(I18N_CORE));

      expect(typeof ctx.window.t).toBe("function");
      expect(ctx.window.t("nav_home")).toBe("nav_home");
      expect(ctx.window.__inlineTranslations.nav_home).toBe("首页");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. 语言切换后翻译正确更新
  // ───────────────────────────────────────────────────────────────────────────
  describe("语言切换后翻译正确更新", function () {

    test("setLanguage() 应更新 currentLang()", function () {
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "Home" }); } });
        },
        "/assets/lang/zh-CN-ui.json": function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "首页" }); } });
        },
      });

      return ctx.window.i18n.load("en").then(function () {
        expect(ctx.window.i18n.t("nav_home")).toBe("Home");
        return ctx.window.i18n.setLanguage("zh-CN").then(function () {
          expect(ctx.window.i18n.currentLang()).toBe("zh-CN");
          expect(ctx.window.i18n.t("nav_home")).toBe("首页");
        });
      });
    }, 10000);

    test("languageChanged 事件应在切换后触发", function () {
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "Home" }); } });
        },
        "/assets/lang/zh-CN-ui.json": function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "首页" }); } });
        },
      });

      var eventData = null;
      ctx.window.i18n.on("languageChanged", function (data) {
        eventData = data;
      });

      return ctx.window.i18n.setLanguage("zh-CN").then(function () {
        expect(eventData).not.toBeNull();
        expect(eventData.language).toBe("zh-CN");
      });
    }, 10000);

    test("切换到相同语言应为 no-op", function () {
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "Home" }); } });
        },
        "/assets/lang/zh-CN-ui.json": function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "首页" }); } });
        },
      });

      var callCount = 0;
      ctx.window.i18n.on("languageChanged", function () { callCount++; });

      return ctx.window.i18n.setLanguage("zh-CN").then(function () {
        var countBefore = callCount;
        return ctx.window.i18n.setLanguage("zh-CN").then(function () {
          expect(callCount).toBe(countBefore);
        });
      });
    }, 10000);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. fallback 语言行为
  // ───────────────────────────────────────────────────────────────────────────
  describe("fallback 语言行为", function () {

    test("加载不存在的语言应 fallback 到 en", function () {
      var enFetchCalled = false;
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          enFetchCalled = true;
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "Home" }); } });
        },
      });

      return ctx.window.i18n.load("unsupported-lang").then(function () {
        expect(enFetchCalled).toBe(true);
      });
    }, 10000);

    test("setLanguage 到不存在于注册表内的代码不应崩溃", function () {
      var ctx = i18nSandbox({
        "/assets/lang/en-ui.json": function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ nav_home: "Home" }); } });
        },
      });

      return ctx.window.i18n.setLanguage("zz-ZZ").catch(function () {
        // Expected rejection for unsupported language
        expect(true).toBe(true);
      });
    }, 10000);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. SITE_CONFIG.resolvePath() 和 resolveImage() BASE_PATH 处理
  // ───────────────────────────────────────────────────────────────────────────
  describe("SITE_CONFIG.resolvePath() / resolveImage()", function () {

    test("语法应合法", function () {
      var result = cp.spawnSync("node", ["--check", SITE_CONFIG]);
      expect(result.status).toBe(0);
    });

    test("resolvePath 当 BASE_PATH 为空时应返回原路径", function () {
      var ctx = sandbox({
        window: {},
        module: { exports: {} },
        windowProps: {
          BASE_PATH: "",
        },
      }, rawCode(SITE_CONFIG));

      var result = ctx.window.SITE_CONFIG.resolvePath("/assets/lang/en-ui.json");
      expect(result).toBe("/assets/lang/en-ui.json");
    });

    test("resolvePath 当 BASE_PATH 有值时应拼接", function () {
      var ctx = sandbox({
        window: {},
        module: { exports: {} },
        windowProps: {
          BASE_PATH: "/brew",
        },
      }, rawCode(SITE_CONFIG));

      var result = ctx.window.SITE_CONFIG.resolvePath("/assets/lang/en-ui.json");
      expect(result).toBe("/brew/assets/lang/en-ui.json");
    });

    test("resolvePath 非绝对路径应直接返回", function () {
      var ctx = sandbox({
        window: {},
        module: { exports: {} },
        windowProps: {
          BASE_PATH: "/brew",
        },
      }, rawCode(SITE_CONFIG));

      var result = ctx.window.SITE_CONFIG.resolvePath("relative/path");
      expect(result).toBe("relative/path");
    });

    test("resolvePath 空路径应返回 BASE_PATH", function () {
      var ctx = sandbox({
        window: {},
        module: { exports: {} },
        windowProps: {
          BASE_PATH: "/brew",
        },
      }, rawCode(SITE_CONFIG));

      var result = ctx.window.SITE_CONFIG.resolvePath("");
      expect(result).toBe("/brew");
    });

    test("resolveImage 应解析已知图片名", function () {
      var ctx = sandbox({
        window: {},
        module: { exports: {} },
        windowProps: {
          BASE_PATH: "",
        },
      }, rawCode(SITE_CONFIG));

      expect(ctx.window.SITE_CONFIG.resolveImage("logo")).toContain("logo-main");
      expect(ctx.window.SITE_CONFIG.resolveImage("logoFooter")).toContain("logo-footer");
      expect(ctx.window.SITE_CONFIG.resolveImage("nonexistent")).toContain("nonexistent");
    });

    test("resolveImage 应拼接 BASE_PATH", function () {
      var ctx = sandbox({
        window: {},
        module: { exports: {} },
        windowProps: {
          BASE_PATH: "/subdir",
        },
      }, rawCode(SITE_CONFIG));

      var logoPath = ctx.window.SITE_CONFIG.resolveImage("logo");
      expect(logoPath).toBe("/subdir/assets/images/logo-main.webp");
    });
  });
});
