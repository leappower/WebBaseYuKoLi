/*!
 * site.config.js — 脚手架模板品牌配置
 *
 * 本文件展示脚手架的默认品牌配置结构。
 * 在新品牌项目中，复制此文件并替换占位符即可。
 *
 * 构建时加载顺序：先加载 site.config.base.js (可选)，再加载 site.config.js 覆盖品牌配置。
 * 当前脚手架默认只加载 site.config.js（已包含完整的通用默认值）。
 *
 * ⚠️ 修改 site.config.base.js = 修改脚手架基础设施（可选加载）
 * ✏️ 修改本文件 = 修改品牌配置（只影响当前品牌）
 */
(function () {
  "use strict";
  var brand = {
    // ═══════════════════════════════════════════════════════════
    // Brand — 品牌基本信息（必填）
    // ═══════════════════════════════════════════════════════════
    brand: {
      name: "BRAND_NAME",
      nameZh: "品牌中文名",
      nameFull: "FULL LEGAL NAME",
      slogan: { en: "Your Slogan Here", "zh-CN": "品牌口号" },
      logo: "/assets/images/logo-footer.webp",
      domain: "example.com",
    },

    // ═══════════════════════════════════════════════════════════
    // Company — 公司实体信息
    // 用于 i18n 占位符 {company.legalName}、{company.shortName}、{city} 等
    // ═══════════════════════════════════════════════════════════
    company: {
      legalName: "Company Legal Name Co., Ltd.",
      shortName: "BRAND_NAME Technology Co., Ltd.",
      city: "City",
      region: "Province/State",
      country: "Country",
      foundedYear: 2000,
      jurisdiction: "City, Region",
      address: {
        full: "Full street address, City, Region, Country",
        short: "City, Country",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // Capabilities — 业务能力数据
    // 用于 i18n 占位符 {years}、{factories}、{factoryArea} 等
    // ═══════════════════════════════════════════════════════════
    capabilities: {
      yearsExperience: 20,
      factories: 4,
      factoryArea: "60,000㎡",
      warehouses: 10,
      productLines: 8,
      skuCount: "500+",
      dailyCapacity: "100,000+",
      exportCountries: "30+",
      shippingHours: 48,
      certifications: ["HACCP", "FDA", "ISO"],
      moq: 500,
    },

    // ═══════════════════════════════════════════════════════════
    // SEO — 搜索引擎优化
    // ═══════════════════════════════════════════════════════════
    seo: {
      siteName: "BRAND_NAME",
      siteNameZh: "品牌中文名",
      titleTemplate: "%s | BRAND_NAME",
      description: {
        en: "A brief description of your business for search engines.",
        "zh-CN": "一段面向搜索引擎的简短业务描述。",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // Contact — 联系方式
    // ═══════════════════════════════════════════════════════════
    contact: {
      whatsappNumber: "",
      whatsappLink: "",
      email: "support@example.com",
      phone: "+1-xxx-xxx-xxxx",
      address: { en: "City, Country", "zh-CN": "国家/城市" },
    },

    // ═══════════════════════════════════════════════════════════
    // Forms — 表单提交端点
    // ═══════════════════════════════════════════════════════════
    forms: {
      enabled: true,
      endpoint: "",
      method: "POST",
    },

    // ═══════════════════════════════════════════════════════════
    // Navigation — 品牌导航结构
    // ═══════════════════════════════════════════════════════════
    nav: {
      items: [
        {
          id: "solutions",
          label: { en: "Solutions", "zh-CN": "解决方案" },
          i18nKey: "nav_solutions",
          children: [
            {
              id: "oem",
              label: { en: "Solution 1", "zh-CN": "方案一" },
              icon: "precision_manufacturing",
              slug: "oem",
              href: "/solutions/oem/",
            },
            {
              id: "odm",
              label: { en: "Solution 2", "zh-CN": "方案二" },
              icon: "design_services",
              slug: "odm",
              href: "/solutions/odm/",
            },
            {
              id: "obm",
              label: { en: "Solution 3", "zh-CN": "方案三" },
              icon: "verified",
              slug: "obm",
              href: "/solutions/obm/",
            },
          ],
        },
        {
          id: "products",
          label: { en: "Products", "zh-CN": "产品中心" },
          i18nKey: "nav_products",
          children: [
            {
              id: "product-1",
              label: { en: "Product Category 1", "zh-CN": "产品分类一" },
              icon: "inventory_2",
              slug: "product-1",
              href: "/products/product-1/",
            },
            {
              id: "product-2",
              label: { en: "Product Category 2", "zh-CN": "产品分类二" },
              icon: "category",
              slug: "product-2",
              href: "/products/product-2/",
            },
            {
              id: "product-3",
              label: { en: "Product Category 3", "zh-CN": "产品分类三" },
              icon: "science",
              slug: "product-3",
              href: "/products/product-3/",
            },
          ],
        },
        {
          id: "manufacturing",
          label: { en: "Manufacturing", "zh-CN": "制造实力" },
          i18nKey: "nav_manufacturing",
          children: [
            {
              id: "bases",
              label: { en: "Production Bases", "zh-CN": "生产基地" },
              icon: "factory",
              slug: "bases",
              href: "/manufacturing/#bases",
            },
            {
              id: "quality",
              label: { en: "Quality Control", "zh-CN": "质量管控" },
              icon: "verified",
              slug: "quality",
              href: "/manufacturing/#quality",
            },
          ],
        },
        {
          id: "resources",
          label: { en: "Resources", "zh-CN": "资源中心" },
          i18nKey: "nav_resources",
          children: [
            {
              id: "catalog",
              label: { en: "Catalog", "zh-CN": "产品目录" },
              icon: "menu_book",
              slug: "catalog",
              href: "/resources/catalog/",
            },
            {
              id: "cases",
              label: { en: "Case Studies", "zh-CN": "成功案例" },
              icon: "analytics",
              slug: "cases",
              href: "/cases/",
            },
          ],
        },
        {
          id: "contact",
          label: { en: "Contact Us", "zh-CN": "联系我们" },
          i18nKey: "nav_contact",
          children: [
            {
              id: "quote",
              label: { en: "Get a Quote", "zh-CN": "获取报价" },
              icon: "request_quote",
              slug: "quote",
              href: "/contact/#quote",
            },
            {
              id: "samples",
              label: { en: "Request Samples", "zh-CN": "免费样品" },
              icon: "redeem",
              slug: "samples",
              href: "/contact/#samples",
            },
          ],
        },
      ],

      secondaryItems: [
        { id: "about", label: { en: "About Us", "zh-CN": "关于我们" }, i18nKey: "nav_about", href: "/about/" },
        { id: "faq", label: { en: "FAQ", "zh-CN": "常见问题" }, i18nKey: "nav_faq", href: "/faq/" },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Footer — 品牌底部导航
    // ═══════════════════════════════════════════════════════════
    footer: {
      mobileItems: [
        { id: "home", type: "link", icon: "home", label: { en: "Home", "zh-CN": "首页" }, href: "/home/" },
        {
          id: "solutions",
          type: "link",
          icon: "lightbulb",
          label: { en: "Solutions", "zh-CN": "方案" },
          href: "/solutions/",
        },
        { id: "inquiry", type: "link", icon: "send", label: { en: "Inquiry", "zh-CN": "询盘" }, href: "/contact/" },
        {
          id: "whatsapp",
          type: "external",
          icon: "chat",
          label: { en: "WhatsApp", "zh-CN": "WhatsApp" },
          href: "#",
          whatsapp: true,
        },
      ],
      tabletItems: [
        { id: "home", type: "link", icon: "home", label: { en: "Home", "zh-CN": "首页" }, href: "/home/" },
        {
          id: "products",
          type: "link",
          icon: "inventory_2",
          label: { en: "Products", "zh-CN": "产品" },
          href: "/products/",
        },
        {
          id: "solutions",
          type: "link",
          icon: "design_services",
          label: { en: "Solutions", "zh-CN": "方案" },
          href: "/solutions/",
        },
        { id: "inquiry", type: "link", icon: "send", label: { en: "Inquiry", "zh-CN": "询盘" }, href: "/contact/" },
        {
          id: "whatsapp",
          type: "external",
          icon: "chat",
          label: { en: "WhatsApp", "zh-CN": "WhatsApp" },
          href: "#",
          whatsapp: true,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // 产品分类 — 替换为实际品牌产品线
    // ═══════════════════════════════════════════════════════════
    categories: {
      products: [
        {
          slug: "product-1",
          key: "nav_products_product_1",
          label: { en: "Product Category 1", "zh-CN": "产品分类一" },
          icon: "inventory_2",
          emoji: "📦",
          accent: "coral",
        },
        {
          slug: "product-2",
          key: "nav_products_product_2",
          label: { en: "Product Category 2", "zh-CN": "产品分类二" },
          icon: "category",
          emoji: "🏷️",
          accent: "green",
        },
        {
          slug: "product-3",
          key: "nav_products_product_3",
          label: { en: "Product Category 3", "zh-CN": "产品分类三" },
          icon: "science",
          emoji: "🔬",
          accent: "gold",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Routes — 页面路由到导航 ID 的映射
    // ═══════════════════════════════════════════════════════════
    routes: {
      activeMap: {
        "oem-customization": "solutions",
        "odm-service": "solutions",
        "obm-partnership": "solutions",
        "case-studies": "resources",
        news: "contact",
        "thank-you": "contact",
        cases: "resources",
        oem: "solutions",
        odm: "solutions",
        obm: "solutions",
        rd: "solutions",
        packaging: "solutions",
        catalog: "resources",
        videos: "resources",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // i18n — 多语言配置（品牌可扩展）
    // ═══════════════════════════════════════════════════════════
    i18n: {
      defaultLang: "en",
      supportedLangs: [
        "en",
        "zh-CN",
        "zh-TW",
        "ja",
        "ko",
        "th",
        "vi",
        "id",
        "ms",
        "my",
        "hi",
        "bn",
        "ar",
        "fa",
        "tr",
        "ru",
        "de",
        "fr",
        "es",
        "pt",
        "it",
        "nl",
        "pl",
        "uk",
        "he",
      ],
      langLabels: {
        en: "English",
        "zh-CN": "简体中文",
        "zh-TW": "繁體中文",
        ja: "日本語",
        ko: "한국어",
        th: "ไทย",
        vi: "Tiếng Việt",
        id: "Bahasa Indonesia",
        ms: "Bahasa Melayu",
        my: "မြန်မာ",
        hi: "हिन्दी",
        bn: "বাংলা",
        ar: "العربية",
        fa: "فارسی",
        tr: "Türkçe",
        ru: "Русский",
        de: "Deutsch",
        fr: "Français",
        es: "Español",
        pt: "Português",
        it: "Italiano",
        nl: "Nederlands",
        pl: "Polski",
        uk: "Українська",
        he: "עברית",
      },
      languages: (function () {
        var codes = [
          "en",
          "zh-CN",
          "zh-TW",
          "ja",
          "ko",
          "th",
          "vi",
          "id",
          "ms",
          "my",
          "hi",
          "bn",
          "ar",
          "fa",
          "tr",
          "ru",
          "de",
          "fr",
          "es",
          "pt",
          "it",
          "nl",
          "pl",
          "uk",
          "he",
        ];
        var labels = {
          en: "English",
          "zh-CN": "简体中文",
          "zh-TW": "繁體中文",
          ja: "日本語",
          ko: "한국어",
          th: "ไทย",
          vi: "Tiếng Việt",
          id: "Bahasa Indonesia",
          ms: "Bahasa Melayu",
          my: "မြန်မာ",
          hi: "हिन्दी",
          bn: "বাংলা",
          ar: "العربية",
          fa: "فارسی",
          tr: "Türkçe",
          ru: "Русский",
          de: "Deutsch",
          fr: "Français",
          es: "Español",
          pt: "Português",
          it: "Italiano",
          nl: "Nederlands",
          pl: "Polski",
          uk: "Українська",
          he: "עברית",
        };
        var uiGroupMap = {
          "zh-CN": "common",
          en: "common",
          "zh-TW": "east_asia",
          ja: "east_asia",
          ko: "east_asia",
          th: "southeast_asia",
          vi: "southeast_asia",
          id: "southeast_asia",
          ms: "southeast_asia",
          my: "southeast_asia",
          ar: "middle_east",
          fa: "middle_east",
          hi: "other",
          bn: "other",
          tr: "european",
          ru: "european",
          de: "european",
          fr: "european",
          es: "european",
          pt: "european",
          it: "european",
          nl: "european",
          pl: "european",
          uk: "european",
          he: "other",
        };
        return codes.map(function (code, idx) {
          return {
            code: code,
            nativeName: labels[code] || code,
            sortOrder: idx,
            uiGroup: uiGroupMap[code] || "other",
            hasTranslation: code === "en" || code === "zh-CN",
          };
        });
      })(),
    },

    // ═══════════════════════════════════════════════════════════
    // Theme — 品牌主题色
    // ═══════════════════════════════════════════════════════════
    theme: {
      colors: {
        primary: "#2E7D32",
        whatsapp: "#25D366",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // Features — 功能开关
    // ═══════════════════════════════════════════════════════════
    features: {
      megaMenu: true,
      mobileFooterNav: false,
      unifiedBottomNav: true,
      geoHero: false,
      iotPulse: false,
    },

    // ═══════════════════════════════════════════════════════════
    // NavMode — 导航模式
    // ═══════════════════════════════════════════════════════════
    navMode: {
      desktop: "dropdown",
    },

    // ═══════════════════════════════════════════════════════════
    // Analytics
    // ═══════════════════════════════════════════════════════════
    analytics: {
      ga4Id: "",
      enabled: false,
      events: {
        quoteClick: "quote_click",
        sampleClick: "sample_click",
        whatsappClick: "whatsapp_click",
        catalogDownload: "catalog_download",
        specDownload: "spec_download",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // Images — 图片路径
    // ═══════════════════════════════════════════════════════════
    images: {
      logo: "/assets/images/logo-footer.webp",
      favicon: "/assets/favicon.ico",
      ogImage: "/assets/images/og-image.jpg",
    },
  };

  // JJC-020 T2.4: BASE_PATH 感知 — 对外提供路径解析方法
  brand.resolvePath = function (path) {
    if (!path || path.indexOf("/") === 0) {
      return ((typeof window !== "undefined" && window.BASE_PATH) || "") + (path || "");
    }
    return path;
  };

  // 挂载到全局
  if (typeof window !== "undefined") {
    window.SITE_CONFIG = brand;
  }

  // 兼容旧访问方式
  if (typeof module !== "undefined" && module.exports) {
    module.exports = brand;
  }
})();
