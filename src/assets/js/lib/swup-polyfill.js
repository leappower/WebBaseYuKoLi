/**
 * swup-polyfill.js — SWUP 事件 polyfill
 *
 * JJC-020 T1.3: 为尚未迁移到 SWUP 的模块提供过渡事件。
 *
 * 背景:
 *   swup-init.js 在 SWUP 启用时触发 spa:load 和 spa:ready 事件。
 *   某些模块（如旧版 spa-router.js）不依赖 SWUP，但仍监听这些事件。
 *
 * 行为:
 *   - 如果 window.__swupEnabled === true，polyfill 静默跳过（由 swup-init.js 管理事件）
 *   - 如果 SWUP 未启用，polyfill 在 DOMContentLoaded 时触发 spa:load 一次
 *
 * 约束:
 *   - 不与 swup-init.js 重复触发 spa:load
 *   - 完全独立，零依赖
 *
 * 加载顺序: 应在所有模块之前加载（defer 即可），确保事件在 DOM 解析后触发
 */
(function () {
  "use strict";

  // 如果 SWUP 已启用，polyfill 不做任何事
  if (window.__swupEnabled) return;

  // 防止重复触发
  var fired = false;

  function dispatchSpaLoad() {
    if (fired) return;
    fired = true;

    // 触发 spa:load 事件（兼容模块监听）
    document.dispatchEvent(new CustomEvent("spa:load", { bubbles: true }));

    // 在 microtask 中触发 spa:ready
    Promise.resolve().then(function () {
      document.dispatchEvent(new CustomEvent("spa:ready", { bubbles: true }));
    });
  }

  if (typeof Boot !== "undefined") {
    Boot.register("swup-polyfill", 3, dispatchSpaLoad);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dispatchSpaLoad);
  } else {
    dispatchSpaLoad();
  }
})();
