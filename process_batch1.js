const fs = require('fs');
const path = require('path');

// 语言映射
const langMap = {
    "zh-CN": {
        "nav_products_coffee": "咖啡冲调系列",
        "nav_products_tea": "茶系列", 
        "nav_products_meal": "餐食系列",
        "nav_products_beauty": "美容系列",
        "nav_products_weight": "体重管理系列",
        "nav_products_gut": "肠道健康系列",
        "nav_products_lifestyle": "生活方式系列",
        "nav_products_legacy": "经典系列",
        "prod_card_coffee_desc": "精选全球优质咖啡豆，带来丰富香醇的咖啡体验。",
        "prod_card_tea_desc": "东方茶韵结合现代工艺，品味健康新潮流。",
        "prod_card_meal_desc": "科学配方营养配餐，方便快捷。",
        "prod_card_beauty_desc": "小分子胶原蛋白肽，由内而外焕发光彩。",
        "prod_card_weight_desc": "科学配比热量控制的代餐，轻松管理体重健康。",
        "prod_card_gut_desc": "科学配比益生菌和膳食纤维，呵护肠道微生态。",
        "prod_card_lifestyle_desc": "健康生活方式的完美伴侣。",
        "prod_card_legacy_desc": "经典配方，品质传承。"
    },
    "en": {
        "nav_products_coffee": "brewing Series",
        "nav_products_tea": "Tea & Milk Tea",
        "nav_products_meal": "Meal Series",
        "nav_products_beauty": "Beauty Series",
        "nav_products_weight": "Weight Management",
        "nav_products_gut": "Gut Health",
        "nav_products_lifestyle": "Lifestyle",
        "nav_products_legacy": "Legacy Products",
        "prod_card_coffee_desc": "Selected premium coffee beans from around the world, delivering a rich and aromatic coffee experience.",
        "prod_card_tea_desc": "Oriental tea charm meets modern craftsmanship. Taste the new trend of healthy tea.",
        "prod_card_meal_desc": "Scientific formula nutritional meals, convenient and quick.",
        "prod_card_beauty_desc": "Small molecule collagen peptides, radiate skin brilliance from the inside out.",
        "prod_card_weight_desc": "Science-based calorie-controlled meal replacement for easy body and health management.",
        "prod_card_gut_desc": "Scientific ratio of probiotics and dietary fiber to nurture gut microecology.",
        "prod_card_lifestyle_desc": "Perfect companion for a healthy lifestyle.",
        "prod_card_legacy_desc": "Classic formulas, quality passed down."
    }
};

// 需要处理的key列表
const keysToProcess = [
    "nav_products_coffee", "nav_products_tea", "nav_products_meal", "nav_products_beauty",
    "nav_products_weight", "nav_products_gut", "nav_products_lifestyle", "nav_products_legacy",
    "prod_card_coffee_desc", "prod_card_tea_desc", "prod_card_meal_desc", "prod_card_beauty_desc",
    "prod_card_weight_desc", "prod_card_gut_desc", "prod_card_lifestyle_desc", "prod_card_legacy_desc"
];

const filesToProcess = fs.readFileSync('batch1_files_pc.txt', 'utf8').split('\n').filter(f => f.trim());
const filesToProcessMobile = fs.readFileSync('batch1_files_mobile.txt', 'utf8').split('\n').filter(f => f.trim());
const filesToProcessTablet = fs.readFileSync('batch1_files_tablet.txt', 'utf8').split('\n').filter(f => f.trim());

// 添加后缀标记用于替换
const filesToProcessWithLang = [
    ...filesToProcess.map(file => ({ file, lang: 'zh-CN', type: 'pc' })),
    ...filesToProcessMobile.map(file => ({ file, lang: 'zh-CN', type: 'mobile' })),
    ...filesToProcessTablet.map(file => ({ file, lang: 'zh-CN', type: 'tablet' })),
    ...filesToProcess.map(file => ({ file, lang: 'en', type: 'pc' })),
    ...filesToProcessMobile.map(file => ({ file, lang: 'en', type: 'mobile' })),
    ...filesToProcessTablet.map(file => ({ file, lang: 'en', type: 'tablet' }))
];

console.log(`Processing ${filesToProcessWithLang.length} files...`);

// 处理每个文件
filesToProcessWithLang.forEach(({ file, lang, type }) => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        let modified = false;

        // 替换data-i18n属性
        keysToProcess.forEach(key => {
            const oldValue = `data-i18n="${key}"`;
            const newValue = `data-i18n="${lang}_${key}"`;
            
            if (content.includes(oldValue)) {
                content.replace(new RegExp(oldValue, 'g'), newValue);
                modified = true;
                console.log(`Replaced in ${file} (${type}, ${lang}): ${key} -> ${lang}_${key}`);
            }
        });

        if (modified) {
            fs.writeFileSync(file, content);
            console.log(`✅ Updated: ${file}`);
        } else {
            console.log(`- No changes needed: ${file}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('Batch 1 processing complete!');