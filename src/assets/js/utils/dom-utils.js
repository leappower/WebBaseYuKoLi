/**
 * dom-utils.js — Shared DOM safety & helper utilities
 *
 * Provides a centralized `esc()` for HTML-attribute escaping, a safe
 * innerHTML setter (`safeHtml`), and an `EventManager` that ties
 * listeners to an AbortController so they auto-clean up.
 */
(function () {
  "use strict";

  var _root = (typeof window !== "undefined" && window.DomUtils) || {};

  // ─── HTML escaping ──────────────────────────────────────────────
  var _escCache = { "": "" };
  function esc(str) {
    if (str == null) return "";
    var s = String(str);
    if (s.length === 0) return "";
    if (_escCache[s] !== undefined) return _escCache[s];
    var escaped = s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    // Only cache short strings to avoid memory bloat
    if (s.length <= 128) _escCache[s] = escaped;
    return escaped;
  }

  // ─── Safe innerHTML setter (runs esc on all interpolated vars) ──
  /**
   * safeHtml(el, html)
   * Sets innerHTML. Caller is responsible for ensuring html is safe
   * (i.e. all dynamic values already passed through esc()).
   * This exists as a single override-point for audits / CSP migration.
   */
  function safeHtml(el, html) {
    if (!el) return;
    el.innerHTML = html;
  }

  // ─── EventManager ──────────────────────────────────────────────
  /**
   * EventManager — auto-cleanup event listeners via AbortController.
   *
   * Usage:
   *   var em = new DomUtils.EventManager();
   *   em.on(el, 'click', handler);
   *   // later:
   *   em.destroy();  // removes all listeners
   *
   * Or tie to an external AbortSignal:
   *   var em = new DomUtils.EventManager(parentSignal);
   */
  function EventManager(parentSignal) {
    this._ac = null;
    this._count = 0;
    if (parentSignal && parentSignal.aborted) {
      this._ac = new AbortController(); // already aborted
      this._ac.abort();
    } else {
      this._ac = new AbortController();
      if (parentSignal) {
        var self = this;
        parentSignal.addEventListener("abort", function () {
          self.destroy();
        }, { once: true });
      }
    }
  }

  EventManager.prototype.on = function (tgt, evt, fn, opts) {
    if (this._ac.signal.aborted) return this;
    tgt.addEventListener(evt, fn, Object.assign({}, opts || {}, { signal: this._ac.signal }));
    this._count++;
    return this;
  };

  EventManager.prototype.destroy = function () {
    if (this._ac.signal.aborted) return;
    this._ac.abort();
    this._count = 0;
  };

  Object.defineProperty(EventManager.prototype, "active", {
    get: function () { return !this._ac.signal.aborted; }
  });

  // ─── Expose ────────────────────────────────────────────────────
  _root.esc = esc;
  _root.safeHtml = safeHtml;
  _root.EventManager = EventManager;

  if (typeof window !== "undefined") window.DomUtils = _root;
  // Also expose on module system if available
  if (typeof module !== "undefined" && module.exports) {
    module.exports = _root;
  }
})();
