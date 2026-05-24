#!/usr/bin/env python3
"""
识别 gut 分类 41 张产品图片，生成产品数据 JSON
使用 Qwen3-VL-32B (SiliconFlow) 进行图片识别

2026-05-24
"""
import json, base64, urllib.request, time, os, sys

API_KEY = "sk-tmuyiqvucrmlidhzhrzibeqbihivoddfhcgvvjseiozaxwwu"
BASE_URL = "https://api.siliconflow.cn/v1"
MODEL = "Qwen/Qwen3-VL-32B-Instruct"
IMG_DIR = "/Users/chee/Projects/BrewYuKoLi/src/assets/images/products/gut"

# 已有的源数据（从画册 V4 JSON）
SRC_JSON = "/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json"

PROMPT = """/no_think
Identify this product from packaging. Return EXACTLY in this format, no extra text:
Brand: [brand name, empty if not visible]
Name: [full product name as shown on packaging]
Specs: [weight/volume/quantity/servings, e.g. 400g, 30 sachets, 950g]
Origin: [country code or name, empty if not visible]"""

def identify_image(img_path):
    """调用 Qwen3-VL 识别单张图片"""
    with open(img_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    ext = os.path.splitext(img_path)[1].lower()
    mime = "image/png" if ext == ".png" else "image/jpeg" if ext in (".jpg", ".jpeg") else "image/webp"

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{img_b64}"}},
                    {"type": "text", "text": PROMPT}
                ]
            }
        ],
        "max_tokens": 150
    }

    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        content = result["choices"][0]["message"]["content"].strip()
        return content, result.get("usage", {})

def parse_response(text):
    """解析 VL 返回的格式化文本"""
    fields = {"brand": "", "name": "", "specs": "", "origin": ""}
    for line in text.split("\n"):
        line = line.strip()
        for key in fields:
            if line.lower().startswith(key + ":"):
                fields[key] = line.split(":", 1)[1].strip()
                break
    return fields

def main():
    # 加载源数据作为 fallback
    with open(SRC_JSON) as f:
        src_data = json.load(f)
    gut_src = src_data.get("🔥肠道健康线", [])

    # 加载已有的 8class flat JSON（查看已有分类的 brand/origin/diets 补全情况）
    with open("/Users/chee/Projects/BrewYuKoLi/src/assets/data/products.8class.flat.json") as f:
        existing = json.load(f)

    results = []
    errors = []

    # 找出 gut 目录中的图片文件
    images = sorted([f for f in os.listdir(IMG_DIR) if f.endswith((".webp", ".png", ".jpg", ".jpeg"))])

    print(f"Found {len(images)} images in gut directory")
    print(f"Source data has {len(gut_src)} entries")
    print("")

    for i, img_file in enumerate(images):
        seq = os.path.splitext(img_file)[0]  # "001", "002", etc.
        img_idx = int(seq)
        src_idx = img_idx - 1  # 源数据索引
        img_path = os.path.join(IMG_DIR, img_file)

        # 获取源数据作为 fallback
        src_item = gut_src[src_idx] if src_idx < len(gut_src) else {}
        src_name = src_item.get("name", "")
        src_info = src_item.get("info_preview", "")

        # 从源数据提取 brand
        import re
        src_brand = ""
        brand_match = re.search(r'品牌\s*:?\s*([^\n]+)', src_info)
        if brand_match:
            src_brand = brand_match.group(1).strip()

        # 提取 origin
        src_origin = ""
        region_match = re.search(r'(?:原产国|出货地|Region of Origin)\s*:?\s*([^\n]+)', src_info)
        if region_match:
            src_origin = region_match.group(1).strip()[:10]

        # 提取 diets
        src_diets = []
        diet_match = re.search(r'(?:特殊饮食|Specialty Diet|饮食类型)\s*:?\s*([^\n]+)', src_info)
        if diet_match:
            diet_text = diet_match.group(1).strip()
            src_diets = [t.strip() for t in re.split(r'[,，、]', diet_text) if t.strip()][:4]

        # VL 识别
        print(f"[{i+1:2d}/{len(images)}] {img_file} ... ", end="", flush=True)
        try:
            vl_text, usage = identify_image(img_path)
            vl_fields = parse_response(vl_text)
            vl_tokens = usage.get("completion_tokens", 0)
            print(f"✅ ({vl_tokens}t) Brand={vl_fields['brand'][:20]}")

            # 合并：VL 优先，源数据补充
            brand = vl_fields["brand"] or src_brand or ""
            name = vl_fields["name"] or src_name or f"Gut Health Product {seq}"
            specs = vl_fields["specs"] or ""
            origin = vl_fields["origin"] or src_origin or ""

            # 从 name 或 specs 提取 moq 信息
            moq = 500

            entry = {
                "id": f"gut-{seq}",
                "model": f"GT-{seq}",
                "name": name,
                "category": "gut",
                "image": f"/assets/images/products/gut/{seq}.webp",
                "brand": brand,
                "origin": origin,
                "specs": specs,
                "moq": moq,
                "diets": src_diets,
                "description": "",
                "tags": ["gut"],
                "_vl_raw": vl_text,
                "_src_name": src_name,
                "_vl_brand": vl_fields["brand"],
                "_vl_name": vl_fields["name"],
                "_vl_specs": vl_fields["specs"],
                "_vl_origin": vl_fields["origin"],
                "_src_brand": src_brand,
            }
            results.append(entry)

            # Rate limit
            time.sleep(0.5)

        except Exception as e:
            print(f"❌ {e}")
            errors.append({"seq": seq, "file": img_file, "error": str(e)})
            # 用源数据兜底
            entry = {
                "id": f"gut-{seq}",
                "model": f"GT-{seq}",
                "name": src_name or f"Gut Health Product {seq}",
                "category": "gut",
                "image": f"/assets/images/products/gut/{seq}.webp",
                "brand": src_brand,
                "origin": src_origin,
                "specs": "",
                "moq": 500,
                "diets": src_diets,
                "description": "",
                "tags": ["gut"],
                "_vl_raw": "",
                "_src_name": src_name,
            }
            results.append(entry)

    # 清理内部字段，只保留标准字段
    clean_results = []
    for r in results:
        clean = {k: v for k, v in r.items() if not k.startswith("_")}
        clean_results.append(clean)

    # 输出
    out_path = "/Users/chee/Projects/BrewYuKoLi/src/assets/data/gut-products.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(clean_results, f, ensure_ascii=False, indent=2)

    # 同时输出带 debug 字段的版本
    debug_path = "/Users/chee/Projects/BrewYuKoLi/src/assets/data/gut-products.debug.json"
    with open(debug_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done: {len(clean_results)} products")
    print(f"   Clean: {out_path}")
    print(f"   Debug: {debug_path}")
    if errors:
        print(f"   Errors: {len(errors)}")

    # 统计
    brand_count = {}
    for r in clean_results:
        b = r.get("brand", "").strip()
        if b:
            brand_count[b] = brand_count.get(b, 0) + 1
    print(f"\nBrand distribution:")
    for b, c in sorted(brand_count.items(), key=lambda x: -x[1]):
        print(f"  {b}: {c}")

if __name__ == "__main__":
    main()
