/* ═══════════════════════════════════════════════════
   case-grid.js — 案例列表 + 筛选逻辑
   Pure frontend, no backend dependency
   ═══════════════════════════════════════════════════ */

;(function () {
  'use strict'

  /* ── Config Bridge ─────────────────────────────── */
  var _cfg = window.SITE_CONFIG || window._cfg || {};
  var _casesCfg = _cfg.cases || {};
  function esc(s) { if (s == null) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

  /* ── Fallback Data ─────────────────────────────── */
  var _fallbackCases = [
    { slug: 'manila-lunchbox-studio-2025', country: '🇵🇭 Philippines',
      industry: '小型餐饮', volume: '200-500', benefit: 'Fast Payback',
      dailyOutput: 320, laborBefore: 3, laborAfter: 1, monthlySaving: 'PHP 36,000',
      payback: 5.2,
      title: '深圳健康品牌方：从配方打样到月产 50 万袋',
      quote: '"第一次做 OEM 完全没经验，YukoLi 帮我们从零开始，配方调试、FDA 注册到包装设计全搞定。"' },
    { slug: 'jakarta-tea-chain-2025', country: '🇮🇩 Indonesia',
      industry: '连锁品牌', volume: '500-1000', benefit: 'Consistency',
      dailyOutput: 600, laborBefore: 3, laborAfter: 0, monthlySaving: 'IDR 45M',
      payback: 6.0,
      title: '雅加达茶饮连锁：80 门店同步上新，品质零差异',
      quote: '"之前自己找工厂经常断货，现在 YukoLi 统一供货，新品开发周期从 3 个月缩短到 2 周。"' },
    { slug: 'hcmc-ecommerce-brand', country: '🇻🇳 Vietnam',
      industry: '跨境电商', volume: '<200', benefit: 'Cost Efficiency',
      dailyOutput: 150, laborBefore: 0, laborAfter: 0, monthlySaving: 'VND 120M',
      payback: 3.5,
      title: '胡志明市跨境电商：月销 12 万盒胶原蛋白饮',
      quote: '"YukoLi 帮我们搞定 FDA 合规和小包装设计，TikTok Shop 直发货柜，供应链成本降了 40%。"' },
    { slug: 'bangkok-coffee-brand', country: '🇹🇭 Thailand',
      industry: '品牌方', volume: '1000+', benefit: 'Quality',
      dailyOutput: 1200, laborBefore: 0, laborAfter: 0, monthlySaving: 'THB 500K',
      payback: 8.0,
      title: '曼谷咖啡品牌：HACCP 认证加持，顺利打入 7-Eleven 渠道',
      quote: '"YukoLi 的生产资质和品控体系让我们直接进入便利店系统，这是以前不可能做到的。"' },
    { slug: 'kl-health-supplement', country: '🇲🇾 Malaysia',
      industry: '大健康品牌', volume: '1000+', benefit: 'Certification',
      dailyOutput: 2000, laborBefore: 0, laborAfter: 0, monthlySaving: 'MYR 85,000',
      payback: 5.0,
      title: '吉隆坡保健品品牌：三重认证打开东南亚 5 国市场',
      quote: '"HACCP + FDA + ISO 三证齐全，产品进入每个国家都不需要额外审查，非常省心。"' },
    { slug: 'cebu-meal-replacement', country: '🇵🇭 Philippines',
      industry: '品牌方', volume: '200-500', benefit: 'Fast Delivery',
      dailyOutput: 280, laborBefore: 0, laborAfter: 0, monthlySaving: 'PHP 180,000',
      payback: 4.0,
      title: 'Cebu 代餐品牌：MOQ 500 起，7 天打样 4 周交付',
      quote: '"MOQ 低、打样快、质量稳定，YukoLi 是我们试过的最灵活的 OEM 合作方。"' },
    { slug: 'surabaya-weight-loss', country: '🇮🇩 Indonesia',
      industry: '跨境电商', volume: '500-1000', benefit: 'Cost Reduction',
      dailyOutput: 800, laborBefore: 0, laborAfter: 0, monthlySaving: 'IDR 65M',
      payback: 5.5,
      title: '泗水体重管理品牌：FDA 认证燃脂饮月销 10 万瓶',
      quote: '"从配方定制到 FDA 申报全流程服务，我们自己不需要组建任何生产团队。"' },
    { slug: 'shanghai-gut-health', country: '🇨🇳 China',
      industry: '大健康品牌', volume: '<200', benefit: 'R&D',
      dailyOutput: 180, laborBefore: 0, laborAfter: 0, monthlySaving: 'CNY 120,000',
      payback: 3.8,
      title: '上海益生菌品牌：联合研发 3 款功能性冲饮，上市即爆款',
      quote: '"YukoLi 的研发团队对益生菌配方非常专业，三款新品首发月均破万单。"' }
  ];

  var _fallbackFilters = {
    industry: {
      label: '行业',
      i18n: 'cases_filter_industry',
      options: ['品牌方', '连锁品牌', '跨境电商', '大健康品牌']
    },
    volume: {
      label: '月订单量',
      i18n: 'cases_filter_volume',
      options: ['<200', '200-500', '500-1000', '1000+']
    },
    country: {
      label: '国家',
      i18n: 'cases_filter_country',
      options: ['🇵🇭 Philippines', '🇮🇩 Indonesia', '🇻🇳 Vietnam', '🇹🇭 Thailand', '🇲🇾 Malaysia']
    },
    benefit: {
      label: '核心收益',
      i18n: 'cases_filter_benefit',
      options: ['Labor Cost Reduction', 'Consistency', 'Space Saving', 'Fast Payback']
    }
  };

  /* ── State ──────────────────────────────────────── */
  var ROI_CASES = _casesCfg.grid || _fallbackCases;
  var FILTERS = _casesCfg.filters || _fallbackFilters;

  var activeFilters = { industry: null, volume: null, country: null, benefit: null }

  /* ── Helpers ────────────────────────────────────── */
  function laborReduction(b, a) {
    return Math.round((1 - a / b) * 100)
  }

  function benefitLabel(key) {
    var map = {
      'Labor Cost Reduction': '降人工',
      'Consistency': '标准化',
      'Space Saving': '省空间',
      'Fast Payback': '快回本'
    }
    return map[key] || key
  }

  function benefitIcon(key) {
    var map = {
      'Labor Cost Reduction': 'group_remove',
      'Consistency': 'verified',
      'Space Saving': 'compress',
      'Fast Payback': 'rocket_launch'
    }
    return map[key] || 'star'
  }

  function benefitColor(key) {
    var map = {
      'Labor Cost Reduction': 'blue',
      'Consistency': 'green',
      'Space Saving': 'purple',
      'Fast Payback': 'orange'
    }
    return map[key] || 'primary'
  }

  /* ── Rendering ──────────────────────────────────── */

  /**
   * Render a single case card (PC variant — used for PC & Tablet)
   */
  function renderCardPc(c) {
    var pct = laborReduction(c.laborBefore, c.laborAfter)
    var bc = benefitColor(c.benefit)
    return '<div class="case-card bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group border border-slate-200 dark:border-slate-700 hover:border-' + bc + '-500/50 flex flex-col">' +
      '<!-- 上方图片 16:9 -->' +
      '<div class="w-full aspect-video bg-slate-200 dark:bg-slate-700 overflow-hidden relative flex-shrink-0">' +
        '<img loading="lazy" alt="' + esc(c.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform" src="/assets/images/default.webp" />' +
        '<div class="absolute top-3 left-3 flex items-center gap-2">' +
          '<span class="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 text-sm font-semibold text-slate-700 dark:text-slate-200 backdrop-blur-sm">' + esc(c.country) + '</span>' +
          '<span class="px-3 py-1 rounded-full bg-' + bc + '-500 text-white text-sm font-bold">' + esc(benefitLabel(c.benefit)) + '</span>' +
        '</div>' +
      '</div>' +
      '<!-- 下方内容 -->' +
      '<div class="flex-1 p-5 lg:p-6 flex flex-col gap-2.5">' +
        '<h3 class="font-bold text-lg lg:text-xl leading-snug text-slate-900 dark:text-white" data-i18n="cases_title_' + esc(c.slug) + '">' + esc(c.title) + '</h3>' +
        '<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">' +
          '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">storefront</span>' + esc(c.industry) + '</span>' +
          '<span class="text-slate-300 dark:text-slate-600">·</span>' +
          '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">restaurant</span>' + esc(c.dailyOutput) + ' 餐/天</span>' +
          '<span class="text-slate-300 dark:text-slate-600">·</span>' +
          '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">schedule</span>' + esc(c.payback) + ' 月回本</span>' +
        '</div>' +
        '<p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic border-l-4 border-' + bc + '-400 pl-3" data-i18n="cases_quote_' + esc(c.slug) + '">' + esc(c.quote) + '</p>' +
        '<div class="grid grid-cols-3 gap-2 mt-1">' +
          '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
            '<div class="text-lg font-black text-' + bc + '-600">-' + pct + '%</div>' +
            '<div class="text-xs text-slate-500 dark:text-slate-400">人工成本</div>' +
          '</div>' +
          '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
            '<div class="text-lg font-black text-slate-700 dark:text-slate-200">' + c.laborBefore + '→' + c.laborAfter + '</div>' +
            '<div class="text-xs text-slate-500 dark:text-slate-400">人数变化</div>' +
          '</div>' +
          '<div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">' +
            '<div class="text-base font-black text-primary">' + c.monthlySaving + '</div>' +
            '<div class="text-xs text-slate-500 dark:text-slate-400">月节省</div>' +
          '</div>' +
        '</div>' +
        '<a href="/cases/' + esc(c.slug) + '/" target="_self" class="inline-flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all mt-auto pt-1">' +
          '<span data-i18n="cases_read_story">查看详情</span>' +
          '<span class="material-symbols-outlined text-base">arrow_forward</span>' +
        '</a>' +
      '</div>' +
    '</div>'
  }

  /**
   * Render a single case card (Mobile variant — compact)
   */
  function renderCardMobile(c) {
    var pct = laborReduction(c.laborBefore, c.laborAfter)
    var bc = benefitColor(c.benefit)
    return '<div class="case-card bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">' +
      '<div class="p-4 flex flex-col gap-2">' +
        '<div class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">' +
          '<span>' + c.country + ' · ' + esc(c.industry) + '</span>' +
          '<span class="font-semibold text-slate-700 dark:text-slate-200">' + esc(c.dailyOutput) + ' 餐/天</span>' +
        '</div>' +
        '<h3 class="font-bold text-base leading-snug" data-i18n="cases_title_' + esc(c.slug) + '">' + esc(c.title) + '</h3>' +
        '<div class="flex items-center gap-3">' +
          '<span class="inline-flex items-center gap-1 text-sm font-bold text-' + bc + '-600">' +
            '<span class="material-symbols-outlined text-sm">' + esc(benefitIcon(c.benefit)) + '</span>' +
            '人工 -' + pct + '%' +
          '</span>' +
          '<span class="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">' +
            '<span class="material-symbols-outlined text-sm text-primary">schedule</span>' +
            esc(c.payback) + ' 月回本' +
          '</span>' +
        '</div>' +
        '<p class="text-sm text-slate-600 dark:text-slate-400 italic" data-i18n="cases_quote_' + c.slug + '">' + esc(c.quote) + '</p>' +
        '<a href="/cases/' + esc(c.slug) + '/" target="_self" class="inline-flex items-center gap-1 text-primary font-bold text-sm">' +
          '<span data-i18n="cases_read_more">Read More</span>' +
          '<span class="material-symbols-outlined text-base">arrow_forward</span>' +
        '</a>' +
      '</div>' +
    '</div>'
  }

  /**
   * Get filtered cases
   */
  function getFiltered() {
    return ROI_CASES.filter(function (c) {
      for (var key in activeFilters) {
        if (activeFilters[key] && c[key] !== activeFilters[key]) return false
      }
      return true
    })
  }

  /**
   * Render all cards into #case-grid
   */
  function renderGrid(variant) {
    var container = document.getElementById('case-grid')
    if (!container) return
    var cases = getFiltered()
    if (cases.length === 0) {
      /* @audit-safe: constant-html */
      /* @audit-safe: constant-html */
      container.innerHTML = '<div class="col-span-full text-center py-16"><p class="text-slate-500 dark:text-slate-400 text-lg" data-i18n="cases_no_results">没有找到匹配的案例，试试调整筛选条件。</p></div>'
      return
    }
    var html = ''
    for (var i = 0; i < cases.length; i++) {
      html += variant === 'mobile' ? renderCardMobile(cases[i]) : renderCardPc(cases[i])
    }
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    container.innerHTML = html

    // Update count
    var countEl = document.getElementById('case-count')
    if (countEl) countEl.textContent = cases.length + ' ' + (window._t || function(k){return k})("case_count")
  }

  /* ── Filter UI Builders ─────────────────────────── */

  /**
   * Build horizontal filter bar (PC)
   */
  function buildFiltersPc() {
    var bar = document.getElementById('case-filters')
    if (!bar) return

    var html = '<div class="flex flex-wrap items-center gap-3">'
    for (var key in FILTERS) {
      var f = FILTERS[key]
      html += '<div class="flex items-center gap-2">' +
        '<span class="text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap" data-i18n="' + f.i18n + '">' + esc(f.label) + '</span>' +
        '<div class="flex gap-1">'
      html += '<button data-filter="' + key + '" data-value="" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white">全部</button>'
      for (var i = 0; i < f.options.length; i++) {
                html += '<button data-filter="' + key + '" data-value="' + f.options[i] +
          '" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary">' + f.options[i] + '</button>'
      }
      html += '</div></div>'
    }
    html += '</div>'
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    bar.innerHTML = html
  }

  /**
   * Build collapsible filter panel (Tablet)
   */
  function buildFiltersTablet() {
    var bar = document.getElementById('case-filters')
    if (!bar) return

    var html = '<button id="case-filter-toggle" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all">' +
      '<span class="material-symbols-outlined text-primary">tune</span>' +
      '<span data-i18n="cases_filter_toggle">筛选案例</span>' +
      '<span id="case-count" class="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">8</span>' +
      '<span class="material-symbols-outlined ml-auto transition-transform" id="case-filter-arrow">expand_more</span>' +
    '</button>' +
    '<div id="case-filter-panel" class="hidden mt-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg space-y-4">'

    for (var key in FILTERS) {
      var f = FILTERS[key]
      html += '<div>' +
        '<span class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" data-i18n="' + f.i18n + '">' + esc(f.label) + '</span>' +
        '<div class="flex flex-wrap gap-1.5">'
      html += '<button data-filter="' + key + '" data-value="" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white">全部</button>'
      for (var i = 0; i < f.options.length; i++) {
                html += '<button data-filter="' + key + '" data-value="' + f.options[i] +
          '" class="case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary">' + f.options[i] + '</button>'
      }
      html += '</div></div>'
    }
    html += '</div>'
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    bar.innerHTML = html

    // Toggle logic
    var toggle = document.getElementById('case-filter-toggle')
    var panel = document.getElementById('case-filter-panel')
    var arrow = document.getElementById('case-filter-arrow')
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var open = !panel.classList.contains('hidden')
        panel.classList.toggle('hidden')
        if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)'
      })
    }
  }

  /**
   * Build mobile dropdown filters (single-row sticky)
   */
  function buildFiltersMobile() {
    var bar = document.getElementById('case-filters')
    if (!bar) return

    var html = '<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">'
    for (var key in FILTERS) {
      var f = FILTERS[key]
            html +=
        '<select data-filter-select="' + key + '"' +
        ' class="case-filter-select flex-shrink-0 px-3 py-2 text-xs font-semibold' +
        ' rounded-lg border border-slate-300 dark:border-slate-600' +
        ' bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200' +
        ' appearance-none cursor-pointer min-w-[110px]"' +
        " style='background-image: url(\"data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22" +
        " width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22" +
        " stroke=%22%2394a3b8%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>\');" +
        " background-repeat: no-repeat; background-position: right 8px center; padding-right: 28px;'>";
      html += '<option value="">' + esc(f.label) + '</option>'
      for (var i = 0; i < f.options.length; i++) {
        html += '<option value="' + f.options[i] + '">' + f.options[i] + '</option>'
      }
      html += '</select>'
    }
    html += '<span id="case-count" class="flex-shrink-0 text-xs font-bold text-primary whitespace-nowrap">8 ' + (window._t || function(k){return k})("case_count") + '</span>'
    html += '</div>'
    /* @audit-safe: config-driven-render */
    /* @audit-safe: config-driven-render */
    bar.innerHTML = html

    // Bind select change events
    var selects = bar.querySelectorAll('.case-filter-select')
    for (var s = 0; s < selects.length; s++) {
      selects[s].addEventListener('change', function () {
        activeFilters[this.getAttribute('data-filter-select')] = this.value || null
        renderGrid('mobile')
      })
    }
  }

  /* ── Filter Button Event Binding ────────────────── */
  var _filterClickBound = false;
  function bindFilterButtons() {
    if (_filterClickBound) return;
    _filterClickBound = true;
    var _clickEM = window.DomUtils && new DomUtils.EventManager();
    (_clickEM || {on:function(){}}).on(document, 'click', function (e) {
      var btn = e.target.closest('.case-filter-btn')
      if (!btn) return

      var filterKey = btn.getAttribute('data-filter')
      var value = btn.getAttribute('data-value')

      activeFilters[filterKey] = value || null

      // Update button states within the same filter group
      var siblings = btn.parentElement.querySelectorAll('.case-filter-btn')
      for (var i = 0; i < siblings.length; i++) {
        siblings[i].className = 'case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary'
      }
      btn.className = 'case-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all border-primary bg-primary text-white'

      // Determine variant
      var variant = document.body.getAttribute('data-case-variant') || 'pc'
      renderGrid(variant)
    })
  }

  /* ── Init ───────────────────────────────────────── */
  function init(variant) {
    if (variant === 'pc') buildFiltersPc()
    else if (variant === 'tablet') buildFiltersTablet()
    else buildFiltersMobile()

    renderGrid(variant)
    bindFilterButtons()
  }

  /* ── Auto-init based on data attribute ──────────── */
  window.CaseGrid = { init: init, FILTERS: FILTERS, ROI_CASES: ROI_CASES }
})()

