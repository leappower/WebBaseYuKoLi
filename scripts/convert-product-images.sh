#!/bin/bash
# 图片转换：JSON 的 _src_image_idx → 实际文件 image{idx}.{jpeg,png}
# 注意：JSON 中 idx 范围为 2-134，但实际文件只有 image1 ~ image133
# 需要统一偏移：idx 为 N 对应 image{N-1}.{ext}
# 但 coffee 线（idx 2-50）已正确转换过了，所以先修正 idx

SRC_DIR="/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_images"
DST_BASE="/Users/chee/Projects/BrewYuKoLi/src/assets/images/products"

python3 << 'PYEOF'
import json, os, subprocess, re

with open('/Users/chee/Projects/BrewYuKoLi/docs/plan/product-catalog-converted.json') as f:
    data = json.load(f)

SRC = "/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_images"
DST = "/Users/chee/Projects/BrewYuKoLi/src/assets/images/products"

# 文件列表映射（按 id 排序）
file_list = {}
for fname in os.listdir(SRC):
    m = re.search(r'image(\d+)', fname)
    if m:
        file_list[int(m.group(1))] = os.path.join(SRC, fname)

print(f"可用图片数: {len(file_list)}, 范围: {min(file_list.keys())}-{max(file_list.keys())}")

total = len(data)
ok = 0
fail = 0
skip = 0
total_src = 0
total_dst = 0

for item in data:
    cat = item['category']
    seq = item['id'].split('-')[1]
    dst_file = os.path.join(DST, cat, f'{seq}.webp')
    
    # 如果文件已存在且 >10KB，跳过
    if os.path.exists(dst_file) and os.path.getsize(dst_file) > 10240:
        skip += 1
        continue
    
    # 从 JSON 的 image 字段提取原始文件名
    # JSON 中 image 是 "image2.png", "image51.jpeg" 等
    src_img_field = item.get('_src_name', '')
    
    # 直接读原始 JSON 中的 image 字段值
    src_basename = ""
    raw_fields = {
        'coffee-001': 'image2.png',
        'coffee-002': 'image3.jpeg',
        'coffee-003': 'image4.jpeg',
    }
    
    # 更好的方式：从转换时保留的原始 json 中 image 字段读
    # 没法，直接按转换规则映射：idx = 顺序号+1（tea从51开始）
    # 但更可靠的方法是用 product_catalog_data.json 重新读取
    pass

# 直接重读源文件，按顺序匹配
with open('/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json') as f:
    raw = json.load(f)

line_keys = ['🔥咖啡冲调线', '🔥茶饮奶茶线', '🔥美容胶原线', '🔥体重管理', '🔥肠道健康线']
image_idx = 0

for lk in line_keys:
    items = raw.get(lk, [])
    for i, raw_item in enumerate(items):
        image_idx += 1
        img_field = raw_item.get('image', '')  # "image2.png"
        
        # 解析数字
        m = re.search(r'image(\d+)', img_field)
        src_num = int(m.group(1)) if m else 0
        
        # 找到源文件
        src_file = None
        for ext in ['.jpeg', '.jpg', '.png']:
            p = os.path.join(SRC, f'image{src_num}{ext}')
            if os.path.exists(p):
                src_file = p
                break
        
        if not src_file:
            print(f"  ❌ image{src_num} not found")
            fail += 1
            continue
        
        # 确定目标目录
        slug_map = {
            '🔥咖啡冲调线': 'coffee',
            '🔥茶饮奶茶线': 'tea',
            '🔥美容胶原线': 'beauty',
            '🔥体重管理': 'weight',
            '🔥肠道健康线': 'gut',
        }
        cat = slug_map[lk]
        seq = f'{i+1:03d}'
        dst_dir = os.path.join(DST, cat)
        os.makedirs(dst_dir, exist_ok=True)
        dst_file = os.path.join(dst_dir, f'{seq}.webp')
        
        # 跳过已存在且有效
        if os.path.exists(dst_file) and os.path.getsize(dst_file) > 10240:
            skip += 1
            continue
        
        src_size = os.path.getsize(src_file)
        total_src += src_size
        
        result = subprocess.run(
            ['cwebp', '-q', '80', src_file, '-o', dst_file],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            dst_size = os.path.getsize(dst_file)
            total_dst += dst_size
            ok += 1
            if ok <= 3 or ok % 20 == 0:
                print(f"  ✅ [{image_idx}/{image_idx}] {cat}/{seq}.webp ({src_size//1024}KB -> {dst_size//1024}KB, -{(1-dst_size/src_size)*100:.0f}%)")
        else:
            print(f"  ❌ {cat}/{seq}.webp: {result.stderr[:60]}")
            fail += 1

print(f"\n结果: {ok} 转换 + {skip} 已存在 + {fail} 失败 = {image_idx} 总数")
if total_src > 0:
    print(f"原始: {total_src//1024//1024} MB -> WebP: {total_dst//1024//1024} MB ({total_dst*100//total_src}%)")
PYEOF
