#!/usr/bin/env python3
import os
import re
import json
from pathlib import Path

# 读取语言文件
with open('src/assets/lang/en-ui.json', 'r', encoding='utf-8') as f:
    en_lang = json.load(f)

# 额外的硬编码模式需要处理
advanced_patterns = {
    # 高频出现的硬编码文本
    r'(\d+)\s+factories': r'<span data-i18n="seo_\1座工厂">\1 factories</span>',
    r'(\d+)\s+product lines': r'<span data-i18n="seo_\1大产品线">\1 product lines</span>',
    r'(\d+)\+?\s+countr(y|ies)': r'<span data-i18n="seo_\1国家">\1+ countries</span>',
    r'(\d+)\s+years': r'<span data-i18n="seo_\1年">\1 years</span>',
    
    # 常见品牌描述
    r'20 Years in Health Food Manufacturing': r'<span data-i18n="about_years_in_manufacturing">20 Years in Health Food Manufacturing</span>',
    r'From Foshan to the world, providing quality OEM/ODM services for global brands\. 4 factories, 7 product lines, serving clients in 30\+ countries\.': r'<span data-i18n="about_global_services">From Foshan to the world, providing quality OEM/ODM services for global brands. 4 factories, 7 product lines, serving clients in 30+ countries.</span>',
    r'Founded in (\d+) in Foshan, Guangdong, ([^.]+) started as a small ([^.]+)\. We have always focused on ([^.]+), providing professional ([^.]+) for global brands\.': r'<span data-i18n="about_founded_history">Founded in \1 in Foshan, Guangdong, \2 started as a small \3. We have always focused on \4, providing professional \5 for global brands.</span>',
    r'After (\d+) years, ([^.]+) has grown into a ([^.]+) with (\d+) modern factories and (\d+) product lines\. We hold ([^.]+), exporting to (\d+)\+ countries\.': r'<span data-i18n="about_growth_story">After \1 years, \2 has grown into a \3 with \4 modern factories and \5 product lines. We hold \6, exporting to \7+ countries.</span>',
    
    # SEO 相关
    r'YuKoLi Technology — 4座现代化工厂，年产能力超过10,000吨': r'<span data-i18n="seo_technology_capicity">YuKoLi Technology — 4座现代化工厂，年产能力超过10,000吨</span>',
    r'OEM/ODM available': r'<span data-i18n="seo_oem_odm_available">OEM/ODM available</span>',
    r'Get free samples and experience the quality difference of YuKoLi Technology': r'<span data-i18n="seo_free_samples">Get free samples and experience the quality difference of YuKoLi Technology</span>',
    
    # 行业术语
    r'HACCP.*?FDA.*?ISO': r'<span data-i18n="certifications">HACCP/FDA/ISO</span>',
    r'Headquartered in ([^.]+), ([^.]+) has dedicated ([^.]+) to the R&D and manufacturing of ([^.]+)': r'<span data-i18n="headquarters_desc">Headquartered in \1, \2 has dedicated \3 to the R&D and manufacturing of \4</span>',
}

def process_advanced_fixes(file_path):
    """处理高级修复"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 应用高级替换
        for pattern, replacement in advanced_patterns.items():
            content = re.sub(pattern, replacement, content)
        
        # 检查并修复 img alt 文本
        # 匹配 alt="硬编码文案" 并添加 data-i18n
        alt_pattern = r'alt="([^"]+)"'
        alt_matches = re.findall(alt_pattern, content)
        
        for alt_text in alt_matches:
            if len(alt_text) > 10 and alt_text not in ['YuKoLi', 'logo', 'icon']:  # 只处理较长的 alt 文本
                # 创建 alt 特定的 i18n key
                alt_key = f'alt_{alt_text.lower().replace(" ", "_").replace("/", "_")[:50]}'
                if len(alt_key) > 30:
                    alt_key = alt_key[:27] + '...'
                
                # 如果替换还没有完成
                if f'data-i18n="{alt_key}"' not in content:
                    content = content.replace(f'alt="{alt_text}"', f'alt="{alt_text}" data-i18n="{alt_key}"')
        
        # 如果有变化，保存
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"❌ 高级修复失败 {file_path}: {e}")
        return False

def main():
    """主函数"""
    print("🔧 开始高级 HTML 硬编码文案修复...")
    
    # 查找需要处理的文件
    html_files = []
    src_dir = Path('src')
    
    for html_file in src_dir.rglob('*.html'):
        html_files.append(str(html_file))
    
    modified_count = 0
    processed_count = 0
    
    print(f"📁 处理 {len(html_files)} 个 HTML 文件")
    
    # 处理每个文件
    for file_path in html_files:
        if process_advanced_fixes(file_path):
            modified_count += 1
            print(f"✅ 高级修复: {file_path}")
        else:
            print(f"⏭️  无需修改: {file_path}")
        processed_count += 1
    
    print(f"\n📊 高级修复完成:")
    print(f"   处理文件: {processed_count}")
    print(f"   修改文件: {modified_count}")

if __name__ == "__main__":
    main()