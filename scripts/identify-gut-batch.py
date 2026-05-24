#!/usr/bin/env python3
"""批量识别 gut 图片 - 分批执行（每批 10 张）"""
import json, base64, urllib.request, time, os, sys, re

API_KEY = "sk-tmuyiqvucrmlidhzhrzibeqbihivoddfhcgvvjseiozaxwwu"
BASE_URL = "https://api.siliconflow.cn/v1"
MODEL = "Qwen/Qwen3-VL-32B-Instruct"
IMG_DIR = "/Users/chee/Projects/BrewYuKoLi/src/assets/images/products/gut"
SRC_JSON = "/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json"

PROMPT = """/no_think
Identify this product from packaging. Return EXACTLY in this format, no extra text:
Brand: [brand name, empty if not visible]
Name: [full product name as shown on packaging]
Specs: [weight/volume/quantity/servings]
Origin: [country code or name, empty if not visible]"""

def identify_image(img_path):
    with open(img_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()
    ext = os.path.splitext(img_path)[1].lower()
    mime = "image/png" if ext == ".png" else "image/jpeg" if ext in (".jpg", ".jpeg") else "image/webp"
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{img_b64}"}},
            {"type": "text", "text": PROMPT}
        ]}],
        "max_tokens": 150
    }
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        return result["choices"][0]["message"]["content"].strip()

def parse_response(text):
    fields = {"brand": "", "name": "", "specs": "", "origin": ""}
    for line in text.split("\n"):
        line = line.strip()
        for key in fields:
            if line.lower().startswith(key + ":"):
                fields[key] = line.split(":", 1)[1].strip()
                break
    return fields

# 加载源数据
with open(SRC_JSON) as f:
    gut_src = json.load(f).get("🔥肠道健康线", [])

# 已有的结果
done_path = "/Users/chee/Projects/BrewYuKoLi/src/assets/data/gut-products.debug.json"
existing_results = []
if os.path.exists(done_path):
    with open(done_path) as f:
        existing_results = json.load(f)
    print(f"Loaded {len(existing_results)} existing results")

# 已完成的 seq
done_seqs = set()
for r in existing_results:
    m = re.match(r"gut-(\d+)", r.get("id", ""))
    if m:
        done_seqs.add(int(m.group(1)))

# 获取所有图片
images = sorted([f for f in os.listdir(IMG_DIR) if f.endswith((".webp", ".png", ".jpg", ".jpeg"))])

# 过滤未完成的
todo = []
for img_file in images:
    seq = int(os.path.splitext(img_file)[0])
    if seq not in done_seqs:
        todo.append((seq, img_file))

print(f"Todo: {len(todo)} images remaining")
if not todo:
    print("All done!")
    sys.exit(0)

# 每批数量
BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 10
todo = todo[:BATCH]

for seq, img_file in todo:
    img_path = os.path.join(IMG_DIR, img_file)
    src_idx = seq - 1
    src_item = gut_src[src_idx] if src_idx < len(gut_src) else {}
    src_name = src_item.get("name", "")
    src_info = src_item.get("info_preview", "")

    src_brand = ""
    m = re.search(r'品牌\s*:?\s*([^\n]+)', src_info)
    if m: src_brand = m.group(1).strip()

    src_origin = ""
    m = re.search(r'(?:原产国|出货地|Region of Origin)\s*:?\s*([^\n]+)', src_info)
    if m: src_origin = m.group(1).strip()[:10]

    src_diets = []
    m = re.search(r'(?:特殊饮食|Specialty Diet|饮食类型)\s*:?\s*([^\n]+)', src_info)
    if m:
        src_diets = [t.strip() for t in re.split(r'[,，、]', m.group(1).strip()) if t.strip()][:4]

    print(f"[gut-{seq:03d}] {img_file} ... ", end="", flush=True)
    try:
        vl_text = identify_image(img_path)
        vl = parse_response(vl_text)
        print(f"✅ Brand={vl['brand'][:25]}")
    except Exception as e:
        vl = {"brand": "", "name": "", "specs": "", "origin": ""}
        print(f"❌ {e}")

    brand = vl["brand"] or src_brand or ""
    name = vl["name"] or src_name or f"Gut Health Product {seq}"
    specs = vl["specs"] or ""
    origin = vl["origin"] or src_origin or ""

    entry = {
        "id": f"gut-{seq:03d}",
        "model": f"GT-{seq:03d}",
        "name": name,
        "category": "gut",
        "image": f"/assets/images/products/gut/{seq:03d}.webp",
        "brand": brand,
        "origin": origin,
        "specs": specs,
        "moq": 500,
        "diets": src_diets,
        "description": "",
        "tags": ["gut"],
        "_vl_raw": vl_text if vl.get("brand") or vl.get("name") else "",
        "_src_name": src_name,
    }
    existing_results.append(entry)
    time.sleep(0.3)

# 排序并保存
existing_results.sort(key=lambda x: x["id"])
with open(done_path, "w", encoding="utf-8") as f:
    json.dump(existing_results, f, ensure_ascii=False, indent=2)

# 保存 clean 版本
clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in existing_results]
clean_path = "/Users/chee/Projects/BrewYuKoLi/src/assets/data/gut-products.json"
with open(clean_path, "w", encoding="utf-8") as f:
    json.dump(clean, f, ensure_ascii=False, indent=2)

print(f"\n✅ Batch done. Total: {len(clean)} products")
print(f"   Remaining: {41 - len(clean)}")
