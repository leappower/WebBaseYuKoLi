/**
 * media-queries.js — Responsive breakpoint cache (IIFE build for src/ static HTML)
 * Synced from: src/assets/media-queries.js
 * Global: window.MediaQueries
 *
 * Usage: <script src="../../assets/js/media-queries.js"></script>
 * Then: window.MediaQueries.mqMobile  (boolean)
 */
(function (global) {
  "use strict";

  // ─── matchMedia 缓存 ──────────────────────────────────────────────────────────
  // 将 window.matchMedia 结果缓存为布尔变量，避免在每次渲染 / 事件回调里重复触发
  // 布局计算。通过 'change' 事件保持与实际视口同步。
  // 断点统一采用 DeviceUtils 体系：Mobile <768 / Tablet 768-1279 / PC >=1280
  var _mq767 = window.matchMedia("(max-width: 767px)");
  var _mq640 = window.matchMedia("(max-width: 640px)");
  var _mq1280min = window.matchMedia("(min-width: 1280px)");
  var _mqTabletRange = window.matchMedia("(min-width: 768px) and (max-width: 1279px)");

  /** 视口宽度 ≤ 767px（移动端） */
  var mqMobile = _mq767.matches;
  /** 视口宽度 ≤ 640px（手机竖屏轮播） */
  var mqMobileSmall = _mq640.matches;
  /** 视口宽度 ≥ 1280px（桌面端） */
  var mqDesktop = _mq1280min.matches;
  /** 视口宽度 768px–1279px（平板端） */
  var mqTablet = _mqTabletRange.matches;

  _mq767.addEventListener("change", function (e) {
    mqMobile = e.matches;
    window.MediaQueries.mqMobile = e.matches;
  });
  _mq640.addEventListener("change", function (e) {
    mqMobileSmall = e.matches;
    window.MediaQueries.mqMobileSmall = e.matches;
  });
  _mq1280min.addEventListener("change", function (e) {
    mqDesktop = e.matches;
    window.MediaQueries.mqDesktop = e.matches;
  });
  _mqTabletRange.addEventListener("change", function (e) {
    mqTablet = e.matches;
    window.MediaQueries.mqTablet = e.matches;
  });

  window.MediaQueries = {
    get mqMobile() {
      return mqMobile;
    },
    get mqMobileSmall() {
      return mqMobileSmall;
    },
    get mqDesktop() {
      return mqDesktop;
    },
    get mqTablet() {
      return mqTablet;
    },
    /** 返回当前是否为移动端（<768px）。等同于 mqMobile，语义更直观。 */
    isMobile: function () {
      return mqMobile;
    },
  };
})(window);
