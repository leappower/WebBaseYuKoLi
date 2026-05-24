#!/usr/bin/env python3
"""
从画册 V4 源数据生成 gut 分类产品 JSON
不需要图片识别——源数据已有完整产品名和品牌信息

2026-05-24
"""
import json, re, os

SRC_JSON = "/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json"
OUT_DIR = "/Users/chee/Projects/BrewYuKoLi/src/assets/data"

# 品牌清理规则：从 info_preview 提取纯品牌名
def extract_brand(info):
    if not info: return ""
    m = re.search(r'品牌\s*:?\s*([^\n]+)', info)
    if m:
        b = m.group(1).strip()
        # 清理 SKU/型号等噪音
        b = re.sub(r'SKU\d+_TH-\d+', '', b).strip()
        b = re.sub(r'Model\[\]?', '', b).strip()
        b = re.sub(r'Product\s+\w+', '', b).strip()
        b = re.sub(r'Pack\s+Type\S*', '', b).strip()
        b = re.sub(r'Packaging\s+Type\S*', '', b).strip()
        b = re.sub(r'Ingredients\S*', '', b).strip()
        b = re.sub(r'Product\s+Form\S*', '', b).strip()
        b = re.sub(r'Dietary\s+Needs\S*', '', b).strip()
        b = re.sub(r'Net\s+Weight\S*', '', b).strip()
        b = re.sub(r'Recommended\s+User\S*', '', b).strip()
        b = re.sub(r'Warranty\s+Type\S*', '', b).strip()
        b = re.sub(r'Product\s+License\S*', '', b).strip()
        b = re.sub(r'Flavor\S*', '', b).strip()
        return b[:30].strip()
    return ""

def extract_origin(info):
    if not info: return ""
    m = re.search(r'(?:原产国|出货地|Region of Origin)\s*:?\s*([^\n]+)', info)
    return m.group(1).strip()[:10] if m else ""

def extract_diets(info):
    if not info: return []
    m = re.search(r'(?:特殊饮食|Specialty Diet|饮食类型)\s*:?\s*([^\n]+)', info)
    if not m:
        m = re.search(r'Dietary Needs[:\s]*([^\n]+)', info)
    if m:
        return [t.strip() for t in re.split(r'[,，、]', m.group(1).strip()) if t.strip()][:4]
    return []

def clean_name(name):
    if not name: return ""
    n = name.strip()
    # 去除电商前缀
    n = re.sub(r'^[(（][^)）]*[)）]\s*', '', n)
    n = re.sub(r'^[\[【][^\]】]*[\]】]\s*', '', n)
    n = re.sub(r'^(畅销款|热卖|新品|包邮|ส่งฟรี|⚡|Best Seller|Variation|Promo|Bundle)\s*', '', n)
    n = re.sub(r'^\[[^\]]*\]\s*', '', n)  # [Trial Pack], [05]
    return n.strip()

def extract_specs(name):
    """从产品名提取规格"""
    if not name: return ""
    m = re.search(r'(\d+\s*(?:g|kg|ml|L|oz|lb|s|gram|กรัม|ก\.ก\.|磅|盎司|袋|盒|罐|瓶|条|sticks|sachet|bags)\b[^)\]）\s]*?(?:\)|\]|\s|$))', name, re.I)
    return m.group(1).strip() if m else ""

with open(SRC_JSON) as f:
    src = json.load(f)

gut_items = src.get("🔥肠道健康线", [])
print(f"Source: {len(gut_items)} gut items")

results = []
for i, item in enumerate(gut_items):
    seq = i + 1
    seq_str = f"{seq:03d}"
    info = item.get("info_preview", "")
    raw_name = item.get("name", "")
    
    brand = extract_brand(info)
    # 如果 brand 仍为空或太脏，尝试从 name 提取已知品牌
    if not brand or len(brand) > 25:
        known = {
            "Orgain": "Orgain", "Anlene": "Anlene", "Kinohimitsu": "Kinohimitsu",
            "Herbalife": "Herbalife", "Nutricost": "Nutricost", "Anthony": "Anthony's",
            "BIOPHARM": "BIOPHARM", "Fresubin": "Fresubin", "Valens": "Valens",
            "Soluxe": "Soluxe", "KOKORI": "KOKORI", "NEO-MUNE": "NEO-MUNE",
            "Peptisol": "Peptisol", "Vismores": "Vismores", "ONCE": "Otsuka",
            "PURO": "PURO", "Infinity": "Infinity", "Albumen": "Albumen",
            "Mahkota": "Mahkota", "Bird": "Luteazia", "Sports Research": "Sports Research",
        }
        for key, val in known.items():
            if key.lower() in raw_name.lower():
                brand = val
                break
    if not brand:
        brand = ""
    
    name = clean_name(raw_name) or f"Gut Health Product {seq_str}"
    specs = extract_specs(raw_name)
    origin = extract_origin(info)
    diets = extract_diets(info)
    
    entry = {
        "id": f"gut-{seq_str}",
        "model": f"GT-{seq_str}",
        "name": name,
        "category": "gut",
        "image": f"/assets/images/products/gut/{seq_str}.webp",
        "brand": brand,
        "origin": origin,
        "specs": specs,
        "moq": 500,
        "diets": diets,
        "description": "",
        "tags": ["gut"]
    }
    results.append(entry)
    print(f"  {seq_str} | {brand[:18]:18s} | {name[:50]}")

# Save
with open(os.path.join(OUT_DIR, "gut-products.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n✅ Generated {len(results)} gut products → gut-products.json")
