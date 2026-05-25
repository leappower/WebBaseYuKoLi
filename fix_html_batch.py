#!/usr/bin/env python3
import os
import re
import json
from pathlib import Path

# 读取语言文件
with open('src/assets/lang/en-ui.json', 'r', encoding='utf-8') as f:
    en_lang = json.load(f)

# 需要替换的硬编码文案映射（英文 -> i18n key）
hardcoded_patterns = {
    # 品牌名称
    r'YuKoLi': r'<span data-i18n="seo_yukoli">YuKoLi</span>',
    r'YuKoLi Technology': r'<span data-i18n="seo_yukoli_technology">YuKoLi Technology</span>',
    r'YuKoLi 优科力科技': r'<span data-i18n="seo_yukoli_优科力科技">YuKoLi 优科力科技</span>',
    
    # SEO 描述
    r'YuKoLi 优科力 — 20年专注健康冲调食品 OEM/ODM，7大产品线，4座自有工厂，出口30+国家。提供配方研发、生产制造、品牌定制一站式服务。': r'<span data-i18n="seo_yukoli_20年专注健康食品_oem_odm_制造">YuKoLi 优科力 — 20年专注健康冲调食品 OEM/ODM，7大产品线，4座自有工厂，出口30+国家。提供配方研发、生产制造、品牌定制一站式服务。</span>',
    
    # 产品线
    r'咖啡冲调': r'<span data-i18n="seo_咖啡冲调">咖啡冲调</span>',
    r'茶饮奶茶': r'<span data-i18n="seo_茶饮奶茶">茶饮奶茶</span>',
    r'代餐蛋白': r'<span data-i18n="seo_代餐蛋白">代餐蛋白</span>',
    r'美容胶原': r'<span data-i18n="seo_美容胶原">美容胶原</span>',
    r'体重管理': r'<span data-i18n="seo_体重管理">体重管理</span>',
    r'肠道健康': r'<span data-i18n="seo_肠道健康">肠道健康</span>',
    r'功能冲饮': r'<span data-i18n="seo_功能冲饮">功能冲饮</span>',
    
    # 工厂描述
    r'4座自有工厂': r'<span data-i18n="seo_4座自有工厂">4座自有工厂</span>',
    r'7大产品线': r'<span data-i18n="seo_7大产品线">7大产品线</span>',
    r'8大产品线': r'<span data-i18n="seo_8大产品线">8大产品线</span>',
    r'出口30\+国家': r'<span data-i18n="seo_出口30_国家">出口30+国家</span>',
    r'20年专注': r'<span data-i18n="seo_20年专注">20年专注</span>',
    r'MOQ 500起': r'<span data-i18n="seo_moq_500起">MOQ 500起</span>',
}

def process_file(file_path):
    """处理单个 HTML 文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 应用所有替换规则
        for pattern, replacement in hardcoded_patterns.items():
            content = re.sub(pattern, replacement, content)
        
        # 如果内容有变化，保存文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 已修改: {file_path}")
            return True
        else:
            print(f"⏭️  无需修改: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ 错误处理 {file_path}: {e}")
        return False

def main():
    """主函数"""
    print("🔧 开始批量修复 HTML 硬编码文案...")
    
    # 查找所有 HTML 文件
    html_files = []
    src_dir = Path('src')
    
    for html_file in src_dir.rglob('*.html'):
        html_files.append(str(html_file))
    
    print(f"📁 找到 {len(html_files)} 个 HTML 文件")
    
    # 统计
    modified_count = 0
    error_count = 0
    
    # 处理每个文件
    for file_path in html_files:
        try:
            if process_file(file_path):
                modified_count += 1
        except Exception as e:
            error_count += 1
            print(f"❌ 处理失败 {file_path}: {e}")
    
    print(f"\n📊 处理完成:")
    print(f"   修改文件: {modified_count}")
    print(f"   错误文件: {error_count}")
    print(f"   总文件数: {len(html_files)}")

if __name__ == "__main__":
    main()