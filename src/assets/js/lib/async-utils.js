/**
 * async-utils.js — 异步工具模块
 *
 * ESM 模块，通过 webpack 打包。
 * 提供 debounce、throttle 和 requestAnimationFrame 包装函数。
 * 提取自 common.js、ui/floating-actions.js、ui/search-engine.js 中的重复实现。
 */

/**
 * Debounce — 防抖
 * 最后一次调用后等待 wait ms 才执行
 * @param {Function} func
 * @param {number} [wait=300]
 * @returns {Function}
 */
export function debounce(func, wait) {
  if (wait === undefined) wait = 300;
  var timeout;
  return function executedFunction() {
    var args = arguments;
    var ctx = this;
    var later = function () {
      clearTimeout(timeout);
      func.apply(ctx, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle — 节流
 * 每 limit ms 最多执行一次
 * @param {Function} func
 * @param {number} [limit=100]
 * @returns {Function}
 */
export function throttle(func, limit) {
  if (limit === undefined) limit = 100;
  var inThrottle;
  return function executedFunction() {
    var args = arguments;
    var ctx = this;
    if (!inThrottle) {
      func.apply(ctx, args);
      inThrottle = true;
      setTimeout(function () {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * requestAnimationFrame 包装 — 下一帧执行
 * 装饰模式，fn 会在下一帧被调用
 * @param {Function} fn
 * @returns {Function} — 返回带 RAF 装饰的版本
 */
export function raf(fn) {
  var rafId = null;
  return function () {
    var args = arguments;
    var ctx = this;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      fn.apply(ctx, args);
    });
  };
}
