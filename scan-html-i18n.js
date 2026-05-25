const fs = require('fs');
const path = require('path');

// 获取语言文件中的所有 key
const enLang = JSON.parse(fs.readFileSync('src/assets/lang/en-ui.json', 'utf8'));
const zhLang = JSON.parse(fs.readFileSync('src/assets/lang/zh-CN-ui.json', 'utf8'));

const i18nKeys = Object.keys(enLang);
console.log(`Total i18n keys: ${i18nKeys.length}`);

// 检查 HTML 文件中的硬编码文案
function scanHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const issues = [];
  
  lines.forEach((line, index) => {
    // 检查标题、meta、img alt、text 等
    if (line.includes('YuKoLi') || line.includes('优科力') || line.includes('OEM') || line.includes('ODM')) {
      const potentialHardcode = {
        line: line.trim(),
        lineNumber: index + 1,
        type: 'brand_name'
      };
      issues.push(potentialHardcode);
    }
    
    // 检查数字描述
    if (line.match(/\d+.*工厂|manufacturing|工厂/)) {
      const potentialHardcode = {
        line: line.trim(),
        lineNumber: index + 1,
        type: 'factory_description'
      };
      issues.push(potentialHardcode);
    }
    
    // 检查产品线描述
    if (line.match(/咖啡|tea|美容|健康|产品线/)) {
      const potentialHardcode = {
        line: line.trim(),
        lineNumber: index + 1,
        type: 'product_line'
      };
      issues.push(potentialHardcode);
    }
  });
  
  return {
    file: path.relative(process.cwd(), filePath),
    issues: issues
  };
}

// 扫描所有 HTML 文件
const htmlFiles = fs.readdirSync('src', { recursive: true })
  .filter(file => file.endsWith('.html'))
  .map(file => path.join('src', file));

const allIssues = [];

htmlFiles.forEach(file => {
  const result = scanHtmlFile(file);
  if (result.issues.length > 0) {
    allIssues.push(result);
  }
});

// 输出结果
console.log('\n=== HTML 文件硬编码文案扫描结果 ===');
console.log(`扫描文件数: ${htmlFiles.length}`);
console.log(`发现问题的文件数: ${allIssues.length}`);

allIssues.forEach(result => {
  console.log(`\n📁 ${result.file}:`);
  result.issues.forEach(issue => {
    console.log(`  行 ${issue.lineNumber}: ${issue.line} (${issue.type})`);
  });
});

console.log('\n=== 建议添加的 i18n keys ===');
const suggestedKeys = [
  'brand_name', 'brand_full_name', 'brand_description', 'brand_short_desc',
  'manufacturing_years', 'factory_count', 'export_countries', 'product_lines',
  'seo_description', 'seo_title', 'og_title', 'og_description'
];

suggestedKeys.forEach(key => {
  if (!i18nKeys.includes(key)) {
    console.log(`建议新增: "${key}"`);
  }
});