/**
 * swup-init.js — SWUP SPA 路由初始化入口
 *
 * 职责:
 *   1. 从 swup-bundle.umd.js 调用 __initSwup() 启动 SWUP 实例
 *   2. 事件兼容层: spa:load + spa:ready 派发
 *   3. 暴露 window.__swupInit 供外部调用
 *
 * 依赖 (必须在此之前加载):
 *   - swup-bundle.umd.js (SWUP vendor + initSwup 函数定义 + SpaRouter 兼容层)
 *
 * JJC-020 T0.1: 将 SWUP 初始化从 swup-bundle.umd.js IIFE 中迁移至独立文件
 */
(function (global) {
  "use strict";

  var initCalled = false;

  /**
   * 初始化 SWUP 实例
   * 可在页面加载后任意时刻调用（幂等 — 多次调用忽略）
   */
  function initSwup() {
    if (initCalled) return;
    initCalled = true;

    // 检查 SWUP vendor 是否已加载
    if (typeof global.Swup === "undefined") {
      console.warn("[SWUP-Init] Swup library not loaded. Retrying in 100ms…");
      global.setTimeout(initSwup, 100);
      return;
    }

    // 调用 swup-bundle.umd.js 暴露的 initSwup 函数
    if (typeof global.__initSwup !== "function") {
      console.error("[SWUP-Init] __initSwup not found — swup-bundle.umd.js may not be loaded");
      return;
    }

    global.__initSwup();

    // ─── 事件兼容层 ───
    // 在原有 spa:load 基础上增加 spa:ready 事件
    // spa:ready 在 spa:load 之后通过 microtask 触发
    setupEventCompatibility();
  }

  /**
   * 事件兼容层
   *
   * swup-bundle.umd.js 中的 page:view 钩子已派发 spa:load。
   * 此处监听 content:replace 派发 spa:load（内容替换后立即触发），
   * 并在 spa:load 后通过 microtask 派发 spa:ready。
   */
  function setupEventCompatibility() {
    // content:replace 钩子 — 内容替换后立即派发 spa:load
    var origContentReplace = null;

    // 需要等 swup 实例就绪后 hook 进去
    // 由于 initSwup 同步执行，swup 此时应已创建
    // 但我们不能直接访问 swup 变量（它在 IIFE 闭包内）…
    // 通过监听自定义事件的方式来 hook

    // 方案: 用 mutation observer 监测 #spa-content 变化
    // 来触发 spa:ready
    var spaContent = document.getElementById("spa-content");
    if (spaContent) {
      var observer = new MutationObserver(function () {
        // spa:ready = spa:load 后的下一个 microtask
        Promise.resolve().then(function () {
          document.dispatchEvent(new CustomEvent("spa:ready", { bubbles: true }));
        });
      });

      observer.observe(spaContent, {
        childList: true,
        subtree: true,
        characterData: false,
      });

      // spa:ready 初始触发 (页面首次加载已完成初始渲染)
      Promise.resolve().then(function () {
        document.dispatchEvent(new CustomEvent("spa:ready", { bubbles: true }));
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 启动
  // ═══════════════════════════════════════════════════════════════════

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSwup);
  } else {
    initSwup();
  }

  // 暴露 initSwup 供外部调用 (e.g. 从浏览器控制台重初始化)
  global.__swupInit = initSwup;
})(window);
