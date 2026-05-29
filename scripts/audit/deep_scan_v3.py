#!/usr/bin/env python3
"""第三次扫描 — 从多个不同角度检测厨具遗留"""
import os, re, json, glob
from collections import defaultdict

BASE = '/Users/chee/Projects/BrewYuKoLi'
SRC = os.path.join(BASE, 'src')

def all_files(ext, base=SRC):
    for root, dirs, files in os.walk(base):
        for f in files:
            if f.endswith(ext):
                yield os.path.join(root, f)

# ─── 角度1: 导航中有但文件不存在的路由 ───────────────────────
print("=" * 60)
print("📋 角度1: 导航配置指向但页面不存在的路由")
print("=" * 60)
with open(os.path.join(BASE, 'src', 'site.config.js')) as f:
    cfg = f.read()

nav_hrefs = set()
for m in re.finditer(r'''href:\s*["']([^"']+)["']''', cfg):
    url = m.group(1).strip().strip('/').split('#')[0]
    if url and url.startswith(('http','mailto','tel','javascript')):
        continue
    if url:
        nav_hrefs.add(url)

existing_pages = set()
for root, dirs, files in os.walk(os.path.join(BASE, 'src', 'pages')):
    rel = os.path.relpath(root, os.path.join(BASE, 'src', 'pages'))
    if rel == '.': continue
    htmls = [f for f in files if f.endswith('.html')]
    if htmls:
        existing_pages.add(rel)

missing = []
for nav in sorted(nav_hrefs):
    found = False
    for ep in existing_pages:
        if ep == nav or ep.startswith(nav + '/'):
            found = True
            break
    if not found:
        missing.append(nav)

if missing:
    for m in sorted(missing):
        print(f"  ⚠️  {m}/ — 在导航中但 src/pages/ 下无模板文件")
else:
    print("  ✅ 所有导航路由都有模板文件")

# ─── 角度2: 翻译文件中的厨具类内容 ────────────────────────────
print()
print("=" * 60)
print("📋 角度2: 多语言文件中的厨具残留文案")
print("=" * 60)

kitchen_zh_keywords = [
    '厨师', '厨房', '烹饪', '炉灶', '烤炉', '烤箱', '炒锅', '煎锅',
    '蒸箱', '油炸', '电磁炉', '炊具', '商用厨房', '机器人', '炒菜',
    '餐饮', '餐厅', '食堂', '后厨', '产线', '工位', '产能',
    'HORECA', '餐饮企业', '连锁餐饮', '中央厨房', '云厨房',
    'IGBT', '线圈盘', '锅体', '功率', '瓦数', '电压',
    '食材', '菜品', '食谱', '菜式', '菜肴', '出餐',
    '厨师机', '洗菜', '切菜', '配菜', '炒菜机器人',
    'Brand IoT', 'hardware-first', 'hardware优先',
    '商用电磁炉', 'induction cooker', 'rice cooker',
]

# 检查 en-ui.json
en_file = os.path.join(BASE, 'src', 'assets', 'lang', 'en-ui.json')
zh_file = os.path.join(BASE, 'src', 'assets', 'lang', 'zh-CN-ui.json')

for lang_name, fpath in [('en-ui.json', en_file), ('zh-CN-ui.json', zh_file)]:
    if not os.path.exists(fpath):
        continue
    with open(fpath) as f:
        data = json.load(f)
    
    hits = []
    for key, val in data.items():
        if not isinstance(val, str):
            continue
        for kw in kitchen_zh_keywords:
            if kw.lower() in val.lower():
                hits.append((key, kw, val[:80]))
                break
    
    if hits:
        print(f"\n   {lang_name} ({len(hits)}处):")
        for key, kw, val in hits[:15]:
            print(f"    🔑 {key}")
            print(f"       包含「{kw}」: {val}")
            print()

# ─── 角度3: 翻译文件中所有包含中文的 key ─────────────────────
print()
print("=" * 60)
print("📋 角度3: 翻译文件中所有含中文的 key（不只是 data-i18n 属性）")
print("=" * 60)
for lang_name, fpath in [('en-ui.json', en_file), ('zh-CN-ui.json', zh_file)]:
    if not os.path.exists(fpath):
        continue
    with open(fpath) as f:
        data = json.load(f)
    
    zh_keys = []
    for key in data:
        if re.search(r'[\u4e00-\u9fff]', key):
            zh_keys.append(key)
    
    if zh_keys:
        print(f"\n   {lang_name} ({len(zh_keys)}个中文key):")
        # Group by prefix
        prefixes = defaultdict(list)
        for k in zh_keys:
            prefix = k.split('_')[0] if '_' in k else k[:3]
            prefixes[prefix].append(k)
        for p in sorted(prefixes):
            keys = sorted(prefixes[p])
            for k in keys:
                print(f"    🔑 {k}")

# ─── 角度4: 资源文件中的厨具图片/资产 ──────────────────────────
print()
print("=" * 60)
print("📋 角度4: 图片/资源文件中的厨具残留")
print("=" * 60)
img_dir = os.path.join(BASE, 'src', 'assets', 'images')
if os.path.exists(img_dir):
    kitchen_img_patterns = [
        '*kitchen*', '*cooker*', '*fryer*', '*steamer*', '*oven*', '*grill*',
        '*robot*', '*induction*', '*chef*', '*restaurant*', '*canteen*',
        '*commercial*', '*cooking*', '*stove*', '*burner*'
    ]
    for root, dirs, files in os.walk(img_dir):
        for f in files:
            f_lower = f.lower()
            for kw in ['kitchen', 'cooker', 'fryer', 'steamer', 'oven', 'grill',
                       'robot', 'induction', 'chef', 'restaurant', 'canteen',
                       'commercial', 'cooking', 'stove', 'burner', 'frying',
                       'wok', 'pan', 'pot']:
                if kw in f_lower:
                    rel = os.path.relpath(os.path.join(root, f), BASE)
                    print(f"  📷 {rel}")
                    break

# ─── 角度5: 搜索索引中的厨具页面 ─────────────────────────────
print()
print("=" * 60)
print("📋 角度5: search-index.js 中的厨具类页面")
print("=" * 60)
search_idx = os.path.join(BASE, 'src', 'assets', 'js', 'search-index.js')
if os.path.exists(search_idx):
    with open(search_idx) as f:
        content = f.read()
    data = json.loads(content.replace('var SEARCH_INDEX = ', '').rstrip().rstrip(';'))
    
    for p in data:
        title = str(p.get('title', '')).lower()
        title_zh = str(p.get('titleZh', '')).lower()
        keywords = ' '.join(p.get('keywords', []))
        combined = title + ' ' + title_zh + ' ' + keywords
        
        for kw in kitchen_zh_keywords:
            if kw.lower() in combined:
                print(f"  📄 {p['path']}")
                print(f"      title: {p.get('title','')} / titleZh: {p.get('titleZh','')}")
                print(f"      keyword match: {kw}")
                break

# ─── 角度6: 所有 JS 文件中硬编码的旧路径 ─────────────────────
print()
print("=" * 60)
print("📋 角度6: JS 中硬编码的旧厨具路径")
print("=" * 60)
old_paths = [
    '/applications/', '/cases/', '/compliance/', '/contact/', '/manufacturing/',
    '/canteen/', '/cloud-kitchen/', '/food-factory/', '/menu-lab/',
    '/support/install', '/support/spare-parts/', '/support/warranty/',
    '/support/training/', '/support/engineer/', '/support/faq/',
    '/privacy/', '/terms/', '/thank-you/',
    '/solutions/oem/induction', '/commercial-kitchen', '/food-service',
]

js_files = list(all_files('.js'))
for fpath in js_files:
    try:
        with open(fpath) as f:
            content = f.read()
        for op in old_paths:
            if op in content:
                rel = os.path.relpath(fpath, BASE)
                # Find context
                line_num = content[:content.find(op)].count('\n') + 1
                print(f"  {rel} L{line_num}: 包含「{op}」")
                break
    except:
        pass

# ─── 角度7: 上一轮 BrewYuKoLi 冲调初始化时标记的文件 ──────────
print()
print("=" * 60)
print("📋 角度7: 所有未被任何 data-i18n 覆盖的屏幕可见中文文本")
print("=" * 60)

html_files = list(all_files('.html'))
def strip_html_tags(text):
    return re.sub(r'<[^>]+>', '', text)

# More aggressive detection of visible Chinese text
for fpath in html_files:
    try:
        with open(fpath) as f:
            lines = f.readlines()
    except:
        continue
    
    rel = os.path.relpath(fpath, BASE)
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Skip lines that are hidden or not visible
        if not stripped or stripped.startswith('//') or stripped.startswith('/*') or 'cdata' in stripped.lower():
            continue
        if '<script' in stripped or '<style' in stripped:
            continue
        
        # Remove HTML tags, check remaining text
        text = strip_html_tags(stripped)
        if not text or len(text) < 5:
            continue
        
        # Must contain Chinese
        if not re.search(r'[\u4e00-\u9fff]', text):
            continue
        
        # Check if this text is inside a data-i18n element
        # Simple check: look at the whole stripped line
        if 'data-i18n=' in stripped:
            # This line has data-i18n - might still have uncovered text
            # Remove the data-i18n values but keep the text
            # Check if text outside data-i18n spans contains Chinese
            no_i18n_line = re.sub(r'<[^>]*data-i18n[^>]*>', '', stripped)
            no_i18n_line = strip_html_tags(no_i18n_line)
            if re.search(r'[\u4e00-\u9fff]', no_i18n_line) and len(no_i18n_line.strip()) >= 5:
                print(f"  ⚠️ {rel} L{i}: {no_i18n_line.strip()[:100]}")
        else:
            # No data-i18n at all on this line
            # Skip if it's JSON-LD or meta
            if 'application/ld+json' not in stripped and 'meta' not in stripped.split('>')[0]:
                # Check if text contains >= 3 Chinese chars (substantial content, not just stray chars)
                chinese_count = len(re.findall(r'[\u4e00-\u9fff]', text))
                if chinese_count >= 3:
                    print(f"  ❌ {rel} L{i}: {text.strip()[:100]}")
