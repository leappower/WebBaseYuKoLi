/**
 * dom-utils.js — DOM 工具模块
 *
 * ESM 模块，通过 webpack 打包。
 * 提供统一的 DOM 选择器、classList 操作、事件绑定工具。
 * 将这些从各文件中提取的通用函数集中管理，减少重复代码。
 *
 * 提取来源：
 *   - common.js: ready()
 *   - breadcrumb-render.js: el(), text(), link()
 *   - 各 UI 组件中的重复 DOM 操作
 */

/**
 * 安全地在 DOM 就绪后执行 fn
 * @param {Function} fn
 */
export function ready(fn) {
  if (typeof Boot !== "undefined") {
    Boot.register("dom-utils", 4, fn);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

/**
 * document.querySelector 简写
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element|null}
 */
export function qs(selector, context) {
  return (context || document).querySelector(selector);
}

/**
 * document.querySelectorAll 简写
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {NodeList}
 */
export function qsa(selector, context) {
  return (context || document).querySelectorAll(selector);
}

/**
 * 创建元素并批量添加类名
 * @param {string} tag
 * @param {string[]} [classes]
 * @returns {HTMLElement}
 */
export function el(tag, classes) {
  var elem = document.createElement(tag);
  if (classes && classes.length) {
    elem.classList.add.apply(elem.classList, classes);
  }
  return elem;
}

/**
 * 创建文本节点
 * @param {string} str
 * @returns {Text}
 */
export function text(str) {
  return document.createTextNode(String(str || ""));
}

/**
 * 创建链接元素
 * @param {string} href
 * @param {string} label
 * @param {string[]} [classes]
 * @returns {HTMLAnchorElement}
 */
export function link(href, label, classes) {
  var a = el("a", classes || []);
  a.href = href || "";
  a.textContent = String(label || "");
  if (href) {
    a.setAttribute("data-no-swup", "");
  }
  return a;
}

/**
 * 清空容器所有子节点
 * @param {HTMLElement} container
 */
export function clearContainer(container) {
  if (!container) return;
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * 将一个元素的 classList 替换为多个类名
 * @param {Element} el
 * @param {string} className — 空格分隔的类名
 */
export function setClass(el, className) {
  if (!el) return;
  el.className = className;
}
