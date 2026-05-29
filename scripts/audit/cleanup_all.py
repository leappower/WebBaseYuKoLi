#!/usr/bin/env python3
"""
Phase 1: 备份并清理孤立页面 — applications/ 和 support/
Phase 2: 清理22个中文 data-i18n key + 770个厨具 en-ui keys
Phase 3: 清理29张厨具图片
"""
import os, re, json, shutil, glob, sys
from datetime import datetime

BASE = '/Users/chee/Projects/BrewYuKoLi'
BACKUP_DIR = os.path.join(BASE, 'backup', f'cleanup_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
LANG_DIR = os.path.join(BASE, 'src', 'assets', 'lang')
IMG_DIR = os.path.join(BASE, 'src', 'assets', 'images')
BUILD_SCRIPT = os.path.join(BASE, 'scripts', 'build-ssg.js')

def ensure_dir(d):
    os.makedirs(d, exist_ok=True)

# ═══ Phase 1: 备份孤立页面 ═══════════════════════════════════
def backup_and_remove(rel_src_dir, description=""):
    src = os.path.join(BASE, rel_src_dir)
    if not os.path.exists(src):
        print(f"  ⚠️ {rel_src_dir} 不存在，跳过")
        return []
    
    # Backup
    dest = os.path.join(BACKUP_DIR, rel_src_dir)
    ensure_dir(os.path.dirname(dest))
    files_backed = []
    
    for root, dirs, files in os.walk(src):
        for f in files:
            fpath = os.path.join(root, f)
            rel = os.path.relpath(fpath, BASE)
            rel_backup = os.path.relpath(fpath, os.path.dirname(BASE.rstrip('/')))
            dest_file = os.path.join(BACKUP_DIR, 'src', 'pages', os.path.relpath(root, os.path.join(BASE, 'src', 'pages')), f)
            ensure_dir(os.path.dirname(dest_file))
            shutil.copy2(fpath, dest_file)
            files_backed.append(rel)
    
    # Remove
    shutil.rmtree(src)
    print(f"  ✅ 已备份并删除: {rel_src_dir}/ ({len(files_backed)} files) - {description}")
    return files_backed

# ═══ Phase 2: 清理22个中文 key ═══════════════════════════════
CHINESE_KEYS_MAP = {
    'seo_20年': 'seo_20_years',
    'seo_20年专注': 'seo_20_years_focus', 
    'seo_30国家': 'seo_30_countries',
    'seo_4座工厂': 'seo_4_factories',
    'seo_4座自有工厂': 'seo_4_own_factories',
    'seo_7大产品线': 'seo_7_product_lines',
    'seo_8大产品线': 'seo_8_product_lines',
    'seo_moq_500起': 'seo_moq_500',
    'seo_yukoli_20年专注健康食品_oem_odm_制造': 'seo_yukoli_20_years_healthy_food_oem_odm',
    'seo_yukoli_优科力科技': 'seo_yukoli_youkeli_tech',
    'seo_yukoli_跃迁力科技': 'seo_yukoli_yueqianli_tech',
    'seo_代餐蛋白': 'seo_meal_replacement',
    'seo_体重管理': 'seo_weight_management',
    'seo_健康食品': 'seo_healthy_food',
    'seo_冲调食品': 'seo_beverage_food',
    'seo_出口30_国家': 'seo_export_30_countries',
    'seo_功能冲饮': 'seo_functional_drinks',
    'seo_咖啡冲调': 'seo_coffee_beverage',
    'seo_工厂': 'seo_factory',
    'seo_美容胶原': 'seo_beauty_collagen',
    'seo_肠道健康': 'seo_gut_health',
    'seo_茶饮奶茶': 'seo_tea_milk_tea',
}

def replace_chinese_keys_in_file(fpath):
    """Replace Chinese data-i18n keys in a file."""
    try:
        with open(fpath) as f:
            content = f.read()
    except:
        return False
    
    original = content
    for old_key, new_key in CHINESE_KEYS_MAP.items():
        content = content.replace(f'data-i18n="{old_key}"', f'data-i18n="{new_key}"')
        content = content.replace(f'data-i18n-alt="{old_key}"', f'data-i18n-alt="{new_key}"')
        content = content.replace(f'data-i18n-title="{old_key}"', f'data-i18n-title="{new_key}"')
    
    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        return True
    return False

def replace_chinese_keys_in_json(json_data):
    """Recursively replace keys in a JSON dict."""
    result = {}
    for k, v in json_data.items():
        if k in CHINESE_KEYS_MAP:
            new_k = CHINESE_KEYS_MAP[k]
        else:
            new_k = k
        if isinstance(v, dict):
            result[new_k] = replace_chinese_keys_in_json(v)
        else:
            result[new_k] = v
    return result

# ═══ Phase 3: 清理770个厨具 key ══════════════════════════════
# Kitchen-related key prefixes to remove from en-ui.json
KITCHEN_PREFIXES = [
    'training_', 'profit_calc', 'profit-calculator', 'quote_type_',
    'ck_', 'cr_', 'ct_', 'sr_', 'ff_',
    'food_factory_', 'formula_lab_',
    'small-restaurant_', 'chain-restaurant_',
    'cloud-kitchen_', 'canteen_',
    'equipment_', 'spare_parts_', 'warranty_', 'engineer_',
    'app_brand_', 'app_func_', 'app_recommended_',
    'func_drink_', 'ingredient_',  
]

# Additional specific kitchen keys
KITCHEN_KEYS = {
    'applications_small-restaurant_small_induction_cooker',
    'applications_hero_subtitle',
    'applications_hero_title',
    'applications_section_subtitle',
    'applications_section_title',
    'case3_desc',
    'case3_title',
    'case3_badge',
}

def is_kitchen_key(key):
    """Check if a translation key is kitchen-related."""
    kl = key.lower()
    # Check prefixes
    for prefix in KITCHEN_PREFIXES:
        if kl.startswith(prefix.lower()):
            return True
    # Check specific keys
    if key in KITCHEN_KEYS:
        return True
    # Check for known kitchen patterns in key name
    kitchen_patterns = ['induction_cooker', 'rice_cooker', 'fryer', 'steamer', 
                        'hotpot', 'robot', 'chef_', 'kitchen_eq', 'cooking_eq',
                        'stove', 'grill_eq', 'burner_', 'cooktop']
    for pat in kitchen_patterns:
        if pat.lower() in kl:
            return True
    return False

# ═══ Phase 4: 厨具图片 ═══════════════════════════════════════
KITCHEN_IMAGE_KEYWORDS = [
    'kitchen', 'cooker', 'fryer', 'steamer', 'oven', 'grill',
    'robot', 'induction', 'chef', 'restaurant', 'canteen',
    'commercial', 'stove', 'burner', 'frying', 'wok', 'hotpot',
    'bakery', 'croissant', 'pan', 'pot',
]

def find_kitchen_images(base_dir):
    """Find all images with kitchen-related filenames."""
    found = []
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if any(kw in f.lower() for kw in KITCHEN_IMAGE_KEYWORDS):
                found.append(os.path.join(root, f))
    return found

# ═══ 主流程 ═══════════════════════════════════════════════════
def main():
    print(f"备份目录: {BACKUP_DIR}")
    ensure_dir(BACKUP_DIR)
    
    # ─── Phase 1: 备份清理页面 ───
    print("\n" + "=" * 60)
    print("Phase 1: 备份并清理孤立页面")
    print("=" * 60)
    
    backed_files = []
    backed_files += backup_and_remove('src/pages/applications', "厨具应用场景页面")
    backed_files += backup_and_remove('src/pages/support', "厨具技术支持页面")
    
    # Create backup README
    readme = f"""# 清理备份 - {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 删除的页面目录
- `src/pages/applications/` — 厨具"应用场景"页面（3 files）
- `src/pages/support/` — 厨具"技术支持"页面（3 files）

## 备份说明
备份保留原始目录结构，可以直接恢复：
    cp -a src/pages/applications /path/to/restore/
"""
    with open(os.path.join(BACKUP_DIR, 'README.md'), 'w') as f:
        f.write(readme)
    
    # ─── Phase 2: 替换中文 key ───
    print("\n" + "=" * 60)
    print("Phase 2: 替换22个中文 data-i18n key")
    print("=" * 60)
    
    # In HTML/JS files
    html_js_files = []
    for root, dirs, files in os.walk(os.path.join(BASE, 'src')):
        for f in files:
            if f.endswith(('.html', '.js')):
                html_js_files.append(os.path.join(root, f))
    
    changed_files = []
    for fpath in html_js_files:
        if replace_chinese_keys_in_file(fpath):
            rel = os.path.relpath(fpath, BASE)
            changed_files.append(rel)
    
    print(f"  HTML/JS 文件替换: {len(changed_files)} files")
    for f in changed_files:
        print(f"    {f}")
    
    # In JSON translation files
    for lang_file in ['en-ui.json', 'zh-CN-ui.json']:
        fpath = os.path.join(LANG_DIR, lang_file)
        if os.path.exists(fpath):
            with open(fpath) as f:
                data = json.load(f)
            old_keys = [k for k in CHINESE_KEYS_MAP if k in data]
            data = replace_chinese_keys_in_json(data)
            with open(fpath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {lang_file}: 替换 {len(old_keys)} 个中文key")
            for k in old_keys:
                print(f"    {k} → {CHINESE_KEYS_MAP[k]}")
    
    # ─── Phase 3: 清理厨具 i18n keys ───
    print("\n" + "=" * 60)
    print("Phase 3: 清理770个厨具 i18n key（仅 en-ui.json）")
    print("=" * 60)
    
    en_file = os.path.join(LANG_DIR, 'en-ui.json')
    zh_file = os.path.join(LANG_DIR, 'zh-CN-ui.json')
    
    for lang_file, name in [(en_file, 'en-ui.json'), (zh_file, 'zh-CN-ui.json')]:
        if not os.path.exists(lang_file):
            continue
        
        with open(lang_file) as f:
            data = json.load(f)
        
        kitchen_keys = [k for k in data if is_kitchen_key(k)]
        total_before = len(data)
        
        for k in kitchen_keys:
            del data[k]
        
        with open(lang_file, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  {name}: 删除 {len(kitchen_keys)} 个厨具 key（{total_before} → {len(data)}）")
    
    # ─── Phase 4: 厨具图片 ───
    print("\n" + "=" * 60)
    print("Phase 4: 清理29张厨具图片")
    print("=" * 60)
    
    kitchen_images = find_kitchen_images(IMG_DIR)
    kitchen_images += find_kitchen_images(os.path.join(BASE, 'src', 'assets', 'applications'))
    
    for img_path in kitchen_images:
        rel = os.path.relpath(img_path, BASE)
        backup_img_dir = os.path.join(BACKUP_DIR, os.path.dirname(rel))
        ensure_dir(backup_img_dir)
        shutil.copy2(img_path, backup_img_dir)
        os.remove(img_path)
        print(f"  📷 已备份并删除: {rel}")
    
    print(f"\n  总计删除图片: {len(kitchen_images)} 张")
    
    # ─── 汇总 ───
    print("\n" + "=" * 60)
    print("📊 清理汇总")
    print("=" * 60)
    print(f"  备份目录: {BACKUP_DIR}")
    print(f"  Phase 1: 删除 {len(backed_files)} 个孤立页面文件")
    print(f"  Phase 2: 替换 {len(CHINESE_KEYS_MAP)} 个中文key，涉及 {len(changed_files)} 个文件")
    print(f"  Phase 3: 厨具 i18n key 待确认处理范围")
    print(f"  Phase 4: 删除 {len(kitchen_images)} 张厨具图片")
    print("\n✅ 清理脚本执行完毕")
    
    return BACKUP_DIR

if __name__ == '__main__':
    main()
