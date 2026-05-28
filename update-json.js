const fs = require('fs');

// Read both JSON files
const en = JSON.parse(fs.readFileSync('src/assets/lang/en-ui.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('src/assets/lang/zh-CN-ui.json', 'utf8'));

// ===== RD PAGE UPDATES =====
// Update existing keys
en['solutions_rd_hero_title'] = 'R&D & Flavor Laboratory';
en['solutions_rd_hero_subtitle'] = 'Innovating Flavor, Developing Formulas';
en['solutions_rd_hero_subtitle_en'] = 'Innovating Flavor, Developing Formulas';
en['solutions_rd_overview'] = 'From concept to finished formulation — our in-house R&D team brings 20+ years of functional food and beverage expertise. We develop custom recipes, optimize sensory profiles, and maintain a proprietary library of 200+ proven formulas.';
en['solutions_rd_overview_en'] = 'From concept to finished formulation — in-house R&D with 200+ recipe library';
en['solutions_rd_meta_title'] = 'R&D & Flavor Lab | YuKoLi Technology';
en['solutions_rd_cap_rd_desc'] = 'Full-spectrum formula development from concept to production-ready recipe. Custom functional ingredients, flavor masking, and nutritional optimization.';
en['solutions_rd_cap_flex_title'] = 'Ingredient Sourcing';
en['solutions_rd_cap_flex_desc'] = 'Global ingredient supply chain with strict quality screening. Sourcing functional actives, natural extracts, vitamins, minerals, and specialty raw materials.';
en['solutions_rd_cap_pack_title'] = 'Flavor & Sensory Testing';
en['solutions_rd_cap_pack_desc'] = 'Professional sensory evaluation panel with trained tasters. Flavor profiling, stability testing, and accelerated shelf-life studies for all product categories.';
en['solutions_rd_cap_quality_desc'] = 'HACCP/FDA/ISO triple certified R&D facility. Full batch documentation, ingredient traceability, and third-party lab verification available.';
en['solutions_rd_cta_title'] = 'Need Custom Formula Development?';
en['solutions_rd_cta_desc'] = 'Get in touch with our R&D team. Free consultation on your formulation project — professional response within 24 hours.';
en['solutions_rd_cta_sample'] = 'Request R&D Consultation';

// Add new overview keys
en['solutions_rd_overview_title'] = 'R&D & Flavor Laboratory';
en['solutions_rd_cap_title'] = 'Our R&D Capabilities';
en['solutions_rd_badge'] = 'R&D / Flavor Lab';
en['solutions_rd_alt_hero'] = 'R&D Laboratory and Flavor Testing';

// ===== PACKAGING PAGE UPDATES =====
en['solutions_packaging_hero_title'] = 'Packaging & Label Compliance';
en['solutions_packaging_hero_subtitle'] = 'Global-Ready Packaging, Compliant Labels';
en['solutions_packaging_hero_subtitle_en'] = 'Global-Ready Packaging, Compliant Labels';
en['solutions_packaging_overview'] = 'Navigate complex global labeling regulations with confidence. We provide end-to-end packaging design and regulatory-compliant labeling services covering 30+ countries, ensuring your products meet every market\'s requirements.';
en['solutions_packaging_overview_en'] = 'Navigate complex global labeling regulations with confidence — 30+ country compliance';
en['solutions_packaging_meta_title'] = 'Packaging & Label Compliance | YuKoLi Technology';
en['solutions_packaging_cap_rd_title'] = 'Packaging Design';
en['solutions_packaging_cap_rd_desc'] = 'Professional packaging design including structural design, material selection, and visual branding. Pouches, cans, boxes, stick packs, and custom formats.';
en['solutions_packaging_cap_flex_title'] = 'Label Compliance';
en['solutions_packaging_cap_flex_desc'] = 'Regulatory-compliant label development for US FDA, EU, ASEAN, China, Middle East and more. Nutrition facts, ingredient declarations, allergen warnings, and claims substantiation.';
en['solutions_packaging_cap_pack_title'] = 'Multi-Language Packaging';
en['solutions_packaging_cap_pack_desc'] = 'Multi-language label production with native translation validation. Supporting 15+ languages for global market access with consistent brand presentation.';
en['solutions_packaging_cap_quality_title'] = 'Sustainable Materials';
en['solutions_packaging_cap_quality_desc'] = 'Eco-friendly packaging options including recyclable, biodegradable, and post-consumer recycled materials. FSC-certified paper and food-grade RPET options available.';
en['solutions_packaging_cta_title'] = 'Need Packaging & Label Compliance?';
en['solutions_packaging_cta_desc'] = 'Get a free packaging compliance review for your target markets. Our regulatory team will assess your current labels and recommend improvements.';
en['solutions_packaging_cta_sample'] = 'Get Label Review';
en['solutions_packaging_cta_whatsapp'] = 'WhatsApp';

// Add new packaging overview keys
en['solutions_packaging_overview_title'] = 'Packaging & Label Compliance Services';
en['solutions_packaging_cap_title'] = 'Our Packaging Capabilities';
en['solutions_packaging_badge'] = 'Packaging / Labeling';
en['solutions_packaging_alt_hero'] = 'Packaging and Label Compliance';

// ===== ZH-CN UPDATES =====
zh['solutions_rd_hero_title'] = '研发与风味实验室';
zh['solutions_rd_hero_subtitle'] = '创新风味，开发配方';
zh['solutions_rd_hero_subtitle_en'] = 'Innovating Flavor, Developing Formulas';
zh['solutions_rd_overview'] = '从概念到成品配方——我们的内部研发团队拥有20年以上的功能性食品与饮品开发经验。我们开发定制配方、优化感官特性，并维护着一个200+已验证配方的专有配方库。';
zh['solutions_rd_overview_en'] = 'From concept to finished formulation — in-house R&D with 200+ recipe library';
zh['solutions_rd_meta_title'] = '研发与风味实验室 | YuKoLi Technology';
zh['solutions_rd_cap_rd_desc'] = '全方位配方开发，从概念到可量产配方。定制功能性成分添加、风味修饰及营养优化。';
zh['solutions_rd_cap_flex_title'] = '原料筛选';
zh['solutions_rd_cap_flex_desc'] = '全球原料供应链，严格质量筛选。供应功能性活性成分、天然提取物、维生素、矿物质及特种原料。';
zh['solutions_rd_cap_pack_title'] = '风味与感官测试';
zh['solutions_rd_cap_pack_desc'] = '专业感官评价团队，经过培训的品评人员。风味剖面分析、稳定性测试及加速货架期研究，覆盖全品类产品。';
zh['solutions_rd_cap_quality_desc'] = 'HACCP/FDA/ISO 三重认证研发设施。完整批次文档记录、原料可追溯，支持第三方实验室验证。';
zh['solutions_rd_cta_title'] = '需要定制配方开发？';
zh['solutions_rd_cta_desc'] = '联系我们的研发团队。免费咨询您的配方项目——24小时内专业回复。';
zh['solutions_rd_cta_sample'] = '预约研发咨询';
zh['solutions_rd_overview_title'] = '研发与风味实验室';
zh['solutions_rd_cap_title'] = '研发能力';
zh['solutions_rd_badge'] = '研发 / 风味实验室';
zh['solutions_rd_alt_hero'] = '研发实验室与风味测试';

// Packaging zh-CN
zh['solutions_packaging_hero_title'] = '包装与标签合规';
zh['solutions_packaging_hero_subtitle'] = '全球合规包装，合规标签';
zh['solutions_packaging_hero_subtitle_en'] = 'Global-Ready Packaging, Compliant Labels';
zh['solutions_packaging_overview'] = '从容应对全球复杂的标签法规。我们提供端到端包装设计与合规标签服务，覆盖30+国家市场，确保您的产品满足每个目标市场的法规要求。';
zh['solutions_packaging_overview_en'] = 'Navigate complex global labeling regulations with confidence — 30+ country compliance';
zh['solutions_packaging_meta_title'] = '包装与标签合规 | YuKoLi Technology';
zh['solutions_packaging_cap_rd_title'] = '包装设计';
zh['solutions_packaging_cap_rd_desc'] = '专业包装设计，包括结构设计、材料选择与视觉品牌设计。袋装、罐装、盒装、条装及定制形式。';
zh['solutions_packaging_cap_flex_title'] = '标签合规';
zh['solutions_packaging_cap_flex_desc'] = '合规标签开发，涵盖美国FDA、欧盟、东盟、中国、中东等市场。营养成分表、成分声明、过敏原警告及声称验证。';
zh['solutions_packaging_cap_pack_title'] = '多语言包装';
zh['solutions_packaging_cap_pack_desc'] = '多语言标签制作，经过母语译者验证。支持15+种语言，确保全球市场准入与统一的品牌呈现。';
zh['solutions_packaging_cap_quality_title'] = '可持续材料';
zh['solutions_packaging_cap_quality_desc'] = '环保包装选择，包括可回收、可生物降解及消费后回收材料。提供FSC认证纸张和食品级RPET选项。';
zh['solutions_packaging_cta_title'] = '需要包装与标签合规服务？';
zh['solutions_packaging_cta_desc'] = '免费获取针对您目标市场的包装合规审查。我们的法规团队将评估您当前的标签并提出改进建议。';
zh['solutions_packaging_cta_sample'] = '获取标签审查';
zh['solutions_packaging_cta_whatsapp'] = 'WhatsApp';
zh['solutions_packaging_overview_title'] = '包装与标签合规服务';
zh['solutions_packaging_cap_title'] = '包装能力';
zh['solutions_packaging_badge'] = '包装 / 标签';
zh['solutions_packaging_alt_hero'] = '包装与标签合规';

// Write files
fs.writeFileSync('src/assets/lang/en-ui.json', JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/assets/lang/zh-CN-ui.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');
console.log('JSON files updated successfully');

// Verify key counts match
const enKeys = Object.keys(en);
const zhKeys = Object.keys(zh);
console.log(`EN keys: ${enKeys.length}, ZH keys: ${zhKeys.length}`);
