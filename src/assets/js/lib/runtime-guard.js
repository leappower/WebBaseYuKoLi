/**
 * runtime-guard.js — 全局安全存取器
 *
 * JJC-020 T1.1: 解决 P0 级时序问题
 * 全局变量（window.t, window.SITE_CONFIG 等）可能在调用时尚未初始化，
 * 本模块提供安全的 null-safe 存取器。
 *
 * JJC-020 T2.3: 新增 whenReady() 方法，统一替代散落各处的 setTimeout(fn, N) 时序补丁。
 *
 * 使用方式:
 *   window.__safe.t(key, fallback)          → 安全调用 window.t()
 *   window.__safe.config(key, fallback)     → 安全读取 SITE_CONFIG
 *   window.__safe.get(name, fallback)       → 安全读取任意 window 属性
 *   window.__safe.ready(name)               → Promise 等待某全局变量就绪
 *   window.__safe.whenReady(selector, fn)   → 等待 DOM 元素就绪后执行回调
 *   window.__safe.whenReady(fn)             → 等待某条件就绪后执行（传入函数作为条件）
 *
 * 加载时序:
 *   本文件必须在 site.config.js 之前加载（index.html 中设置为最早 script）
 */
(function () {
  "use strict";

  // ───────────────────────────────────────────────────────────────────────────
  // 内部辅助：CSS 选择器或函数作为条件
  // ───────────────────────────────────────────────────────────────────────────
  function _isReady(selectorOrFn) {
    if (typeof selectorOrFn === "function") return selectorOrFn();
    if (typeof selectorOrFn === "string") return document.querySelector(selectorOrFn);
    return false;
  }

  window.__safe = {
    /**
     * 安全调用 window.t(key, fallback)
     * @param {string} key - 翻译键
     * @param {string} [fallback] - 当翻译不可用时的 fallback
     * @returns {string}
     */
    t: function (key, fallback) {
      // Priority: TranslationManager > inline high-frequency keys > fallback > key itself
      if (typeof window.t === "function") {
        var result = window.t(key);
        if (result && result !== key) return result;
      }
      // T1.5: Fallback to inline translations when TranslationManager not ready
      if (window.__inlineTranslations && window.__inlineTranslations[key]) {
        return window.__inlineTranslations[key];
      }
      return fallback || key;
    },

    /**
     * 安全读取 window.SITE_CONFIG 中的配置项
     * @param {string} key - 配置键
     * @param {*} [fallback] - 当值不存在时的 fallback
     * @returns {*}
     */
    config: function (key, fallback) {
      var cfg = window.SITE_CONFIG || {};
      var val = cfg[key];
      return val !== undefined ? val : fallback;
    },

    /**
     * 安全读取任意 window 属性
     * @param {string} name - 属性名
     * @param {*} [fallback] - 当值不存在时的 fallback
     * @returns {*}
     */
    get: function (name, fallback) {
      var val = window[name];
      return val !== undefined ? val : fallback;
    },

    /**
     * 等待某全局变量就绪（返回Promise）
     * 适用于需要在模块加载后执行依赖操作的场景
     * @param {string} name - 全局变量名
     * @returns {Promise<*>}
     */
    ready: function (name) {
      return new Promise(function (resolve) {
        if (window[name]) return resolve(window[name]);
        var check = function () {
          if (window[name]) resolve(window[name]);
        };
        document.addEventListener("spa:ready", check, { once: true });
        document.addEventListener("DOMContentLoaded", check, { once: true });
        // 超时 fallback：最多等 5s，拿不到也 resolve（避免死锁）
        setTimeout(function () {
          resolve(window[name]);
        }, 5000);
      });
    },

    /**
     * 等待 DOM 元素或条件就绪后执行回调。
     *
     * 统一替代散落各处的 `setTimeout(fn, 100/200/300)` 时序补丁。
     * 使用 MutationObserver 监听 DOM 变化，元素出现后立即执行，无需猜测延迟。
     *
     * 用法:
     *   // 等待选择器匹配的元素出现
     *   __safe.whenReady('#my-element', function(el) { ... });
     *
     *   // 等待条件函数返回 truthy
     *   __safe.whenReady(function() { return window.XXX }, function(val) { ... });
     *
     *   // 仅等待选择器，不执行回调（返回 Promise<Element|null>）
     *   __safe.whenReady('#my-element').then(function(el) { ... });
     *
     * @param {string|Function} selectorOrFn - CSS 选择器，或返回 truthy 的条件函数
     * @param {Function} [fn] - 元素/值就绪后执行的回调，接收匹配的 element 或条件返回值
     * @param {number} [timeout] - 超时毫秒（默认 3000，超时后以 null 调用回调）
     * @returns {Promise<Element|*>} 当不传 fn 时返回 Promise
     */
    whenReady: function (selectorOrFn, fn, timeout) {
      timeout = timeout || 3000;

      // 如果不传 fn，返回 Promise
      if (typeof fn !== "function") {
        var self = this;
        return new Promise(function (resolve) {
          self.whenReady(selectorOrFn, resolve, timeout);
        });
      }

      // 立即检查是否已就绪
      var ready = _isReady(selectorOrFn);
      if (ready) {
        try {
          fn(ready);
        } catch (e) {
          console.warn("[__safe.whenReady] callback error:", e);
        }
        return;
      }

      // 如果选择器是字符串，等待元素出现
      if (typeof selectorOrFn === "string") {
        var observer = new MutationObserver(function () {
          var el = document.querySelector(selectorOrFn);
          if (el) {
            observer.disconnect();
            try {
              fn(el);
            } catch (e) {
              console.warn("[__safe.whenReady] callback error:", e);
            }
          }
        });
        observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true,
        });
        // 超时保护
        setTimeout(function () {
          observer.disconnect();
          try {
            fn(null);
          } catch (e) {
            console.warn("[__safe.whenReady] timeout callback error:", e);
          }
        }, timeout);
        return;
      }

      // 如果选择器是函数，轮询检查（最多 300 次，每 10ms）
      if (typeof selectorOrFn === "function") {
        var maxChecks = Math.max(1, Math.floor(timeout / 10));
        var checks = 0;
        function poll() {
          checks++;
          var result = selectorOrFn();
          if (result) {
            try {
              fn(result);
            } catch (e) {
              console.warn("[__safe.whenReady] callback error:", e);
            }
            return;
          }
          if (checks >= maxChecks) {
            try {
              fn(null);
            } catch (e) {
              console.warn("[__safe.whenReady] timeout callback error:", e);
            }
            return;
          }
          setTimeout(poll, 10);
        }
        poll();
      }
    },
  };
})();
