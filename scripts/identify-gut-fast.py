#!/usr/bin/env python3
"""
批量识别 gut 图片 - Qwen3-VL-32B，快速版
失败用源数据兜底，0 等待
"""
import json, base64, urllib.request, os, sys, re, time

API_KEY = "***"
BASE_URL = "https://api.siliconflow.cn/v1"
MODEL = "Qwen/Qwen3-VL-32B-Instruct"
IMG_DIR = "/Users/chee/Projects/BrewYuKoLi/src/assets/images/products/gut"
SRC_JSON = "/Volumes/Chee_2/OpenClaw/冲调产品画册catalog_v4/product_catalog_data.json"
DEBUG_PATH = "/Users/chee/Projects/BrewYuKoLi/src/assets/data/gut-products.debug.json"
CLEAN_PATH = "/Users/chee/Projects/BrewYuKoLi/src/assets/data/gut-products.json"

PROMPT = "/no_think\nProduct info from packaging. Return ONLY:\nBrand: [brand]\nName: [product name]\nSpecs: [weight/qty]\nOrigin: [country]"

def identify(img_path):
    with open(img_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    ext = os.path.splitext(img_path)[1].lower()
    mime = {"png":"image/png","jpg":"image/jpeg","jpeg":"image/jpeg"}.get(ext,"image/webp")
    payload = {
        "model": MODEL,
        "messages": [{"role":"user","content":[
            {"type":"image_url","image_url":{"url":f"data:{mime};base64,{b64}"}},
            {"type":"text","text":PROMPT}
        ]}],
        "max_tokens": 120
    }
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Authorization":f"Bearer {API_KEY}","Content-Type":"application/json"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        r = json.loads(resp.read())
        return r["choices"][0]["message"]["content"].strip()

def parse(text):
    f = {"brand":"","name":"","specs":"","origin":""}
    for line in text.split("\n"):
        line = line.strip()
        for k in f:
            if line.lower().startswith(k+":"):
                f[k] = line.split(":",1)[1].strip()
    return f

# Load source data
with open(SRC_JSON) as fh:
    gut_src = json.load(fh).get("🔥肠道健康线", [])

# Load existing
results = []
if os.path.exists(DEBUG_PATH):
    with open(DEBUG_PATH) as fh:
        results = json.load(fh)
done = set(int(re.match(r"gut-(\d+)", r["id"]).group(1)) for r in results)

images = sorted(f for f in os.listdir(IMG_DIR) if f.endswith((".webp",".png",".jpg",".jpeg")))
todo = [(int(os.path.splitext(f)[0]), f) for f in images if int(os.path.splitext(f)[0]) not in done]

if not todo:
    print(f"All {len(results)} done!")
    sys.exit(0)

print(f"Existing: {len(results)}, Todo: {len(todo)}")

for seq, fname in todo:
    idx = seq - 1
    src = gut_src[idx] if idx < len(gut_src) else {}
    src_name = src.get("name","")
    src_info = src.get("info_preview","")
    
    src_brand = (re.search(r'品牌\s*:?\s*([^\n]+)', src_info) or [0,""])[1].strip()
    src_origin = (re.search(r'(?:原产国|出货地|Region of Origin)\s*:?\s*([^\n]+)', src_info) or [0,""])[1].strip()[:10]
    src_diets_raw = (re.search(r'(?:特殊饮食|Specialty Diet|饮食类型)\s*:?\s*([^\n]+)', src_info) or [0,""])[1]
    src_diets = [t.strip() for t in re.split(r'[,，、]', src_diets_raw) if t.strip()][:4]

    vl_text, vl = "", {"brand":"","name":"","specs":"","origin":""}
    try:
        vl_text = identify(os.path.join(IMG_DIR, fname))
        vl = parse(vl_text)
        status = "✅"
    except Exception as e:
        status = f"❌ {str(e)[:30]}"

    brand = vl["brand"] or src_brand or ""
    name = vl["name"] or src_name or f"Gut Health Product {seq:03d}"
    specs = vl["specs"] or ""
    origin = vl["origin"] or src_origin or ""

    print(f"[{status}] gut-{seq:03d} | {vl['brand'][:20]:20s} | {name[:50]}")

    results.append({
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
        "_vl": vl_text, "_src": src_name
    })

results.sort(key=lambda x: x["id"])

# Save debug + clean
with open(DEBUG_PATH, "w") as fh:
    json.dump(results, fh, ensure_ascii=False, indent=2)
clean = [{k:v for k,v in r.items() if not k.startswith("_")} for r in results]
with open(CLEAN_PATH, "w") as fh:
    json.dump(clean, fh, ensure_ascii=False, indent=2)

print(f"\nDone: {len(clean)}/41")
