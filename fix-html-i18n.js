const fs = require('fs');
const path = require('path');

// 获取语言文件
const enLang = JSON.parse(fs.readFileSync('src/assets/lang/en-ui.json', 'utf8'));
const zhLang = JSON.parse(fs.readFileSync('src/assets/lang/zh-CN-ui.json', 'utf8'));

// 需要添加的硬编码文案映射（英文→中文）
const hardcodedMap = {
  // 品牌相关
  "YuKoLi": "YuKoLi 优科力",
  "YuKoLi Technology": "YuKoLi Technology 佛山优科力科技",
  "YuKoLi 优科力科技": "YuKoLi 优科力科技",
  "YuKoLi 跃迁力科技": "YuKoLi 跃迁力科技",
  
  // SEO相关
  "健康食品": "健康食品",
  "OEM/ODM": "OEM/ODM",
  "冲调食品": "冲调食品",
  "工厂": "工厂",
  
  // 产品线相关
  "咖啡冲调": "咖啡冲调",
  "茶饮奶茶": "茶饮奶茶",
  "代餐蛋白": "代餐蛋白",
  "美容胶原": "美容胶原",
  "体重管理": "体重管理",
  "肠道健康": "肠道健康",
  "功能冲饮": "功能冲饮",
  
  // 其他
  "20年专注": "20年专注",
  "4座自有工厂": "4座自有工厂",
  "7大产品线": "7大产品线",
  "8大产品线": "8大产品线",
  "出口30+国家": "出口30+国家",
  "MOQ 500起": "MOQ 500起",
  
  // 文案内容
  "YuKoLi — 20年专注健康食品 OEM/ODM 制造": "YuKoLi — 20年专注健康食品 OEM/ODM 制造",
  "YuKoLi Technology — 4 modern factories with annual capacity over 10,000 tons": "YuKoLi Technology — 4座现代化工厂，年产能力超过10,000吨",
  "OEM/ODM available": "OEM/ODM available",
  "Get free samples and experience the quality difference of YuKoLi Technology": "获取免费样品，体验 YuKoLi Technology 的品质差异"
};

// 为硬编码文案生成 i18n key
function generateI18nKey(text) {
  // 清理文本，生成 key
  let key = text
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();
  
  // 确保长度合适
  if (key.length > 50) {
    key = key.substring(0, 47) + '...';
  }
  
  return `seo_${key}`;
}

// 添加缺失的翻译
Object.keys(hardcodedMap).forEach(enText => {
  const zhText = hardcodedMap[enText];
  const key = generateI18nKey(enText);
  
  if (!enLang[key]) {
    enLang[key] = enText;
    console.log(`添加英文: ${key} = "${enText}"`);
  }
  
  if (!zhLang[key]) {
    zhLang[key] = zhText;
    console.log(`添加中文: ${key} = "${zhText}"`);
  }
});

// 保存更新后的语言文件
fs.writeFileSync('src/assets/lang/en-ui.json', JSON.stringify(enLang, null, 2) + '\n');
fs.writeFileSync('src/assets/lang/zh-CN-ui.json', JSON.stringify(zhLang, null, 2) + '\n');

console.log('✅ 语言文件已更新');