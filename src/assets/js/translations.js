/**
 * translations.js — 翻译加载与语言切换（薄壳层）
 *
 * JJC-020 T2.1: 核心逻辑已迁移至 lib/i18n-core.js，
 * 本文件保留为向后兼容的薄壳层，保持 window.t / window.translationManager 等全局 API。
 *
 * 职责：
 *   - 提供 TranslationManager 类（旧版接口兼容）
 *   - 实例化 translationsManager 单例
 *   - 注册全局 window.t / window.setLanguage / window.reloadTranslations 等
 *   - SPA 事件绑定
 *
 * 加载时序：在 i18n-bundle.js (含 lang-registry + translations-dropdown-template) 之后加载。
 */
(function (global) {
  "use strict";

  // ───────────────────────────────────────────────────────────────────────────
  // 确保 i18n-core 已加载
  // ───────────────────────────────────────────────────────────────────────────
  if (!global.i18n || !global.i18n._core) {
    console.error("[translations.js] i18n-core not loaded — translations unavailable");
    return;
  }

  var core = global.i18n._core;

  // ───────────────────────────────────────────────────────────────────────────
  // 辅助：临时存储 SPA 事件注册（防止重复注册）
  // ───────────────────────────────────────────────────────────────────────────
  var _spaRegs = {};
  function _spaOn(tgt, evt, fn, key) {
    if (_spaRegs[key]) _spaRegs[key].abort();
    var ac = new AbortController();
    _spaRegs[key] = ac;
    tgt.addEventListener(evt, fn, { signal: ac.signal });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TranslationManager — 旧版类兼容（内部委托到 i18n-core）
  // ───────────────────────────────────────────────────────────────────────────
  function TranslationManager() {
    // 委托核心属性
    this.currentLanguage = core.currentLanguage;
    this.translationsCache = core.translationsCache;
    this.pendingLoads = core.pendingLoads;
    this.keyPathCache = core.keyPathCache;
    this.isInitialized = core.isInitialized;
    this.eventListeners = core.eventListeners;
    this.languages = core.languages;
    this.dropdownEl = null;
  }

  // ── 方法：全部委托到 core ──
  var proto = TranslationManager.prototype;

  proto.getInitialLanguage = function () {
    return core._getInitialLanguage();
  };
  proto.detectBrowserLanguage = function () {
    return _detectBrowserLanguage();
  };
  proto.loadTranslations = function (lang) {
    return core.load(lang);
  };
  proto.fetchTranslations = function (lang) {
    return core.load(lang);
  };
  proto.loadUITranslations = function (lang) {
    return core._loadUITranslations(lang);
  };
  proto.loadProductTranslations = function (lang) {
    return core._loadProductTranslations(lang);
  };
  proto.mergeTranslations = function (a, b) {
    return _extend({}, a, b);
  };
  proto.normalizeTranslationKeys = function (obj) {
    return core._normalizeKeys(obj);
  };
  proto.resolveTranslationValue = function (obj, key) {
    return core._resolve(obj, key);
  };
  proto.getKeyPath = function (key) {
    return core._getKeyPath(key);
  };
  proto.interpolate = function (val) {
    return core._interpolate(val);
  };
  proto.translate = function (key) {
    return core.t(key);
  };
  proto.uiText = function (key, fallback) {
    var val = core.t(key);
    return val && val !== key ? val : fallback || key;
  };
  proto.reloadTranslations = function () {
    var lang = core.currentLanguage;
    core.translationsCache.delete(lang);
    core.translationsCache.delete("ui-" + lang);
    core.translationsCache.delete("product-" + lang);
    return core.load(lang);
  };
  proto.on = function (evt, fn) {
    core.on(evt, fn);
  };
  proto.emit = function (evt, data) {
    core._emit(evt, data);
  };
  proto.setLanguage = function (lang) {
    return core.setLanguage(lang);
  };
  proto.setElementTranslation = function (el, text) {
    _setElementTranslation(el, text);
  };
  proto.getDropdown = function () {
    var el =
      this.dropdownEl && document.contains(this.dropdownEl)
        ? this.dropdownEl
        : document.getElementById("language-dropdown");
    this.dropdownEl = el;
    return el;
  };
  proto.openLanguageDropdown = function () {
    _openDropdown(this);
  };
  proto.closeLanguageDropdown = function () {
    _closeDropdown(this);
  };
  proto.toggleLanguageDropdown = function (e) {
    if (e) e.stopPropagation();
    var dd = this.getDropdown();
    if (!dd) {
      this.initDropdownContainer();
      dd = this.getDropdown();
    }
    if (!dd) return;
    dd.style.display === "block" || dd.classList.contains("show")
      ? this.closeLanguageDropdown()
      : this.openLanguageDropdown();
  };
  proto.filterLanguages = function (query) {
    _filterLanguages(query);
  };
  proto.resetLanguageSearch = function () {
    _resetLanguageSearch(this);
  };
  proto.initDropdownContainer = function () {
    _initDropdown(this);
  };
  proto.bindDropdownEvents = function () {
    _bindDropdownEvents(this);
  };
  proto.updateCurrentLanguageLabel = function (lang) {
    _updateLabel(lang, this.languages);
  };
  proto.setupEventListeners = function () {
    _setupListeners(this);
  };
  proto.resetEventListeners = function () {
    this._eventListenersSetup = false;
    this.dropdownEl = null;
  };
  proto.refreshCompanyName = function (uiData) {
    _refreshCompanyName(uiData);
  };
  proto.refreshDocumentTitle = function (uiData) {
    _refreshDocumentTitle(uiData);
  };
  proto.applyTranslations = function () {
    return _applyTranslations(this);
  };
  proto.initialize = function () {
    return _initialize(this);
  };
  proto.recoverFromBfcache = function () {
    return _recoverBfcache(this);
  };
  proto.debug = function () {};

  // ───────────────────────────────────────────────────────────────────────────
  // 被委托的原始函数
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

  function _getNativeNames() {
    return global.LANG_REGISTRY && global.LANG_REGISTRY.getNativeNames ? global.LANG_REGISTRY.getNativeNames() : {};
  }

  function _setElementTranslation(el, text) {
    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {
      var found = false;
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) {
          el.childNodes[i].textContent = text;
          found = true;
          break;
        }
      }
      if (!found) el.textContent = text;
    } else if (el.placeholder !== text) {
      el.placeholder = text;
    }
  }

  function _getFallbackTranslation(key) {
    var curLang = core.currentLanguage;
    if (curLang !== "en") {
      var en = core.translationsCache.get("ui-en");
      if (en) {
        var v = core._resolve(en, key);
        if (!v || v === key) {
          var prefixed = "en_" + key;
          v = core._resolve(en, prefixed);
          if (v === prefixed) v = undefined;
        }
        if (v && v !== key) return v;
      }
    }
    return key;
  }

  function _applyTranslations(self) {
    var curLang = core.currentLanguage;
    var cacheKey = "ui-" + curLang;

    var uiPromise = core.translationsCache.has(cacheKey)
      ? Promise.resolve(core.translationsCache.get(cacheKey))
      : core._loadUITranslations(curLang);

    return uiPromise
      .then(function (uiData) {
        var ensureEn =
          curLang !== "en" && !core.translationsCache.has("ui-en")
            ? core._loadUITranslations("en").catch(function () {})
            : Promise.resolve();
        return ensureEn.then(function () {
          if (!uiData) {
            console.warn("[i18n] applyTranslations: uiTranslations is null/undefined for", curLang);
            return;
          }
          var els = document.querySelectorAll("[data-i18n]");
          var phEls = document.querySelectorAll("[data-i18n-placeholder]");
          var ariaEls = document.querySelectorAll("[data-i18n-aria]");
          var metaEls = document.querySelectorAll("[data-i18n-meta]");
          var labelEl = document.getElementById("current-lang-label");
          var prodData = core.translationsCache.get("product-" + curLang) || {};
          var merged = _extend({}, uiData, prodData);

          function lookup(key) {
            var val = core._resolve(merged, key);
            if ((!val || val === key) && curLang) {
              var prefixed = curLang + "_" + key;
              val = core._resolve(merged, prefixed);
              if (val === prefixed) val = undefined;
            }
            return val && val !== key ? core._interpolate(val) : core._interpolate(_getFallbackTranslation(key));
          }

          var batches = [];
          els.forEach(function (el) {
            var key = el.getAttribute("data-i18n");
            if (el.id === "current-lang-label") return;
            var text = lookup(key);
            if (text && text !== key) batches.push({ el: el, text: text });
          });
          phEls.forEach(function (el) {
            var key = el.getAttribute("data-i18n-placeholder");
            var text = lookup(key);
            if (text && text !== key && el.placeholder !== text) batches.push({ el: el, placeholder: text });
          });
          ariaEls.forEach(function (el) {
            var key = el.getAttribute("data-i18n-aria");
            var text = lookup(key);
            if (text && text !== key) batches.push({ el: el, ariaLabel: text });
          });
          metaEls.forEach(function (el) {
            var key = el.getAttribute("data-i18n-meta");
            var text = lookup(key);
            if (text && text !== key && el.getAttribute("content") !== text)
              batches.push({ el: el, metaContent: text });
          });

          if (batches.length > 0) {
            requestAnimationFrame(function () {
              batches.forEach(function (b) {
                if (b.text) _setElementTranslation(b.el, b.text);
                else if (b.placeholder) b.el.placeholder = b.placeholder;
                else if (b.ariaLabel) b.el.setAttribute("aria-label", b.ariaLabel);
                else if (b.metaContent) b.el.setAttribute("content", b.metaContent);
              });
            });
          }

          // 更新语言标签
          if (labelEl) {
            var nativeName = _getNativeNames()[curLang] || curLang.toUpperCase();
            if (labelEl.textContent !== nativeName) labelEl.textContent = nativeName;
            var btnLabel = document.querySelector(".current-lang-btn-label");
            if (btnLabel && btnLabel.textContent !== nativeName) btnLabel.textContent = nativeName;
          }

          _updateLabel(curLang, self.languages);
          _refreshCompanyName(uiData);
          _refreshDocumentTitle(uiData);
          core._emit("translationsApplied", { language: curLang });
        });
      })
      .catch(function (err) {
        console.error("[i18n] applyTranslations ERROR:", err);
      });
  }

  function _refreshCompanyName(uiData) {
    var name =
      (uiData && core._interpolate(uiData.company_name)) || core._interpolate(_getFallbackTranslation("company_name"));
    if ((!name || name === "company_name") && core.currentLanguage === "zh-CN") name = "佛山市跃迁力科技有限公司";
    if (name && name !== "company_name") {
      document.querySelectorAll('[data-i18n="company_name"]').forEach(function (el) {
        if (el.textContent !== name) el.textContent = name;
      });
    }
  }

  function _refreshDocumentTitle(uiData) {
    if (document.getElementById("page-title")) {
      var title = (uiData && uiData.page_title) || _getFallbackTranslation("page_title");
      if (title && title !== "page_title" && document.title !== title) document.title = title;
    }
  }

  function _updateLabel(lang, languages) {
    var sel = document.getElementById("lang-selector");
    if (sel && sel.value !== lang) sel.value = lang;
    var btn = document.getElementById("lang-toggle-btn");
    if (btn) {
      var labelEl = document.getElementById("current-lang-label");
      if (labelEl) {
        var langName = lang;
        if (Array.isArray(languages)) {
          var found = languages.find(function (l) {
            return l.code === lang;
          });
          if (found) langName = found.name;
        }
        labelEl.textContent = langName;
      }
    }
  }

  function _initDropdown(self) {
    var langs = self.languages || [];
    var curLang = core.currentLanguage || "en";
    if (document.getElementById("language-dropdown")) return;
    if (typeof LanguageDropdownTemplate === "undefined") {
      console.warn("[i18n] LanguageDropdownTemplate not found, attempting to load dynamically");
      var s = document.createElement("script");
      s.src = "/assets/js/translations-dropdown-template.js";
      s.onload = function () {
        _initDropdown(self);
      };
      s.onerror = function () {
        console.error("[i18n] Failed to load LanguageDropdownTemplate");
      };
      document.head.appendChild(s);
      return;
    }
    var html = LanguageDropdownTemplate.createDropdownHTML(langs, curLang);
    var wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    var dd = wrapper.firstChild;
    document.body.appendChild(dd);
    self.dropdownEl = dd;
    _bindDropdownEvents(self);
    _updateLabel(curLang, self.languages);
  }

  function _bindDropdownEvents(self) {
    var dd = self.getDropdown();
    if (!dd) return;
    dd.addEventListener("click", function (e) {
      e.stopPropagation();
    });
    dd.addEventListener("click", function (e) {
      var opt = e.target.closest(".lang-option");
      if (opt) {
        var code = opt.getAttribute("data-code");
        if (code) core.setLanguage(code);
      }
    });
    var input = dd.querySelector('#lang-search-input, input[data-i18n-placeholder="lang_search_placeholder"]');
    if (input) {
      input.addEventListener("input", function (e) {
        _filterLanguages(e.target.value);
      });
    }
  }

  function _openDropdown(self) {
    var dd = self.getDropdown();
    var anchor = document.getElementById("language-dropdown-anchor");
    if (!dd) {
      _initDropdown(self);
      dd = self.getDropdown();
    }
    if (!dd) return;
    dd.style.position = "fixed";
    dd.style.zIndex = "9999";
    dd.style.display = "block";
    dd.classList.add("show");
    if (anchor) {
      var rect = anchor.getBoundingClientRect();
      dd.style.top = rect.bottom + 8 + "px";
      if (window.innerWidth < 768) {
        dd.style.left = "16px";
        dd.style.right = "16px";
        dd.style.width = "auto";
      } else {
        var w = dd.offsetWidth || 240;
        if (window.innerWidth - rect.right + w > window.innerWidth) {
          dd.style.left = Math.max(8, window.innerWidth - w - 8) + "px";
        } else {
          dd.style.left = "";
          dd.style.right = window.innerWidth - rect.right + "px";
        }
      }
    }
  }

  function _closeDropdown(self) {
    var dd = self.getDropdown();
    if (dd) {
      dd.style.display = "none";
      dd.style.left = "";
      dd.style.right = "";
      dd.style.width = "";
      dd.classList.remove("show");
    }
  }

  function _filterLanguages(query) {
    var els = document.querySelectorAll(".lang-option");
    var q = query.toLowerCase();
    els.forEach(function (el) {
      var code = el.getAttribute("data-code").toLowerCase();
      var text = el.textContent.toLowerCase();
      el.style.display = code.indexOf(q) !== -1 || text.indexOf(q) !== -1 ? "" : "none";
    });
  }

  function _resetLanguageSearch(self) {
    var dd = self.getDropdown();
    if (dd) {
      var input = dd.querySelector('input[data-i18n-placeholder="lang_search_placeholder"]');
      if (input) input.value = "";
      _filterLanguages("");
    }
  }

  function _setupListeners(self) {
    if (self._eventListenersSetup) return;
    self._eventListenersSetup = true;
    var container = document.querySelector(".lang-dropdown-container");
    document.addEventListener("click", function (e) {
      if (container && !container.contains(e.target)) _closeDropdown(self);
    });
    var dd = self.getDropdown();
    if (dd) {
      dd.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      dd.addEventListener("click", function (e) {
        var opt = e.target.closest(".lang-option");
        if (opt) {
          var code = opt.getAttribute("data-code");
          if (code) core.setLanguage(code);
        }
      });
      var input = dd.querySelector('#lang-search-input, input[data-i18n-placeholder="lang_search_placeholder"]');
      if (input) {
        input.addEventListener("input", function (e) {
          _filterLanguages(e.target.value);
        });
      }
    }
  }

  function _initialize(self) {
    if (core.isInitialized) return Promise.resolve(self);
    try {
      if (!localStorage.getItem("browserLang")) localStorage.setItem("browserLang", _detectBrowserLanguage());
    } catch (e) {
      /* ignore */
    }

    var lang = core._getInitialLanguage();
    core.currentLanguage = lang;
    _setupListeners(self);

    return Promise.all([
      core._loadUITranslations(lang),
      core._loadProductTranslations(lang).catch(function (err) {
        console.warn("[i18n] initialize: product translations for", lang, "failed:", err.message);
      }),
      lang !== "en" && !core.translationsCache.has("ui-en")
        ? core._loadUITranslations("en").catch(function () {})
        : Promise.resolve(),
    ])
      .then(function () {
        return _applyTranslations(self);
      })
      .then(function () {
        document.documentElement.lang = core.currentLanguage;
        core.isInitialized = true;
        core._emit("initialized", { language: core.currentLanguage });
        global.dispatchEvent(new CustomEvent("productTranslationsLoaded", { detail: { language: lang } }));
      })
      .catch(function (err) {
        console.error("[i18n] initialize FAILED:", err);
        core.currentLanguage = "en";
        return core
          .load("en")
          .then(function () {
            return _applyTranslations(self);
          })
          .then(function () {
            document.documentElement.lang = "en";
            core.isInitialized = true;
            core._emit("initialized", { language: "en" });
          })
          .catch(function (err2) {
            console.error("[i18n] initialize: fallback also FAILED:", err2);
          });
      });
  }

  function _recoverBfcache(self) {
    if (!document.getElementById("language-dropdown")) self.dropdownEl = null;
    _setupListeners(self);
    return _applyTranslations(self)
      .then(function () {
        core._emit("bfcacheRecovered", { language: core.currentLanguage });
      })
      .catch(function (err) {
        console.error("[i18n] recoverFromBfcache FAILED:", err);
        return core.load("en").then(function () {
          return _applyTranslations(self);
        });
      });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 实例化
  // ───────────────────────────────────────────────────────────────────────────
  var manager = new TranslationManager();

  // 自动初始化（DOM ready 后）
  (function autoInit() {
    function tryInit() {
      if (!manager.isInitialized) _initialize(manager);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryInit);
    } else {
      tryInit();
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // 全局导出（向后兼容）
  // ───────────────────────────────────────────────────────────────────────────
  global.t = function (key) {
    return core.t(key);
  };
  global.setLanguage = function (lang) {
    return core.setLanguage(lang);
  };
  global.toggleLanguageDropdown = function (e) {
    return manager.toggleLanguageDropdown(e);
  };
  global.filterLanguages = function (q) {
    return _filterLanguages(q);
  };
  global.translationManager = manager;
  global.TranslationManager = TranslationManager;
  global.reloadTranslations = function () {
    return manager.reloadTranslations();
  };
  global.recoverTranslationsFromBfcache = function () {
    return _recoverBfcache(manager);
  };

  // SPA 事件
  _spaOn(
    document,
    "spa:load",
    function () {
      manager.resetEventListeners();
      _applyTranslations(manager)
        .then(function () {
          document.dispatchEvent(new Event("spa:ready"));
        })
        .catch(function (err) {
          console.warn("[i18n] spa:load applyTranslations failed:", err);
          document.dispatchEvent(new Event("spa:ready"));
        });
    },
    "spa:load:i18n"
  );
})(window);
