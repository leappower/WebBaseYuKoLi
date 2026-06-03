/**
 * device-utils.js — 统一的设备判断工具类
 *
 * 功能：
 * - 统一的屏幕尺寸判断（基于视口宽度 window.innerWidth）
 * - 统一的设备类型判断（Mobile / Tablet / PC）
 * - 统一的断点管理（<768 / 768-1279 / >=1280）
 * - 设备特定页面路径生成
 * - 响应式重定向判断
 *
 * 使用方式：
 *   // 判断设备类型
 *   if (DeviceUtils.isMobile()) { ... }
 *   if (DeviceUtils.isTablet()) { ... }
 *   if (DeviceUtils.isPC()) { ... }
 *
 *   // 获取设备类型
 *   var deviceType = DeviceUtils.getDeviceType();
 *   // deviceType: 'mobile' | 'tablet' | 'pc'
 *
 *   // 获取设备特定页面路径
 *   var devicePath = DeviceUtils.getDevicePagePath('/pages/home/index.html');
 *   // devicePath: '/pages/home/index-mobile.html' (tablet)
 *
 *   // 判断是否需要重定向
 *   if (DeviceUtils.shouldRedirect('index.html')) {
 *     // 重定向到设备特定页面
 *   }
 *
 * 注意：
 * - 使用 window.innerWidth（视口宽度）而非 screen.width（物理屏幕宽度）
 * - 视口宽度更符合响应式设计，随窗口大小变化
 * - 物理屏幕宽度不随窗口大小变化
 *
 * 依赖：无（纯工具类）
 */

(function (global) {
  "use strict";

  /**
   * 设备类型枚举
   */
  var DeviceType = {
    MOBILE: "mobile",
    TABLET: "tablet",
    PC: "pc",
  };

  /**
   * 断点配置
   * 与 Tailwind 默认断点保持一致
   */
  var Breakpoints = {
    MOBILE_MAX: 767, // < 768px
    TABLET_MIN: 768, // >= 768px
    TABLET_MAX: 1279, // < 1280px
    PC_MIN: 1280, // >= 1280px
  };

  /**
   * 预注册 matchMedia 监听，用于精确的断点变化通知。
   * getDeviceType() 仍然使用 window.innerWidth 做实时判断，
   * matchMedia 仅用于监听跨越断点的时机。
   */
  var _mqBreakpoints = null;

  function initMatchMedia() {
    if (_mqBreakpoints) return;
    _mqBreakpoints = {
      mobile: window.matchMedia("(max-width: 767px)"),
      tablet: window.matchMedia("(min-width: 768px) and (max-width: 1279px)"),
      pc: window.matchMedia("(min-width: 1280px)"),
    };
  }

  /**
   * 获取当前屏幕宽度（视口宽度）
   * 使用 window.innerWidth 而非 screen.width，因为：
   * - window.innerWidth 是视口宽度（不包括滚动条）
   * - screen.width 是物理屏幕宽度（不随窗口大小变化）
   * - 响应式布局应该基于视口宽度
   *
   * @returns {number} 视口宽度（px）
   */
  function getScreenSize() {
    return window.innerWidth;
  }

  /**
   * 判断当前设备类型
   * 使用 matchMedia 查询，与 CSS 断点完全一致，
   * 不会出现 JS 判定与 CSS @media 不一致的情况。
   *
   * @returns {string} DeviceType.MOBILE | DeviceType.TABLET | DeviceType.PC
   */
  function getDeviceType() {
    initMatchMedia();

    if (_mqBreakpoints.mobile.matches) {
      return DeviceType.MOBILE;
    }
    if (_mqBreakpoints.tablet.matches) {
      return DeviceType.TABLET;
    }
    return DeviceType.PC;
  }

  /**
   * 判断是否为 Mobile
   *
   * @returns {boolean} 是否为 Mobile
   */
  function isMobile() {
    return getDeviceType() === DeviceType.MOBILE;
  }

  /**
   * 判断是否为 Tablet
   *
   * @returns {boolean} 是否为 Tablet
   */
  function isTablet() {
    return getDeviceType() === DeviceType.TABLET;
  }

  /**
   * 判断是否为 PC
   *
   * @returns {boolean} 是否为 PC
   */
  function isPC() {
    return getDeviceType() === DeviceType.PC;
  }

  /**
   * 获取设备特定页面文件名
   *
   * @param {string} basePath - 基础路径，如 '/pages/home/index.html'
   * @returns {string} 设备特定路径，如 '/pages/home/index-mobile.html'
   */
  function getDevicePagePath(basePath) {
    // 如果不是 index.html 相关路径，返回原值
    if (!basePath) {
      return basePath;
    }

    // 正则匹配所有 index.html / index-pc.html / index-tablet.html / index-mobile.html
    var idxMatch = basePath.match(/^(.*\/)index(?:-(?:pc|tablet|mobile))?\.html$/);
    if (!idxMatch) {
      return basePath;
    }

    var baseDir = idxMatch[1]; // e.g. "/pages/home/" or "/solutions/" or ""
    var deviceType = getDeviceType();
    var suffix;

    switch (deviceType) {
      case DeviceType.MOBILE:
        suffix = "index-mobile.html";
        break;
      case DeviceType.TABLET:
        suffix = "index-tablet.html";
        break;
      case DeviceType.PC:
        suffix = "index-pc.html";
        break;
      default:
        suffix = "index-mobile.html";
    }

    return baseDir + suffix;
  }

  /**
   * 判断是否需要重定向到设备特定页面
   *
   * @param {string} currentFile - 当前文件名，如 'index.html' 或 'index-mobile.html'
   * @returns {boolean} 是否需要重定向
   */
  function shouldRedirect(currentFile) {
    // 如果当前文件名为空（目录 URL），不需要重定向
    if (!currentFile || currentFile === "") {
      return false;
    }

    var deviceType = getDeviceType();
    var targetFile;

    switch (deviceType) {
      case DeviceType.MOBILE:
        targetFile = "index-mobile.html";
        break;
      case DeviceType.TABLET:
        targetFile = "index-tablet.html";
        break;
      case DeviceType.PC:
        targetFile = "index-pc.html";
        break;
      default:
        targetFile = "index.html";
    }

    // 特殊情况：PC 访问 index.html 不需要重定向（保持干净 URL）
    if (deviceType === DeviceType.PC && currentFile === "index.html") {
      return false;
    }

    // 如果当前文件不是目标文件，需要重定向
    return currentFile !== targetFile;
  }

  /**
   * 判断是否为目录 URL（SPA 导航使用）
   * 目录 URL 以 '/' 结尾，如 '/products/'
   *
   * @returns {boolean} 是否为目录 URL
   */
  function isDirectoryURL() {
    var pathname = window.location.pathname;
    return pathname.endsWith("/") || pathname === "";
  }

  // 设备类型变化检测
  var lastDeviceType = getDeviceType();
  var deviceChangeCallbacks = [];

  /**
   * 监听设备类型变化
   * @param {Function} callback - 设备类型变化时的回调函数
   */
  function onDeviceChange(callback) {
    if (typeof callback === "function") {
      deviceChangeCallbacks.push(callback);
    }
  }

  /**
   * 检查设备类型是否变化，并通知所有回调
   */
  function checkDeviceChange() {
    initMatchMedia();
    var currentDeviceType = getDeviceType();
    if (currentDeviceType !== lastDeviceType) {
      var oldDeviceType = lastDeviceType;
      lastDeviceType = currentDeviceType;

      deviceChangeCallbacks.forEach(function (callback) {
        try {
          callback(currentDeviceType, oldDeviceType);
        } catch (e) {
          console.error("[DeviceUtils] Error in device change callback:", e);
        }
      });
    }
  }

  /**
   * 初始化 matchMedia change 监听
   * 代替 resize + 防抖方案：
   * - resize 在每次窗口大小变化时都触发，浪费性能
   * - matchMedia change 只在条件真值跨断点时触发，更精确
   * - 三个断点互斥，但各自独立监听确保不会遗漏
   */
  function initResizeListener() {
    initMatchMedia();

    _mqBreakpoints.mobile.addEventListener("change", checkDeviceChange);
    _mqBreakpoints.tablet.addEventListener("change", checkDeviceChange);
    _mqBreakpoints.pc.addEventListener("change", checkDeviceChange);

    // 初始检查
    setTimeout(checkDeviceChange, 100);
  }

  // 公开 API
  window.DeviceUtils = {
    DeviceType: DeviceType,
    Breakpoints: Breakpoints,
    /** 获取 matchMedia 断点对象（只读），供外部直接查询 */
    getMqBreakpoints: function () {
      initMatchMedia();
      return _mqBreakpoints;
    },
    getScreenSize: getScreenSize,
    getDeviceType: getDeviceType,
    isMobile: isMobile,
    isTablet: isTablet,
    isPC: isPC,
    getDevicePagePath: getDevicePagePath,
    shouldRedirect: shouldRedirect,
    isDirectoryURL: isDirectoryURL,
    onDeviceChange: onDeviceChange,
    initResizeListener: initResizeListener,
    getLastDeviceType: function () {
      return lastDeviceType;
    },
  };

  // 初始化窗口大小变化监听
  if (typeof window !== "undefined") {
    setTimeout(initResizeListener, 0);
  }
})(typeof window !== "undefined" ? window : global);
