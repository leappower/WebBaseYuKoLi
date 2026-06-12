/*!
 * site.config.base.js — 脚手架通用配置
 *
 * 本文件定义所有脚手架站点的通用配置结构。
 * 品牌专属配置在 site.config.js 中覆盖。
 *
 * 构建时合并顺序：base → brand (site.config.js)
 *
 * ⚠️ 修改此文件 = 修改脚手架基础设施（影响所有品牌项目）
 * ✏️ 修改 site.config.js = 修改品牌配置（只影响当前品牌）
 */
(function () {
  "use strict";
  var base = {
    // ═══════════════════════════════════════════════════════════
    // Brand — 品牌基础（每个品牌必须覆盖）
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
    // SEO — 每个 brand 覆盖域名和站点信息
    // ═══════════════════════════════════════════════════════════
    seo: {
      siteName: "BRAND_NAME",
      siteNameZh: "品牌中文名",
      titleTemplate: "%s | BRAND_NAME",
      description: "Site description (override in site.config.js)",
      ogImage: "/assets/images/og-default.webp",
    },

    // ═══════════════════════════════════════════════════════════
    // Contact — 每个 brand 覆盖联系方式
    // ═══════════════════════════════════════════════════════════
    contact: {
      whatsappNumber: "",
      whatsappLink: "",
      email: "support@example.com",
      formEndpoint: "",
    },

    // ═══════════════════════════════════════════════════════════
    // Forms — 表单提交（GAS 或后端 API）
    // ═══════════════════════════════════════════════════════════
    forms: {
      enabled: true,
      endpoint: "",
      method: "POST",
    },

    // ═══════════════════════════════════════════════════════════
    // Navigation — L1 主导航结构
    // children 在 site.config.js 中定义（品牌产品分类）
    // ═══════════════════════════════════════════════════════════
    nav: {
      primary: [
        { id: "home", label: { en: "Home", "zh-CN": "首页" }, href: "/home/" },
        {
          id: "products",
          label: { en: "Products", "zh-CN": "产品中心" },
          i18nKey: "nav_products",
          children: [],
        },
        {
          id: "solutions",
          label: { en: "Solutions", "zh-CN": "解决方案" },
          i18nKey: "nav_solutions",
          children: [],
        },
        { id: "cases", label: { en: "Cases", "zh-CN": "案例" }, href: "/cases/" },
        { id: "about", label: { en: "About", "zh-CN": "关于" }, href: "/about/" },
        { id: "contact", label: { en: "Contact", "zh-CN": "联系" }, href: "/contact/" },
      ],
      secondary: [],
    },

    // ═══════════════════════════════════════════════════════════
    // Footer — 结构定义
    // ═══════════════════════════════════════════════════════════
    footer: {
      columns: [],
      bottomLinks: [],
      copyright: "© {year} BRAND_NAME. All rights reserved.",
    },

    // ═══════════════════════════════════════════════════════════
    // 页面分类体系 — 路由到导航 ID 的映射
    // ═══════════════════════════════════════════════════════════
    pageCategory: {
      home: "home",
      products: "products",
      solutions: "solutions",
      cases: "cases",
      about: "about",
      contact: "contact",
      manufacturing: "about",
      compliance: "about",
    },

    // ═══════════════════════════════════════════════════════════
    // 产品分类 — 在 site.config.js 中定义
    // ═══════════════════════════════════════════════════════════
    categories: {
      products: [],
    },

    // ═══════════════════════════════════════════════════════════
    // i18n — 多语言框架
    // ═══════════════════════════════════════════════════════════
    i18n: {
      defaultLang: "en",
      supportedLangs: ["en", "zh-CN"],
    },

    // ═══════════════════════════════════════════════════════════
    // 主题 / 设计令牌
    // ═══════════════════════════════════════════════════════════
    theme: {
      primaryColor: "#2E7D32",
      primaryLight: "#4CAF50",
      primaryDark: "#1B5E20",
      borderRadius: "0.75rem",
    },

    // ═══════════════════════════════════════════════════════════
    // 功能开关
    // ═══════════════════════════════════════════════════════════
    features: {
      darkMode: true,
      search: true,
      compare: true,
      floatingWhatsApp: true,
    },

    // ═══════════════════════════════════════════════════════════
    // Nav Mode
    // ═══════════════════════════════════════════════════════════
    navMode: {
      desktop: "mega-menu",
      mobile: "slide-menu",
      tablet: "slide-menu",
    },

    // ═══════════════════════════════════════════════════════════
    // Analytics
    // ═══════════════════════════════════════════════════════════
    analytics: {
      ga4Id: "",
      enabled: false,
    },

    // ═══════════════════════════════════════════════════════════
    // Images
    // ═══════════════════════════════════════════════════════════
    images: {
      logoHeader: "/assets/images/logo-header.webp",
      logoFooter: "/assets/images/logo-footer.webp",
      defaultProduct: "/assets/images/products/default.webp",
      ogDefault: "/assets/images/og-default.webp",
    },
  };

  // Export base config
  window.SITE_CONFIG_BASE = base;
})();
