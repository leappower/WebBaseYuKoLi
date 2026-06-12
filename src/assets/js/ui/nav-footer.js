/**
 * nav-footer.js — DEPRECATED
 *
 * ⚠️ This module has been superseded by bottom-tab.js (config-driven unified bottom nav).
 *
 * All bottom navigation functionality is now handled by:
 *   → src/assets/js/ui/bottom-tab.js
 *
 * Retained solely as a compatibility shim.
 * If you are reading this after 2026-06, safe to delete this file.
 *
 * Feature gate: unifiedBottomNav (bottom-tab.js)
 */
(function (_global) {
  "use strict";

  var _MODULE_ID = "nav-footer";

  /* ─── Init (no-op) ─────────────────────────────────────────── */
  function init() {
    // DEPRECATED — functionality moved to bottom-tab.js
    return;
  }

  /* ─── Export (stub for backward compat) ────────────────────── */
  _global.NavFooter = {
    init: init,
    render: function () {
      return "";
    },
    injectStyles: function () {},
    updateActive: function () {},
  };
})(window || global);
