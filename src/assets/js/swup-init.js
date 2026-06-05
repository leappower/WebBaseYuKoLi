/**
 * swup-init.js — SWUP SPA 路由初始化入口
 *
 * 职责:
 *   1. 从 swup-bundle.umd.js 调用 __initSwup() 启动 SWUP 实例
 *   2. 事件兼容层: 初始 spa:ready 派发（导航时由 swup-bundle.umd.js 派发）
 *   3. 暴露 window.__swupInit 供外部调用
 *
 * 依赖 (必须在此之前加载):
 *   - swup-bundle.umd.js (SWUP vendor + initSwup 函数定义 + SpaRouter 兼容层)
 *
 * JJC-020 T0.1: 将 SWUP 初始化从 swup-bundle.umd.js IIFE 中迁移至独立文件
 * JJC-020 T4.2: 简化事件兼容层，spa:ready 由 swup-bundle.umd.js 的 page:view 钩子统一派发
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
    // 初始 spa:ready 派发（页面首次加载已完成初始渲染）
    // 后续 SPA 导航的 spa:ready 由 swup-bundle.umd.js 的 page:view 钩子派发
    setupEventCompatibility();
  }

  /**
   * 事件兼容层（T4.2 简化版）
   *
   * swup-bundle.umd.js 的 page:view 钩子已同时派发 spa:load + spa:ready。
   * 此处仅保留初始 spa:ready 派发（页面首次加载时触发）。
   */
  function setupEventCompatibility() {
    Promise.resolve().then(function () {
      document.dispatchEvent(new CustomEvent("spa:ready", { bubbles: true }));
    });
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
