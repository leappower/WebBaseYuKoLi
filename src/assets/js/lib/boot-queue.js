/**
 * boot-queue.js — 启动队列（ES5）
 *
 * 替代 56+ 处 document.addEventListener("DOMContentLoaded", fn) 的竞态问题。
 * 按优先级和依赖关系顺序初始化模块。
 *
 * 优先级约定：
 *   0 = i18n / translations
 *   1 = nav / footer / skeleton
 *   2 = spa-router / swup-init
 *   3 = page-level init (breadcrumb, search-engine, page-effects...)
 *   4 = data modules (product-grid, case-grid, contacts...)
 *   5 = enhancements (bottom-tab, slide-menu, floating-actions...)
 *
 * 用法示例：
 *   if (typeof Boot !== "undefined") {
 *     Boot.register("myModule", 3, init);
 *   } else {
 *     document.addEventListener("DOMContentLoaded", init);
 *   }
 */

(function () {
  var queue = [];
  var started = false;
  var ready = false;

  // DOMContentLoaded → 标记 ready，执行队列
  document.addEventListener("DOMContentLoaded", function () {
    ready = true;
    flush();
  });

  // 按 priority 升序执行（同优先级按注册顺序）
  function flush() {
    if (!ready) return;
    queue.sort(function (a, b) {
      return a.priority - b.priority;
    });
    for (var i = 0; i < queue.length; i++) {
      try {
        queue[i].fn();
      } catch (e) {
        if (typeof console !== "undefined") console.warn("[Boot] " + queue[i].name + " failed:", e);
      }
    }
    queue = [];
    started = true;
    dispatchComplete();
  }

  function dispatchComplete() {
    if (typeof document === "undefined") return;
    try {
      var evt = document.createEvent("Event");
      evt.initEvent("boot:complete", false, false);
      document.dispatchEvent(evt);
    } catch (e2) {
      // Some older browsers may not support createEvent
      if (document.createEventObject) {
        document.fireEvent("onboot:complete");
      }
    }
  }

  /**
   * 注册初始化函数
   * @param {string} name    模块名（仅用于日志）
   * @param {number} priority 优先级 (0-5)
   * @param {Function} fn     初始化函数
   */
  function register(name, priority, fn) {
    if (started) {
      // boot 已完成后注册：如果 DOM 已就绪则立即执行，否则挂在 DOMContentLoaded 上
      if (typeof document !== "undefined" && document.readyState !== "loading") {
        fn();
      } else {
        document.addEventListener("DOMContentLoaded", fn);
      }
      return;
    }
    queue.push({ name: name, priority: priority, fn: fn });
  }

  window.Boot = {
    register: register,
    isReady: function () {
      return ready;
    },
  };
})();
