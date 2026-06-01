/**
 * BrewYuKoLi (优科力冲调) 官网表单 → Google Sheets
 *
 * 统一收集两个渠道的表单提交：
 *   1. Contact 页面产品需求表 (product-builder.js) → /api/quote-submit
 *   2. Smart Popup / 弹窗快捷联系表 (smart-popup.js) → /api/quote-submit
 *
 * 部署方式：Google Apps Script Web App → "以我的身份执行" + "任何人都可以访问"
 * 部署后得到 URL → 设为 .env 中的 GOOGLE_FORM_URL 变量
 */

// ─── 表头定义 (21列) ────────────────────────────────────────────
var HEADERS = [
  '表单来源',      // A - "product-builder" | "smart_popup" | "contact_page"
  '提交语言',      // B
  '合作模式',      // C - OEM / ODM / OBM / 不确定
  '产品类别',      // D - 选中的类别列表
  '预估月量',      // E - 数值 + 标签
  '时间规划',      // F - 立即需要 / 1-3个月 / 3-6个月 / 调研中
  '需求完整度',    // G - 0~100 score
  '姓名',          // H
  '公司名称',      // I
  '国家/地区',     // J
  '邮箱',          // K
  '电话',          // L
  '留言/需求说明', // M
  '来源页面URL',   // N
  '浏览器语言',    // O
  '屏幕尺寸',      // P - 宽 x 高
  '时区',          // Q
  '页面停留(秒)',  // R
  '滚动深度(%)',   // S
  'User Agent',    // T
  '提交时间',      // U - Asia/Shanghai
];

// ─── 工具函数 ────────────────────────────────────────────────────
function sanitize(val) {
  if (val == null) return '';
  var s = String(val);
  if (/^[+=\-@]/.test(s)) s = "'" + s;
  return s;
}

function getHeaderRange(sheet) {
  return sheet.getRange(1, 1, 1, HEADERS.length);
}

function initSheet(sheet) {
  if (sheet.getLastRow() > 0) return; // 已有数据，不重复初始化
  sheet.appendRow(HEADERS);
  var hdr = getHeaderRange(sheet);
  hdr.setFontWeight('bold').setBackground('#e8f5e9'); // Brew 品牌绿
  sheet.setFrozenRows(1);
  var colWidths = [140, 80, 100, 220, 180, 140, 80, 120, 200, 120, 240, 200, 400, 300, 80, 120, 120, 80, 80, 300, 160];
  colWidths.forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });
}

// ─── 主入口 ──────────────────────────────────────────────────────
function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    // 解析输入（支持 JSON 和 form-urlencoded）
    var data = {};
    try {
      data = JSON.parse((e.postData && e.postData.contents) || '{}');
    } catch (_) {
      data = e.parameter || {};
    }
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) { data = {}; }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    initSheet(sheet);

    // ── 组装行数据 ──

    // 表单来源
    var source = sanitize(data.type || data.formType || '');

    // 提交语言
    var lang = sanitize(data.language || data.browserLanguage || '');

    // 合作模式
    var mode = sanitize(data.mode || '');
    var modeLabel = '';
    if (mode === 'oem') modeLabel = 'OEM - 我有配方';
    else if (mode === 'odm') modeLabel = 'ODM - 您来研发';
    else if (mode === 'obm') modeLabel = 'OBM - 打造品牌';
    else if (mode === 'not-sure') modeLabel = '不确定 - 帮我推荐';
    else modeLabel = mode;

    // 产品类别
    var cats = Array.isArray(data.categories) ? data.categories.join(', ') : sanitize(data.categories);
    // 转换为中文标签
    var catMap = {
      coffee: '☕ 咖啡系列', tea: '🍵 茶饮系列', meal: '🥤 代餐系列',
      beauty: '✨ 胶原养颜', weight: '⚖️ 体重管理', gut: '🫘 肠道健康',
      lifestyle: '🍃 功能冲饮', legacy: '📖 经典冲饮'
    };
    if (Array.isArray(data.categories)) {
      cats = data.categories.map(function(c) { return catMap[c] || c; }).join(', ');
    }

    // 预估月量
    var qty = data.quantityLabel ? sanitize(data.quantityLabel) : (data.quantity ? sanitize(data.quantity) : '');

    // 时间规划
    var tl = sanitize(data.timeline || '');
    var tlLabel = '';
    if (tl === 'now') tlLabel = '⚡ 立即需要';
    else if (tl === '1-3') tlLabel = '📅 1-3个月';
    else if (tl === '3-6') tlLabel = '🗓 3-6个月';
    else if (tl === 'research') tlLabel = '🔍 调研中';
    else tlLabel = tl;

    // 需求完整度
    var score = data.score != null ? sanitize(data.score) : '';
    score = score ? score + '%' : '';

    // 姓名
    var name = sanitize(data.fullname || data.name || '');

    // 公司名称
    var company = sanitize(data.company || '');

    // 国家/地区
    var country = sanitize(data.country || '');

    // 邮箱
    var email = sanitize(data.email || '');

    // 电话
    var phone = sanitize(data.phone || '');

    // 留言/需求
    var message = sanitize(data.message || '');

    // 来源页面URL
    var pageUrl = sanitize(data.url || data.pageUrl || '');

    // 浏览器语言
    var browserLang = sanitize(data.browserLanguage || '');

    // 屏幕尺寸
    var screenSize = '';
    if (data.screenWidth || data.screenHeight) {
      screenSize = (data.screenWidth || '') + 'x' + (data.screenHeight || '');
    }

    // 时区
    var tz = sanitize(data.timezone || '');

    // 页面停留
    var timeOnPage = data.timeOnPage != null ? sanitize(data.timeOnPage) : '';

    // 滚动深度
    var scrollDepth = data.scrollDepth != null ? sanitize(data.scrollDepth) : '';

    // User Agent
    var ua = sanitize(data.userAgent || '');

    // 提交时间
    var now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    var row = [
      source,        // A
      lang,          // B
      modeLabel,     // C
      cats,          // D
      qty,           // E
      tlLabel,       // F
      score,         // G
      name,          // H
      company,       // I
      country,       // J
      email,         // K
      phone,         // L
      message,       // M
      pageUrl,       // N
      browserLang,   // O
      screenSize,    // P
      tz,            // Q
      timeOnPage,    // R
      scrollDepth,   // S
      ua,            // T
      now,           // U
    ];

    // 逐格写入（防公式注入）
    var rowNum = sheet.getLastRow() + 1;
    row.forEach(function(val, i) {
      sheet.getRange(rowNum, i + 1).setValue(String(val));
    });

    lock.releaseLock();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── 测试函数（在 Apps Script 编辑器中运行） ──────────────────
function testProductBuilder() {
  var testData = {
    type: 'product-builder',
    mode: 'odm',
    categories: ['coffee', 'tea', 'meal'],
    quantity: 5000,
    quantityLabel: '5,000–10,000 units/mo',
    timeline: '1-3',
    fullname: '张三',
    company: '上海健康食品有限公司',
    country: 'CN',
    email: 'zhang@example.com',
    phone: '+86 139 1234 5678',
    message: '需要咖啡和代餐产品开发，已有初步配方思路。',
    score: 85,
    url: 'https://brew.yukoli.com/contact/',
    language: 'zh-CN',
    browserLanguage: 'zh-CN',
    screenWidth: 1920,
    screenHeight: 1080,
    timezone: 'Asia/Shanghai',
    timeOnPage: 120,
    scrollDepth: 75,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  };
  var e = { postData: { contents: JSON.stringify(testData) } };
  var result = doPost(e);
  Logger.log(result.getContentText());
}

function testSmartPopup() {
  var testData = {
    formType: 'smart_popup',
    name: 'John Doe',
    company: 'Food Co.',
    email: 'john@foodco.com',
    phone: '+852 9876 5432',
    country: 'HK',
    message: 'Interested in OEM coffee production',
    language: 'en',
    browserLanguage: 'en-US',
    screenWidth: 1440,
    screenHeight: 900,
    timezone: 'Asia/Hong_Kong',
    pageUrl: 'https://brew.yukoli.com/products/',
    timeOnPage: 45,
    scrollDepth: 30,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
  };
  var e = { postData: { contents: JSON.stringify(testData) } };
  var result = doPost(e);
  Logger.log(result.getContentText());
}
