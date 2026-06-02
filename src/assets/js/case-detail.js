/* ═══════════════════════════════════════════════════
   case-detail.js — 案例详情页渲染 (OEM/ODM)
   Dynamic rendering: extracts slug from URL, loads data, renders all sections
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Config Helpers ───────────────────────────── */
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ── Fallback Data (from cases-generated.json) ── */
  var _casesData = [
    {
      slug: "sea-coffee-brand",
      title: "菲律宾咖啡品牌借力定制研发，7天极速打样抢占东南亚市场",
      title_en: "Filipino Coffee Brand Seizes SEA Market via Custom R&D and 7-Day Sampling",
      country: "🇵🇭 Philippines",
      industry: "品牌方",
      industry_en: "Brand Owner",
      highlight: "定制研发快打样",
      highlight_en: "Custom R&D Fast Sampling",
      quote: "YuKoLi的配方调校精准契合本地口味，7天出样让我们快人一步完成本土合规上市。",
      quote_en:
        "YuKoLi's precise flavor tuning perfectly matched our local market. Their 7-day sampling and FDA compliance got us to launch much faster.",
      lead_time: "7天极速打样",
      lead_time_en: "7-Day Fast Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "FDA+HACCP双认证",
      cert_label_en: "FDA & HACCP Certified",
      monthly_volume: "月产80万条",
      monthly_volume_en: "800K Sachets/Month",
      background:
        "该客户是菲律宾本土新兴咖啡品牌，主打年轻化、高性价比的即溶咖啡产品线。品牌创始人拥有丰富的东南亚快消品渠道资源，希望在3个月内完成从配方研发到多规格产品上市的全链路交付。",
      background_en:
        "This client is an emerging Filipino coffee brand targeting young consumers with affordable instant coffee products. The founder has extensive FMCG channel resources across Southeast Asia and aimed to complete the full cycle from R&D to multi-spec product launch within 3 months.",
      pain_points: [
        "菲律宾消费者偏好浓郁且甜度适中的咖啡口感，需精准调校配方以贴合本地味蕾",
        "首次进入东南亚市场，缺乏FDA等本地合规经验，担心注册周期延误上市",
        "品牌刚起步，需要灵活的生产方案以控制初期备货风险",
      ],
      pain_points_en: [
        "Filipino consumers prefer rich, moderately sweet coffee — flavor tuning needed",
        "First SEA market entry, lacked local FDA compliance experience",
        "Early-stage brand needed flexible production to control initial inventory risk",
      ],
      solutions: [
        {
          icon: "science",
          title: "配方研发",
          title_en: "R&D",
          desc: "研发团队基于目标客群口味偏好进行3轮配方盲测调校，最终锁定最佳烘焙曲线与甜度配比",
        },
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "协助完成菲律宾FDA注册，提供配料合规审核与标签审核一站式服务",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "启动柔性小批量产线，7天完成首批打样，为品牌赢得快速试水市场的时间窗口",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "定制3种规格条装包装，条装独立锁鲜技术确保产品在热带气候下保持风味稳定",
        },
      ],
      solutions_en: [
        {
          icon: "science",
          title: "R&D",
          title_en: "R&D",
          desc: "Three rounds of blind taste tests to lock the optimal roasting profile and sweetness ratio",
        },
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "Full Philippine FDA registration support with ingredient compliance and label review",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "Flexible small-batch production line delivered first samples in 7 days",
        },
        {
          icon: "inventory_2",
          title: "Packaging & Logistics",
          title_en: "Packaging & Logistics",
          desc: "Custom 3-spec sachet packaging with individual fresh-lock technology for tropical climate",
        },
      ],
      metrics: [
        { value: "7天", value_en: "7 Days", label: "极速打样", label_en: "Fast Sampling" },
        { value: "80万条/月", value_en: "800K Sachets/Month", label: "稳定产能", label_en: "Monthly Output" },
        { value: "500起", value_en: "From 500", label: "低门槛MOQ", label_en: "Low MOQ" },
        { value: "30+国", value_en: "30+ Countries", label: "合规出口", label_en: "Compliant Export" },
      ],
      results: [
        {
          icon: "trending_up",
          title: "市场验证",
          title_en: "Market Validation",
          desc: "首批打样产品在上线后2周内即获得3家连锁便利店采购意向",
        },
        {
          icon: "speed",
          title: "速度优势",
          title_en: "Speed Advantage",
          desc: "从配方研发到首批出货仅用45天，比行业平均周期缩短50%",
        },
        {
          icon: "verified",
          title: "合规保障",
          title_en: "Compliance",
          desc: "产品顺利通过菲律宾FDA审核，获得当地市场合法销售资质",
        },
      ],
      results_en: [
        {
          icon: "trending_up",
          title: "Market Validation",
          title_en: "Market Validation",
          desc: "First samples received purchase intent from 3 chain convenience stores within 2 weeks",
        },
        {
          icon: "speed",
          title: "Speed Advantage",
          title_en: "Speed Advantage",
          desc: "From R&D to first shipment in 45 days — 50% faster than industry average",
        },
        {
          icon: "verified",
          title: "Compliance",
          title_en: "Compliance",
          desc: "Product passed Philippine FDA review, obtained legal local sales authorization",
        },
      ],
    },
    {
      slug: "mideast-meal-brand",
      title: "阿联酋代餐跨境突围：Halal认证与小包装定制双管齐下",
      title_en: "UAE Meal Replacement Brand Expands E-commerce via Halal Certification & Mini Packs",
      country: "🇦🇪 UAE",
      industry: "跨境电商",
      industry_en: "Cross-Border E-Commerce",
      highlight: "清真合规小包装",
      highlight_en: "Halal Compliant Mini Packs",
      quote: "中东市场对合规要求极严，YuKoLi的Halal资质和灵活小包装让我们迅速赢得本地消费者信任。",
      quote_en:
        "The Middle East has strict compliance. YuKoLi's authentic Halal certification and flexible small packaging quickly won local consumers' trust for our e-commerce launch.",
      lead_time: "5天极速打样",
      lead_time_en: "5-Day Fast Sampling",
      moq_label: "MOQ 300起",
      moq_label_en: "MOQ from 300",
      cert_label: "Halal+HACCP双认证",
      cert_label_en: "Halal & HACCP Certified",
      monthly_volume: "月产60万杯",
      monthly_volume_en: "600K Cups/Month",
      background:
        "该客户是阿联酋新兴跨境电商品牌，计划通过电商平台推出代餐奶昔产品线，面向中东年轻消费群体。品牌对清真认证有刚性需求，同时需要灵活的小包装方案以降低物流成本。",
      background_en:
        "This UAE-based cross-border e-commerce brand planned to launch meal replacement shakes targeting young Middle Eastern consumers. They had a hard requirement for Halal certification and needed flexible mini-pack solutions to reduce logistics costs.",
      pain_points: [
        "中东市场对清真认证要求极为严格，需取得权威Halal认证才能进入主流零售与电商渠道",
        "跨境电商物流成本高，需小包装方案降低单件运费",
        "代餐市场竞争激烈，需快速迭代产品口味以抢占消费者心智",
      ],
      pain_points_en: [
        "Strict Halal certification requirement for mainstream retail and e-commerce channels",
        "High cross-border logistics cost required mini-pack solutions",
        "Competitive meal replacement market demanded rapid flavor iteration",
      ],
      solutions: [
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "通过权威Halal认证机构审核，从原料源头到生产全链路确保清真合规",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "定制迷你条装（15g/条），大幅降低单件运输成本，同时满足中东消费者试新尝鲜的购买习惯",
        },
        {
          icon: "science",
          title: "配方研发",
          title_en: "R&D",
          desc: "基于中东饮食偏好研发椰枣风味与藏红花风味代餐配方，打造差异化产品",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "5天极速打样，小批量柔性生产支持多口味并行上市测试",
        },
      ],
      solutions_en: [
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "Full Halal certification from authoritative body, covering entire production chain",
        },
        {
          icon: "inventory_2",
          title: "Packaging",
          title_en: "Packaging",
          desc: "Custom mini sachets (15g each) reduced per-unit shipping costs significantly",
        },
        {
          icon: "science",
          title: "R&D",
          title_en: "R&D",
          desc: "Developed date-flavored and saffron-flavored meal replacement formulas tailored for Middle Eastern tastes",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "5-day rapid sampling with flexible small-batch production for multi-flavor parallel testing",
        },
      ],
      metrics: [
        { value: "5天", value_en: "5 Days", label: "极速打样", label_en: "Fast Sampling" },
        { value: "60万杯/月", value_en: "600K Cups/Month", label: "稳定产能", label_en: "Monthly Output" },
        { value: "300起", value_en: "From 300", label: "灵活MOQ", label_en: "Flexible MOQ" },
        { value: "Halal", value_en: "Halal", label: "权威认证", label_en: "Halal Certified" },
      ],
      results: [
        {
          icon: "trending_up",
          title: "上线即爆",
          title_en: "Launch Success",
          desc: "首个SKU上线3周即冲上电商平台代餐品类TOP10",
        },
        {
          icon: "inventory_2",
          title: "物流优化",
          title_en: "Logistics Optimization",
          desc: "小包装方案使单件运输成本降低40%，显著提升毛利率",
        },
        {
          icon: "verified",
          title: "品牌信任",
          title_en: "Brand Trust",
          desc: "Halal认证成为品牌核心卖点，复购率提升至35%",
        },
      ],
      results_en: [
        {
          icon: "trending_up",
          title: "Launch Success",
          title_en: "Launch Success",
          desc: "First SKU reached top 10 in meal replacement category within 3 weeks",
        },
        {
          icon: "inventory_2",
          title: "Logistics",
          title_en: "Logistics",
          desc: "Mini-pack solution reduced per-unit shipping cost by 40%",
        },
        {
          icon: "verified",
          title: "Trust",
          title_en: "Trust",
          desc: "Halal certification became key USP, repurchase rate reached 35%",
        },
      ],
    },
    {
      slug: "eu-collagen-brand",
      title: "德国高端胶原蛋白破局欧盟，多规格严苛品控铸就爆款",
      title_en: "German Premium Collagen Brand Conquers EU Market via Multi-Spec & Strict Quality Control",
      country: "🇩🇪 Germany",
      industry: "大健康",
      industry_en: "Health & Wellness",
      highlight: "欧盟品控多规格",
      highlight_en: "EU Standard Multi-Specs",
      quote: "欧盟标准极其严苛，YuKoLi不仅通过了ISO体系认证，还能提供多规格灵活定制，完美匹配我们的高端定位。",
      quote_en:
        "EU standards are extremely strict. YuKoLi not only passed ISO certification but also provided multi-specification flexible customization, perfectly matching our premium brand positioning.",
      lead_time: "7天周期打样",
      lead_time_en: "7-Day Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "ISO 22000认证",
      cert_label_en: "ISO 22000 Certified",
      monthly_volume: "月产40万瓶",
      monthly_volume_en: "400K Bottles/Month",
      background:
        "该品牌是德国高端美容保健品品牌，主攻欧洲线下药房与高端护肤渠道。需要寻找能够通过欧盟严苛品控要求并具有多规格生产能力的OEM合作伙伴，以支撑其多SKU矩阵的市场策略。",
      background_en:
        "This German premium beauty supplement brand targets European pharmacies and high-end skincare channels. They needed an OEM partner capable of meeting strict EU quality standards with multi-spec production capacity to support their multi-SKU market strategy.",
      pain_points: [
        "欧盟食品补充剂法规标准极高，普通代工厂难以达标",
        "产品线涵盖瓶装、条装、胶囊等多种剂型，需要多规格柔性产线",
        "高端品牌定位要求包装材质与印刷品质达到奢侈级别",
      ],
      pain_points_en: [
        "Very high EU food supplement regulatory standards",
        "Multi-format product line (bottles, sachets, capsules) required flexible production",
        "Premium brand positioning demanded luxury-grade packaging materials and printing",
      ],
      solutions: [
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "通过ISO 22000食品安全管理体系认证，全链条满足欧盟食品补充剂法规要求",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "多规格柔性产线支持瓶装、条装、胶囊等剂型一键切换，满足40万瓶/月产能需求",
        },
        {
          icon: "science",
          title: "配方研发",
          title_en: "R&D",
          desc: "德国团队与YuKoLi联合研发，采用高吸收率小分子胶原蛋白肽配方",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "定制高端烫金工艺包装盒，配合冷链物流保障产品品质直达德国",
        },
      ],
      solutions_en: [
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "ISO 22000 certified, fully compliant with EU food supplement regulations",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "Multi-format flexible lines supporting bottles, sachets, capsules with 400K/month capacity",
        },
        {
          icon: "science",
          title: "R&D",
          title_en: "R&D",
          desc: "Co-developed high-absorption low-molecular-weight collagen peptide formula",
        },
        {
          icon: "inventory_2",
          title: "Packaging",
          title_en: "Packaging",
          desc: "Premium hot-stamping packaging with cold-chain logistics to Germany",
        },
      ],
      metrics: [
        { value: "40万瓶/月", value_en: "400K Bottles/Month", label: "稳定产能", label_en: "Monthly Output" },
        { value: "ISO 22000", value_en: "ISO 22000", label: "国际认证", label_en: "ISO Certified" },
        { value: "多规格", value_en: "Multi-Spec", label: "灵活定制", label_en: "Multi-Spec" },
        { value: "EU合规", value_en: "EU Compliant", label: "欧盟准入", label_en: "EU Compliant" },
      ],
      results: [
        {
          icon: "verified",
          title: "品质认证",
          title_en: "Quality",
          desc: "顺利通过欧盟官方GMP飞行检查，获得欧洲药房渠道上架资格",
        },
        {
          icon: "trending_up",
          title: "市场拓展",
          title_en: "Market Growth",
          desc: "上市6个月即进入德国1000+家高端药房",
        },
        {
          icon: "star",
          title: "品牌赋能",
          title_en: "Brand Value",
          desc: "凭借卓越品质获得多个欧洲美妆奖项，品牌溢价提升30%",
        },
      ],
      results_en: [
        {
          icon: "verified",
          title: "Quality",
          title_en: "Quality",
          desc: "Passed EU official GMP inspection, obtained pharmacy channel listing qualification",
        },
        {
          icon: "trending_up",
          title: "Growth",
          title_en: "Growth",
          desc: "Listed in 1000+ German high-end pharmacies within 6 months",
        },
        {
          icon: "star",
          title: "Brand",
          title_en: "Brand",
          desc: "Won multiple European beauty awards, brand premium increased by 30%",
        },
      ],
    },
    {
      slug: "jp-functional-drink",
      title: "日本机能饮品品牌落地，精研配方与品控攻克日标合规壁垒",
      title_en: "Japanese Functional Drink Brand Achieves Local Compliance via Precision R&D and Strict QC",
      country: "🇯🇵 Japan",
      industry: "新消费品牌",
      industry_en: "Neo-Consumer Brand",
      highlight: "深度研发严品控",
      highlight_en: "Deep R&D Precision QC",
      quote: "日本市场对成分与品控的挑剔众所周知，YuKoLi的研发深度与精细品控让我们安心实现本土化落地。",
      quote_en:
        "The Japanese market is notoriously picky about ingredients and quality control. YuKoLi's deep R&D and precision manufacturing gave us complete confidence for local compliance.",
      lead_time: "6天极速打样",
      lead_time_en: "6-Day Fast Sampling",
      moq_label: "MOQ 100起",
      moq_label_en: "MOQ from 100",
      cert_label: "HACCP+ISO双认证",
      cert_label_en: "HACCP & ISO Certified",
      monthly_volume: "月产90万支",
      monthly_volume_en: "900K Pouches/Month",
      background:
        "该客户是日本新锐功能性饮品品牌，主打GABA助眠与活力能量两条产品线。日本市场对功能性食品的成分标注、功效宣称和品质管控有极为严格的法规要求。",
      background_en:
        "This Japanese functional beverage startup launched GABA relaxation and energy drink lines. Japan has extremely strict regulations on functional food ingredient labeling, efficacy claims, and quality control.",
      pain_points: [
        "日本食品标示法对功能性成分剂量与功效宣称有明确规定，需精准合规",
        "日标微生物与理化指标比国际标准更严苛",
        '品牌希望保持"日本品质"形象，对代工厂品控体系要求极高',
      ],
      pain_points_en: [
        "Japan Food Labeling Law has strict requirements on functional ingredient dosage and claims",
        "Japanese microbiological and physicochemical standards are stricter than international norms",
        'Brand needed to maintain "Japanese quality" image, requiring exceptional QC systems',
      ],
      solutions: [
        {
          icon: "science",
          title: "配方研发",
          title_en: "R&D",
          desc: "精确控制GABA与维生素添加量，确保符合日本机能性食品标示基准",
        },
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "HACCP+ISO双认证体系覆盖全产线，批次全检满足日标微生物检测标准",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "6天快速打样，无菌灌装工艺保障产品纯净度达到日本市场标准",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "日语标签设计与合规审核一站式服务，确保包装信息完全符合日本法规",
        },
      ],
      solutions_en: [
        {
          icon: "science",
          title: "R&D",
          title_en: "R&D",
          desc: "Precisely controlled GABA and vitamin levels compliant with Japanese functional food standards",
        },
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "HACCP+ISO dual certification with batch testing meeting Japanese microbiological standards",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "6-day sampling with aseptic filling for Japanese-market purity standards",
        },
        {
          icon: "inventory_2",
          title: "Packaging",
          title_en: "Packaging",
          desc: "One-stop Japanese label design and compliance review",
        },
      ],
      metrics: [
        { value: "6天", value_en: "6 Days", label: "极速打样", label_en: "Fast Sampling" },
        { value: "90万支/月", value_en: "900K sticks/Month", label: "高产能力", label_en: "High Output" },
        { value: "100起", value_en: "From 100", label: "超低MOQ", label_en: "Ultra Low MOQ" },
        { value: "日标", label: "日本合规", label_en: "Japan Compliant" },
      ],
      results: [
        {
          icon: "verified",
          title: "合规通关",
          title_en: "Compliance Cleared",
          desc: "产品一次性通过日本消费者厅机能性食品备案审查",
        },
        {
          icon: "trending_up",
          title: "销售增长",
          title_en: "Sales Growth",
          desc: "上线3个月即进入东京大阪200+家便利店和药妆店",
        },
        { icon: "star", title: "品质口碑", title_en: "Quality Reputation", desc: "消费者满意度达4.7星，复购率超40%" },
      ],
      results_en: [
        {
          icon: "verified",
          title: "Compliance",
          title_en: "Compliance",
          desc: "Products passed Japanese Consumer Affairs Agency functional food review in one go",
        },
        {
          icon: "trending_up",
          title: "Growth",
          title_en: "Growth",
          desc: "Listed in 200+ convenience stores and drugstores in Tokyo and Osaka within 3 months",
        },
        {
          icon: "star",
          title: "Reputation",
          title_en: "Reputation",
          desc: "Consumer satisfaction rating 4.7, repurchase rate exceeded 40%",
        },
      ],
    },
    {
      slug: "na-probiotic-brand",
      title: "北美益生菌冲饮合规出海，HACCP冷链方案护航月销百万",
      title_en: "NA Probiotic Brand Achieves Compliance & Sales Boost via HACCP Cold Chain",
      country: "🇺🇸 USA",
      industry: "大健康",
      industry_en: "Health & Wellness",
      highlight: "HACCP冷链保活",
      highlight_en: "HACCP Cold Chain Viability",
      quote: "YuKoLi的FDA注册和冷链方案彻底解决了我们的合规与活性难题，让高活菌冲饮顺利入北美。",
      quote_en:
        "YuKoLi's comprehensive FDA registration and cold chain solutions resolved our compliance and probiotic viability challenges, ensuring smooth entry into the North American market.",
      lead_time: "7天专业打样",
      lead_time_en: "7-Day Pro Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "FDA+HACCP认证",
      cert_label_en: "FDA & HACCP Certified",
      monthly_volume: "月产80万盒",
      monthly_volume_en: "800K Units/Month",
      background:
        "该客户是美国天然健康食品电商品牌，计划推出高活性益生菌冲饮产品线。益生菌产品在运输和储存过程中活性衰减是最大痛点，同时需要解决FDA注册与膳食补充剂合规问题。",
      background_en:
        "This US-based natural health food e-commerce brand planned to launch a high-viability probiotic drink mix. Probiotic activity degradation during transit was their biggest pain point, along with FDA registration and dietary supplement compliance.",
      pain_points: [
        "益生菌活性在常温运输中快速衰减，严重影响产品功效",
        "美国FDA对膳食补充剂的cGMP合规要求严格",
        "品牌希望实现百万级月销，需要稳定的大规模产能保障",
      ],
      pain_points_en: [
        "Probiotic viability degraded rapidly during ambient transport",
        "US FDA cGMP compliance requirements for dietary supplements are strict",
        "Brand targeted million-unit monthly sales requiring stable mass production",
      ],
      solutions: [
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "完成FDA膳食补充剂设施注册，提供cGMP合规全套文档支持",
        },
        {
          icon: "ac_unit",
          title: "冷链方案",
          title_en: "Cold Chain",
          desc: "定制冷链仓储与运输方案，从生产线到北美仓库全程温控，保障益生菌活性",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "高活性益生菌专用产线，采用冻干技术确保出厂活菌数达到100亿CFU/份",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "铝箔独立条装配合脱氧剂，实现常温下18个月长效保活",
        },
      ],
      solutions_en: [
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "FDA dietary supplement facility registration with full cGMP documentation",
        },
        {
          icon: "ac_unit",
          title: "Cold Chain",
          title_en: "Cold Chain",
          desc: "Custom cold chain from production line to North American warehouses",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "Dedicated high-viability probiotic line with freeze-dry technology ensuring 10B CFU/serving",
        },
        {
          icon: "inventory_2",
          title: "Packaging",
          title_en: "Packaging",
          desc: "Aluminum foil individual sachets with oxygen absorbers for 18-month shelf life at ambient temperature",
        },
      ],
      metrics: [
        { value: "100亿CFU", label: "活菌含量", label_en: "Viable Count" },
        { value: "80万盒/月", label: "产能规模", label_en: "Monthly Output" },
        { value: "18个月", label: "长保质期", label_en: "Shelf Life" },
        { value: "FDA", label: "美国合规", label_en: "FDA Compliant" },
      ],
      results: [
        {
          icon: "verified",
          title: "合规通关",
          title_en: "Compliance",
          desc: "一次性通过FDA cGMP审查，获准在美国市场合法销售",
        },
        {
          icon: "trending_up",
          title: "销售增长",
          title_en: "Growth",
          desc: "上线首月即突破月销80万盒，快速成为品类TOP3",
        },
        {
          icon: "ac_unit",
          title: "品质稳定",
          title_en: "Quality",
          desc: "终端活菌检测率达标准值95%以上，消费者好评率98%",
        },
      ],
      results_en: [
        {
          icon: "verified",
          title: "Compliance",
          title_en: "Compliance",
          desc: "Passed FDA cGMP review, obtained US market sales authorization",
        },
        {
          icon: "trending_up",
          title: "Growth",
          title_en: "Growth",
          desc: "Exceeded 800K units/month in first month, became category top 3",
        },
        {
          icon: "ac_unit",
          title: "Quality",
          title_en: "Quality",
          desc: "End-user viability test exceeded 95% of label claim, 98% positive reviews",
        },
      ],
    },
    {
      slug: "au-tea-chain",
      title: "澳洲茶饮连锁口味定制标准化，标签合规助阵百店同频",
      title_en: "Australian Tea Chain Standardizes Flavor & Achieves Label Compliance Across 100 Stores",
      country: "🇦🇺 Australia",
      industry: "连锁品牌",
      industry_en: "Chain Brand",
      highlight: "千店一味稳供应",
      highlight_en: "Consistent Flavor Supply",
      quote: "从口味调校到澳洲标签合规，YuKoLi实现了全部门店风味统一，是连锁品牌最可靠的后盾。",
      quote_en:
        "From flavor tuning to Australian label compliance, YuKoLi ensured consistent taste across all our stores. They are the most reliable supply backbone for chain brands.",
      lead_time: "5天极速打样",
      lead_time_en: "5-Day Rapid Sampling",
      moq_label: "MOQ 300起",
      moq_label_en: "MOQ from 300",
      cert_label: "ISO 22000认证",
      cert_label_en: "ISO 22000 Certified",
      monthly_volume: "月产120万包",
      monthly_volume_en: "1.2M Units/Month",
      background:
        "该客户是澳大利亚快速扩张的连锁茶饮品牌，在悉尼、墨尔本、布里斯班等城市拥有100+门店。品牌面临的核心挑战是如何在快速扩张的同时保持所有门店出品的一致性。",
      background_en:
        "This rapidly expanding Australian tea chain has 100+ stores across Sydney, Melbourne, and Brisbane. Their core challenge was maintaining consistent product quality across all stores during rapid expansion.",
      pain_points: [
        "100+门店需要完全统一的风味标准，人工制作难以保证一致性",
        "澳洲食品标签法规复杂，各州对成分与过敏原标注要求不同",
        "门店扩张速度快，需要稳定且可扩展的供应链支撑",
      ],
      pain_points_en: [
        "100+ stores needed identical flavor standards — manual preparation inconsistent",
        "Complex Australian food labeling laws with state-level variations",
        "Rapid store expansion required stable, scalable supply chain",
      ],
      solutions: [
        {
          icon: "science",
          title: "配方研发",
          title_en: "R&D",
          desc: "将门店招牌饮品配方转化为标准化即溶粉包，热冷双冲技术还原门店级口感",
        },
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "完成澳洲FSANZ合规审核，提供所有门店统一的多语言标签模板",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "120万包/月稳定量产，批次间无差异，确保千店一味",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "全澳10大仓储直配体系，48小时直达任意门店",
        },
      ],
      solutions_en: [
        {
          icon: "science",
          title: "R&D",
          title_en: "R&D",
          desc: "Converted signature store drinks into standard instant powder formulations with hot/cold dual brewing",
        },
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "Completed FSANZ compliance review with unified multi-language label templates for all stores",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "1.2M units/month stable mass production with zero batch-to-batch variation",
        },
        {
          icon: "inventory_2",
          title: "Logistics",
          title_en: "Logistics",
          desc: "Australia-wide 10-warehouse distribution network, 48-hour delivery to any store",
        },
      ],
      metrics: [
        { value: "120万包/月", value_en: "1.2M Packs/Month", label: "稳定产能", label_en: "Monthly Output" },
        { value: "100+门店", value_en: "100+ Stores", label: "覆盖规模", label_en: "Store Coverage" },
        { value: "零差异", value_en: "Zero Variation", label: "批次一致", label_en: "Zero Variation" },
        { value: "FSANZ", value_en: "FSANZ", label: "澳洲合规", label_en: "FSANZ Compliant" },
      ],
      results: [
        {
          icon: "verified",
          title: "品质统一",
          title_en: "Consistency",
          desc: '所有门店实现"千店一味"，顾客满意度提升至4.8星',
        },
        {
          icon: "trending_up",
          title: "扩张加速",
          title_en: "Growth",
          desc: "标准化供应链支撑下，一年内从50店扩张至100+店",
        },
        {
          icon: "inventory_2",
          title: "成本优化",
          title_en: "Cost Saving",
          desc: "中央化生产使单杯成本降低35%，显著提升利润率",
        },
      ],
      results_en: [
        {
          icon: "verified",
          title: "Consistency",
          title_en: "Consistency",
          desc: '"Same taste everywhere" achieved, customer satisfaction reached 4.8 stars',
        },
        {
          icon: "trending_up",
          title: "Growth",
          title_en: "Growth",
          desc: "Standardized supply chain enabled expansion from 50 to 100+ stores in one year",
        },
        {
          icon: "inventory_2",
          title: "Cost",
          title_en: "Cost",
          desc: "Centralized production reduced per-cup cost by 35%, significantly improving margins",
        },
      ],
    },
    {
      slug: "af-weight-brand",
      title: "非洲跨境电商业绩翻倍：低门槛试错与合规双驱狂奔",
      title_en: "African Cross-border Weight Management Brand Doubles Sales via Flexible MOQ & Compliance",
      country: "🇳🇬 Nigeria",
      industry: "跨境电商",
      industry_en: "Cross-Border E-Commerce",
      highlight: "灵活试错快打样",
      highlight_en: "Flexible MOQ Fast Sampling",
      quote: "极低的起订量和5天打样让我们敢测新品，YuKoLi的非洲合规指导更帮我们避开了大坑。",
      quote_en:
        "The extremely low MOQ and 5-day sampling gave us the confidence to test new products. YuKoLi's African compliance guidance helped us avoid major pitfalls.",
      lead_time: "5天极速打样",
      lead_time_en: "5-Day Rapid Sampling",
      moq_label: "MOQ 100起",
      moq_label_en: "MOQ from 100",
      cert_label: "Halal认证",
      cert_label_en: "Halal Certified",
      monthly_volume: "月产30万瓶",
      monthly_volume_en: "300K Units/Month",
      background:
        "该客户是专注于非洲市场的跨境电商品牌，主推体重管理类健康产品。非洲不同国家对食品进口的法规差异极大，需要兼具低门槛试错与合规保障的供应链伙伴。",
      background_en:
        "This cross-border e-commerce brand focused on African markets for weight management products. African countries have vastly different food import regulations, requiring a supply chain partner offering both low-barrier trial and compliance assurance.",
      pain_points: [
        "非洲各国食品进口法规差异大，合规复杂度极高",
        "跨境创业者资金有限，需要极低的试错成本",
        "非洲物流基础设施薄弱，包装需要特别设计以应对长途运输",
      ],
      pain_points_en: [
        "Widely varying food import regulations across African countries",
        "Limited capital for cross-border entrepreneurs, needing very low trial cost",
        "Weak African logistics infrastructure requiring specially designed packaging",
      ],
      solutions: [
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "提供非洲各目标市场的食品进口合规指导，Halal认证覆盖主要穆斯林国家",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "MOQ 100起订，5天出样，支持小批量多频次订货策略",
        },
        {
          icon: "science",
          title: "配方研发",
          title_en: "R&D",
          desc: "针对非洲消费者口味偏好研发木薯风味、芒果风味等本土化体重管理产品",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "耐高温防震包装设计，适应非洲长途运输环境",
        },
      ],
      solutions_en: [
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "Food import compliance guidance for African markets, Halal certification for Muslim-majority countries",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "MOQ from 100, 5-day sampling, supporting small-batch multi-frequency ordering",
        },
        {
          icon: "science",
          title: "R&D",
          title_en: "R&D",
          desc: "Locally adapted formulas (cassava, mango flavors) for African consumer preferences",
        },
        {
          icon: "inventory_2",
          title: "Packaging",
          title_en: "Packaging",
          desc: "Heat-resistant shockproof packaging designed for Africa's long-distance transport",
        },
      ],
      metrics: [
        { value: "100起", value_en: "From 100", label: "超低MOQ", label_en: "Ultra Low MOQ" },
        { value: "5天", value_en: "5 Days", label: "极速打样", label_en: "Fast Sampling" },
        { value: "30万瓶/月", label: "产能灵活", label_en: "Flexible Output" },
        { value: "Halal", value_en: "Halal", label: "合规保障", label_en: "Halal Certified" },
      ],
      results: [
        {
          icon: "trending_up",
          title: "业绩翻倍",
          title_en: "Sales Doubled",
          desc: "首年销售额实现翻番，成功进入尼日利亚、肯尼亚、南非3国市场",
        },
        {
          icon: "verified",
          title: "零合规问题",
          title_en: "Zero Compliance Issues",
          desc: "所有产品顺利通过各国海关清关，未发生任何退货或扣留事件",
        },
        {
          icon: "inventory_2",
          title: "模式复制",
          title_en: "Model Replication",
          desc: '总结出"低MOQ测品→爆款确认→批量补货"的成功打品模式',
        },
      ],
      results_en: [
        {
          icon: "trending_up",
          title: "Sales",
          title_en: "Sales",
          desc: "First year sales doubled, entered Nigeria, Kenya, and South Africa markets",
        },
        {
          icon: "verified",
          title: "Compliance",
          title_en: "Compliance",
          desc: "All products cleared customs smoothly with zero returns or detention incidents",
        },
        {
          icon: "inventory_2",
          title: "Model",
          title_en: "Model",
          desc: 'Developed successful "low-MOQ test → hit confirmation → bulk restock" product model',
        },
      ],
    },
    {
      slug: "cn-new-consumer",
      title: "国潮功能性饮品引爆社媒，配方共创到全链路极速交付",
      title_en: "Chinese Neo-Consumer Functional Beverage Goes Viral via Formula Co-Creation & Full-Link Delivery",
      country: "🇨🇳 China",
      industry: "新消费品牌",
      industry_en: "Neo-Consumer Brand",
      highlight: "创研一体全交付",
      highlight_en: "Co-Creation Full Delivery",
      quote: "从0到1的配方共创和极速交付能力，YuKoLi帮我们在红海中跑出爆款，全面领先。",
      quote_en:
        "From 0 to 1 formula co-creation to rapid full-link delivery, YuKoLi helped us launch a viral hit in a red ocean market, keeping us ahead.",
      lead_time: "6天定制打样",
      lead_time_en: "6-Day Custom Sampling",
      moq_label: "MOQ 500起",
      moq_label_en: "MOQ from 500",
      cert_label: "ISO 22000认证",
      cert_label_en: "ISO 22000 Certified",
      monthly_volume: "月产200万瓶",
      monthly_volume_en: "2M Units/Month",
      background:
        "该客户是国内新消费功能性饮品品牌，定位国潮风格，主打职场年轻人提神需求。品牌在社交媒体上拥有大量粉丝，需要供应链能够快速响应爆单需求。",
      background_en:
        'This Chinese neo-consumer functional beverage brand targets young professionals with a trendy "Guochao" (national trend) aesthetic. With massive social media following, they needed a supply chain capable of rapid response to viral demand surges.',
      pain_points: [
        "国内功能性饮品市场竞争白热化，需要差异化卖点实现突围",
        "社交媒体爆单节奏难以预测，供应链需具备极强的弹性响应能力",
        "国潮定位对包装设计审美要求高，需将文化元素融入产品",
      ],
      pain_points_en: [
        "Highly competitive domestic functional beverage market demanded differentiated positioning",
        "Unpredictable social media viral surges required extremely flexible supply chain",
        '"Guochao" aesthetic required culturally authentic packaging design',
      ],
      solutions: [
        {
          icon: "science",
          title: "配方研发",
          title_en: "R&D",
          desc: "配方共创模式，品牌与YuKoLi研发团队联合开发人参+维生素提神配方",
        },
        {
          icon: "verified",
          title: "合规认证",
          title_en: "Certification",
          desc: "ISO 22000认证体系覆盖全链路，国产功能性食品合规一站式解决",
        },
        {
          icon: "precision_manufacturing",
          title: "生产制造",
          title_en: "Manufacturing",
          desc: "200万瓶/月柔性产能，支持爆单时48小时加急生产",
        },
        {
          icon: "inventory_2",
          title: "包装物流",
          title_en: "Packaging & Logistics",
          desc: "国潮风格定制包装设计，配合电商仓直发体系实现T+2到货",
        },
      ],
      solutions_en: [
        {
          icon: "science",
          title: "R&D",
          title_en: "R&D",
          desc: "Co-creation model — brand and YuKoLi jointly developed ginseng + vitamin energy formula",
        },
        {
          icon: "verified",
          title: "Certification",
          title_en: "Certification",
          desc: "ISO 22000 covering full chain, one-stop domestic functional food compliance",
        },
        {
          icon: "precision_manufacturing",
          title: "Manufacturing",
          title_en: "Manufacturing",
          desc: "2M units/month flexible capacity supporting 48-hour rush production for viral surges",
        },
        {
          icon: "inventory_2",
          title: "Packaging",
          title_en: "Packaging",
          desc: "Guochao-style custom packaging with e-commerce direct-ship achieving T+2 delivery",
        },
      ],
      metrics: [
        { value: "200万瓶/月", label: "爆款产能", label_en: "Peak Output" },
        { value: "6天", value_en: "6 Days", label: "快速打样", label_en: "Fast Sampling" },
        { value: "48h", label: "加急响应", label_en: "Rush Response" },
        { value: "T+2", label: "极速到货", label_en: "Fast Delivery" },
      ],
      results: [
        {
          icon: "trending_up",
          title: "社交爆款",
          title_en: "Viral Hit",
          desc: "产品上线后在小红书、抖音等平台获5000万+曝光，单日最高销量破10万瓶",
        },
        {
          icon: "verified",
          title: "品牌破圈",
          title_en: "Brand Breakout",
          desc: "从线上爆款成功打入盒马、KKV等线下新零售渠道",
        },
        {
          icon: "star",
          title: "持续迭代",
          title_en: "Continuous Iteration",
          desc: "基于社媒反馈3个月完成3次配方升级，始终保持品类领先",
        },
      ],
      results_en: [
        {
          icon: "trending_up",
          title: "Viral",
          title_en: "Viral",
          desc: "50M+ impressions on Xiaohongshu and Douyin, peak single-day sales exceeded 100K bottles",
        },
        {
          icon: "verified",
          title: "Breakout",
          title_en: "Breakout",
          desc: "Expanded from online hit to offline channels like Hema and KKV",
        },
        {
          icon: "star",
          title: "Iteration",
          title_en: "Iteration",
          desc: "3 formula upgrades in 3 months based on social media feedback, maintaining category leadership",
        },
      ],
    },
  ];

  /* ── State ──────────────────────────────────────── */
  var _currentSlug = window.CASE_SLUG || "";
  var _currentCase = null;
  var _langListenerBound = false;

  /* ── Helpers ────────────────────────────────────── */

  /**
   * Extract slug from URL path
   * /cases/sea-coffee-brand/ → "sea-coffee-brand"
   * /cases/sea-coffee-brand → "sea-coffee-brand"
   */
  function extractSlug() {
    var path = window.location.pathname.replace(/\/$/, "");
    var parts = path.split("/");
    // Last non-empty segment
    for (var i = parts.length - 1; i >= 0; i--) {
      if (parts[i] && parts[i] !== "cases" && parts[i] !== "detail") {
        return parts[i];
      }
    }
    return "";
  }

  /**
   * Find case data by slug. Checks:
   * 1. window.CASE_DETAILS_DATA (injected JSON in HTML)
   * 2. window._caseDetailData (fallback)
   * 3. _casesData (internal fallback)
   */
  function findCase(slug) {
    // Try external data first
    var external = window.CASE_DETAILS_DATA || window._caseDetailData;
    if (external && Array.isArray(external)) {
      for (var i = 0; i < external.length; i++) {
        if (external[i].slug === slug) return external[i];
      }
    }
    // Fallback to internal data
    for (var j = 0; j < _casesData.length; j++) {
      if (_casesData[j].slug === slug) return _casesData[j];
    }
    return null;
  }

  /**
   * Translate helper (uses translationManager if available)
   */
  function t(key) {
    if (window.translationManager && typeof window.translationManager.translate === "function") {
      var text = window.translationManager.translate(key);
      if (text && text !== key) return text;
    }
    return key;
  }

  /**
   * Get current language from translationManager
   */
  function getLang() {
    if (window.translationManager && window.translationManager.currentLanguage) {
      return window.translationManager.currentLanguage;
    }
    var stored;
    try {
      stored = localStorage.getItem("userLanguage");
    } catch (e) {}
    if (stored) return stored;
    var htmlLang = document.documentElement && document.documentElement.lang;
    if (htmlLang) return htmlLang;
    return "zh-CN";
  }

  function isZh() {
    var lang = getLang();
    return lang === "zh-CN" || lang === "zh-TW" || lang === "zh";
  }

  /**
   * Get localized property from case object
   * e.g. getProp(c, 'title') → c.title (zh) or c.title_en (en)
   */
  function getProp(c, key) {
    if (!c) return "";
    if (isZh()) return c[key] || c[key + "_en"] || "";
    return c[key + "_en"] || c[key] || "";
  }

  /* ── Rendering ──────────────────────────────────── */

  /**
   * Build meta badges (country, industry, highlight)
   */
  function renderBadges(c) {
    var html = "";
    html +=
      '<span class="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 text-sm font-semibold text-slate-700 dark:text-slate-200 backdrop-blur-sm border border-slate-200 dark:border-slate-600">' +
      esc(c.country) +
      "</span>";
    html +=
      '<span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">' +
      esc(getProp(c, "industry")) +
      "</span>";
    return html;
  }

  /**
   * Build hero metrics strip (lead time, moq, cert, volume)
   */
  function renderHeroMetrics(c) {
    var items = [
      { icon: "schedule", text: isZh() ? c.lead_time : c.lead_time_en },
      { icon: "inventory_2", text: isZh() ? c.moq_label : c.moq_label_en },
      { icon: "verified", text: isZh() ? c.cert_label : c.cert_label_en },
      { icon: "bar_chart", text: isZh() ? c.monthly_volume : c.monthly_volume_en },
    ];
    var html = "";
    for (var i = 0; i < items.length; i++) {
      html +=
        '<div class="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm">' +
        '<span class="material-symbols-outlined text-primary text-base">' +
        items[i].icon +
        "</span>" +
        "<span>" +
        esc(items[i].text) +
        "</span>" +
        "</div>";
    }
    return html;
  }

  /**
   * Render pain point cards
   */
  function renderPainPoints(c) {
    var pains = isZh() ? c.pain_points || [] : c.pain_points_en || c.pain_points || [];
    if (!pains.length) return '<p class="text-slate-500">No data available.</p>';
    var html = "";
    for (var i = 0; i < pains.length; i++) {
      html +=
        '<div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">' +
        '<div class="flex items-start gap-3">' +
        '<span class="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center text-sm font-black">' +
        (i + 1) +
        "</span>" +
        '<p class="text-slate-600 dark:text-slate-300 leading-relaxed">' +
        esc(pains[i]) +
        "</p>" +
        "</div></div>";
    }
    return html;
  }

  /**
   * Render solution cards (4-column)
   */
  function renderSolutions(c) {
    var sols = isZh() ? c.solutions || [] : c.solutions_en || c.solutions || [];
    if (!sols.length) return '<p class="text-slate-500">No data available.</p>';
    var html = "";
    for (var i = 0; i < sols.length; i++) {
      var s = sols[i];
      html +=
        '<div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">' +
        '<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">' +
        '<span class="material-symbols-outlined text-primary">' +
        esc(s.icon || "check_circle") +
        "</span></div>" +
        '<h3 class="font-bold text-sm mb-1">' +
        esc(isZh() ? s.title : s.title_en) +
        "</h3>" +
        '<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">' +
        esc(s.desc || "") +
        "</p>" +
        "</div>";
    }
    return html;
  }

  /**
   * Render key metrics (4 metric cards for colored section)
   */
  function renderMetrics(c) {
    var metrics = c.metrics || [];
    if (!metrics.length) {
      metrics = [
        { value: isZh() ? c.lead_time : c.lead_time_en, label: isZh() ? "打样周期" : "Sampling", label_en: "Sampling" },
        {
          value: isZh() ? c.monthly_volume : c.monthly_volume_en,
          label: isZh() ? "月产能" : "Monthly Output",
          label_en: "Monthly Output",
        },
        { value: isZh() ? c.moq_label : c.moq_label_en, label: isZh() ? "起订量" : "MOQ", label_en: "MOQ" },
        {
          value: isZh() ? c.cert_label : c.cert_label_en,
          label: isZh() ? "认证" : "Certification",
          label_en: "Certification",
        },
      ];
    }
    var html = "";
    for (var i = 0; i < metrics.length; i++) {
      var m = metrics[i];
      var label = isZh() ? m.label || "" : m.label_en || m.label || "";
      var value = isZh() ? m.value : m.value_en || m.value;
      html +=
        '<div class="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm">' +
        '<div class="text-2xl font-black mb-1">' +
        esc(value) +
        "</div>" +
        '<div class="text-sm text-white/70">' +
        esc(label) +
        "</div>" +
        "</div>";
    }
    return html;
  }

  /**
   * Render results cards (3-column)
   */
  function renderResults(c) {
    var results = isZh() ? c.results || [] : c.results_en || c.results || [];
    if (!results.length) return '<p class="text-slate-500">No data available.</p>';
    var html = "";
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      html +=
        '<div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">' +
        '<div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">' +
        '<span class="material-symbols-outlined text-green-600">' +
        esc(r.icon || "check") +
        "</span></div>" +
        '<h3 class="font-bold text-sm mb-1">' +
        esc(isZh() ? r.title : r.title_en) +
        "</h3>" +
        '<p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">' +
        esc(r.desc || "") +
        "</p>" +
        "</div>";
    }
    return html;
  }

  /* ── SEO / Metadata ───────────────────────────── */

  function updateSEO(c) {
    var title = (isZh() ? c.title : c.title_en) + " | " + t("seo_yukoli");
    setTextOrAttr("page-title", "innerText", title);
    document.title = title;
    setTextOrAttr("meta-description", "content", isZh() ? c.quote || c.title : c.quote_en || c.title_en);

    var slug = c.slug;
    var baseUrl = "https://brew.yukoli.com/cases/" + slug + "/";
    setTextOrAttr("canonical-url", "href", baseUrl);
    setTextOrAttr("hreflang-zh", "href", baseUrl);
    setTextOrAttr("hreflang-en", "href", baseUrl);
    setTextOrAttr("hreflang-x-default", "href", baseUrl);
    setTextOrAttr("og-url", "content", baseUrl);

    var ogTitle = (isZh() ? c.title : c.title_en) + " | YuKoLi Case Study";
    setTextOrAttr("og-title", "content", ogTitle);
    setTextOrAttr("og-description", "content", isZh() ? c.quote || c.title : c.quote_en || c.title_en);

    // Device alt links
    var altPc = "/cases/" + slug + "/index-pc.html";
    var altMobile = "/cases/" + slug + "/index-mobile.html";
    var altTablet = "/cases/" + slug + "/index-tablet.html";
    setTextOrAttr("alt-pc", "href", altPc);
    setTextOrAttr("alt-mobile", "href", altMobile);
    setTextOrAttr("alt-tablet", "href", altTablet);
  }

  function setTextOrAttr(id, property, value) {
    var el = document.getElementById(id);
    if (!el) return;
    if (property === "innerText" || property === "textContent") {
      el[property] = value;
    } else {
      el.setAttribute(property, value);
    }
  }

  /* ── Main Render ───────────────────────────────── */

  function renderAll(c) {
    if (!c) {
      // Show "not found" message
      var main = document.querySelector("#spa-content") || document.querySelector("main");
      if (main) {
        main.innerHTML =
          '<div class="py-20 text-center"><h2 class="text-2xl font-bold mb-4">Case Not Found</h2><p class="text-slate-500 mb-6">The case study you\'re looking for could not be found.</p><a href="/cases/" class="text-primary font-bold">&larr; Back to Cases</a></div>';
      }
      return;
    }

    // Hero
    setTextOrAttr("case-hero-title", "innerText", isZh() ? c.title : c.title_en);
    setTextOrAttr("case-hero-quote", "innerText", (isZh() ? c.quote : c.quote_en) || "");
    setInnerHTML("case-hero-badges", renderBadges(c));
    setInnerHTML("case-hero-metrics", renderHeroMetrics(c));

    // Breadcrumb
    setTextOrAttr("breadcrumb-current", "innerText", isZh() ? c.title : c.title_en);
    setTextOrAttr("breadcrumb-current-mobile", "innerText", isZh() ? c.title : c.title_en);

    // Background
    setTextOrAttr("case-background-content", "innerText", (isZh() ? c.background : c.background_en) || "");

    // Pain Points
    setInnerHTML("case-pain-points-grid", renderPainPoints(c));

    // Solutions
    setInnerHTML("case-solution-grid", renderSolutions(c));

    // Metrics
    setInnerHTML("case-metrics-grid", renderMetrics(c));

    // Results
    setInnerHTML("case-results-grid", renderResults(c));

    // Testimonial
    setTextOrAttr("case-testimonial-text", "innerText", (isZh() ? c.quote : c.quote_en) || "");
    setTextOrAttr("case-testimonial-author", "innerText", c.country || "");

    // SEO
    updateSEO(c);
  }

  function setInnerHTML(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ── Init ───────────────────────────────────────── */

  function init(variant) {
    // Extract slug
    var slug = _currentSlug || extractSlug();
    if (!slug) {
      // Try URL hash or data attribute
      slug = window.location.hash.replace("#", "") || "";
    }
    _currentSlug = slug;

    // Find case data
    _currentCase = findCase(slug);
    if (!_currentCase) {
      console.warn("[CaseDetail] No case found for slug:", slug);
      renderAll(null);
      return;
    }

    renderAll(_currentCase);

    // Listen for language changes
    if (!_langListenerBound && window.translationManager) {
      _langListenerBound = true;
      window.translationManager.on("languageChanged", function () {
        if (_currentCase) renderAll(_currentCase);
      });
    }
  }

  /* ── Public API ─────────────────────────────────── */
  window.CaseDetail = {
    init: init,
    getCurrentCase: function () {
      return _currentCase;
    },
    getSlug: function () {
      return _currentSlug;
    },
    data: _casesData,
  };

  /* ── Auto-init (works for both full page load & swup script injection) ── */
  function tryInit() {
    var path = window.location.pathname.replace(/\/+$/, "");
    if (/^\/cases\/[a-z0-9-]+(\/index-(pc|mobile|tablet)\.html)?$/.test(path)) {
      var variant = document.body.getAttribute("data-case-variant") || "pc";
      init(variant);
      return true;
    }
    return false;
  }
  if (!tryInit()) {
    document.addEventListener("DOMContentLoaded", function () {
      tryInit();
    });
  }
})();
