/**
 * template-constants.js — Shared HTML template constants
 *
 * JJC-020 T3.5: Centralizes commonly repeated HTML template strings
 * to reduce CSS class name duplication across components.
 *
 * Usage:
 *   var TEMPLATES = window.TemplateConstants;
 *   el.innerHTML = TEMPLATES.materialIcon('search') + ...;
 *
 * ⚠️  Conservative approach: only extract patterns that appear
 *     in ≥2 independent modules (not over-abstracted).
 *
 * Loaded as a standalone script before any UI component that uses it.
 */

(function (global) {
  "use strict";

  /**
   * Wrap a Material Symbols icon name in the standard tag.
   *   '<span class="material-symbols-outlined">' + icon + '</span>'
   * Used 38× across 6+ dropdown/nav modules.
   */
  function materialIcon(iconName, extraClass) {
    var cls = "material-symbols-outlined";
    if (extraClass) cls += " " + extraClass;
    return '<span class="' + cls + '">' + iconName + "</span>";
  }

  /**
   * Chevron right icon (dropdown arrow indicator).
   *   '<span class="material-symbols-outlined xxx-chevron">chevron_right</span>'
   */
  function chevronRight(prefix) {
    var cls = prefix ? prefix + "-chevron" : "chevron";
    return '<span class="material-symbols-outlined ' + cls + '">chevron_right</span>';
  }

  /**
   * Expand more / less arrow for dropdown triggers.
   *   '<span class="material-symbols-outlined xxx-dropdown-arrow">expand_more</span>'
   */
  function expandArrow(prefix) {
    return '<span class="material-symbols-outlined ' + prefix + '-dropdown-arrow">expand_more</span>';
  }

  /**
   * Dropdown separator.
   *   '<div class="xxx-separator"></div>'
   */
  function separator(prefix) {
    return '<div class="' + prefix + '-separator"></div>';
  }

  /**
   * Popup handle (drag indicator at top of mobile popup).
   *   '<div class="xxx-popup-handle"></div>'
   */
  function popupHandle(prefix) {
    return '<div class="' + prefix + '-popup-handle"></div>';
  }

  /**
   * Dropdown icon wrapper.
   *   '<span class="xxx-icon"><span class="material-symbols-outlined">...</span></span>'
   */
  function dropdownIcon(prefix, iconName) {
    return '<span class="' + prefix + '-icon">' + materialIcon(iconName) + "</span>";
  }

  /**
   * Dropdown label with data-i18n attribute.
   *   '<span class="xxx-label" data-i18n="key">label</span>'
   */
  function dropdownLabel(prefix, key, label) {
    var lbl = label || key;
    return '<span class="' + prefix + '-label" data-i18n="' + key + '">' + lbl + "</span>";
  }

  /**
   * Popup search input (shared by custom-select.js and navigator.js).
   *   '<input type="text" class="cs-popup-search" placeholder="..." data-i18n-placeholder="...">'
   */
  function popupSearchInput() {
    return '<input type="text" class="cs-popup-search" placeholder="搜索..." data-i18n-placeholder="search_placeholder">';
  }

  /**
   * Popup search input (shared by custom-select.js and navigator.js).
   */
  function popupSearchIcon() {
    return '<span class="material-symbols-outlined cs-popup-search-icon">search</span>';
  }

  // ─── CSS icons used across modules ───

  var ICONS = {
    cancel: '<span class="material-symbols-outlined">cancel</span>',
    store: '<span class="material-symbols-outlined">store</span>',
    close: '<span class="material-symbols-outlined">close</span>',
    search: '<span class="material-symbols-outlined">search</span>',
    expandMore: '<span class="material-symbols-outlined">expand_more</span>',
    chevronRight: '<span class="material-symbols-outlined">chevron_right</span>',
    checkCircle: '<span class="material-symbols-outlined">check_circle</span>',
  };

  // ─── Expose ───

  global.TemplateConstants = {
    materialIcon: materialIcon,
    chevronRight: chevronRight,
    expandArrow: expandArrow,
    separator: separator,
    popupHandle: popupHandle,
    dropdownIcon: dropdownIcon,
    dropdownLabel: dropdownLabel,
    popupSearchInput: popupSearchInput,
    popupSearchIcon: popupSearchIcon,
    ICONS: ICONS,
  };
})(typeof window !== "undefined" ? window : this);
