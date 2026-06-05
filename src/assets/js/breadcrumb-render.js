/**
 * breadcrumb-render.js — 面包屑渲染层
 *
 * 纯 DOM API，不使用 innerHTML。
 * 通过 document.createElement() 构建 DOM 树，通过 classList.add() 批量添加 Tailwind 原子类。
 *
 * 职责：
 *   1. buildDesktopBreadcrumb(segments) → HTMLElement
 *   2. buildMobileBackBar(segments) → HTMLElement
 *   3. buildSiblings(siblings, labelMap) → HTMLElement
 *   4. clearContainer(container) → void
 *   5. renderAll(container, segments, siblings, options) → void
 */

(function () {
  "use strict";

  if (window.BreadcrumbRender) return;
  var BreadcrumbRender = (window.BreadcrumbRender = {});

  // ═══════════════════════════════════════════════════════════════
  // 内部工具
  // ═══════════════════════════════════════════════════════════════

  /**
   * 创建文本节点
   */
  function text(str) {
    return document.createTextNode(String(str || ""));
  }

  /**
   * 创建元素并批量添加类名
   * @param {string} tag
   * @param {string[]} classes
   * @returns {HTMLElement}
   */
  function el(tag, classes) {
    var elem = document.createElement(tag);
    if (classes && classes.length) {
      elem.classList.add.apply(elem.classList, classes);
    }
    return elem;
  }

  /**
   * 创建链接元素
   */
  function link(href, label, classes) {
    var a = el("a", classes || []);
    a.href = href || "";
    a.textContent = String(label || "");
    if (href) {
      a.setAttribute("data-no-swup", "");
    }
    return a;
  }

  /**
   * 渲染 Chevron 分隔符
   */
  function chevron() {
    var span = el("span", ["mx-1.5", "text-slate-300", "dark:text-slate-600"]);
    span.textContent = "/";
    return span;
  }

  /**
   * 渲染移动端 Chevron
   */
  function chevronMobile() {
    var span = el("span", ["mx-1", "text-slate-300", "text-xs"]);
    span.textContent = "/";
    return span;
  }

  // ═══════════════════════════════════════════════════════════════
  // 公开 API
  // ═══════════════════════════════════════════════════════════════

  /**
   * 构建 PC/Tablet 面包屑
   * @param {Array} segments — [{label, href, current}]
   * @returns {HTMLElement} 完整的面包屑容器 div
   */
  BreadcrumbRender.buildDesktopBreadcrumb = function (segments) {
    if (!segments || !segments.length) return null;

    var container = el("div", ["pt-4", "pb-0", "hidden", "md:block", "px-3", "sm:px-6", "lg:px-8"]);
    var nav = el("nav", ["breadcrumb-nav", "text-sm", "text-slate-500", "dark:text-slate-400", "py-4"]);
    nav.setAttribute("aria-label", "Breadcrumb");
    var ol = el("ol", ["flex", "items-center", "gap-1", "flex-wrap"]);
    nav.appendChild(ol);
    container.appendChild(nav);

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];

      if (i > 0) {
        ol.appendChild(chevron());
      }

      var li = el("li");
      if (seg.href && !seg.current) {
        var a = link(seg.href, seg.label, ["hover:text-primary", "transition-colors"]);
        // 为 i18n key 添加 data-i18n 属性
        if (
          seg.label &&
          typeof seg.label === "string" &&
          /^[a-z_]/.test(seg.label) &&
          seg.label.indexOf(" ") === -1 &&
          seg.label.indexOf(":") === -1
        ) {
          a.setAttribute("data-i18n", seg.label);
        }
        li.appendChild(a);
      } else {
        var span = el("span", ["text-slate-900", "dark:text-white", "font-medium"]);
        if (seg.current) {
          span.id = "breadcrumb-current";
        }
        span.textContent = String(seg.label || "");
        li.appendChild(span);
      }

      ol.appendChild(li);
    }

    return container;
  };

  /**
   * 构建 Mobile 返回栏
   * @param {Array} segments
   * @param {Object} [options]
   * @param {string} [options.backLabel="返回"] — 返回按钮 aria-label
   * @param {Function} [options.goBackFn] — goBack 回调
   * @returns {HTMLElement}
   */
  BreadcrumbRender.buildMobileBackBar = function (segments, options) {
    if (!segments || !segments.length) return null;

    options = options || {};
    var backLabel = options.backLabel || "返回";

    var container = el("div", ["pt-4", "pb-2", "md:hidden", "px-3", "sm:px-6", "lg:px-8"]);
    var flexBox = el("div", ["flex", "items-center", "gap-2"]);

    // 返回按钮
    var btn = el("button", [
      "flex",
      "items-center",
      "justify-center",
      "w-8",
      "h-8",
      "rounded-xl",
      "bg-primary/10",
      "dark:bg-primary/20",
      "text-primary",
      "hover:bg-primary/20",
      "dark:hover:bg-primary/30",
      "transition-all",
      "flex-shrink-0",
      "shadow-sm",
    ]);
    btn.setAttribute("aria-label", backLabel);
    btn.addEventListener("click", function () {
      if (window.Breadcrumb && typeof window.Breadcrumb.goBack === "function") {
        window.Breadcrumb.goBack();
      }
    });
    var iconSpan = document.createElement("span");
    iconSpan.className = "material-symbols-outlined text-lg";
    iconSpan.textContent = "arrow_back";
    btn.appendChild(iconSpan);
    flexBox.appendChild(btn);

    // 导航链
    var linkBox = el("div", ["flex", "items-center", "gap-1", "flex-wrap"]);

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];

      if (i > 0) {
        linkBox.appendChild(chevronMobile());
      }

      if (seg.href && !seg.current) {
        var a = link(seg.href, seg.label, [
          "text-xs",
          "text-slate-500",
          "dark:text-slate-400",
          "hover:text-primary",
          "transition-colors",
        ]);
        linkBox.appendChild(a);
      } else {
        var span = el("span", [
          "text-sm",
          "font-bold",
          "text-slate-900",
          "dark:text-white",
          "truncate",
          "max-w-[160px]",
        ]);
        if (seg.current) {
          span.id = "breadcrumb-current-mobile";
        }
        span.textContent = String(seg.label || "");
        linkBox.appendChild(span);
      }
    }

    flexBox.appendChild(linkBox);
    container.appendChild(flexBox);
    return container;
  };

  /**
   * 构建同级导航
   * @param {Array} siblings — [{href, label, active}]
   * @param {Object} [options]
   * @param {string} [options.sectionLabel] — 分区标签（如"其他品类"）
   * @returns {HTMLElement} 包含 PC 和 Mobile 两套同级导航的容器
   */
  BreadcrumbRender.buildSiblings = function (siblings, options) {
    if (!siblings || siblings.length <= 1) return null;

    options = options || {};
    var sectionLabel = options.sectionLabel || "";

    var wrapper = document.createDocumentFragment();

    // ── PC 版 ──
    var pcDiv = el("div", ["sibling-nav", "hidden", "md:block", "mb-8"]);

    if (sectionLabel) {
      var labelDiv = el("div", [
        "text-xs",
        "font-bold",
        "text-slate-400",
        "dark:text-slate-500",
        "uppercase",
        "tracking-widest",
        "mb-3",
      ]);
      labelDiv.textContent = sectionLabel;
      pcDiv.appendChild(labelDiv);
    }

    var pcFlex = el("div", ["flex", "items-center", "gap-2", "flex-wrap"]);
    for (var i = 0; i < siblings.length; i++) {
      var s = siblings[i];
      if (s.active) continue;
      var a = el("a", [
        "inline-flex",
        "items-center",
        "gap-1.5",
        "px-4",
        "py-2",
        "rounded-full",
        "border",
        "border-slate-200",
        "dark:border-slate-700",
        "text-sm",
        "text-slate-600",
        "dark:text-slate-300",
        "hover:border-primary",
        "hover:text-primary",
        "transition-all",
      ]);
      a.href = s.href;
      if (s.icon) {
        var icon = document.createElement("span");
        icon.className = "text-xs";
        icon.textContent = s.icon;
        a.appendChild(icon);
      }
      var labelText = document.createTextNode(String(s.label || ""));
      a.appendChild(labelText);
      a.setAttribute("data-no-swup", "");
      pcFlex.appendChild(a);
    }
    pcDiv.appendChild(pcFlex);
    wrapper.appendChild(pcDiv);

    // ── Mobile 版 ──
    var mobDiv = el("div", ["sibling-nav", "md:hidden", "mb-6"]);
    var mobScroll = el("div", [
      "flex",
      "items-center",
      "gap-2",
      "overflow-x-auto",
      "pb-2",
      "-mx-4",
      "px-4",
      "scrollbar-hide",
    ]);
    for (var j = 0; j < siblings.length; j++) {
      var sm = siblings[j];
      if (sm.active) continue;
      var mobA = el("a", [
        "flex-shrink-0",
        "inline-flex",
        "items-center",
        "gap-1",
        "px-3",
        "py-1.5",
        "rounded-full",
        "border",
        "border-slate-200",
        "dark:border-slate-700",
        "text-xs",
        "text-slate-600",
        "dark:text-slate-300",
        "hover:border-primary",
        "hover:text-primary",
        "transition-all",
        "whitespace-nowrap",
      ]);
      mobA.href = sm.href;
      if (sm.icon) {
        var mobIcon = document.createElement("span");
        mobIcon.textContent = sm.icon;
        mobA.appendChild(mobIcon);
      }
      mobA.appendChild(document.createTextNode(String(sm.label || "")));
      mobA.setAttribute("data-no-swup", "");
      mobScroll.appendChild(mobA);
    }
    mobDiv.appendChild(mobScroll);
    wrapper.appendChild(mobDiv);

    // 转为实际 div 容器
    var container = el("div", []);
    container.appendChild(wrapper);
    return container;
  };

  /**
   * 清空容器
   * @param {HTMLElement} container
   */
  BreadcrumbRender.clearContainer = function (container) {
    if (!container) return;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  };

  /**
   * 全量渲染（清空容器后按顺序 append）
   *
   * @param {HTMLElement} container — #breadcrumb-container
   * @param {Array} segments — detect() 返回的 segments
   * @param {Array} siblings — 同级导航列表
   * @param {Object} [options]
   * @param {string} [options.backLabel]
   * @param {string} [options.siblingSectionLabel]
   * @param {boolean} [options.skipSiblings] — 如果已有 cross-sell-container 则跳过同级导航
   */
  BreadcrumbRender.renderAll = function (container, segments, siblings, options) {
    if (!container) return;

    options = options || {};

    BreadcrumbRender.clearContainer(container);

    // 1. PC 面包屑
    var bcEl = BreadcrumbRender.buildDesktopBreadcrumb(segments);
    if (bcEl) container.appendChild(bcEl);

    // 2. Mobile 返回栏
    var mbEl = BreadcrumbRender.buildMobileBackBar(segments, options);
    if (mbEl) container.appendChild(mbEl);

    // 3. 同级导航
    if (!options.skipSiblings && siblings && siblings.length > 1) {
      var siblingEl = BreadcrumbRender.buildSiblings(siblings, options);
      if (siblingEl) {
        siblingEl.id = "sibling-wrapper";
        container.appendChild(siblingEl);
      }
    }
  };
})();
