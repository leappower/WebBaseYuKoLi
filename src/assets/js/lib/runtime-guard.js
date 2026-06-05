/**
 * runtime-guard.js — 全局安全存取器
 *
 * JJC-020 T1.1: 解决 P0 级时序问题
 * 全局变量（window.t, window.SITE_CONFIG 等）可能在调用时尚未初始化，
 * 本模块提供安全的 null-safe 存取器。
 *
 * 使用方式:
 *   window.__safe.t(key, fallback)      → 安全调用 window.t()
 *   window.__safe.config(key, fallback)  → 安全读取 SITE_CONFIG
 *   window.__safe.get(name, fallback)    → 安全读取任意 window 属性
 *   window.__safe.ready(name)            → Promise 等待某全局变量就绪
 *
 * 加载时序:
 *   本文件必须在 site.config.js 之前加载（index.html 中设置为最早 script）
 */
(function () {
  "use strict";

  window.__safe = {
    /**
     * 安全调用 window.t(key, fallback)
     * @param {string} key - 翻译键
     * @param {string} [fallback] - 当翻译不可用时的 fallback
     * @returns {string}
     */
    t: function (key, fallback) {
      return typeof window.t === "function" ? window.t(key) : fallback || key;
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
  };
})();
