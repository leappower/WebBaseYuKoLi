/**
 * site.config.js — YuKoLi Healthy Food OEM/ODM 站点配置
 * 所有模块通过 window.SITE_CONFIG 读取配置，带 fallback 保障。
 */
;(function (global) {
  "use strict";

  var config = {

    // ═══ 品牌 ═══
    brand: {
      name: "YuKoLi",
      fullName: "YuKoLi Technology",
      fullNameCN: "优科力科技",
      legalName: "Foshan YuKoLi Technology Co., Ltd.",
      legalNameCN: "佛山优科力科技有限公司",
      slogan: { en: "Healthy Food OEM/ODM Manufacturer", "zh-CN": "健康食品 OEM/ODM 制造集团" },
      logo: "/assets/images/logo_html.webp",
      logoDark: "/assets/images/logo_html_2.webp",
      logoFooter: "/assets/images/logo_footer.webp",
      logoHeader: "/assets/images/logo_header.webp",
      domain: "www.yukoli.com",
      url: "https://www.yukoli.com",
    },

    // ═══ SEO ═══
    seo: {
      title: "YuKoLi | Healthy Food OEM/ODM Manufacturer — 7 Product Lines, 4 Factories",
      description: "YuKoLi 优科力科技 — 20+年健康食品OEM/ODM制造经验，4座自有工厂，7大产品线覆盖咖啡、茶饮、代餐、胶原蛋白、体重管理、肠道健康、功能冲饮。HACCP/FDA/ISO认证，MOQ 500起，30+国家出口。",
      ogImage: "/assets/images/logo_header.webp",
    },

    // ═══ 联系渠道 ═══
    contacts: {
      whatsapp: (typeof WHATSAPP_NUMBER !== 'undefined') ? WHATSAPP_NUMBER : "8613163756465",
      whatsappDefaultMsg: (typeof WHATSAPP_DEFAULT_MSG !== 'undefined') ? WHATSAPP_DEFAULT_MSG : "Hello YuKoLi, we are looking for OEM/ODM support for healthy food products.",
      email: (typeof INFO_EMAIL !== 'undefined') ? INFO_EMAIL : "info@yukoli.com",
      supportEmail: "support@yukoli.com",
      formEmail: (typeof FORM_EMAIL !== 'undefined') ? FORM_EMAIL : "179564128@qq.com",
      phone: "",
      address: "Room 502-6, Building 12, Fangchuangyuan, No.83 Zhanlun Road, Honggang, Foshan, Guangdong, China",
      addressCN: "广东省佛山市顺德区容桂街道展业路83号方创园12栋502-6",
      social: {
        line: "", telegram: "",
        facebook: "https://www.facebook.com/people/Yukoli-Technology-Co-Ltd/61579549730250/",
        instagram: "", twitter: "",
        linkedin: "https://linkedin.com/company/baeckereitechnik-profi",
        youtube: "", tiktok: "", wechat: "",
      },
      wechat: { enabled: true, qrImage: "/assets/images/wechat-qr.webp" },
      support: { email: "support@yukoli.com", channels: ["email", "whatsapp", "wechat"] },
    },

    // ═══ 导航 ═══
    nav: {
      items: [
        { id: "solutions", label: { en: "Solutions", "zh-CN": "解决方案" }, i18nKey: "nav_solutions",
          children: [
            { id: "oem", label: { en: "OEM Manufacturing", "zh-CN": "OEM制造" }, icon: "precision_manufacturing", slug: "oem" },
            { id: "odm", label: { en: "ODM Development", "zh-CN": "ODM研发" }, icon: "science", slug: "odm" },
            { id: "obm", label: { en: "Private Label", "zh-CN": "自有品牌" }, icon: "label", slug: "obm" },
          ],
        },
        { id: "products", label: { en: "Products", "zh-CN": "产品中心" }, i18nKey: "nav_products",
          children: [
            { id: "coffee", label: { en: "Coffee Mix", "zh-CN": "咖啡冲调" }, icon: "coffee", slug: "coffee", accent: "coffee" },
            { id: "tea", label: { en: "Tea & Milk Tea", "zh-CN": "茶饮奶茶" }, icon: "local_cafe", slug: "tea", accent: "tea" },
            { id: "meal", label: { en: "Meal Replacement", "zh-CN": "代餐蛋白" }, icon: "fitness_center", slug: "meal", accent: "meal" },
            { id: "beauty", label: { en: "Beauty & Collagen", "zh-CN": "美容胶原" }, icon: "spa", slug: "beauty", accent: "beauty" },
            { id: "weight", label: { en: "Weight Management", "zh-CN": "体重管理" }, icon: "monitor_weight", slug: "weight", accent: "weight" },
            { id: "gut", label: { en: "Gut Health", "zh-CN": "肠道健康" }, icon: "biotech", slug: "gut", accent: "gut" },
            { id: "lifestyle", label: { en: "Functional Powders", "zh-CN": "功能冲饮" }, icon: "bolt", slug: "lifestyle", accent: "lifestyle" },
          ],
        },
        { id: "manufacturing", label: { en: "Manufacturing", "zh-CN": "生产实力" }, i18nKey: "nav_manufacturing", href: "/manufacturing/" },
        { id: "compliance", label: { en: "Compliance", "zh-CN": "认证合规" }, i18nKey: "nav_compliance", href: "/compliance/" },
        { id: "resources", label: { en: "Resources", "zh-CN": "资源中心" }, i18nKey: "nav_resources",
          children: [
            { id: "catalog", label: { en: "Catalog", "zh-CN": "产品画册" }, icon: "menu_book", slug: "catalog" },
            { id: "rd-lab", label: { en: "R&D Lab", "zh-CN": "研发中心" }, icon: "biotech", slug: "rd-lab" },
            { id: "blog", label: { en: "Blog", "zh-CN": "行业洞察" }, icon: "article", slug: "blog" },
          ],
        },
        { id: "about", label: { en: "About", "zh-CN": "关于我们" }, i18nKey: "nav_about", href: "/about/" },
        { id: "contact", label: { en: "Contact", "zh-CN": "联系我们" }, i18nKey: "nav_contact", href: "/contact/" },
      ],
      cta: { text: { en: "Request Sample", "zh-CN": "申请样品" }, href: "/contact/", i18nKey: "nav_request_sample" },
    },

    // ═══ Footer ═══
    footer: {
      mobileItems: [
        { id: "products", label: { en: "Products", "zh-CN": "产品" }, icon: "inventory_2", href: "/products/" },
        { id: "solutions", label: { en: "Solutions", "zh-CN": "方案" }, icon: "precision_manufacturing", href: "/solutions/oem/" },
        { id: "inquiry", label: { en: "Inquiry", "zh-CN": "询价" }, icon: "request_quote", href: "/contact/" },
        { id: "whatsapp", label: { en: "WhatsApp", "zh-CN": "WhatsApp" }, icon: "chat", href: "https://wa.me/8613163756465?text=Hello%20YuKoLi" },
      ],
      tabletItems: [
        { id: "products", label: { en: "Products", "zh-CN": "产品中心" }, icon: "inventory_2", href: "/products/" },
        { id: "solutions", label: { en: "Solutions", "zh-CN": "解决方案" }, icon: "precision_manufacturing", href: "/solutions/oem/" },
        { id: "manufacturing", label: { en: "Manufacturing", "zh-CN": "生产实力" }, icon: "factory", href: "/manufacturing/" },
        { id: "contact", label: { en: "Contact", "zh-CN": "联系我们" }, icon: "support_agent", href: "/contact/" },
      ],
    },

    // ═══ 分类体系 ═══
    categories: {
      products: [
        { slug: "coffee", key: "nav_products_coffee", label: "咖啡冲调", icon: "coffee", emoji: "☕", accent: "coffee" },
        { slug: "tea", key: "nav_products_tea", label: "茶饮奶茶", icon: "local_cafe", emoji: "🍵", accent: "tea" },
        { slug: "meal", key: "nav_products_meal", label: "代餐蛋白", icon: "fitness_center", emoji: "🥤", accent: "meal" },
        { slug: "beauty", key: "nav_products_beauty", label: "美容胶原", icon: "spa", emoji: "✨", accent: "beauty" },
        { slug: "weight", key: "nav_products_weight", label: "体重管理", icon: "monitor_weight", emoji: "⚖️", accent: "weight" },
        { slug: "gut", key: "nav_products_gut", label: "肠道健康", icon: "biotech", emoji: "🦠", accent: "gut" },
        { slug: "lifestyle", key: "nav_products_lifestyle", label: "功能冲饮", icon: "bolt", emoji: "⚡", accent: "lifestyle" },
      ],
      solutions: [
        { slug: "oem", label: "OEM制造", icon: "precision_manufacturing" },
        { slug: "odm", label: "ODM研发", icon: "science" },
        { slug: "obm", label: "自有品牌", icon: "label" },
      ],
      resources: [
        { slug: "catalog", label: "产品画册", icon: "menu_book" },
        { slug: "rd-lab", label: "研发中心", icon: "biotech" },
        { slug: "blog", label: "行业洞察", icon: "article" },
      ],
    },

    // ═══ 路由 ═══
    routes: {
      pages: {
        home: "/home/",
        products: "/products/",
        solutions: "/solutions/",
        manufacturing: "/manufacturing/",
        compliance: "/compliance/",
        catalog: "/resources/catalog/",
        contact: "/contact/",
        quote: "/contact/",
        thankYou: "/thank-you/",
        about: "/about/",
        landing: "/landing/",
      },
      exceptions: {
        "/": "/home/index.html",
        "/home/": "/home/index.html",
        "/applications/cases/": "/cases/index.html",
        "/news/detail/": "/news/detail-pc.html",
      },
    },

    // ═══ 案例系统（待填充OEM案例） ═══
    cases: {
      grid: [],
      map: {},
    },

    // ═══ 交叉销售 ═══
    crossSell: {
      map: {},
      scenes: {},
      appLabels: {
        coffee: "咖啡冲调", tea: "茶饮奶茶", meal: "代餐蛋白",
        beauty: "美容胶原", weight: "体重管理", gut: "肠道健康", lifestyle: "功能冲饮",
      },
    },

    // ═══ 图片资源 ═══
    images: {
      prefix: "images",
      heroBg: "images/workshop_bgm.webp",
      heroMain: "images/hero_main.webp",
      factoryPoster: "images/factory_video_poster.webp",
      gallery: [
        "images/factory_gallery_1.webp",
        "images/factory_gallery_2.webp",
        "images/factory_gallery_3.webp",
        "images/factory_gallery_4.webp",
      ],
      certs: [
        "images/cert_1.webp", "images/cert_2.webp", "images/cert_3.webp",
        "images/cert_4.webp", "images/cert_5.webp", "images/cert_6.webp",
      ],
    },

    // ═══ i18n ═══
    i18n: {
      defaultLanguage: "zh-CN",
      languages: [
        { code: "zh-CN", nativeName: "中文（简体）", englishName: "Chinese (Simplified)", hasTranslation: true, uiGroup: "common", sortOrder: 1, currency: { symbol: "¥", code: "CNY", rate: 1, unit: "万元" } },
        { code: "en", nativeName: "English", englishName: "English", hasTranslation: true, uiGroup: "common", sortOrder: 2, currency: { symbol: "$", code: "USD", rate: 0.14, unit: "K" } },
        { code: "th", nativeName: "ภาษาไทย", englishName: "Thai", hasTranslation: true, uiGroup: "sea", sortOrder: 3, currency: { symbol: "฿", code: "THB", rate: 5.0, unit: "ล้าน" } },
        { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", hasTranslation: true, uiGroup: "sea", sortOrder: 4, currency: { symbol: "₫", code: "VND", rate: 3500, unit: "tr" } },
        { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", hasTranslation: true, uiGroup: "sea", sortOrder: 5, currency: { symbol: "Rp", code: "IDR", rate: 22000, unit: "jt" } },
        { code: "ms", nativeName: "Bahasa Melayu", englishName: "Malay", hasTranslation: true, uiGroup: "sea", sortOrder: 6, currency: { symbol: "RM", code: "MYR", rate: 0.67, unit: "K" } },
        { code: "fil", nativeName: "Filipino", englishName: "Filipino", hasTranslation: true, uiGroup: "sea", sortOrder: 7, currency: { symbol: "₱", code: "PHP", rate: 8.0, unit: "K" } },
        { code: "ja", nativeName: "日本語", englishName: "Japanese", hasTranslation: false, uiGroup: "ea", sortOrder: 8, currency: { symbol: "¥", code: "JPY", rate: 21, unit: "万" } },
        { code: "ko", nativeName: "한국어", englishName: "Korean", hasTranslation: false, uiGroup: "ea", sortOrder: 9, currency: { symbol: "₩", code: "KRW", rate: 190, unit: "만" } },
        { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", hasTranslation: false, uiGroup: "other", sortOrder: 10, currency: { symbol: "₹", code: "INR", rate: 11.7, unit: "L" } },
        { code: "ar", nativeName: "العربية", englishName: "Arabic", hasTranslation: false, uiGroup: "mena", sortOrder: 11, currency: { symbol: "ر.س", code: "SAR", rate: 0.52, unit: "K" } },
        { code: "es", nativeName: "Español", englishName: "Spanish", hasTranslation: false, uiGroup: "eu", sortOrder: 12, currency: { symbol: "€", code: "EUR", rate: 0.13, unit: "K" } },
        { code: "de", nativeName: "Deutsch", englishName: "German", hasTranslation: false, uiGroup: "eu", sortOrder: 13, currency: { symbol: "€", code: "EUR", rate: 0.13, unit: "K" } },
        { code: "fr", nativeName: "Français", englishName: "French", hasTranslation: false, uiGroup: "eu", sortOrder: 14, currency: { symbol: "€", code: "EUR", rate: 0.13, unit: "K" } },
        { code: "pt", nativeName: "Português", englishName: "Portuguese", hasTranslation: false, uiGroup: "eu", sortOrder: 15, currency: { symbol: "R$", code: "BRL", rate: 0.72, unit: "K" } },
        { code: "ru", nativeName: "Русский", englishName: "Russian", hasTranslation: false, uiGroup: "other", sortOrder: 16, currency: { symbol: "₽", code: "RUB", rate: 13.3, unit: "K" } },
        { code: "tr", nativeName: "Türkçe", englishName: "Turkish", hasTranslation: false, uiGroup: "other", sortOrder: 17, currency: { symbol: "₺", code: "TRY", rate: 4.5, unit: "K" } },
        { code: "zh-TW", nativeName: "中文（繁體）", englishName: "Chinese (Traditional)", hasTranslation: false, uiGroup: "common", sortOrder: 18, currency: { symbol: "NT$", code: "TWD", rate: 4.5, unit: "萬" } },
      ],
    },

    // ═══ 产品线 ═══
    productLines: {
      coffee:    { name: { en: "Coffee Mix", "zh-CN": "咖啡冲调" }, icon: "coffee", accent: "coffee" },
      tea:       { name: { en: "Tea & Milk Tea", "zh-CN": "茶饮奶茶" }, icon: "local_cafe", accent: "tea" },
      meal:      { name: { en: "Meal Replacement", "zh-CN": "代餐蛋白" }, icon: "fitness_center", accent: "meal" },
      beauty:    { name: { en: "Beauty & Collagen", "zh-CN": "美容胶原" }, icon: "spa", accent: "beauty" },
      weight:    { name: { en: "Weight Management", "zh-CN": "体重管理" }, icon: "monitor_weight", accent: "weight" },
      gut:       { name: { en: "Gut Health", "zh-CN": "肠道健康" }, icon: "biotech", accent: "gut" },
      lifestyle: { name: { en: "Functional Powders", "zh-CN": "功能冲饮" }, icon: "bolt", accent: "lifestyle" },
    },

    // ═══ 导航模式 ═══
    navMode: {
      desktop: "mega-menu",
      mobile: "fullscreen",
      footerTabs: true,
      megaColumns: 4,
    },

    // ═══ CTA 配置 ═══
    cta: {
      whatsapp: "https://wa.me/8613163756465?text=Hello%20YuKoLi",
      quote: "/contact/",
      sample: "/contact/",
    },

    // ═══ 功能开关 ═══
    features: {
      iotPulse: false,
      geoHero: false,
      smartPopup: true,
      profitCalculator: false,
      productCompare: false,
      cases: false,
      crossSell: true,
      screenshot: false,
      pdfExport: false,
      serviceMap: false,
      megaMenu: true,
      productLines: true,
      mobileFooterNav: true,
      floatingWhatsApp: true,
    },

    // ═══ 主题 ═══
    theme: {
      colors: {
        primary: "#2E7D32",
        primaryHover: "#1B5E20",
        primaryRgb: "46, 125, 50",
        bgLight: "#FAFBF5",
        bgDark: "#1a2e1a",
        textPrimary: "#0f172a",
        textMuted: "#64748b",
        textLight: "#f1f5f9",
      },
      accentColors: {
        coffee:    { primary: "#6F4E37", bg: "#F5F0EB", light: "#A0826D", dark: "#4A3524" },
        tea:       { primary: "#4CAF50", bg: "#F1F8E9", light: "#81C784", dark: "#2E7D32" },
        meal:      { primary: "#FF8F00", bg: "#FFF8E1", light: "#FFB74D", dark: "#E65100" },
        beauty:    { primary: "#E91E63", bg: "#FCE4EC", light: "#F48FB1", dark: "#AD1457" },
        weight:    { primary: "#00ACC1", bg: "#E0F7FA", light: "#4DD0E1", dark: "#006064" },
        gut:       { primary: "#8BC34A", bg: "#F1F8E9", light: "#AED581", dark: "#558B2F" },
        lifestyle: { primary: "#7C4DFF", bg: "#EDE7F6", light: "#B388FF", dark: "#4527A0" },
        legacy:    { primary: "#607D8B", bg: "#ECEFF1", light: "#90A4AE", dark: "#37474F" },
        coral:     { primary: "#FF6F61", bg: "#FFF5F4", light: "#FF8A80", dark: "#E05545" },
        gold:      { primary: "#D4AF37", bg: "#FFFBEB", light: "#F6E5B0", dark: "#B8960F" },
        teal:      { primary: "#009688", bg: "#E0F2F1", light: "#80CBC4", dark: "#00695C" },
        orange:    { primary: "#FF9800", bg: "#FFF3E0", light: "#FFCC80", dark: "#E65100" },
        green:     { primary: "#43A047", bg: "#E8F5E9", light: "#A5D6A7", dark: "#2E7D32" },
      },
      fonts: {
        heading: "'Inter', 'Noto Sans SC', sans-serif",
        body: "'Inter', 'Noto Sans SC', sans-serif",
      },
    },
  };

  global.SITE_CONFIG = config;

})(this);
