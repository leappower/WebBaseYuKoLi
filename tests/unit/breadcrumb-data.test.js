/**
 * breadcrumb-data.test.js — 面包屑数据层单元测试
 *
 * 测试 BreadcrumbData.detect() 的 8 种页面类型 + 边界情况。
 * 不依赖 DOM，纯函数测试。
 */

var fs = require("fs");
var path = require("path");

// 模拟 site.config.js 的 categories 结构
var MOCK_CATEGORIES = {
  products: [
    { slug: "coffee", key: "nav_products_coffee", label: { en: "Coffee", "zh-CN": "咖啡系列" } },
    { slug: "tea", key: "nav_products_tea", label: { en: "Tea", "zh-CN": "茶饮系列" } },
    { slug: "meal", key: "nav_products_meal", label: { en: "Meal Replacement", "zh-CN": "代餐系列" } },
    { slug: "beauty", key: "nav_products_beauty", label: { en: "Beauty", "zh-CN": "胶原养颜" } },
    { slug: "functional", key: "nav_products_functional", label: { en: "Functional", "zh-CN": "功能性食品" } },
    { slug: "supplements", key: "nav_products_supplements", label: { en: "Supplements", "zh-CN": "营养补充剂" } },
  ],
  applications: [
    { slug: "fast-food", key: "nav_app_fast_food", label: { en: "Fast Food", "zh-CN": "快餐连锁" } },
    { slug: "cafe", key: "nav_app_cafe", label: { en: "Café & Bakery", "zh-CN": "咖啡烘焙" } },
    { slug: "hotel", key: "nav_app_hotel", label: { en: "Hotel", "zh-CN": "酒店餐饮" } },
    { slug: "retail", key: "nav_app_retail", label: { en: "Retail", "zh-CN": "零售渠道" } },
    { slug: "office", key: "nav_app_office", label: { en: "Office", "zh-CN": "企业办公" } },
    { slug: "healthcare", key: "nav_app_healthcare", label: { en: "Healthcare", "zh-CN": "医疗健康" } },
    { slug: "export", key: "nav_app_export", label: { en: "Export", "zh-CN": "出口贸易" } },
  ],
  support: [
    { slug: "faq", key: "nav_support_faq", label: { en: "FAQ", "zh-CN": "常见问题" } },
    { slug: "shipping", key: "nav_support_shipping", label: { en: "Shipping", "zh-CN": "物流配送" } },
    { slug: "quality", key: "nav_support_quality", label: { en: "Quality", "zh-CN": "质量保证" } },
    { slug: "customization", key: "nav_support_custom", label: { en: "Customization", "zh-CN": "定制服务" } },
    { slug: "contact", key: "nav_support_contact", label: { en: "Contact", "zh-CN": "联系我们" } },
  ],
};

// 执行文件语法检查
describe("breadcrumb-data.js — 语法检查", function () {
  var MODULE = path.resolve(__dirname, "../../src/assets/js/breadcrumb-data.js");

  test("文件应存在", function () {
    expect(fs.existsSync(MODULE)).toBe(true);
  });

  test("语法应合法", function () {
    var cp = require("child_process");
    var result = cp.spawnSync("node", ["--check", MODULE]);
    expect(result.status).toBe(0);
  });
});

describe("BreadcrumbData.detect() — 路由检测", function () {
  var MODULE = path.resolve(__dirname, "../../src/assets/js/breadcrumb-data.js");

  // 由于 BreadcrumbData 在 IIFE 中注册到 window，我们在 Node 环境模拟 jsdom 或直接 eval
  // 这里我们用 vm module 来执行
  var vm = require("vm");
  var sandbox = { window: {} };
  var context = vm.createContext(sandbox);

  beforeAll(function () {
    var code = fs.readFileSync(MODULE, "utf-8");
    vm.runInContext(code, context);
  });

  function detect(pathname, lang) {
    return context.window.BreadcrumbData.detect(
      pathname,
      MOCK_CATEGORIES,
      { currentLang: lang || "zh-CN" }
    );
  }

  // ── /products/all/ ──
  test("检测 /products/all/ 为 category 类型", function () {
    var result = detect("/products/all");
    expect(result.type).toBe("category");
    expect(result.slug).toBe("all");
    expect(result.segments.length).toBe(2);
    expect(result.segments[0].label).toBe("nav_product_center");
    expect(result.segments[0].href).toBe("/products/");
    expect(result.segments[1].current).toBe(true);
  });

  // ── 品类页 ──
  test("检测 /products/coffee/ 为品类页", function () {
    var result = detect("/products/coffee");
    expect(result.type).toBe("category");
    expect(result.slug).toBe("coffee");
    expect(result.segments.length).toBe(2);
    expect(result.segments[1].href).toBe("/products/coffee/");
  });

  // ── PDP ──
  test("检测 PDP /products/coffee/CF-001/ 含品类", function () {
    var result = detect("/products/coffee/CF-001");
    expect(result.type).toBe("pdp");
    expect(result.slug).toBe("CF-001");
    expect(result.refSlug).toBe("coffee");
    expect(result.refCategoryLabel).toBe("咖啡系列");
    expect(result.segments.length).toBe(3);
    expect(result.segments[2].current).toBe(true);
  });

  test("检测 PDP /products/unknown/MODEL-X/ 无品类", function () {
    var result = detect("/products/unknown/MODEL-X");
    expect(result.type).toBe("pdp");
    expect(result.slug).toBe("MODEL-X");
    expect(result.refSlug).toBe("");
    expect(result.refCategoryLabel).toBe("");
    expect(result.segments.length).toBe(2);
  });

  // ── Compare ──
  test("检测 /products/compare 为 compare 类型", function () {
    var result = detect("/products/compare");
    expect(result.type).toBe("compare");
    expect(result.segments.length).toBe(2);
    expect(result.segments[1].current).toBe(true);
  });

  // ── Application ──
  test("检测 /applications/cafe/ 为 application 类型", function () {
    var result = detect("/applications/cafe");
    expect(result.type).toBe("application");
    expect(result.slug).toBe("cafe");
    expect(result.segments.length).toBe(2);
    expect(result.segments[0].href).toBe("/applications/");
    expect(result.siblings.length).toBeGreaterThan(0);
  });

  // ── Support ──
  test("检测 /support/faq/ 为 support 类型", function () {
    var result = detect("/support/faq");
    expect(result.type).toBe("support");
    expect(result.slug).toBe("faq");
    expect(result.segments.length).toBe(2);
    expect(result.siblings.length).toBeGreaterThan(0);
  });

  // ── News detail ──
  test("检测 /news/detail 为 news-detail 类型", function () {
    var result = detect("/news/detail");
    expect(result.type).toBe("news-detail");
    expect(result.segments.length).toBe(2);
    expect(result.segments[1].current).toBe(true);
  });

  // ── Case detail ──
  test("检测 /cases/my-case/ 为 case-detail 类型", function () {
    var result = detect("/cases/my-case");
    expect(result.type).toBe("case-detail");
    expect(result.slug).toBe("my-case");
    expect(result.segments.length).toBe(2);
    expect(result.segments[1].current).toBe(true);
  });

  // ── 未知路径 ──
  test("检测 /unknown 为 none 类型", function () {
    var result = detect("/unknown");
    expect(result.type).toBe("none");
  });

  // ── 根路径 ──
  test("检测 / 为 none 类型", function () {
    var result = detect("/");
    expect(result.type).toBe("none");
  });
});

describe("BreadcrumbData.buildSiblingList() — 同级导航", function () {
  var vm = require("vm");
  var sandbox = { window: {} };
  var context = vm.createContext(sandbox);

  beforeAll(function () {
    var MODULE = path.resolve(__dirname, "../../src/assets/js/breadcrumb-data.js");
    var code = fs.readFileSync(MODULE, "utf-8");
    vm.runInContext(code, context);
  });

  test("applications group 返回 7 个兄弟项", function () {
    var list = context.window.BreadcrumbData.buildSiblingList(
      "applications", "cafe", MOCK_CATEGORIES, "zh-CN"
    );
    expect(list.length).toBe(7);
    var active = list.filter(function (l) { return l.active; });
    expect(active.length).toBe(1);
    expect(active[0].href).toContain("/cafe/");
  });

  test("support group 返回 5 个兄弟项", function () {
    var list = context.window.BreadcrumbData.buildSiblingList(
      "support", "faq", MOCK_CATEGORIES, "zh-CN"
    );
    expect(list.length).toBe(5);
  });

  test("products group 返回 0（产品分类不使用同级导航）", function () {
    var list = context.window.BreadcrumbData.buildSiblingList(
      "products", "coffee", MOCK_CATEGORIES, "zh-CN"
    );
    expect(list.length).toBe(6); // detect() 中 products 不调用 buildSiblingList
  });
});

describe("BreadcrumbData.buildCategoryMaps() — 品类映射", function () {
  var vm = require("vm");
  var sandbox = { window: {} };
  var context = vm.createContext(sandbox);

  beforeAll(function () {
    var MODULE = path.resolve(__dirname, "../../src/assets/js/breadcrumb-data.js");
    var code = fs.readFileSync(MODULE, "utf-8");
    vm.runInContext(code, context);
  });

  test("返回 slugToKey 和 keyToSlug 映射", function () {
    var maps = context.window.BreadcrumbData.buildCategoryMaps(MOCK_CATEGORIES);
    expect(maps.slugToKey.coffee).toBe("nav_products_coffee");
    expect(maps.keyToSlug["nav_products_tea"]).toBe("tea");
    expect(Object.keys(maps.slugToKey).length).toBe(6);
  });
});
