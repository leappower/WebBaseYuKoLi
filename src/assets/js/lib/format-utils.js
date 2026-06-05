/**
 * format-utils.js — 格式化工具模块
 *
 * ESM 模块，通过 webpack 打包。
 * 提供日期、价格、数字的格式化函数。
 * 将这些从各文件中提取的通用格式化函数集中管理。
 */

/**
 * HTML-escape a string
 * @param {string} str
 * @returns {string}
 */
export function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 数字千分位格式化
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return "0";
  return Number(num).toLocaleString("en-US");
}

/**
 * 格式化价格（保留两位小数 + 千分位）
 * @param {number} price
 * @param {string} [symbol="¥"]
 * @returns {string}
 */
export function formatPrice(price, symbol) {
  if (price == null || isNaN(price)) return (symbol || "¥") + "0.00";
  symbol = symbol || "¥";
  return (
    symbol +
    Number(price)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return "";
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

/**
 * 格式化日期为 YYYY年MM月DD日
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateCN(date) {
  if (!date) return "";
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.getFullYear() + "年" + String(d.getMonth() + 1) + "月" + String(d.getDate()) + "日";
}
