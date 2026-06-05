/**
 * site.config.js — 唯一站点配置入口
 *
 * 替换此文件即可搭建一个全新的 B 端官网。
 * 所有模块通过 window.SITE_CONFIG 读取配置，带 fallback 保障。
 *
 * 加载方式：在 index.html 最早期位置引入
 *   <script src="/site.config.js"></script>
 */
(function (global) {
  "use strict";

  var config = {
    // ═══════════════════════════════════════════════════════════
    // 品牌
    // ═══════════════════════════════════════════════════════════
    brand: {
      name: "YuKoLi", // BRAND_NAME will be derived from this at runtime
      fullName: "YuKoLi Technology",
      fullNameCN: "跃迁力科技",
      legalName: "Foshan YuKoLi Technology Co., Ltd.",
      legalNameCN: "佛山市跃迁力科技有限公司",
      slogan: { en: "Health Food OEM/ODM Solutions", "zh-CN": "健康冲调食品 OEM/ODM 专家" },
      logo: "/assets/images/logo-main.webp",
      logoDark: "/assets/images/logo-main-dark.webp",
      logoFooter: "/assets/images/logo-footer.webp",
      logoHeader: "/assets/images/logo-header.webp",
      domain: "brew.yukoli.com",
      url: "https://brew.yukoli.com",
    },

    // ═══════════════════════════════════════════════════════════
    // SEO
    // ═══════════════════════════════════════════════════════════
    seo: {
      title:
        '<span data-i18n="seo_yukoli">YuKoLi</span> 优科力 | <span data-i18n="seo_健康冲调食品_OEM_ODM专家">健康冲调食品 OEM/ODM 专家</span>',
      description:
        "YuKoLi 优科力科技 — 20年专注健康冲调食品 OEM/ODM，7大产品线（咖啡、茶饮、代餐、胶原、体重管理、肠道健康、功能冲饮），4座自有工厂，出口30+国家。提供配方研发、生产制造、品牌定制一站式服务。",
      ogImage: "/assets/images/logo-header.webp",
    },

    // ═══════════════════════════════════════════════════════════
    // 联系渠道
    // ═══════════════════════════════════════════════════════════
    contacts: {
      whatsapp: typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : "8618565718814",
      whatsappDefaultMsg:
        typeof WHATSAPP_DEFAULT_MSG !== "undefined"
          ? WHATSAPP_DEFAULT_MSG
          : "Hi YuKoLi, I'm interested in your health food OEM/ODM services.",
      email: typeof INFO_EMAIL !== "undefined" ? INFO_EMAIL : "support.brew@yukoli.com",
      supportEmail: "support.brew@yukoli.com",
      formEmail: typeof FORM_EMAIL !== "undefined" ? FORM_EMAIL : "179564128@qq.com",
      phone: "+86 18565718814",
      address: "Room 502-6, Building 12, Fangchuangyuan, No.83 Zhanlun Road, Honggang, Foshan, Guangdong, China",
      addressCN: "广东省佛山市顺德区容桂街道展业路83号方创园12栋502-6",
      social: {
        line: "#",
        telegram: "#",
        facebook: "#",
        instagram: "#",
        twitter: "#",
        linkedin: "#",
        youtube: "",
        tiktok: "",
        wechat: "",
      },
      wechat: {
        enabled: true,
        qrImage: "/assets/images/wechat-qr.webp",
      },
      support: {
        email: "support.brew@yukoli.com",
        channels: ["email", "whatsapp", "wechat"],
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 导航（含 CTA）
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
              label: { en: "OEM", "zh-CN": "OEM 代工" },
              icon: "precision_manufacturing",
              slug: "oem",
              href: "/solutions/oem/",
            },
            {
              id: "odm",
              label: { en: "ODM", "zh-CN": "ODM 贴牌" },
              icon: "design_services",
              slug: "odm",
              href: "/solutions/odm/",
            },
            {
              id: "obm",
              label: { en: "OBM", "zh-CN": "OBM 自有品牌" },
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
    },

    // ═══════════════════════════════════════════════════════════
    // Footer
    // ═══════════════════════════════════════════════════════════
    footer: {
      mobileItems: [
        { id: "home", label: { en: "Home", "zh-CN": "首页" }, icon: "home", href: "/home/" },
        { id: "products", label: { en: "Products", "zh-CN": "产品" }, icon: "inventory_2", href: "/products/" },
        { id: "solutions", label: { en: "Solutions", "zh-CN": "方案" }, icon: "design_services", href: "/solutions/" },
        { id: "inquiry", label: { en: "Inquiry", "zh-CN": "询盘" }, icon: "request_quote", href: "/contact/" },
        {
          id: "whatsapp",
          label: { en: "WhatsApp", "zh-CN": "WhatsApp" },
          icon: "chat",
          href: "https://wa.me/8618565718814",
        },
      ],
      tabletItems: [
        { id: "home", label: { en: "Home", "zh-CN": "首页" }, icon: "home", href: "/home/" },
        { id: "products", label: { en: "Products", "zh-CN": "产品" }, icon: "inventory_2", href: "/products/" },
        { id: "solutions", label: { en: "Solutions", "zh-CN": "方案" }, icon: "design_services", href: "/solutions/" },
        { id: "contact", label: { en: "Contact", "zh-CN": "联系" }, icon: "request_quote", href: "/contact/" },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // 页面分类体系
    // ═══════════════════════════════════════════════════════════
    categories: {
      products: [
        { slug: "coffee", key: "nav_products_coffee", label: "咖啡系列", icon: "coffee", emoji: "☕", accent: "coral" },
        { slug: "tea", key: "nav_products_tea", label: "茶饮系列", icon: "local_cafe", emoji: "🍵", accent: "green" },
        { slug: "meal", key: "nav_products_meal", label: "代餐系列", icon: "restaurant", emoji: "🥤", accent: "gold" },
        { slug: "beauty", key: "nav_products_beauty", label: "胶原养颜", icon: "spa", emoji: "✨", accent: "pink" },
        {
          slug: "weight",
          key: "nav_products_weight",
          label: "体重管理",
          icon: "monitor_weight",
          emoji: "⚖️",
          accent: "orange",
        },
        { slug: "gut", key: "nav_products_gut", label: "肠道健康", icon: "biotech", emoji: "🦠", accent: "teal" },
        {
          slug: "lifestyle",
          key: "nav_products_lifestyle",
          label: "功能冲饮",
          icon: "energy_savings_leaf",
          emoji: "🌿",
          accent: "green",
        },
        {
          slug: "legacy",
          key: "nav_products_legacy",
          label: "经典冲饮",
          icon: "auto_stories",
          emoji: "📖",
          accent: "brown",
        },
      ],
      applications: [
        { slug: "brand_owner", label: "品牌方", icon: "badge" },
        { slug: "chain_brand", label: "连锁品牌", icon: "store" },
        { slug: "ecommerce", label: "跨境电商", icon: "shopping_cart" },
        { slug: "health_brand", label: "大健康品牌", icon: "health_and_safety" },
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
        thankYou: "/thank-you/",
        support: "/support/",
        cases: "/cases/",
        roiCalculator: "/profit-calculator/",
        about: "/about/",
        // landing: "/landing/",  // removed in i18n cleanup
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
        inconsistent_quality: {
          min: 0.25,
          mid: 0.45,
          max: 0.62,
          label: { en: "Inconsistent Quality", "zh-CN": "出品不稳定" },
        },
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
        coffee_drink: { min: 0.3, max: 1.5, label: { en: "Coffee Drink", "zh-CN": "咖啡冲调" } },
        tea_drink: { min: 0.2, max: 1.0, label: { en: "Tea Drink", "zh-CN": "茶饮" } },
        meal_replacement: { min: 0.5, max: 2.0, label: { en: "Meal Replacement", "zh-CN": "代餐蛋白" } },
        collagen: { min: 0.5, max: 2.5, label: { en: "Collagen", "zh-CN": "胶原蛋白" } },
        weight_mgmt: { min: 0.3, max: 1.5, label: { en: "Weight Management", "zh-CN": "体重管理" } },
      },
      exchangeRates: {
        base: "USD",
        rates: { PHP: 56.2, IDR: 15800, VND: 25300, THB: 35.5, MYR: 4.7, CNY: 7.24, USD: 1 },
        updatedAt: "2026-05-01",
      },
      whatsappTemplates: {
        brand_owner: "Hi, I'm a brand owner looking for OEM/ODM services for health food products. Can you help?",
        chain_brand: "Hi, I manage a chain brand and need a reliable OEM partner for our private label health drinks.",
        ecommerce: "Hi, I sell on e-commerce platforms and want to create my own health food brand. What's the MOQ?",
        health_brand:
          "Hi, I'm in the health & wellness industry and need OEM manufacturing for functional food products.",
        "product-detail": "Hi, I'm interested in the {product name}. Please send me pricing, specs, and MOQ.",
        "roi-result": "Hi {brand}, I calculated my ROI:\n...",
        case: "Hi, I read the {country} {industry} case on your website. I have a similar situation.",
        global: "Hi, I'm interested in {brand} health food OEM/ODM services. Please help me find the right solution.",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 案例系统
    // ═══════════════════════════════════════════════════════════
    cases: {
      grid: [
        {
          slug: "sea-brand-coffee-private-label-2025",
          country: "🇸🇬 Singapore",
          industry: "品牌定制",
          volume: "500K+",
          benefit: "Full Service",
          title: "新加坡咖啡品牌：从配方到成品的 OEM 一站式",
          quote: '"从配方研发到包装设计，YuKoLi 全程跟进，产品上市周期缩短了 60%。"',
        },
        {
          slug: "uk-ecommerce-meal-replacement",
          country: "🇬🇧 UK",
          industry: "跨境电商",
          volume: "1M+",
          benefit: "Speed to Market",
          title: "英国 DTC 品牌：3 个月完成代餐粉产品线上线",
          quote: '"YuKoLi 的研发团队对欧洲市场合规非常了解，省了我们大量时间。"',
        },
        {
          slug: "th-chain-tea-brand-2025",
          country: "🇹🇭 Thailand",
          industry: "连锁茶饮",
          volume: "2M+",
          benefit: "Consistency",
          title: "泰国连锁茶饮品牌：全国 200+ 门店统一供货",
          quote: '"每批产品的口感完全一致，客户投诉率降了 90%。"',
        },
        {
          slug: "ph-pharmacy-collagen-2025",
          country: "🇵🇭 Philippines",
          industry: "连锁药房",
          volume: "300K+",
          benefit: "Certification",
          title: "菲律宾连锁药房：胶原肽粉 OEM 代工",
          quote: '"所有认证（FDA、GMP、ISO）YuKoLi 全部搞定，我们只负责销售。"',
        },
        {
          slug: "my-weight-management-brand",
          country: "🇲🇾 Malaysia",
          industry: "体重管理",
          volume: "800K+",
          benefit: "R&D Strength",
          title: "马来西亚体重管理品牌：独家配方定制",
          quote: '"他们的研发团队帮我们开发了一个差异化配方，市场反馈非常好。"',
        },
        {
          slug: "id-gut-health-supplement",
          country: "🇮🇩 Indonesia",
          industry: "肠道健康",
          volume: "600K+",
          benefit: "Local Compliance",
          title: "印尼肠道健康品牌：益生菌冲饮 OEM",
          quote: '"对 BPOM 认证流程很熟悉，产品顺利通过注册。"',
        },
        {
          slug: "vn-functional-drink-brand",
          country: "🇻🇳 Vietnam",
          industry: "功能冲饮",
          volume: "1.5M+",
          benefit: "Scale",
          title: "越南功能饮品品牌：月产能 100 万袋",
          quote: '"产能和质量都稳定，旺季也能保证供货。"',
        },
        {
          slug: "jp-beauty-collagen-2025",
          country: "🇯🇵 Japan",
          industry: "胶原养颜",
          volume: "400K+",
          benefit: "Quality Control",
          title: "日本美妆品牌：高纯度胶原蛋白肽代工",
          quote: '"产品质量完全达到日本市场标准，客户复购率超过 70%。"',
        },
      ],
      detail: {},
      filters: {
        industries: ["品牌定制", "跨境电商", "连锁茶饮", "连锁药房", "体重管理", "肠道健康", "功能冲饮", "胶原养颜"],
        countries: ["Singapore", "UK", "Thailand", "Philippines", "Malaysia", "Indonesia", "Vietnam", "Japan"],
        benefits: [
          "Full Service",
          "Speed to Market",
          "Consistency",
          "Certification",
          "R&D Strength",
          "Local Compliance",
          "Scale",
          "Quality Control",
        ],
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 搭配推荐 & 场景入口
    // ═══════════════════════════════════════════════════════════
    crossSell: {
      map: {}, // Optional override; cross-sell.js has built-in fallback
      scenes: {}, // Optional override; cross-sell.js has built-in fallback
      appLabels: {
        brand_owner: "品牌方",
        chain_brand: "连锁品牌",
        ecommerce: "跨境电商",
        health_brand: "大健康品牌",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 图片资源
    // ═══════════════════════════════════════════════════════════
    images: {
      prefix: "images",
      heroBg: "images/workshop-bg.webp",
      heroMain: "images/hero-main.webp",
      factoryPoster: "images/factory-video-poster.webp",
      gallery: [
        "images/factory-gallery-1.webp",
        "images/factory-gallery-2.webp",
        "images/factory-gallery-3.webp",
        "images/factory-gallery-4.webp",
      ],
      certs: [
        "images/cert-1.webp",
        "images/cert-2.webp",
        "images/cert-3.webp",
        "images/cert-4.webp",
        "images/cert-5.webp",
        "images/cert-6.webp",
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // 多语言
    // ═══════════════════════════════════════════════════════════
    i18n: {
      defaultLanguage: "zh-CN",
      languages: [
        {
          code: "zh-CN",
          nativeName: "中文（简体）",
          englishName: "Chinese (Simplified)",
          hasTranslation: true,
          uiGroup: "common",
          sortOrder: 1,
          currency: { symbol: "¥", code: "CNY", rate: 1, unit: "万元" },
        },
        {
          code: "en",
          nativeName: "English",
          englishName: "English",
          hasTranslation: true,
          uiGroup: "common",
          sortOrder: 2,
          currency: { symbol: "$", code: "USD", rate: 0.14, unit: "K" },
        },
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
      desktop: "dropdown", // "mega-menu" | "dropdown" | "simple"
      mobile: "fullscreen", // "fullscreen" | "slide" | "drawer"
      footerTabs: true, // 是否启用 Fixed Footer Tab
      megaColumns: 4, // Mega Menu 列数（仅 desktop=mega-menu 时有效）
    },

    // ═══════════════════════════════════════════════════════════
    // CTA 配置
    // ═══════════════════════════════════════════════════════════
    cta: {
      primary: {
        text: { en: "Get Quote", "zh-CN": "获取报价" },
        href: "/contact/",
        style: "cta", // "primary" | "cta" | "whatsapp" (映射到 .btn-* 类)
      },
      whatsapp: {
        text: { en: "Chat on WhatsApp", "zh-CN": "WhatsApp 咨询" },
        style: "whatsapp", // 使用 .btn-whatsapp 样式
        showFloat: true, // 是否显示浮动 WhatsApp 按钮
        floatPosition: { bottom: "82px", right: "16px" },
      },
    },

    // ═══════════════════════════════════════════════════════════
    // 主题 / 视觉系统
    // ═══════════════════════════════════════════════════════════
    theme: {
      colors: {
        primary: "#2E7D32",
        primaryHover: "#256028",
        primaryRgb: "46, 125, 50",
        bgLight: "#f8f6f6",
        bgDark: "#221610",
        textPrimary: "#0f172a",
        textMuted: "#64748b",
        textLight: "#f1f5f9",
      },
      // 新增：产品线强调色（按 accent key 自动映射）
      accentColors: {
        coral: { primary: "#FF6F61", bg: "#FFF5F4", light: "#FF8A80", dark: "#E05545" },
        gold: { primary: "#D4AF37", bg: "#FFFBEB", light: "#F6E5B0", dark: "#B8960F" },
        green: { primary: "#00A67E", bg: "#F0FDF9", light: "#6EE7B7", dark: "#008060" },
        teal: { primary: "#2E7D32", bg: "#E0F7FA", light: "#4DD0E1", dark: "#004044" },
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
        heading: "'Plus Jakarta Sans', 'Satoshi', 'Public Sans', system-ui, sans-serif",
        body: "'Inter', 'Noto Sans SC', 'Public Sans', system-ui, sans-serif",
        mono: "'Space Grotesk', monospace",
        cdn: [
          "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
        ],
        // Satoshi 是商业字体，CDN 不可用。安装后添加本地引用：
        // cdn: [...above, "/assets/fonts/satoshi.woff2"]
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
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      // 新增：间距系统
      spacing: {
        xs: "8px",
        sm: "16px",
        md: "24px",
        lg: "40px",
        xl: "64px",
        "2xl": "80px",
        "3xl": "120px",
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
      productCompare: false, // TODO: planned — no module yet
      cases: true,
      crossSell: true,
      screenshot: false, // TODO: planned — no module yet
      pdfExport: false, // TODO: planned — no module yet
      serviceMap: false, // TODO: planned — no module yet
      megaMenu: true, // 是否启用 Mega Menu（需 navMode.desktop="mega-menu"）
      productLines: true, // 是否启用产品线系统
      mobileFooterNav: true, // 是否启用移动端 Fixed Footer Tab
      unifiedBottomNav: true, // 是否启用统一底部导航（bottom-tab.js 统一接管，取代旧 footer.js 导航）
      floatingWhatsApp: true, // 是否启用浮动 WhatsApp 按钮
    },
  };

  // ── 导出 ──
  global.SITE_CONFIG = config;
  global._cfg = config; // @deprecated — use window.SITE_CONFIG instead

  // Node.js 环境导出
  if (typeof module !== "undefined" && module.exports) {
    module.exports = config;
  }
})(window || global);
