/**
 * site.config.js — 唯一站点配置入口
 *
 * 替换此文件即可搭建一个全新的 B 端官网。
 * 所有模块通过 window.SITE_CONFIG 读取配置，带 fallback 保障。
 *
 * 加载方式：在 index.html 最早期位置引入
 *   <script src="/site.config.js"></script>
 */
;(function (global) {
  "use strict";

  var config = {

    // ═══════════════════════════════════════════════════════════
    // 品牌
    // ═══════════════════════════════════════════════════════════
    brand: {
      name: "YuKoLi",  // BRAND_NAME will be derived from this at runtime
      fullName: "YuKoLi Technology",
      fullNameCN: "跃迁力科技",
      legalName: "Foshan YuKoLi Technology Co., Ltd.",
      legalNameCN: "佛山市跃迁力科技有限公司",
      slogan: { en: "Smart Commercial Kitchen Equipment", "zh-CN": "智能商厨设备领导品牌" },
      logo: "/assets/images/logo_html.webp",
      logoDark: "/assets/images/logo_html_2.webp",
      logoFooter: "/assets/images/logo_footer.webp",
      logoHeader: "/assets/images/logo_header.webp",
      domain: "www.kitchen.yukoli.com",
      url: "https://www.kitchen.yukoli.com",
    },

    // ═══════════════════════════════════════════════════════════
    // SEO
    // ═══════════════════════════════════════════════════════════
    seo: {
      title: "YuKoLi 智能厨具 | 专业商用厨房设备制造商",
      description: "YuKoLi 跃迁力科技 — 23年专注智能商厨设备研发制造，200+产品型号，服务50+国家。提供翻炒、切配、煎炸、炖煮、蒸煮全系列自动化解决方案。",
      ogImage: "/assets/images/logo_header.webp",
    },

    // ═══════════════════════════════════════════════════════════
    // 联系渠道
    // ═══════════════════════════════════════════════════════════
    contacts: {
      whatsapp: (typeof WHATSAPP_NUMBER !== 'undefined') ? WHATSAPP_NUMBER : "8613163756465",
      whatsappDefaultMsg: (typeof WHATSAPP_DEFAULT_MSG !== 'undefined') ? WHATSAPP_DEFAULT_MSG : "Hi YuKoLi, I'm interested in your commercial kitchen equipment.",
      email: (typeof INFO_EMAIL !== 'undefined') ? INFO_EMAIL : "info@yukoli.com",
      supportEmail: "support.kitchen@yukoli.com",
      formEmail: (typeof FORM_EMAIL !== 'undefined') ? FORM_EMAIL : "179564128@qq.com",
      phone: "",
      address: "Room 502-6, Building 12, Fangchuangyuan, No.83 Zhanlun Road, Honggang, Foshan, Guangdong, China",
      addressCN: "广东省佛山市顺德区容桂街道展业路83号方创园12栋502-6",
      social: {
        line: "https://line.me/ti/p/+66840273150",
        telegram: "https://t.me/baeckerei-profi",
        facebook: "https://www.facebook.com/people/Yukoli-Technology-Co-Ltd/61579549730250/",
        instagram: "https://instagram.com/baeckerei.profi",
        twitter: "https://twitter.com/baeckerei_profi",
        linkedin: "https://linkedin.com/company/baeckereitechnik-profi",
        youtube: "",
        tiktok: "",
        wechat: "",
      },
      wechat: {
        enabled: true,
        qrImage: "/assets/images/wechat-qr.webp",
      },
      support: {
        email: "support.kitchen@yukoli.com",
        channels: ["email", "whatsapp", "wechat"],
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 导航（含 CTA）
    // ═══════════════════════════════════════════════════════════
    nav: {
      items: [
        {
          id: "products", label: { en: "Products", "zh-CN": "产品中心" }, i18nKey: "nav_products",
          children: [
            { id: "all", label: { en: "All Products", "zh-CN": "全部产品" }, icon: "grid_view", slug: "all" },
            { id: "stirfry", label: { en: "Stir-fry", "zh-CN": "翻炒系列" }, icon: "local_fire_department", slug: "stirfry", i18nKey: "nav_products_stirfry" },
            { id: "cutting", label: { en: "Cutting", "zh-CN": "切配系列" }, icon: "content_cut", slug: "cutting", i18nKey: "nav_products_cutting" },
            { id: "frying", label: { en: "Frying", "zh-CN": "煎炸系列" }, icon: "outdoor_grill", slug: "frying", i18nKey: "nav_products_frying" },
            { id: "stewing", label: { en: "Stewing", "zh-CN": "炖煮系列" }, icon: "soup_kitchen", slug: "stewing", i18nKey: "nav_products_stewing" },
            { id: "steaming", label: { en: "Steaming", "zh-CN": "蒸煮系列" }, icon: "cloud", slug: "steaming", i18nKey: "nav_products_steaming" },
            { id: "other", label: { en: "Auxiliary", "zh-CN": "辅助设备" }, icon: "more_horiz", slug: "other", i18nKey: "nav_products_other" },
          ],
        },
        {
          id: "applications", label: { en: "Applications", "zh-CN": "行业场景" }, i18nKey: "nav_applications",
          children: [
            { id: "small-restaurant", label: { en: "Small Restaurant", "zh-CN": "小型餐饮" }, icon: "storefront", slug: "small-restaurant" },
            { id: "central-kitchen", label: { en: "Central Kitchen", "zh-CN": "中央厨房" }, icon: "apartment", slug: "central-kitchen" },
            { id: "canteen", label: { en: "Smart Canteen", "zh-CN": "智慧食堂" }, icon: "school", slug: "canteen" },
            { id: "chain-restaurant", label: { en: "Chain Restaurant", "zh-CN": "连锁餐饮" }, icon: "store", slug: "chain-restaurant" },
            { id: "cloud-kitchen", label: { en: "Cloud Kitchen", "zh-CN": "云厨房/外卖" }, icon: "cloud", slug: "cloud-kitchen" },
            { id: "food-factory", label: { en: "Food Factory", "zh-CN": "食品工厂" }, icon: "factory", slug: "food-factory" },
            { id: "menu-lab", label: { en: "Menu Lab", "zh-CN": "菜系实验室" }, icon: "science", slug: "menu-lab" },
          ],
        },
        {
          id: "cases", label: { en: "Case Studies", "zh-CN": "客户案例" }, i18nKey: "nav_case_studies",
          href: "/cases/",
        },
        {
          id: "support", label: { en: "Support", "zh-CN": "服务支持" }, i18nKey: "nav_support",
          children: [
            { id: "faq", label: { en: "FAQ", "zh-CN": "技术问答" }, icon: "help", slug: "faq" },
            { id: "installation", label: { en: "Installation", "zh-CN": "安装调试" }, icon: "build", slug: "installation" },
            { id: "warranty", label: { en: "Warranty", "zh-CN": "质保维护" }, icon: "verified", slug: "warranty" },
            { id: "spare-parts", label: { en: "Spare Parts", "zh-CN": "配件支持" }, icon: "settings", slug: "spare-parts" },
            { id: "training", label: { en: "Training", "zh-CN": "培训下载" }, icon: "school", slug: "training" },
          ],
        },
        {
          id: "about", label: { en: "About", "zh-CN": "关于我们" }, i18nKey: "nav_about",
          href: "/about/",
        },
      ],
      cta: { text: { en: "Get Quote", "zh-CN": "获取报价" }, href: "/quote/", i18nKey: "nav_get_quote" },
    },

    // ═══════════════════════════════════════════════════════════
    // Footer
    // ═══════════════════════════════════════════════════════════
    footer: {
      mobileItems: [
        { id: "products", label: { en: "Products", "zh-CN": "产品" }, icon: "inventory_2", href: "/products/" },
        { id: "cases", label: { en: "Cases", "zh-CN": "案例" }, icon: "analytics", href: "/cases/" },
        { id: "quote", label: { en: "Quote", "zh-CN": "报价" }, icon: "request_quote", href: "/quote/" },
        { id: "support", label: { en: "Support", "zh-CN": "支持" }, icon: "support_agent", href: "/support/" },
      ],
      tabletItems: [
        { id: "products", label: { en: "Products", "zh-CN": "产品中心" }, icon: "inventory_2", href: "/products/" },
        { id: "applications", label: { en: "Applications", "zh-CN": "行业场景" }, icon: "storefront", href: "/applications/small-restaurant/" },
        { id: "cases", label: { en: "Case Studies", "zh-CN": "客户案例" }, icon: "analytics", href: "/cases/" },
        { id: "support", label: { en: "Support", "zh-CN": "服务支持" }, icon: "support_agent", href: "/support/" },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // 页面分类体系
    // ═══════════════════════════════════════════════════════════
    categories: {
      products: [
        { slug: "stirfry", key: "nav_products_stirfry", label: "翻炒系列", icon: "local_fire_department", emoji: "🔥", accent: "coral" },
        { slug: "cutting", key: "nav_products_cutting", label: "切配系列", icon: "content_cut", emoji: "🔪", accent: "gold" },
        { slug: "frying", key: "nav_products_frying", label: "煎炸系列", icon: "outdoor_grill", emoji: "🍳", accent: "orange" },
        { slug: "stewing", key: "nav_products_stewing", label: "炖煮系列", icon: "soup_kitchen", emoji: "🥘", accent: "green" },
        { slug: "steaming", key: "nav_products_steaming", label: "蒸煮系列", icon: "cloud", emoji: "⬆️", accent: "teal" },
        { slug: "other", key: "nav_products_other", label: "辅助设备", icon: "more_horiz", emoji: "⚙️", accent: "coral" },
      ],
      applications: [
        { slug: "small-restaurant", label: "小型餐饮", icon: "storefront" },
        { slug: "central-kitchen", label: "中央厨房", icon: "apartment" },
        { slug: "canteen", label: "智慧食堂", icon: "school" },
        { slug: "chain-restaurant", label: "连锁餐饮", icon: "store" },
        { slug: "cloud-kitchen", label: "云厨房/外卖", icon: "cloud" },
        { slug: "food-factory", label: "食品工厂", icon: "factory" },
        { slug: "menu-lab", label: "菜系实验室", icon: "science" },
      ],
      support: [
        { slug: "faq", label: "技术问答", icon: "help" },
        { slug: "installation", label: "安装调试", icon: "build" },
        { slug: "warranty", label: "质保维护", icon: "verified" },
        { slug: "spare-parts", label: "配件支持", icon: "settings" },
        { slug: "training", label: "培训下载", icon: "school" },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // 路由配置
    // ═══════════════════════════════════════════════════════════
    routes: {
      pages: {
        home: "/home/",
        products: "/products/",
        quote: "/quote/",
        thankYou: "/thank-you/",
        support: "/support/",
        cases: "/cases/",
        roiCalculator: "/profit-calculator/",
        about: "/about/",
        landing: "/landing/",
        contact: "/contact/",
      },
      exceptions: {
        "/": "/home/index.html",
        "/home/": "/home/index.html",
        "/news/detail/": "/news/detail-pc.html",
        "/applications/cases/": "/cases/index.html",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // ROI 计算器数据
    // ═══════════════════════════════════════════════════════════
    roi: {
      savingsTable: {
        hiring_difficulty: { min: 0.3, mid: 0.52, max: 0.7, label: { en: "Hiring Difficulty", "zh-CN": "招工难" } },
        high_labor_cost: { min: 0.35, mid: 0.6, max: 0.78, label: { en: "High Labor Cost", "zh-CN": "人工成本高" } },
        inconsistent_quality: { min: 0.25, mid: 0.45, max: 0.62, label: { en: "Inconsistent Quality", "zh-CN": "出品不稳定" } },
        slow_service: { min: 0.28, mid: 0.48, max: 0.65, label: { en: "Slow Service", "zh-CN": "出餐慢" } },
        limited_space: { min: 0.22, mid: 0.42, max: 0.58, label: { en: "Limited Space", "zh-CN": "空间不足" } },
      },
      salaries: {
        Philippines: { monthly: 25000, currency: "PHP", symbol: "₱", rateToUSD: 56 },
        Indonesia: { monthly: 4800000, currency: "IDR", symbol: "Rp", rateToUSD: 15800 },
        Vietnam: { monthly: 7000000, currency: "VND", symbol: "₫", rateToUSD: 25000 },
        Thailand: { monthly: 15000, currency: "THB", symbol: "฿", rateToUSD: 35 },
        Malaysia: { monthly: 2500, currency: "MYR", symbol: "RM", rateToUSD: 4.7 },
        China: { monthly: 5000, currency: "CNY", symbol: "¥", rateToUSD: 7.24 },
        Japan: { monthly: 220000, currency: "JPY", symbol: "¥", rateToUSD: 150 },
        "South Korea": { monthly: 2800000, currency: "KRW", symbol: "₩", rateToUSD: 1300 },
        India: { monthly: 25000, currency: "INR", symbol: "₹", rateToUSD: 83 },
        "Saudi Arabia": { monthly: 4000, currency: "SAR", symbol: "ر.س", rateToUSD: 3.75 },
        Taiwan: { monthly: 40000, currency: "TWD", symbol: "NT$", rateToUSD: 32 },
        Singapore: { monthly: 3500, currency: "SGD", symbol: "S$", rateToUSD: 1.34 },
        USA: { monthly: 3500, currency: "USD", symbol: "$", rateToUSD: 1 },
        UK: { monthly: 2200, currency: "GBP", symbol: "£", rateToUSD: 0.79 },
        Germany: { monthly: 2800, currency: "EUR", symbol: "€", rateToUSD: 0.92 },
        France: { monthly: 2600, currency: "EUR", symbol: "€", rateToUSD: 0.92 },
        Brazil: { monthly: 2800, currency: "BRL", symbol: "R$", rateToUSD: 5.0 },
        Mexico: { monthly: 8000, currency: "MXN", symbol: "Mex$", rateToUSD: 17 },
        Turkey: { monthly: 15000, currency: "TRY", symbol: "₺", rateToUSD: 30 },
        UAE: { monthly: 4500, currency: "AED", symbol: "د.إ", rateToUSD: 3.67 },
        Australia: { monthly: 4500, currency: "AUD", symbol: "A$", rateToUSD: 1.53 },
        Egypt: { monthly: 6000, currency: "EGP", symbol: "E£", rateToUSD: 48 },
        "South Africa": { monthly: 15000, currency: "ZAR", symbol: "R", rateToUSD: 18 },
        Russia: { monthly: 60000, currency: "RUB", symbol: "₽", rateToUSD: 92 },
        Other: { monthly: 2000, currency: "USD", symbol: "$", rateToUSD: 1 },
      },
      equipmentCost: {
        smart_wok: { min: 3000, max: 8000, label: { en: "Smart Wok", "zh-CN": "智能炒菜机" } },
        rice_cooker: { min: 1500, max: 4000, label: { en: "Rice Cooker", "zh-CN": "蒸饭柜" } },
        dishwasher: { min: 2000, max: 5000, label: { en: "Dishwasher", "zh-CN": "洗碗机" } },
        induction_cooker: { min: 500, max: 2000, label: { en: "Induction Cooker", "zh-CN": "电磁炉" } },
        deep_fryer: { min: 1000, max: 3000, label: { en: "Deep Fryer", "zh-CN": "油炸炉" } },
      },
      exchangeRates: {
        base: "USD",
        rates: { PHP: 56.2, IDR: 15800, VND: 25300, THB: 35.5, MYR: 4.7, CNY: 7.24, USD: 1 },
        updatedAt: "2026-05-01",
      },
      whatsappTemplates: {
        "small-restaurant": "Hi, I run a small restaurant (approx __ orders/day). I want to know the price for your smart cooking machines.",
        "central-kitchen": "Hi, I am setting up a central kitchen. I need equipment for large volume production.",
        "chain-restaurant": "Hi, I manage a chain restaurant with __ stores. I'm looking for standardized cooking equipment.",
        canteen: "Hi, I manage a canteen serving __ people daily. I need high-volume cooking equipment.",
        "cloud-kitchen": "Hi, I run a cloud kitchen. I need compact multi-functional cooking equipment.",
        "menu-lab": "Hi, I'm curious if your machines can cook our local dishes. Can you test our menu?",
        "product-detail": "Hi, I'm interested in the {product name} ({model}). Please send me pricing and specs.",
        "roi-result": "Hi {brand}, I calculated my ROI:\n...",
        case: "Hi, I read the {country} {industry} case on your website. I have a similar situation.",
        global: "Hi, I'm interested in {brand} commercial equipment. Please help me find the right machine.",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 案例系统
    // ═══════════════════════════════════════════════════════════
    cases: {
      grid: [
        { slug: 'manila-lunchbox-studio-2025', country: '🇵🇭 Philippines', industry: '小型餐饮', volume: '200-500', benefit: 'Fast Payback', dailyOutput: 320, laborBefore: 3, laborAfter: 1, monthlySaving: 'PHP 36,000', payback: 5.2, title: '马尼拉 Liempo 快餐店：从 3 个厨师到 1 台机器', quote: '"开业三年一直为招不到稳定的炒锅师傅发愁。现在一个人就能搞定，出餐速度还更快了。"' },
        { slug: 'jakarta-catering-hub-2025', country: '🇮🇩 Indonesia', industry: '中央厨房', volume: '500-1000', benefit: 'Consistency', dailyOutput: 600, laborBefore: 12, laborAfter: 5, monthlySaving: 'IDR 22M', payback: 8.0, title: '雅加达送餐中央厨房：6 家门店统一出品', quote: '"以前每个门店味道都不一样，客户经常投诉。现在六家店的味道完全一样，回头客明显多了。"' },
        { slug: 'hcmc-cloud-kitchen-compact', country: '🇻🇳 Vietnam', industry: '云厨房', volume: '<200', benefit: 'Space Saving', dailyOutput: 150, laborBefore: 3, laborAfter: 1, monthlySaving: 'VND 14M', payback: 5.5, title: '胡志明市云厨房：15㎡ 完成全品类出餐', quote: '"空间小但能做的菜很多，客户都以为是专业大厨房。"' },
        { slug: 'bangkok-chain-8-stores', country: '🇹🇭 Thailand', industry: '连锁餐饮', volume: '1000+', benefit: 'Consistency', dailyOutput: 1200, laborBefore: 24, laborAfter: 12, monthlySaving: 'THB 270K', payback: 11.3, title: '曼谷火锅连锁 8 店：口味标准化 + 培训周期缩短 75%', quote: '"新店开业第 2 周就能正常出餐，以前至少要 2 个月。"' },
        { slug: 'kl-canteen-2000-meals', country: '🇲🇾 Malaysia', industry: '智慧食堂', volume: '1000+', benefit: 'Fast Payback', dailyOutput: 2000, laborBefore: 15, laborAfter: 6, monthlySaving: 'MYR 13,500', payback: 6.2, title: '吉隆坡工厂食堂：2000 餐/天，6.2 个月回本', quote: '"工人最喜欢的是清洗方便，10 分钟就能搞定。"' },
        { slug: 'cebu-small-resto-payback', country: '🇵🇭 Philippines', industry: '小型餐饮', volume: '200-500', benefit: 'Fast Payback', dailyOutput: 280, laborBefore: 3, laborAfter: 1, monthlySaving: 'PHP 32,000', payback: 4.8, title: 'Cebu 小吃店：投资 1 台，4.8 个月回本', quote: '"最好的投资决定，省下来的钱已经买第二台了。"' },
        { slug: 'surabaya-central-automation', country: '🇮🇩 Indonesia', industry: '中央厨房', volume: '500-1000', benefit: 'Labor Cost Reduction', dailyOutput: 800, laborBefore: 18, laborAfter: 8, monthlySaving: 'IDR 24M', payback: 8.5, title: '泗水中央厨房：自动化后废品率从 8% 降至 1.2%', quote: '"食品浪费大幅减少，每个月节省的食材钱就很可观。"' },
        { slug: 'hanoi-street-food-modern', country: '🇻🇳 Vietnam', industry: '小型餐饮', volume: '<200', benefit: 'Consistency', dailyOutput: 180, laborBefore: 2, laborAfter: 1, monthlySaving: 'VND 8M', payback: 5.1, title: '河内街头小吃升级：1 台机器 + 1 个人 = 全品类菜单', quote: '"Phở 和 Bánh Mì 都能用，外国游客也夸味道好。"' },
      ],
      detail: {},
      filters: {
        industries: ["小型餐饮", "中央厨房", "连锁餐饮", "智慧食堂", "云厨房"],
        volumes: ["<200", "200-500", "500-1000", "1000+"],
        countries: ["Philippines", "Indonesia", "Vietnam", "Thailand", "Malaysia"],
        benefits: ["Labor Cost Reduction", "Consistency", "Space Saving", "Fast Payback"],
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 搭配推荐 & 场景入口
    // ═══════════════════════════════════════════════════════════
    crossSell: {
      map: {},    // Optional override; cross-sell.js has built-in fallback
      scenes: {}, // Optional override; cross-sell.js has built-in fallback
      appLabels: {
        "small-restaurant": "小型餐饮",
        "central-kitchen": "中央厨房",
        canteen: "智慧食堂",
        "chain-restaurant": "连锁餐饮",
        "cloud-kitchen": "云厨房/外卖",
        "food-factory": "食品工厂",
        "menu-lab": "菜系实验室",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 图片资源
    // ═══════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════
    // 多语言
    // ═══════════════════════════════════════════════════════════
    i18n: {
      defaultLanguage: "zh-CN",
      languages: [
        { code: "zh-CN", nativeName: "中文（简体）", englishName: "Chinese (Simplified)", hasTranslation: true, uiGroup: "common", sortOrder: 1, currency: { symbol: "¥", code: "CNY", rate: 1, unit: "万元" } },
        { code: "en", nativeName: "English", englishName: "English", hasTranslation: true, uiGroup: "common", sortOrder: 2, currency: { symbol: "$", code: "USD", rate: 0.14, unit: "K" } },
        // ── Southeast Asia ──
        { code: "th", nativeName: "ไทย", englishName: "Thai", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 3, currency: { symbol: "฿", code: "THB", rate: 5.0, unit: "ล้าน" } },
        { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 4, currency: { symbol: "₫", code: "VND", rate: 3400, unit: "Triệu" } },
        { code: "ms", nativeName: "Bahasa Melayu", englishName: "Malay", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 5, currency: { symbol: "RM", code: "MYR", rate: 0.65, unit: "Juta" } },
        { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 6, currency: { symbol: "Rp", code: "IDR", rate: 2200, unit: "Juta" } },
        { code: "fil", nativeName: "Filipino", englishName: "Filipino", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 7, currency: { symbol: "₱", code: "PHP", rate: 0.017, unit: "K" } },
        { code: "km", nativeName: "ភាសាខ្មែរ", englishName: "Khmer", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 8, currency: { symbol: "៛", code: "KHR", rate: 4100, unit: "ម៉ឺន" } },
        { code: "lo", nativeName: "ລາວ", englishName: "Lao", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 9, currency: { symbol: "₭", code: "LAK", rate: 22000, unit: "ລ້ານ" } },
        { code: "my", nativeName: "မြန်မာဘာသာ", englishName: "Burmese", hasTranslation: false, uiGroup: "southeast_asia", sortOrder: 10, currency: { symbol: "K", code: "MMK", rate: 2100, unit: "K" } },
        // ── East Asia ──
        { code: "ja", nativeName: "日本語", englishName: "Japanese", hasTranslation: true, uiGroup: "east_asia", sortOrder: 11, currency: { symbol: "¥", code: "JPY", rate: 21, unit: "万円", label: "JP¥" } },
        { code: "ko", nativeName: "한국어", englishName: "Korean", hasTranslation: false, uiGroup: "east_asia", sortOrder: 12, currency: { symbol: "₩", code: "KRW", rate: 188, unit: "백만" } },
        // ── South Asia + Others ──
        { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", hasTranslation: false, uiGroup: "other", sortOrder: 13, currency: { symbol: "₹", code: "INR", rate: 11.5, unit: "Lakh" } },
        { code: "zh-TW", nativeName: "中文（繁體）", englishName: "Chinese (Traditional)", hasTranslation: true, uiGroup: "other", sortOrder: 14, currency: { symbol: "NT$", code: "TWD", rate: 4.4, unit: "萬元" } },
        { code: "ar", nativeName: "العربية", englishName: "Arabic", hasTranslation: false, uiGroup: "middle_east", sortOrder: 15, currency: { symbol: "ر.س", code: "SAR", rate: 0.52, unit: "K" } },
        { code: "he", nativeName: "עברית", englishName: "Hebrew", hasTranslation: false, uiGroup: "middle_east", sortOrder: 16, currency: { symbol: "₪", code: "ILS", rate: 3.7, unit: "K" } },
        { code: "tr", nativeName: "Türkçe", englishName: "Turkish", hasTranslation: false, uiGroup: "middle_east", sortOrder: 17, currency: { symbol: "₺", code: "TRY", rate: 30, unit: "K" } },
        // ── European ──
        { code: "fr", nativeName: "Français", englishName: "French", hasTranslation: false, uiGroup: "european", sortOrder: 18, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "de", nativeName: "Deutsch", englishName: "German", hasTranslation: false, uiGroup: "european", sortOrder: 19, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "es", nativeName: "Español", englishName: "Spanish", hasTranslation: false, uiGroup: "european", sortOrder: 20, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "pt", nativeName: "Português", englishName: "Portuguese", hasTranslation: false, uiGroup: "european", sortOrder: 21, currency: { symbol: "R$", code: "BRL", rate: 5.0, unit: "K" } },
        { code: "ru", nativeName: "Русский", englishName: "Russian", hasTranslation: false, uiGroup: "european", sortOrder: 22, currency: { symbol: "₽", code: "RUB", rate: 92, unit: "K" } },
        { code: "it", nativeName: "Italiano", englishName: "Italian", hasTranslation: false, uiGroup: "european", sortOrder: 23, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "nl", nativeName: "Nederlands", englishName: "Dutch", hasTranslation: false, uiGroup: "european", sortOrder: 24, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "pl", nativeName: "Polski", englishName: "Polish", hasTranslation: false, uiGroup: "european", sortOrder: 25, currency: { symbol: "zł", code: "PLN", rate: 4.0, unit: "K" } },
      ],
      overrides: {}, // TODO: 从翻译 JSON 中提取业务专用 key
    },

    // ═══════════════════════════════════════════════════════════
    // 产品线定义（配置驱动，导航/渲染/色系自动读取）
    // ═══════════════════════════════════════════════════════════
    productLines: [
      // 每个产品线定义一条，key 用于路由和数据关联
      // accent 映射到 theme.accentColors 中的色系
      // icon 使用 Material Icons 名称或 emoji
      // features 是该产品线的卖点列表（用于产品卡片渲染）
      // sort 控制菜单显示顺序，越小越靠前
      // hidden: true 可隐藏某条产品线（不显示在菜单中但保留数据）
    ],

    // ═══════════════════════════════════════════════════════════
    // 导航模式配置
    // ═══════════════════════════════════════════════════════════
    navMode: {
      desktop: "dropdown",        // "mega-menu" | "dropdown" | "simple"
      mobile: "fullscreen",       // "fullscreen" | "slide" | "drawer"
      footerTabs: true,           // 是否启用 Fixed Footer Tab
      megaColumns: 4,             // Mega Menu 列数（仅 desktop=mega-menu 时有效）
    },

    // ═══════════════════════════════════════════════════════════
    // CTA 配置
    // ═══════════════════════════════════════════════════════════
    cta: {
      primary: {
        text: { en: "Get Quote", "zh-CN": "获取报价" },
        href: "/quote/",
        style: "cta",             // "primary" | "cta" | "whatsapp" (映射到 .btn-* 类)
      },
      whatsapp: {
        text: { en: "Chat on WhatsApp", "zh-CN": "WhatsApp 咨询" },
        style: "whatsapp",        // 使用 .btn-whatsapp 样式
        showFloat: true,          // 是否显示浮动 WhatsApp 按钮
        floatPosition: { bottom: "82px", right: "16px" },
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 主题 / 视觉系统
    // ═══════════════════════════════════════════════════════════
    theme: {
      colors: {
        primary: "#ec5b13",
        primaryHover: "#d4521a",
        primaryRgb: "236, 91, 19",
        bgLight: "#f8f6f6",
        bgDark: "#221610",
        textPrimary: "#0f172a",
        textMuted: "#64748b",
        textLight: "#f1f5f9",
      },
      // 新增：产品线强调色（按 accent key 自动映射）
      accentColors: {
        coral:  { primary: "#FF6F61", bg: "#FFF5F4", light: "#FF8A80", dark: "#E05545" },
        gold:   { primary: "#D4AF37", bg: "#FFFBEB", light: "#F6E5B0", dark: "#B8960F" },
        green:  { primary: "#00A67E", bg: "#F0FDF9", light: "#6EE7B7", dark: "#008060" },
        teal:   { primary: "#006064", bg: "#E0F7FA", light: "#4DD0E1", dark: "#004044" },
        orange: { primary: "#FF7A45", bg: "#FFF7ED", light: "#FFB380", dark: "#E06030" },
      },
      // 新增：完整设计 token（对标设计稿 :root）
      tokens: {
        surface: "#FFFFFF",
        surfaceSoft: "#FAF8F3",
        border: "#E7E1D6",
        borderSoft: "#F0EBE0",
        text: "#1F2937",
        textSoft: "#4B5563",
        textMuted: "#6B7280",
        textInverse: "#FFFFFF",
        success: "#00A67E",
        warning: "#F59E0B",
        error: "#EF4444",
        containerWide: "1440px",
        zSticky: 200,
        zOverlay: 800,
      },
      fonts: {
        heading: '"Public Sans", sans-serif',
        body: '"Inter", "Public Sans", system-ui, sans-serif',
      },
      hero: {
        height: "600px",
      },
      button: {
        px: "2rem",
        py: "1rem",
        radius: "0.75rem",
        fontSize: "1.125rem",
      },
      card: {
        radius: "1rem",
        padding: "1.5rem",
      },
      section: {
        py: { sm: "2rem", md: "4rem", lg: "5rem", xl: "6rem" },
      },
      radius: {
        sm: "0.25rem", md: "0.5rem", lg: "0.75rem",
        xl: "1rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px",
      },
      // 新增：间距系统
      spacing: {
        xs: "8px", sm: "16px", md: "24px", lg: "40px", xl: "64px", "2xl": "80px", "3xl": "120px",
      },
      // 新增：动画
      animation: {
        normal: "all 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "all 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 功能开关
    // ═══════════════════════════════════════════════════════════
    features: {
      iotPulse: false,
      geoHero: false,
      smartPopup: true,
      profitCalculator: true,
      productCompare: true,
      cases: true,
      crossSell: true,
      screenshot: true,
      pdfExport: true,
      serviceMap: true,
      megaMenu: true,          // 是否启用 Mega Menu（需 navMode.desktop="mega-menu"）
      productLines: true,      // 是否启用产品线系统
      mobileFooterNav: true,   // 是否启用移动端 Fixed Footer Tab
      floatingWhatsApp: true,  // 是否启用浮动 WhatsApp 按钮
    },
  };

  // ── 导出 ──
  global.SITE_CONFIG = config;
  global._cfg = config;

  // Node.js 环境导出
  if (typeof module !== "undefined" && module.exports) {
    module.exports = config;
  }
})(window || global);
