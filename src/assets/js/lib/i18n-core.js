/**
 * i18n-core.js — 自建 i18n 引擎核心
 *
 * JJC-020 T2.1: 将 translations.js 的翻译加载、缓存、语言切换逻辑提取为独立模块。
 *
 * 职责：
 *   - 翻译 JSON 加载（fetch / localStorage 缓存）
 *   - 翻译键值解析（点号路径、BOM 清理、品牌变量插值）
 *   - 语言切换与事件分发
 *   - 提供标准 API: i18n.load(lang), i18n.t(key), i18n.currentLang()
 *
 * 兼容性：
 *   - ESM 格式，但通过立即执行函数兼容当前全局脚本模式
 *   - 自动注册为 window.i18n 和 window.t
 *   - 使用 window.__safe.t() 作为 fallback 桥接
 *
 * 依赖：
 *   - window.SITE_CONFIG (site.config.js)
 *   - window.LANG_REGISTRY (lang-registry.js)
 *   - fetch() 可用
 */
(function (global) {
  "use strict";

  // ───────────────────────────────────────────────────────────────────────────
  // 辅助：对象浅合并
  // ───────────────────────────────────────────────────────────────────────────
  function _extend(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src) {
        for (var k in src) {
          if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
        }
      }
    }
    return target;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 环境检测：开发模式 / localhost
  // ───────────────────────────────────────────────────────────────────────────
  var _isDev = (function () {
    var host = (global.location && global.location.hostname) || "";
    var port = (global.location && global.location.port) || "";
    return (
      "localhost" === host ||
      "127.0.0.1" === host ||
      ["8080", "3000", "3001", "5000", "9000"].indexOf(port) !== -1 ||
      /\b(test|staging|preview|dev|internal|local)\b/.test(host.toLowerCase())
    );
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // I18nCore 构造函数
  // ───────────────────────────────────────────────────────────────────────────
  function I18nCore() {
    this.currentLanguage = this._getInitialLanguage();
    this.translationsCache = new Map();
    this.pendingLoads = new Map();
    this.keyPathCache = new Map();
    this.isInitialized = false;
    this.eventListeners = new Map();

    // 从 LANG_REGISTRY 读取语言列表配置
    var reg = global.LANG_REGISTRY;
    var langArr = (reg && reg.LANGUAGES) || [];
    this.languages = langArr.map(function (l) {
      return { code: l.code, name: l.nativeName };
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Promise 超时辅助
  // ───────────────────────────────────────────────────────────────────────────
  function _withTimeout(promise, ms, label) {
    ms = ms || 10000;
    label = label || "Operation timeout";
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error(label));
        }, ms);
      }),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 获取 LANG_REGISTRY 中的原生名称映射
  // ───────────────────────────────────────────────────────────────────────────
  function _getNativeNames() {
    return global.LANG_REGISTRY && global.LANG_REGISTRY.getNativeNames ? global.LANG_REGISTRY.getNativeNames() : {};
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 检测浏览器语言
  // ───────────────────────────────────────────────────────────────────────────
  function _detectBrowserLanguage() {
    var lang = (navigator.language || "en").substring(0, 2);
    var map = {
      zh: "zh-CN",
      en: "en",
      id: "id",
      th: "th",
      ms: "ms",
      vi: "vi",
      ko: "ko",
      ja: "ja",
      fr: "fr",
      de: "de",
      es: "es",
      pt: "pt",
      ar: "ar",
      ru: "ru",
      hi: "hi",
      tr: "tr",
      it: "it",
      nl: "nl",
      pl: "pl",
      sv: "sv",
      nb: "nb",
      da: "da",
      fi: "fi",
      tl: "tl",
      my: "my",
    };
    return map[lang] || "en";
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 获取初始语言
  // ───────────────────────────────────────────────────────────────────────────
  I18nCore.prototype._getInitialLanguage = function () {
    // 1. localStorage 用户偏好
    try {
      var saved = localStorage.getItem("userLanguage");
      if (saved && _getNativeNames()[saved]) return saved;
    } catch (e) {
      /* ignore */
    }
    // 2. 浏览器语言检测
    return _detectBrowserLanguage();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 翻译键路径解析（缓存点号路径分割结果）
  // ───────────────────────────────────────────────────────────────────────────
  I18nCore.prototype._getKeyPath = function (key) {
    if (!this.keyPathCache.has(key)) {
      this.keyPathCache.set(key, key.split("."));
    }
    return this.keyPathCache.get(key);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 从对象中沿点号路径取值
  // ───────────────────────────────────────────────────────────────────────────
  I18nCore.prototype._resolve = function (obj, key) {
    if (!obj || !key) return key;
    var parts = this._getKeyPath(key);
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      cur = cur ? cur[parts[i]] : undefined;
    }
    return cur !== undefined ? cur : key;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // BOM 清理 + 递归标准化键名
  // ───────────────────────────────────────────────────────────────────────────
  I18nCore.prototype._normalizeKeys = function (obj) {
    if (Array.isArray(obj)) return obj.map(this._normalizeKeys.bind(this));
    if (!obj || typeof obj !== "object") return obj;
    var result = {};
    var self = this;
    Object.keys(obj).forEach(function (k) {
      var clean = typeof k === "string" ? k.replace(/^\uFEFF/, "") : k;
      result[clean] = self._normalizeKeys(obj[k]);
    });
    return result;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 品牌变量 {brand} 插值
  // ───────────────────────────────────────────────────────────────────────────
  I18nCore.prototype._interpolate = function (val) {
    if (typeof val !== "string") return val;
    var brand =
      this._brandName ||
      (this._brandName = (global.SITE_CONFIG && global.SITE_CONFIG.brand && global.SITE_CONFIG.brand.name) || "Brand");
    return val.replace(/\{brand\}/g, brand);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 获取 BASE_PATH（用于拼接翻译 JSON URL）
  // ───────────────────────────────────────────────────────────────────────────
  I18nCore.prototype._basePath = function () {
    return (typeof global.BASE_PATH !== "undefined" && global.BASE_PATH) || "";
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 核心 API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * 获取当前语言代码
   * @returns {string}
   */
  I18nCore.prototype.currentLang = function () {
    return this.currentLanguage;
  };

  /**
   * 加载指定语言的翻译数据（UI + Product 合并）
   * @param {string} lang - 语言代码
   * @returns {Promise<Object>}
   */
  I18nCore.prototype.load = function (lang) {
    // 如果三个缓存都存在，直接返回
    if (this.translationsCache.has("ui-" + lang) && this.translationsCache.has("product-" + lang)) {
      return Promise.resolve(this.translationsCache.get(lang));
    }
    // 如果已有 pending load，复用
    if (this.pendingLoads.has(lang)) return this.pendingLoads.get(lang);

    var self = this;
    var promise = this._loadUITranslations(lang)
      .then(function (ui) {
        return self._loadProductTranslations(lang).then(function (prod) {
          var merged = _extend({}, ui, prod);
          self.translationsCache.set(lang, merged);
          return merged;
        });
      })
      .catch(function (err) {
        console.error("[i18n-core] load failed for", lang, err);
        if (lang !== "en") return self.load("en");
        throw err;
      });

    this.pendingLoads.set(lang, promise);
    return promise.finally(function () {
      self.pendingLoads.delete(lang);
    });
  };

  /**
   * 加载 UI 翻译 JSON（含 localStorage 缓存）
   * @param {string} lang
   * @returns {Promise<Object>}
   */
  I18nCore.prototype._loadUITranslations = function (lang) {
    var cacheKey = "ui-" + lang;
    if (this.translationsCache.has(cacheKey)) {
      return Promise.resolve(this.translationsCache.get(cacheKey));
    }

    var storageKey = "yukoli-translations-" + cacheKey;
    var self = this;

    // 非开发者模式：尝试 localStorage 缓存
    if (!_isDev) {
      try {
        var raw = localStorage.getItem(storageKey);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (
            parsed &&
            typeof parsed === "object" &&
            parsed.data &&
            typeof parsed.data === "object" &&
            parsed.timestamp &&
            Date.now() - parsed.timestamp < 86400000 &&
            parsed._v === 3
          ) {
            self.translationsCache.set(cacheKey, parsed.data);
            return Promise.resolve(parsed.data);
          }
          // 过期或版本不匹配，清除
          try {
            localStorage.removeItem(storageKey);
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        console.warn("[i18n-core] localStorage read failed for", lang, e.message);
        try {
          localStorage.removeItem(storageKey);
        } catch (e2) {
          /* ignore */
        }
      }
    }

    if (typeof fetch !== "function") {
      if (lang !== "en") return this._loadUITranslations("en");
      return Promise.reject(new Error("fetch not available"));
    }

    var bp = this._basePath();
    // Use absolute URL to prevent relative path resolution issues in dev mode
    var origin = (global.location && global.location.origin) || "";
    var url = origin + bp + "/assets/lang/" + lang + "-ui.json";

    // Dev mode debugging: log the fetch URL for easier troubleshooting
    if (_isDev) {
      // dev mode: url is absolute with origin
    }

    return _withTimeout(
      fetch(url, { cache: _isDev ? "no-store" : "default" })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status + ": " + res.statusText);
          return res.json();
        })
        .then(function (data) {
          var normalized = self._normalizeKeys(data);
          self.translationsCache.set(cacheKey, normalized);
          if (!_isDev) {
            try {
              localStorage.setItem(storageKey, JSON.stringify({ timestamp: Date.now(), _v: 2, data: normalized }));
            } catch (e) {
              /* ignore quota errors */
            }
          }
          return normalized;
        })
        .catch(function (err) {
          console.error("[i18n-core] loadUITranslations failed for", lang, err);
          if (lang !== "en") return self._loadUITranslations("en");
          throw err;
        }),
      5000,
      "[i18n-core] loadUITranslations timeout for " + lang
    );
  };

  /**
   * 从 PRODUCT_DATA_TABLE 提取产品翻译
   * @param {string} lang
   * @returns {Promise<Object>}
   */
  I18nCore.prototype._loadProductTranslations = function (lang) {
    var cacheKey = "product-" + lang;
    if (this.translationsCache.has(cacheKey)) {
      return Promise.resolve(this.translationsCache.get(cacheKey));
    }

    var self = this;
    return Promise.resolve().then(function () {
      var suffix =
        lang.charAt(0).toUpperCase() +
        lang.slice(1).replace(/-([a-z])/g, function (m, c) {
          return c.toUpperCase();
        });
      var table = global.PRODUCT_DATA_TABLE || [];
      var map = {};
      var fields = [
        "name",
        "specifications",
        "usage",
        "throughput",
        "material",
        "sub_category",
        "tier",
        "badge",
        "control_method",
        "product_dimensions",
        "color",
      ];
      table.forEach(function (cat) {
        var prods = cat.products || [];
        prods.forEach(function (p) {
          var pid = p._productId || p.id;
          if (!pid) return;
          var entry = {};
          fields.forEach(function (f) {
            var val = p[f + suffix];
            if (val) entry[f] = val;
          });
          if (Object.keys(entry).length > 0) map[pid] = entry;
        });
      });
      self.translationsCache.set(cacheKey, map);
      global._productTranslations = map;
      return map;
    });
  };

  /**
   * 翻译单个 key
   * 查找优先级：ui-{lang} > product-{lang} > {lang} > key fallback
   * @param {string} key - 翻译键（支持点号路径）
   * @returns {string}
   */
  I18nCore.prototype.t = function (key) {
    var lang = this.currentLanguage;

    // 1. UI 翻译
    var ui = this.translationsCache.get("ui-" + lang);
    if (ui) {
      var val = this._resolve(ui, key);
      if (val && val !== key) return this._interpolate(val);
    }

    // 2. Product 翻译
    var prod = this.translationsCache.get("product-" + lang);
    if (prod) {
      val = this._resolve(prod, key);
      if (val && val !== key) return this._interpolate(val);
    }

    // 3. 合并缓存（旧版兼容）
    var merged = this.translationsCache.get(lang);
    if (merged) {
      val = this._resolve(merged, key);
      if (val && val !== key) return this._interpolate(val);
    }

    return key;
  };

  /**
   * 切换语言
   * @param {string} lang - 目标语言代码
   * @returns {Promise<void>}
   */
  I18nCore.prototype.setLanguage = function (lang) {
    var self = this;
    if (self._switchingTo === lang) return Promise.resolve();
    self._switchingTo = lang;

    if (!_getNativeNames()[lang]) {
      self._switchingTo = null;
      return Promise.reject(new Error("Unsupported language: " + lang));
    }

    if (this.currentLanguage === lang) {
      self._switchingTo = null;
      return Promise.resolve();
    }

    return Promise.all([
      this._loadUITranslations(lang),
      this._loadProductTranslations(lang).catch(function (err) {
        console.warn("[i18n-core] product translations for", lang, "failed:", err.message);
      }),
    ])
      .then(function () {
        // 确保 en 已加载作为 fallback
        var ensureEn =
          lang !== "en" && !self.translationsCache.has("ui-en")
            ? self._loadUITranslations("en").catch(function () {})
            : Promise.resolve();
        return ensureEn.then(function () {
          var prev = self.currentLanguage;
          self.currentLanguage = lang;
          try {
            localStorage.setItem("userLanguage", lang);
          } catch (e) {
            /* ignore */
          }
          self._emit("languageChanged", { language: lang, previousLanguage: prev });
          self._switchingTo = null;
        });
      })
      .catch(function (err) {
        self._switchingTo = null;
        console.error("[i18n-core] setLanguage failed for", lang, err);
        if (lang !== "en") return self.setLanguage("en");
      });
  };

  /**
   * 事件：注册监听器
   * @param {string} event
   * @param {Function} fn
   */
  I18nCore.prototype.on = function (event, fn) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(fn);
  };

  /**
   * 事件：触发
   * @param {string} event
   * @param {*} data
   */
  I18nCore.prototype._emit = function (event, data) {
    var listeners = this.eventListeners.get(event) || [];
    listeners.forEach(function (fn) {
      fn(data);
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 导出
  // ───────────────────────────────────────────────────────────────────────────

  var instance = new I18nCore();

  // 注册为 window.i18n
  global.i18n = {
    load: function (lang) {
      return instance.load(lang);
    },
    t: function (key) {
      return instance.t(key);
    },
    currentLang: function () {
      return instance.currentLang();
    },
    setLanguage: function (lang) {
      return instance.setLanguage(lang);
    },
    on: function (evt, fn) {
      instance.on(evt, fn);
    },
    _core: instance,
  };

  // 兼容 window.t() — 当 translations.js 尚未加载时提供 fallback
  // 如果 translations.js 先加载并设置了 window.t，则这个会被覆盖
  if (typeof global.t !== "function") {
    global.t = function (key) {
      return instance.t(key);
    };
  }

  // 兼容 __safe.t() 桥接
  // window.__safe 已在 runtime-guard.js 中定义，若已存在则跳过
})(window);
