#!/usr/bin/env python3
"""
Generate 5 non-product images for solutions, catalog, videos, and contact pages.
Pipeline: DeepSeek V4 Flash (SiliconFlow) → Gemini 3 Pro (Kuai)
"""
import json, os, base64, time, re, urllib.request
from pathlib import Path

SF_KEY = os.environ.get("SILICONFLOW_API_KEY", "sk-tmuyiqvucrmlidhzhrzibeqbihivoddfhcgvvjseiozaxwwu")
KUAI_KEY = os.environ.get("KUAI_API_KEY", "sk-gX7yxSZvTRZekkduJtVPoRtwPlk1J4BMND02SUERJUXW19Uh")
PROJ = Path("/Users/chee/Projects/BrewYuKoLi")

IMAGES = [
    dict(name="oem-hero", out="src/assets/images/oem/solutions/oem-hero.webp",
         desc="Hero banner of a modern Chinese OEM beverage powder contract manufacturing facility. Wide-angle view of clean automated production line, Chinese technicians in white lab coats monitoring digital control panels, stainless steel blending tanks, HACCP-compliant environment, bright LED lighting. Professional B2B photography style. Chinese workers, NOT Southeast Asian. Real factory details."),
    dict(name="obm-hero", out="src/assets/images/oem/solutions/obm-hero.webp",
         desc="Modern brand-building and product development scene. Chinese marketing and design team in a bright contemporary meeting room, mood boards and product packaging mockups on table, looking at product samples, digital screens showing brand concepts. Modern Chinese creative agency atmosphere. Real business photography, natural window light."),
    dict(name="catalog-hero", out="src/assets/images/oem/resources/catalog-hero.webp",
         desc="Professional product catalog layout on a modern wooden desk. Open catalog pages showing beverage powder product photography with forest green #2E7D32 brand accents, coffee and tea product images, a smartphone and coffee cup beside the catalog, soft natural window light. Clean professional flat lay composition. Real lifestyle photography, not AI-perfect."),
    dict(name="videos-hero", out="src/assets/images/oem/resources/videos-hero.webp",
         desc="Professional video production scene inside a modern Chinese beverage factory. Professional camera and lighting equipment set up on production floor, Chinese crew filming the automated line, B-roll setup, modern industrial background with processing equipment. Behind-the-scenes documentary style. Real, slightly candid photography."),
    dict(name="contact-partner-tour", out="src/assets/images/contact-partner-tour.webp",
         desc="Modern Chinese beverage factory reception and meeting area. Clean glass-walled conference room, YuKoLi branding on wall, professional reception desk with indoor plants, modern minimalist design, a Chinese sales representative welcoming visitors. Bright natural light through floor-to-ceiling windows. Professional corporate photography style."),
]

ZONAL_SYS = """You are an AI image prompt optimization expert. Generate high-quality image prompts.

Analyze the image request, then output:

## FINAL PROMPT
(English only, directly usable for image generation. Include all visual details including lighting, composition, mood, colors, textures.)"""

def gen_prompt(desc):
    url = "https://api.siliconflow.cn/v1/chat/completions"
    payload = json.dumps({
        "model": "deepseek-ai/DeepSeek-V4-Flash",
        "messages": [
            {"role": "system", "content": ZONAL_SYS},
            {"role": "user", "content": f"B2B website hero image. Scene: {desc}\n\n- Chinese workers, NOT Southeast Asian\n- Real photo feel, NOT AI-perfect\n- No kitchen/restaurant terminology\n- No real text/labels in image"}
        ],
        "max_tokens": 800, "temperature": 0.7
    }).encode()
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {SF_KEY}"})
    for a in range(3):
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            data = json.loads(resp.read())
            text = data["choices"][0]["message"]["content"]
            if "FINAL PROMPT" in text:
                text = text.split("FINAL PROMPT")[-1]
            text = text.replace("```", "").strip().lstrip("#").strip()
            for p in ["Final Prompt:", "final prompt:", "Prompt:", "prompt:"]:
                if text.startswith(p):
                    text = text[len(p):].strip()
            return text
        except Exception as e:
            print(f"  Prompt attempt {a+1}: {e}")
            time.sleep(2)
    return None

def gen_img(prompt):
    url = "https://api.kuai.host/v1/chat/completions"
    payload = json.dumps({
        "model": "gemini-3-pro-image-preview",
        "messages": [{"role": "user", "content": f"{prompt}\n\n1920x1080 landscape, no text/labels in image."}],
        "max_tokens": 8192
    }).encode()
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {KUAI_KEY}"})
    for a in range(3):
        try:
            resp = urllib.request.urlopen(req, timeout=120)
            data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"]
            m = re.search(r'base64,([A-Za-z0-9+/=]+)', content)
            if m: return base64.b64decode(m.group(1))
            m = re.search(r'([A-Za-z0-9+/=]{100,})', content)
            if m: return base64.b64decode(m.group(1))
        except Exception as e:
            print(f"  Image attempt {a+1}: {e}")
            time.sleep(5)
    return None

for img in IMAGES:
    name = img["name"]
    print(f"\n[{name}] Prompt...")
    prompt = gen_prompt(img["desc"])
    if not prompt:
        print(f"  FAILED: prompt")
        continue
    print(f"  Prompt: {prompt[:120]}...")
    print(f"  Generating...")
    data = gen_img(prompt)
    if not data:
        print(f"  FAILED: image")
        continue
    out = PROJ / img["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    sz = out.stat().st_size
    print(f"  ✅ {out.relative_to(PROJ)} ({sz/1024:.0f} KB)")
    time.sleep(2)

print("\nDone!")
