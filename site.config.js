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
      name: "YuKoLi",
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
      whatsapp: "8613163756465",
      whatsappDefaultMsg: "Hi YuKoLi, I'm interested in your commercial kitchen equipment.",
      email: "info@yukoli.com",
      supportEmail: "support.kitchen@yukoli.com",
      phone: "",
      address: "Room 502-6, Building 12, Fangchuangyuan, No.83 Zhanlun Road, Honggang, Foshan, Guangdong, China",
      addressCN: "广东省佛山市顺德区容桂街道展业路83号方创园12栋502-6",
      social: {
        facebook: "",
        instagram: "",
        youtube: "",
        linkedin: "",
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
        { slug: "stirfry", key: "nav_products_stirfry", label: "翻炒系列", icon: "local_fire_department", emoji: "🔥" },
        { slug: "cutting", key: "nav_products_cutting", label: "切配系列", icon: "content_cut", emoji: "🔪" },
        { slug: "frying", key: "nav_products_frying", label: "煎炸系列", icon: "outdoor_grill", emoji: "🍳" },
        { slug: "stewing", key: "nav_products_stewing", label: "炖煮系列", icon: "soup_kitchen", emoji: "🥘" },
        { slug: "steaming", key: "nav_products_steaming", label: "蒸煮系列", icon: "cloud", emoji: "⬆️" },
        { slug: "other", key: "nav_products_other", label: "辅助设备", icon: "more_horiz", emoji: "⚙️" },
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
      grid: [],  // TODO: 从 case-grid.js 迁移
      detail: {}, // TODO: 从 cases-page.js 迁移
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
      map: {
    stirfry: [
      { slug: "cutting", reason: "切配后直接翻炒，备料到出餐无缝衔接", highlight: "效率 +200%" },
      { slug: "steaming", reason: "蒸饭蒸菜同步进行，午高峰不排队", highlight: "出餐 -40min" },
      { slug: "other", reason: "洗碗机+保温台，后厨动线一次到位", highlight: "人手 -3人" },
      { slug: "stewing", reason: "炖汤+炒菜双线出餐，菜品更丰富", highlight: "菜品 +30%" },
    ],
    cutting: [
      { slug: "stirfry", reason: "切好直接下锅，备料到烹饪零等待", highlight: "效率 +180%" },
      { slug: "steaming", reason: "切配+蒸煮一体化，前处理更高效", highlight: "备料 -60min" },
      { slug: "other", reason: "传送带+分拣台，流水线式切配作业", highlight: "产能 +4倍" },
    ],
    frying: [
      { slug: "stirfry", reason: "炸+炒双线并行，出餐速度翻倍", highlight: "出餐 +100%" },
      { slug: "cutting", reason: "切配备料跟上油炸节奏，不缺料", highlight: "备料 0等待" },
      { slug: "other", reason: "滤油台+排烟系统，油炸区干净整洁", highlight: "油烟 -80%" },
    ],
    stewing: [
      { slug: "stirfry", reason: "炖汤+炒菜组合，满足多样化菜单", highlight: "菜品 +25%" },
      { slug: "steaming", reason: "炖煮蒸饭同步，大锅饭不再手忙脚乱", highlight: "同步出餐" },
      { slug: "cutting", reason: "自动切配炖菜食材，规格统一味道稳", highlight: "口味一致" },
    ],
    steaming: [
      { slug: "stirfry", reason: "蒸+炒搭档，炒菜蒸饭同时搞定", highlight: "效率 +150%" },
      { slug: "cutting", reason: "蒸前切配自动完成，食材现切现蒸", highlight: "鲜度提升" },
      { slug: "stewing", reason: "蒸+炖组合，汤饭粥一灶全出", highlight: "一灶多用" },
      { slug: "other", reason: "保温分餐台搭配蒸柜，热菜直达窗口", highlight: "温度不降" },
    ],
    other: [
      { slug: "stirfry", reason: "核心烹饪+辅助设备，后厨全套配齐", highlight: "一站式" },
      { slug: "cutting", reason: "切配+辅助传送，流水线完整配置", highlight: "流水线化" },
      { slug: "steaming", reason: "蒸柜+保温台，从蒸到分餐不断链", highlight: "温度可控" },
    ],
  },
      scenes: {
    stirfry: [
      {
        href: "/applications/small-restaurant/",
        slug: "small-restaurant",
        icon: "storefront",
        desc: "2-5人小后厨，一台炒菜机顶3个厨师",
      },
      {
        href: "/applications/canteen/",
        slug: "canteen",
        icon: "restaurant",
        desc: "食堂午高峰500-5000人，90分钟出完热菜",
      },
      {
        href: "/applications/central-kitchen/",
        slug: "central-kitchen",
        icon: "apartment",
        desc: "中央厨房批量出餐，菜品口味标准化",
      },
    ],
    cutting: [
      {
        href: "/applications/central-kitchen/",
        slug: "central-kitchen",
        icon: "apartment",
        desc: "千份级备料，切配规格统一不出错",
      },
      {
        href: "/applications/food-factory/",
        slug: "food-factory",
        icon: "factory",
        desc: "食品工厂流水线切配，日产能提升6倍",
      },
      { href: "/applications/canteen/", slug: "canteen", icon: "restaurant", desc: "食堂切菜工序自动化，2小时→20分钟" },
    ],
    frying: [
      {
        href: "/applications/small-restaurant/",
        slug: "small-restaurant",
        icon: "storefront",
        desc: "炸鸡炸薯条出餐快，外卖高峰不爆单",
      },
      {
        href: "/applications/chain-restaurant/",
        slug: "chain-restaurant",
        icon: "store",
        desc: "连锁店炸品口味统一，每批出品标准化",
      },
      {
        href: "/applications/cloud-kitchen/",
        slug: "cloud-kitchen",
        icon: "delivery_dining",
        desc: "云厨房多品牌共用，炸炉轮流出餐",
      },
    ],
    stewing: [
      { href: "/applications/canteen/", slug: "canteen", icon: "restaurant", desc: "食堂炖汤一大锅，千人份同时供应" },
      {
        href: "/applications/central-kitchen/",
        slug: "central-kitchen",
        icon: "apartment",
        desc: "中央厨房炖品批量出，口味稳定如一",
      },
      {
        href: "/applications/chain-restaurant/",
        slug: "chain-restaurant",
        icon: "store",
        desc: "连锁店招牌炖品，每家店味道都一样",
      },
    ],
    steaming: [
      {
        href: "/applications/canteen/",
        slug: "canteen",
        icon: "restaurant",
        desc: "食堂蒸饭蒸菜同步，千人份量轻松搞定",
      },
      {
        href: "/applications/central-kitchen/",
        slug: "central-kitchen",
        icon: "apartment",
        desc: "中央厨房批量蒸制，配送前锁鲜保味",
      },
      {
        href: "/applications/food-factory/",
        slug: "food-factory",
        icon: "factory",
        desc: "食品工厂蒸煮工序，全自动温度控制",
      },
    ],
    other: [
      { href: "/applications/canteen/", slug: "canteen", icon: "restaurant", desc: "食堂洗碗分餐一体，后厨人手省一半" },
      {
        href: "/applications/chain-restaurant/",
        slug: "chain-restaurant",
        icon: "store",
        desc: "连锁店排烟+清洗标准化，后厨干净合规",
      },
      {
        href: "/applications/central-kitchen/",
        slug: "central-kitchen",
        icon: "apartment",
        desc: "中央厨房传送+包装，全流程自动化",
      },
    ],
    all: [
      {
        href: "/applications/small-restaurant/",
        slug: "small-restaurant",
        icon: "storefront",
        desc: "2-5人小后厨，一台炒菜机顶3个厨师",
      },
      {
        href: "/applications/canteen/",
        slug: "canteen",
        icon: "restaurant",
        desc: "食堂午高峰500-5000人，90分钟出完热菜",
      },
      {
        href: "/applications/central-kitchen/",
        slug: "central-kitchen",
        icon: "apartment",
        desc: "中央厨房批量出餐，菜品口味标准化",
      },
      {
        href: "/applications/chain-restaurant/",
        slug: "chain-restaurant",
        icon: "dining",
        desc: "连锁门店统一出品，告别厨师依赖",
      },
      {
        href: "/applications/cloud-kitchen/",
        slug: "cloud-kitchen",
        icon: "delivery_dining",
        desc: "外卖云厨房，单店日产能3000+单",
      },
      {
        href: "/applications/food-factory/",
        slug: "food-factory",
        icon: "factory",
        desc: "食品工厂产线自动化，日产能万份以上",
      },
      { href: "/applications/menu-lab/", slug: "menu-lab", icon: "science", desc: "菜系实验室，一键复制各国风味" },
    ],
  },
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
        { code: "th", nativeName: "ไทย", englishName: "Thai", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 3, currency: { symbol: "฿", code: "THB", rate: 5.0, unit: "ล้าน" } },
        { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 4, currency: { symbol: "₫", code: "VND", rate: 3400, unit: "Triệu" } },
        { code: "ms", nativeName: "Bahasa Melayu", englishName: "Malay", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 5, currency: { symbol: "RM", code: "MYR", rate: 0.65, unit: "Juta" } },
        { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 6, currency: { symbol: "Rp", code: "IDR", rate: 2200, unit: "Juta" } },
        { code: "fil", nativeName: "Filipino", englishName: "Filipino", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 7, currency: { symbol: "₱", code: "PHP", rate: 0.017, unit: "K" } },
        { code: "km", nativeName: "ភាសាខ្មែរ", englishName: "Khmer", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 8, currency: { symbol: "៛", code: "KHR", rate: 4100, unit: "ម៉ឺន" } },
        { code: "lo", nativeName: "ລາວ", englishName: "Lao", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 9, currency: { symbol: "₭", code: "LAK", rate: 22000, unit: "ລ້ານ" } },
        { code: "my", nativeName: "မြန်မာဘာသာ", englishName: "Burmese", hasTranslation: true, uiGroup: "southeast_asia", sortOrder: 10, currency: { symbol: "K", code: "MMK", rate: 2100, unit: "K" } },
        // ── East Asia ──
        { code: "ja", nativeName: "日本語", englishName: "Japanese", hasTranslation: true, uiGroup: "east_asia", sortOrder: 11, currency: { symbol: "¥", code: "JPY", rate: 21, unit: "万円", label: "JP¥" } },
        { code: "ko", nativeName: "한국어", englishName: "Korean", hasTranslation: true, uiGroup: "east_asia", sortOrder: 12, currency: { symbol: "₩", code: "KRW", rate: 188, unit: "백만" } },
        // ── South Asia + Others ──
        { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", hasTranslation: true, uiGroup: "other", sortOrder: 13, currency: { symbol: "₹", code: "INR", rate: 11.5, unit: "Lakh" } },
        { code: "zh-TW", nativeName: "中文（繁體）", englishName: "Chinese (Traditional)", hasTranslation: true, uiGroup: "other", sortOrder: 14, currency: { symbol: "NT$", code: "TWD", rate: 4.4, unit: "萬元" } },
        { code: "ar", nativeName: "العربية", englishName: "Arabic", hasTranslation: true, uiGroup: "middle_east", sortOrder: 15, currency: { symbol: "ر.س", code: "SAR", rate: 0.52, unit: "K" } },
        { code: "he", nativeName: "עברית", englishName: "Hebrew", hasTranslation: true, uiGroup: "middle_east", sortOrder: 16, currency: { symbol: "₪", code: "ILS", rate: 3.7, unit: "K" } },
        { code: "tr", nativeName: "Türkçe", englishName: "Turkish", hasTranslation: true, uiGroup: "middle_east", sortOrder: 17, currency: { symbol: "₺", code: "TRY", rate: 30, unit: "K" } },
        // ── European ──
        { code: "fr", nativeName: "Français", englishName: "French", hasTranslation: true, uiGroup: "european", sortOrder: 18, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "de", nativeName: "Deutsch", englishName: "German", hasTranslation: true, uiGroup: "european", sortOrder: 19, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "es", nativeName: "Español", englishName: "Spanish", hasTranslation: true, uiGroup: "european", sortOrder: 20, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "pt", nativeName: "Português", englishName: "Portuguese", hasTranslation: true, uiGroup: "european", sortOrder: 21, currency: { symbol: "R$", code: "BRL", rate: 5.0, unit: "K" } },
        { code: "ru", nativeName: "Русский", englishName: "Russian", hasTranslation: true, uiGroup: "european", sortOrder: 22, currency: { symbol: "₽", code: "RUB", rate: 92, unit: "K" } },
        { code: "it", nativeName: "Italiano", englishName: "Italian", hasTranslation: true, uiGroup: "european", sortOrder: 23, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "nl", nativeName: "Nederlands", englishName: "Dutch", hasTranslation: true, uiGroup: "european", sortOrder: 24, currency: { symbol: "€", code: "EUR", rate: 0.92, unit: "K" } },
        { code: "pl", nativeName: "Polski", englishName: "Polish", hasTranslation: true, uiGroup: "european", sortOrder: 25, currency: { symbol: "zł", code: "PLN", rate: 4.0, unit: "K" } },
      ],
      overrides: {}, // TODO: 从翻译 JSON 中提取业务专用 key
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
    },
  };

  // ── 导出 ──
  global.SITE_CONFIG = config;
  // 兼容简写
  global._cfg = config;

  // Node.js 环境导出
  if (typeof module !== "undefined" && module.exports) {
    module.exports = config;
  }
})(window || global);
