/*!
 * site_config_site_name — 站点配置枢纽（生产版本）
 * 所有模块通过 window.SITE_CONFIG 读取
 *
 * site_config_last_updated — 最后更新：2026-05-17 (Nav Alignment Phase 1)
 * 变更：
 *   - 更新 navMode desktop 为 mega-menu
 *   - 更新 footer.mobileItems 符合统一底部栏规范
 *   - site_config_update_contact_whatsapp: 添加 contact.whatsappNumber，统一 WhatsApp 号码
 *   - site_config_update_nav_secondary: 添加 nav.secondaryItems（About/News/FAQ）
 *   - site_config_update_brand: 添加 brand 配置，品牌色统一 #2E7D32
 */
(function () {
  "use strict";
  var cfg = {
    // ═══════════════════════════════════════════════════════════
    // Brand
    // ═══════════════════════════════════════════════════════════
    brand: {
      name: "YuKoLi",
      nameZh: "优科力",
      nameFull: "Foshan YuKoLi Technology Co., Ltd.",
      slogan: { en: "Your OEM/ODM Partner for Health Food Manufacturing", "zh-CN": "您的健康食品 OEM/ODM 合作伙伴" },
      logo: "/assets/images/logo-footer.webp",
      domain: "yukoli.com",
    },

    // ═══════════════════════════════════════════════════════════
    // SEO
    // ═══════════════════════════════════════════════════════════
    seo: {
      title: {
        en: '<span data-i18n="seo_yukoli">YuKoLi</span> — <span data-i18n="seo_OEM_ODM_Health_Food_Manufacturer">OEM/ODM Health Food Manufacturer</span>',
        "zh-CN":
          '<span data-i18n="seo_yukoli">优科力</span> — <span data-i18n="seo_健康食品_OEM_ODM代工生产">健康食品 OEM/ODM 代工生产</span>',
      },
      description: {
        en: "FDA & HACCP certified OEM/ODM health food manufacturer. 4 owned factories, 100K+ units daily capacity. Coffee, tea, meal replacement, collagen & more.",
        "zh-CN": "FDA/HACCP 认证健康食品代工厂。4 大自有工厂，日产能 10 万+。咖啡、代餐、胶原蛋白等 OEM/ODM。",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // Contact
    // ═══════════════════════════════════════════════════════════
    contacts: {
      whatsapp: "8618565718814",
      whatsappDisplay: "+86 185 6571 8814",
      whatsappMessage: "Hi YuKoLi, I'm interested in your OEM/ODM solutions.",
      email: "sales@yukoli.com",
      phone: "+86-757-xxxxxxx",
      address: { en: "Foshan, Guangdong, China", "zh-CN": "中国广东省佛山市" },
    },

    // ═══════════════════════════════════════════════════════════
    // Forms — 表单提交直连 Google Apps Script
    // ═══════════════════════════════════════════════════════════
    forms: {
      gasUrl:
        "https://script.google.com/macros/s/AKfycbymllbA_mL_l3muQN9QaU04FEGpXbmvzuGmZvYvDntjxK1QMF6BK8NZBrdqc1E22rBa5w/exec",
    },

    // ═══════════════════════════════════════════════════════════
    // Navigation — L1 主导航 (6 项, 所有断点统一)
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
              label: { en: "OEM Manufacturing", "zh-CN": "OEM 代工" },
              icon: "precision_manufacturing",
              slug: "oem",
              href: "/solutions/oem/",
            },
            {
              id: "odm",
              label: { en: "ODM Private Label", "zh-CN": "ODM 贴牌" },
              icon: "design_services",
              slug: "odm",
              href: "/solutions/odm/",
            },
            {
              id: "obm",
              label: { en: "OBM Full-Service", "zh-CN": "OBM 自有品牌" },
              icon: "verified",
              slug: "obm",
              href: "/solutions/obm/",
            },
            {
              id: "rd",
              label: { en: "R&D & Flavor Lab", "zh-CN": "研发与风味实验室" },
              icon: "science",
              slug: "rd",
              href: "/solutions/rd/",
            },
            {
              id: "packaging",
              label: { en: "Packaging & Labeling", "zh-CN": "包装与标签合规" },
              icon: "inventory",
              slug: "packaging",
              href: "/solutions/packaging/",
            },
          ],
        },
        {
          id: "products",
          label: { en: "Products", "zh-CN": "产品中心" },
          i18nKey: "nav_products",
          children: [
            {
              id: "all",
              label: { en: "All Products", "zh-CN": "全部产品" },
              icon: "grid_view",
              slug: "all",
              i18nKey: "nav_products_all",
              href: "/products/all/",
            },
            {
              id: "coffee",
              label: { en: "Coffee", "zh-CN": "咖啡系列" },
              icon: "coffee",
              slug: "coffee",
              i18nKey: "nav_products_coffee",
              href: "/products/coffee/",
            },
            {
              id: "tea",
              label: { en: "Tea & Milk Tea", "zh-CN": "茶饮奶茶系列" },
              icon: "local_cafe",
              slug: "tea",
              i18nKey: "nav_products_tea",
              href: "/products/tea/",
            },
            {
              id: "meal",
              label: { en: "Meal Replacement", "zh-CN": "代餐系列" },
              icon: "restaurant",
              slug: "meal",
              i18nKey: "nav_products_meal",
              href: "/products/meal/",
            },
            {
              id: "beauty",
              label: { en: "Beauty & Collagen", "zh-CN": "美容胶原系列" },
              icon: "spa",
              slug: "beauty",
              i18nKey: "nav_products_beauty",
              href: "/products/beauty/",
            },
            {
              id: "weight",
              label: { en: "Weight Management", "zh-CN": "体重管理" },
              icon: "monitor_weight",
              slug: "weight",
              i18nKey: "nav_products_weight",
              href: "/products/weight/",
            },
            {
              id: "gut",
              label: { en: "Gut Health", "zh-CN": "肠道健康" },
              icon: "biotech",
              slug: "gut",
              i18nKey: "nav_products_gut",
              href: "/products/gut/",
            },
            {
              id: "lifestyle",
              label: { en: "Lifestyle Functional", "zh-CN": "功能冲饮" },
              icon: "energy_savings_leaf",
              slug: "lifestyle",
              i18nKey: "nav_products_lifestyle",
              href: "/products/lifestyle/",
            },
            {
              id: "legacy",
              label: { en: "Legacy Classics", "zh-CN": "经典冲饮" },
              icon: "auto_stories",
              slug: "legacy",
              i18nKey: "nav_products_legacy",
              href: "/products/legacy/",
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
              label: { en: "Our 4 Production Bases", "zh-CN": "四大生产基地" },
              icon: "factory",
              slug: "bases",
              href: "/manufacturing/#bases",
            },
            {
              id: "quality",
              label: { en: "Quality Control", "zh-CN": "质量管控体系" },
              icon: "verified",
              slug: "quality",
              href: "/manufacturing/#quality",
            },
            {
              id: "smart",
              label: { en: "Smart Factory", "zh-CN": "智能工厂" },
              icon: "precision_manufacturing",
              slug: "smart",
              href: "/manufacturing/#smart",
            },
            {
              id: "supplychain",
              label: { en: "Global Supply Chain", "zh-CN": "全球供应链" },
              icon: "public",
              slug: "supplychain",
              href: "/manufacturing/#supplychain",
            },
          ],
        },
        {
          id: "compliance",
          label: { en: "Compliance", "zh-CN": "认证合规" },
          i18nKey: "nav_compliance",
          children: [
            {
              id: "certs",
              label: { en: "Global Certifications", "zh-CN": "国际认证" },
              icon: "verified_user",
              slug: "certs",
              href: "/compliance/#certs",
            },
            {
              id: "halal",
              label: { en: "Halal Dedicated Lines", "zh-CN": "清真认证专线" },
              icon: "assured_workload",
              slug: "halal",
              href: "/compliance/#halal",
            },
            {
              id: "coa",
              label: { en: "Lab Reports & COA", "zh-CN": "检测报告与 COA" },
              icon: "description",
              slug: "coa",
              href: "/compliance/#coa",
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
              label: { en: "2026 Product Catalog", "zh-CN": "2026 产品目录" },
              icon: "menu_book",
              slug: "catalog",
              href: "/resources/catalog/",
            },
            {
              id: "whitepapers",
              label: { en: "Whitepapers & Trends", "zh-CN": "行业白皮书" },
              icon: "article",
              slug: "whitepapers",
              href: "/resources/whitepapers/",
            },
            {
              id: "cases",
              label: { en: "Case Studies", "zh-CN": "成功案例" },
              icon: "analytics",
              slug: "cases",
              href: "/cases/",
            },
            {
              id: "videos",
              label: { en: "Video Library", "zh-CN": "视频中心" },
              icon: "play_circle",
              slug: "videos",
              href: "/resources/videos/",
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
              label: { en: "Request Free Samples", "zh-CN": "免费样品" },
              icon: "redeem",
              slug: "samples",
              href: "/contact/#samples",
            },
            {
              id: "visit",
              label: { en: "Visit Our Factory", "zh-CN": "参观工厂" },
              icon: "tour",
              slug: "visit",
              href: "/contact/#visit",
            },
            {
              id: "network",
              label: { en: "Global Sales Network", "zh-CN": "全球销售网络" },
              icon: "language",
              slug: "network",
              href: "/contact/#network",
            },
          ],
        },
      ],

      // 二级导航项（非 L1，用于 slide-menu 二级区域 + footer）
      secondaryItems: [
        { id: "about", label: { en: "About YuKoLi", "zh-CN": "关于优科力" }, i18nKey: "nav_about", href: "/about/" },
        { id: "news", label: { en: "News", "zh-CN": "新闻动态" }, i18nKey: "nav_news", href: "/news/" },
        { id: "faq", label: { en: "FAQ", "zh-CN": "常见问题" }, i18nKey: "nav_faq", href: "/faq/" },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Footer
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
          href: "https://wa.me/8618565718814",
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
          href: "https://wa.me/8618565718814",
          whatsapp: true,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // 页面分类体系
    // ═══════════════════════════════════════════════════════════
    categories: {
      products: [
        {
          slug: "coffee",
          key: "nav_products_coffee",
          label: { en: "Coffee", "zh-CN": "咖啡系列" },
          icon: "coffee",
          emoji: "☕",
          accent: "coral",
        },
        {
          slug: "tea",
          key: "nav_products_tea",
          label: { en: "Tea & Milk Tea", "zh-CN": "茶饮系列" },
          icon: "local_cafe",
          emoji: "🍵",
          accent: "green",
        },
        {
          slug: "meal",
          key: "nav_products_meal",
          label: { en: "Meal Replacement", "zh-CN": "代餐系列" },
          icon: "restaurant",
          emoji: "🥤",
          accent: "gold",
        },
        {
          slug: "beauty",
          key: "nav_products_beauty",
          label: { en: "Beauty & Collagen", "zh-CN": "胶原养颜" },
          icon: "spa",
          emoji: "✨",
          accent: "pink",
        },
        {
          slug: "weight",
          key: "nav_products_weight",
          label: { en: "Weight Management", "zh-CN": "体重管理" },
          icon: "monitor_weight",
          emoji: "⚖️",
          accent: "orange",
        },
        {
          slug: "gut",
          key: "nav_products_gut",
          label: { en: "Gut Health", "zh-CN": "肠道健康" },
          icon: "biotech",
          emoji: "🫘",
          accent: "lime",
        },
        {
          slug: "lifestyle",
          key: "nav_products_lifestyle",
          label: { en: "Functional Drinks", "zh-CN": "功能冲饮" },
          icon: "energy_savings_leaf",
          emoji: "🍃",
          accent: "purple",
        },
        {
          slug: "legacy",
          key: "nav_products_legacy",
          label: { en: "Classic Beverages", "zh-CN": "经典冲饮" },
          icon: "auto_stories",
          emoji: "📖",
          accent: "teal",
        },
      ],
    },

    routes: {
      activeMap: {
        "oem-customization": "solutions",
        "odm-service": "solutions",
        "obm-partnership": "solutions",
        "case-studies": "resources",
        news: "contact",
        "thank-you": "contact",
        cases: "resources",

        /* Solutions sub-pages */
        oem: "solutions",
        rd: "solutions",
        packaging: "solutions",

        /* Products sub-pages */
        all: "products",
        coffee: "products",
        tea: "products",
        meal: "products",
        beauty: "products",
        weight: "products",
        gut: "products",
        lifestyle: "products",
        legacy: "products",

        /* Resources sub-pages */
        catalog: "resources",
        videos: "resources",
        whitepapers: "resources",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // i18n / 多语言
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
      // Build languages array from supportedLangs + langLabels
      // Consumed by lang-registry.js → LANG_REGISTRY.LANGUAGES
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
    // 主题 / 设计令牌
    // ═══════════════════════════════════════════════════════════
    theme: {
      colors: {
        primary: "#2E7D32",
        whatsapp: "#25D366",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 功能开关
    // ═══════════════════════════════════════════════════════════
    features: {
      megaMenu: true,
      mobileFooterNav: false, // 旧功能 — 废弃，由 unifiedBottomNav 替代
      unifiedBottomNav: true, // 统一底部导航（新）
      geoHero: false,
      iotPulse: false,
    },

    // ═══════════════════════════════════════════════════════════
    // Nav Mode（导航模式）
    // ═══════════════════════════════════════════════════════════
    navMode: {
      desktop: "dropdown",
    },

    // ═══════════════════════════════════════════════════════════
    // Analytics（GA4 数据分析）
    // ═══════════════════════════════════════════════════════════
    analytics: {
      ga4Id: "", // GA4 Measurement ID, 留空则不注入
      enabled: false, // 默认关闭，设为 true + 填入 ga4Id 才激活
      events: {
        quoteClick: "quote_click",
        sampleClick: "sample_click",
        whatsappClick: "whatsapp_click",
        catalogDownload: "catalog_download",
        specDownload: "spec_download",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // Images（图片路径）
    // ═══════════════════════════════════════════════════════════
    images: {
      logo: "/assets/images/logo-footer.webp",
      favicon: "/assets/favicon.ico",
      ogImage: "/assets/images/og-image.jpg",
    },
  };

  // JJC-020 T2.4: BASE_PATH 感知 — 对外提供路径解析方法
  cfg.resolvePath = function (path) {
    if (!path || path.indexOf("/") === 0) {
      return ((typeof window !== "undefined" && window.BASE_PATH) || "") + (path || "");
    }
    return path;
  };

  // 挂载到全局
  if (typeof window !== "undefined") {
    window.SITE_CONFIG = cfg;
  }

  // 兼容旧访问方式
  if (typeof module !== "undefined" && module.exports) {
    module.exports = cfg;
  }
})();
