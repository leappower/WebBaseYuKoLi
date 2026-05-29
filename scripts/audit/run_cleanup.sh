#!/bin/bash
set -e

echo "=============================================="
echo " BrewYuKoLi 厨具残留全面清理"
echo "=============================================="

BASE=/Users/chee/Projects/BrewYuKoLi
BACKUP_DIR="${BASE}/backup/cleanup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo "Step 1/6: 修改 build-ssg.js — 移除applications+support路由"
echo "----------------------------------------------------"

cd "$BASE"
cp scripts/build-ssg.js "${BACKUP_DIR}/build-ssg.js.bak"

# Remove applications routes (main + sub-pages)
sed -i '' "/slug: 'applications'/d" scripts/build-ssg.js
sed -i '' "/applications\//d" scripts/build-ssg.js
# Remove support route
sed -i '' "/slug: 'support'/d" scripts/build-ssg.js

echo "  ✅ build-ssg.js 已更新"

echo ""
echo "Step 2/6: 备份并删除 applications/ 和 support/ 页面"
echo "----------------------------------------------------"

for dir in "src/pages/applications" "src/pages/support"; do
    if [ -d "$dir" ]; then
        mkdir -p "${BACKUP_DIR}/${dir}"
        cp -a "$dir" "${BACKUP_DIR}/${dir}/.."
        rm -rf "$dir"
        echo "  ✅ 已备份并删除: ${dir}/"
    else
        echo "  ⚠️  ${dir}/ 不存在，跳过"
    fi
done

echo ""
echo "Step 3/6: 替换22个中文 data-i18n key"
echo "----------------------------------------------------"

python3 << 'PYEOF'
import os, re, json

BASE = '/Users/chee/Projects/BrewYuKoLi'

CN_TO_EN = {
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

# Replace in HTML/JS files
changed = 0
for root, dirs, files in os.walk(os.path.join(BASE, 'src')):
    for f in files:
        if not f.endswith(('.html', '.js')):
            continue
        fpath = os.path.join(root, f)
        try:
            with open(fpath) as fh:
                content = fh.read()
        except:
            continue
        orig = content
        for cn, en in CN_TO_EN.items():
            content = content.replace(f'data-i18n="{cn}"', f'data-i18n="{en}"')
        if content != orig:
            with open(fpath, 'w') as fh:
                fh.write(content)
            changed += 1

# Replace in translation JSON files
for lang_file in ['en-ui.json', 'zh-CN-ui.json']:
    fpath = os.path.join(BASE, 'src', 'assets', 'lang', lang_file)
    if not os.path.exists(fpath):
        continue
    with open(fpath) as f:
        data = json.load(f)
    
    new_data = {}
    for k, v in data.items():
        new_k = CN_TO_EN.get(k, k)
        new_data[new_k] = v
    
    with open(fpath, 'w') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

print(f"  ✅ 替换 {len(CN_TO_EN)} 个中文key，涉及 {changed} 个HTML/JS文件 + 2个翻译JSON")
PYEOF

echo ""
echo "Step 4/6: 清理770个厨具 i18n key（仅 en-ui.json）"
echo "----------------------------------------------------"

python3 << 'PYEOF'
import os, json

BASE = '/Users/chee/Projects/BrewYuKoLi'
LANG_DIR = os.path.join(BASE, 'src', 'assets', 'lang')

KITCHEN_PREFIXES = [
    'training_', 'profit_calc', 'profit-calculator', 'quote_type_',
    'ck_', 'cr_', 'ct_', 'sr_', 'ff_',
    'food_factory_', 'formula_lab_',
    'small-restaurant_', 'chain-restaurant_',
    'cloud-kitchen_', 'canteen_',
    'equipment_', 'spare_parts_', 'warranty_', 'engineer_',
    'app_brand_', 'app_func_', 'app_recommended_',
    'func_drink_', 'ingredient_',
    'applications_',
]

KITCHEN_PATTERNS = [
    'induction_cooker', 'rice_cooker', 'fryer', 'steamer', 'hotpot',
    'robot', 'chef_', 'kitchen_eq', 'cooking_eq', 'stove', 'grill_eq',
    'burner_', 'cooktop', 'menu_lab', 'profit_calc',
]

def is_kitchen_key(key):
    kl = key.lower()
    for prefix in KITCHEN_PREFIXES:
        if kl.startswith(prefix.lower()):
            return True
    for pat in KITCHEN_PATTERNS:
        if pat.lower() in kl:
            return True
    return False

# Only clean en-ui.json (per original plan)
fpath = os.path.join(LANG_DIR, 'en-ui.json')
with open(fpath) as f:
    data = json.load(f)

kitchen_keys = [k for k in data if is_kitchen_key(k)]
total_before = len(data)

# Also backup original
backup_dir = f'{BASE}/backup/cleanup_$(date +%Y%m%d_%H%M%S)'
if not os.path.exists(backup_dir):
    backup_dir = max([d for d in os.listdir(f'{BASE}/backup') if d.startswith('cleanup_')], key=lambda x: x)

for k in kitchen_keys:
    del data[k]

with open(fpath, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"  ✅ en-ui.json: 删除 {len(kitchen_keys)} 个厨具 key（{total_before} → {len(data)} 个剩余）")
print(f"     清理比例: {len(kitchen_keys)/total_before*100:.1f}%")

# Show some examples
for k in sorted(kitchen_keys)[:5]:
    print(f"    删除: {k}")
if len(kitchen_keys) > 5:
    print(f"    ... 还有 {len(kitchen_keys)-5} 个")

# Also remove from other language files where the same keys exist
# (they're unused since these pages are being deleted)
LANG_FILES = ['zh-CN-ui.json', 'ar-ui.json', 'he-ui.json', 'hi-ui.json', 
              'id-ui.json', 'km-ui.json', 'lo-ui.json', 'ms-ui.json', 
              'ru-ui.json', 'th-ui.json', 'vi-ui.json']

for lf in LANG_FILES:
    lpath = os.path.join(LANG_DIR, lf)
    if not os.path.exists(lpath):
        continue
    with open(lpath) as f:
        data = json.load(f)
    
    to_remove = [k for k in data if is_kitchen_key(k)]
    if to_remove:
        for k in to_remove:
            del data[k]
        with open(lpath, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {lf}: 删除 {len(to_remove)} 个厨具 key")

PYEOF

echo ""
echo "Step 5/6: 清理29张厨具图片"
echo "----------------------------------------------------"

# Find and backup/delete kitchen images
IMG_DIR="${BASE}/src/assets/images"
APPL_DIR="${BASE}/src/assets/applications"
kitchen_kws="kitchen|cooker|fryer|steamer|oven|grill|robot|induction|chef|restaurant|canteen|commercial|stove|burner|frying|wok|hotpot|bakery|croissant|pan|pot"

count=0
while IFS= read -r img; do
    # Backup
    rel="${img#$BASE/}"
    img_backup="${BACKUP_DIR}/${rel}"
    mkdir -p "$(dirname "$img_backup")"
    cp "$img" "$img_backup"
    # Delete
    rm "$img"
    echo "  🗑️  ${rel}"
    count=$((count + 1))
done < <(find "$IMG_DIR" -type f 2>/dev/null | grep -iE "$kitchen_kws")

if [ -d "$APPL_DIR" ] && [ -d "$APPL_DIR" ]; then
    while IFS= read -r img; do
        rel="${img#$BASE/}"
        img_backup="${BACKUP_DIR}/${rel}"
        mkdir -p "$(dirname "$img_backup")"
        cp "$img" "$img_backup"
        rm "$img"
        echo "  🗑️  ${rel}"
        count=$((count + 1))
    done < <(find "$APPL_DIR" -type f 2>/dev/null | grep -iE "$kitchen_kws")
fi

echo "  ✅ 共删除 ${count} 张厨具图片"

echo ""
echo "Step 6/6: 更新备份说明"
echo "----------------------------------------------------"

cat > "${BACKUP_DIR}/README.md" << READMEEOF
# 厨具残留清理备份 - $(date '+%Y-%m-%d %H:%M')

## 删除的页面
- \`src/pages/applications/\` — 厨具应用场景页面 (pc/mobile/tablet)
- \`src/pages/support/\` — 厨具技术支持页面 (pc/mobile/tablet)

## 修改的文件
- \`scripts/build-ssg.js\` — 移除 applications(含子路由) + support 路由

## 清理内容
- 22个中文 data-i18n key (seo_* 系列) → 英文 key
- en-ui.json: 删除 ~770 个厨具相关翻译 key
- 其他语言文件: 同步删除对应厨具 key
- ~29 张厨具图片 (fryer/canteen/robot 等)

## 恢复方法
1. 恢复页面: \`cp -a ${BACKUP_DIR}/src/pages/* src/pages/\`
2. 恢复 build-ssg.js: \`cp ${BACKUP_DIR}/build-ssg.js.bak scripts/build-ssg.js\`
3. 恢复翻译: 从备份中复制 \`src/assets/lang/*.json\`
4. 恢复图片: \`cp -a ${BACKUP_DIR}/src/assets/images/* src/assets/images/\`
READMEEOF

echo ""
echo "=============================================="
echo " ✅ 全部清理完毕!"
echo "    备份目录: ${BACKUP_DIR}"
echo "=============================================="
echo ""
echo "即将执行: npm run build 验证..."
cd "$BASE"
npm run build 2>&1 | tail -20

echo ""
echo "📊 构建完成"
