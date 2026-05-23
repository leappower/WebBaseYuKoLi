#!/usr/bin/env python3
"""生成 product-data-table.js"""
import json

IN_JSON = '/Users/chee/Projects/BrewYuKoLi/docs/plan/product-catalog-converted.json'
OUT_JS = '/Users/chee/Projects/BrewYuKoLi/src/assets/js/product-data-table.js'

with open(IN_JSON) as f:
    data = json.load(f)

lines = {}
for item in data:
    lines.setdefault(item['category'], []).append(item)

rows = []
for item in data:
    name_esc = item['name'].replace('"', "'").replace('\n', ' ')
    specs_esc = item['specs'].replace('"', "'")
    tags_str = ', '.join(f'"{t}"' for t in item['tags'])
    rows.append(f'  {{ id: "{item["id"]}", model: "{item["model"]}", '
                f'name: "{name_esc}", category: "{item["category"]}", '
                f'image: "{item["image"]}", specs: "{specs_esc}", '
                f'moq: {item["moq"]}, tags: [{tags_str}] }}')

rows_joined = ',\n'.join(rows)

cat_counts = '\n'.join(f' *   {k}: {len(v)} SKU' for k, v in lines.items())

js = f'''/**
 * product-data-table.js — BrewYuKoLi 产品目录
 *
 * 数据来源: 画册 V4（133 SKU）
 * 最后更新: 2026-05-23
 *
 * 产品线:
{cat_counts}
 */
"use strict";
var PRODUCT_DATA_TABLE = [
{rows_joined}
];
var PRODUCT_DATA_VERSION = "20260523-v1";
window.PRODUCT_DATA_TABLE = PRODUCT_DATA_TABLE;
window.PRODUCT_DATA_VERSION = PRODUCT_DATA_VERSION;
'''

with open(OUT_JS, 'w') as f:
    f.write(js)

print(f'OK: {len(data)} SKU -> {OUT_JS}')
