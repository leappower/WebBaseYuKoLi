#!/usr/bin/env python3
"""
数据格式转换: 画册 V4 JSON → product-data-table.js 兼容格式

输入: /Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json
输出: docs/plan/product-catalog-converted.json（校验用）
       src/assets/js/product-data-table.js 的数据数组（直接写入）

映射规则:
  JSON.name              → data.name（保留原始名称，仅清理电商前缀）
  JSON.image             → data.image（映射为 WebP 路径）
  JSON.info_preview      → 提取 brand/category/region/tags
  JSON 所属产品线 key     → data.category

2026-05-23
"""

import json, re, os, sys

SRC = '/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json'
OUT_JSON = '/Users/chee/Projects/BrewYuKoLi/docs/plan/product-catalog-converted.json'
OUT_JS = '/Users/chee/Projects/BrewYuKoLi/src/assets/js/product-data-table.js'

# 产品线 → 类别前缀映射
LINE_MAP = {
    '🔥咖啡冲调线': ('coffee', 'CF'),
    '🔥茶饮奶茶线': ('tea', 'TE'),
    '🔥美容胶原线': ('beauty', 'BT'),
    '🔥体重管理': ('weight', 'WT'),
    '🔥肠道健康线': ('gut', 'GT'),
}

# 读入源数据
with open(SRC) as f:
    raw = json.load(f)

# ─── info_preview 解析 ───
def parse_info(txt, line_key):
    """
    从非结构化的 info_preview 提取有用字段。
    字段格式高度不统一（中/英/泰混排），只提取明显结构化的。
    其余用 description 兜底。
    """
    if not txt:
        return {'brand': '', 'region': '', 'tags': [], 'description': ''}
    
    result = {'brand': '', 'region': '', 'tags': [], 'description': ''}
    
    # 提取品牌 (很多格式: 品牌 XXX / Brand XXX / 第 XX 行)
    brand_match = re.search(r'(?:品牌|Brand|店名)\s*:?\s*([^\n]+)', txt)
    if brand_match:
        result['brand'] = brand_match.group(1).strip()
    
    # 提取出货地 / 原产国 / Country/Region of Origin
    region_match = re.search(r'(?:出货地|原产国|Region of Origin)\s*:?\s*([^\n]+)', txt)
    if region_match:
        result['region'] = region_match.group(1).strip()[:10]
    
    # 提取特殊饮食/认证标签
    diet_match = re.search(r'(?:特殊饮食|Specialty Diet|special diet)\s*:?\s*([^\n]+)', txt)
    if diet_match:
        diet_text = diet_match.group(1).strip()
        diet_tags = [t.strip() for t in re.split(r'[,，、]', diet_text) if t.strip()]
        result['tags'].extend(diet_tags)
    
    # 提取保质期
    shelf_match = re.search(r'(?:保质期|Expiry Date)\s*:?\s*([^\n]+)', txt)
    if shelf_match:
        result['shelf_life'] = shelf_match.group(1).strip()
    
    # 提取 Nutri-Grade
    nutri_match = re.search(r'Nutri-Grade\s*:?\s*([^\n]+)', txt)
    if nutri_match:
        result['nutri_grade'] = nutri_match.group(1).strip()
    
    # 描述: 去掉已知字段行的剩余内容，取前 100 字
    cleaned = re.sub(r'(?:分类|类别|Category|品牌|Brand|特殊饮食|Specialty Diet|原产国|Region of Origin|'
                     r'出货地|保质期|Expiry Date|Nutri-Grade|商品描述|Product Description|'
                     r'商品规格|Product Specifications|Shopee|icon arrow right|'
                     r'icon arrow left|虾皮购物|图标箭头右|图标箭头左)'
                     r'[:：]?.*?\n', '', txt)
    cleaned = re.sub(r'^.*?咖啡|^.*?饮料|^.*?茶|^.*?健康', '', cleaned)
    cleaned = cleaned.strip()
    if cleaned:
        result['description'] = cleaned[:120]
    
    return result


# ─── 名称清洗 ───
def clean_name(name):
    """去除电商前缀、括号备注等干扰信息，保留产品核心名称"""
    if not name:
        return ''
    n = name.strip()
    # 去除开头的电商特有前缀（含括号包裹的）
    n = re.sub(r'^[(（][^)）]*[)）]\s*', '', n)
    n = re.sub(r'^[\[【][^\]】]*[\]】]\s*', '', n)
    # 去除特定前缀词
    n = re.sub(r'^(畅销款|热卖|新品|包邮|ส่งฟรี|⚡|Best Seller|Variation|Promo|Bundle)\s*', '', n)
    # 去除括号内过长的无意义内容（保留品牌和产品名）
    n = re.sub(r'[(（][^)）]{40,}[)）]', '', n)
    return n.strip()


# ─── 生成 model 编号 ───
def make_model(prefix, seq):
    return f'{prefix}-{seq:03d}'


# ─── 生成 id ───
def make_id(slug, seq):
    return f'{slug}-{seq:03d}'


# ═══════════════════════════════════════
# 主处理流程
# ═══════════════════════════════════════

converted = []
image_seq = {}  # 保持图片编号顺序

for line_key, items in raw.items():
    if line_key == '产品线':
        continue
    
    slug, prefix = LINE_MAP[line_key]
    image_seq[slug] = 0
    
    for i, item in enumerate(items):
        image_seq[slug] += 1
        seq = image_seq[slug]
        
        # 解析 info_preview
        info = parse_info(item.get('info_preview', ''), line_key)
        
        # 图片文件名映射: 从 imageN.jpeg/png 解析序号
        img_src = item.get('image', '')
        img_match = re.search(r'image(\d+)', img_src)
        img_idx = int(img_match.group(1)) if img_match else 0
        
        # 提取 moq 信息（如有）
        moq = 500
        moq_match = re.search(r'MOQ[：:]?\s*(\d+)', item.get('info_preview', ''))
        if moq_match:
            moq = int(moq_match.group(1))
        
        # 提取 specs（从 name 末尾提取重量类信息）
        name = item.get('name', '')
        specs_match = re.search(r'(\d+\s*(?:g|kg|ml|L|盎司|包|袋|盒|罐|瓶|条|sticks|sachet|bags))', name, re.I)
        specs = specs_match.group(1) if specs_match else ''
        
        # 生成标签
        tags = [slug.lower(), 'OEM', 'ODM']
        if info['region']:
            tags.append(info['region'][:4].upper())
        for t in info['tags']:
            tag = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fff]', '', t)[:15]
            if tag:
                tags.append(tag)
        
        entry = {
            'id': make_id(slug, seq),
            'model': make_model(prefix, seq),
            'name': clean_name(name) or f'{slug} Product {seq}',
            'category': slug,
            'image': f'/assets/images/products/{slug}/{seq:03d}.webp',
            'specs': specs,
            'moq': moq,
            'tags': list(set(tags)),
            'brand': info['brand'],
            'region': info['region'],
            'description': info.get('description', '') if info.get('description') else '',
            '_src_name': name,  # 保留原始名称
            '_src_image_idx': img_idx,  # 保留原始图片序号，用于 A0-2 映射
        }
        converted.append(entry)

# ─── 写入校验 JSON ───
os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
with open(OUT_JSON, 'w') as f:
    json.dump(converted, f, ensure_ascii=False, indent=2)

# ─── 统计 ───
from collections import Counter
cat_count = Counter(e['category'] for e in converted)
print(f'✅ 转换完成: {len(converted)} SKU')
print('\n按产品线:')
for slug, count in sorted(cat_count.items()):
    print(f'  {slug}: {count} SKU')

# 按顺序打印每条线的前3条
print('\n=== 样本 ===')
for slug in ['coffee', 'tea', 'beauty', 'weight', 'gut']:
    items = [e for e in converted if e['category'] == slug]
    print(f'\n--- {slug} (前3) ---')
    for e in items[:3]:
        print(f'  [{e["id"]}] {e["model"]} | {e["name"][:40]} | {e["image"]}')

print(f'\n校验 JSON 已写入: {OUT_JSON}')
