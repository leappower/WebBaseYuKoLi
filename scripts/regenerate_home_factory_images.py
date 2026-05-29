#!/usr/bin/env python3
"""
BrewYuKoLi — 首页工厂图片重生成
场景: 先进的中国现代化冲调食品加工厂 + 东南亚用户（区分视觉）
Pipeline: DeepSeek V4 Flash (SiliconFlow) → Gemini 3 Pro (Kuai)
"""
import json, os, sys, base64, time, subprocess, re, urllib.request
from pathlib import Path

SF_KEY = os.environ.get("SILICONFLOW_API_KEY", "sk-tmuyiqvucrmlidhzhrzibeqbihivoddfhcgvvjseiozaxwwu")
KUAI_KEY = os.environ.get("KUAI_API_KEY", "sk-gX7yxSZvTRZekkduJtVPoRtwPlk1J4BMND02SUERJUXW19Uh")
PROJ = Path("/Users/chee/Projects/BrewYuKoLi")
LOG = PROJ / ".openclaw-project" / "home-image-generation-log.txt"

def log(msg):
    with open(LOG, "a") as f:
        f.write(f"{time.strftime('%H:%M:%S')} {msg}\n")
    print(msg)

# Factory images — "先进的中国现代化冲调食品加工厂" (NOT Southeast Asian)
IMAGES = [
    dict(name="hero-pc", subdir="hero", size="1024x1024",
         desc="Hero banner of a modern Chinese beverage processing factory. Ultra-modern factory floor with gleaming stainless steel blending tanks, automated filling lines, HACCP-certified clean environment, ceiling-high windows with natural light, Chinese workers in white lab coats and hairnets. The atmosphere is advanced, efficient, pristine. No Southeast Asian workers. Real photo style with professional lighting, slight industrial aesthetic, not AI-perfect symmetric, real factory details like control panels and pipes."),
    dict(name="factory-1", subdir="factory", size="1024x1024",
         desc="Exterior of a modern Chinese food processing factory in Guangzhou. Sleek contemporary architecture, large glass facade, manicured landscaping, company sign area, blue sky with white clouds, clean parking area. The building looks advanced and professional. Real estate photography style, natural daylight, slight lens flare. Not Southeast Asian — this is a modern Chinese industrial park."),
    dict(name="factory-2", subdir="factory", size="1024x1024",
         desc="Interior of a modern Chinese automated production line. State-of-the-art filling and packaging machinery, stainless steel pipes and tanks, robotic arms, HACCP compliance, digital control panels, Chinese QC technicians in cleanroom suits monitoring tablets. Bright white LED lighting, clean tile floors, organized workflow. Real industrial photography, low angle showing scale."),
    dict(name="factory-3", subdir="factory", size="1024x1024",
         desc="High-tech warehouse and raw material storage in modern Chinese beverage factory. Automated guided vehicles (AGVs) transporting pallets, tall metal shelving, FIFO rotation system, climate-controlled environment. Chinese warehouse operators in uniform vests. Natural cool white light, organized chaos aesthetic. Real documentary style, not CGI-perfect."),
    dict(name="factory-4", subdir="factory", size="1024x1024",
         desc="Advanced quality control and R&D laboratory in a Chinese beverage factory. Modern analytical instruments (HPLC, spectrophotometers), lab benches with beakers and samples, Chinese scientists in white lab coats examining formulas. Clean, bright, professional R&D environment. Real photojournalism style."),
]

ZONAL_PROMPT = """You are an AI image prompt optimization expert. Generate high-quality image prompts.

Analyze the image request, then output:

## FINAL PROMPT
(English only, directly usable for image generation. Include all visual details including lighting, composition, mood, colors, textures.)
"""

def generate_prompt(desc):
    url = "https://api.siliconflow.cn/v1/chat/completions"
    payload = json.dumps({
        "model": "deepseek-ai/DeepSeek-V4-Flash",
        "messages": [
            {"role": "system", "content": ZONAL_PROMPT},
            {"role": "user", "content": f"Generate a photo-realistic image prompt for a B2B website. Scene: {desc}\n\nKey constraints:\n- This is a CHINESE modern factory, NOT Southeast Asian\n- Chinese workers (not Southeast Asian)\n- Real photo feel, NOT AI-perfect symmetric\n- No kitchen/cooking/restaurant terminology\n- Real factory details: pipes, control panels, some organized clutter\n- Industrial aesthetic with modern cleanliness\n- 1024x1024 square format"}
        ],
        "max_tokens": 1024,
        "temperature": 0.7
    }).encode()
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {SF_KEY}"})
    for attempt in range(3):
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            data = json.loads(resp.read())
            text = data["choices"][0]["message"]["content"]
            if "FINAL PROMPT" in text:
                text = text.split("FINAL PROMPT")[-1]
            text = text.replace("```", "").strip().lstrip("#").strip()
            for prefix in ["Final Prompt:", "final prompt:", "Prompt:", "prompt:"]:
                if text.startswith(prefix):
                    text = text[len(prefix):].strip()
            return text
        except Exception as e:
            log(f"  Prompt gen attempt {attempt+1} failed: {e}")
            time.sleep(2)
    return None

def generate_image(prompt):
    url = "https://api.kuai.host/v1/chat/completions"
    payload = json.dumps({
        "model": "gemini-3-pro-image-preview",
        "messages": [{"role": "user", "content": f"{prompt}\n\n1024x1024 square, no text/labels in image."}],
        "max_tokens": 8192
    }).encode()
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {KUAI_KEY}"})
    for attempt in range(3):
        try:
            resp = urllib.request.urlopen(req, timeout=120)
            data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"]
            m = re.search(r'base64,([A-Za-z0-9+/=]+)', content)
            if m:
                return base64.b64decode(m.group(1))
            m = re.search(r'([A-Za-z0-9+/=]{100,})', content)
            if m:
                return base64.b64decode(m.group(1))
            log(f"  No base64 in response")
            return None
        except Exception as e:
            log(f"  Image gen attempt {attempt+1} failed: {e}")
            if attempt < 2:
                time.sleep(5)
    return None

def save_image(img_data, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(img_data)
    sz = path.stat().st_size
    if sz < 30000:
        log(f"  WARNING: {path.name} only {sz} bytes")
    return sz

def run():
    log("=" * 60)
    log("Home page factory image regeneration (Chinese modern factory vision)")
    log("=" * 60)
    success, failed = [], []
    for img in IMAGES:
        name = img["name"]
        log(f"\n[{name}] Generating prompt via DeepSeek-V4-Flash...")
        prompt = generate_prompt(img["desc"])
        if not prompt:
            log(f"  FAILED to get prompt for {name}")
            failed.append(name)
            continue
        log(f"  Prompt: {prompt[:150]}...")
        log(f"[{name}] Generating image via Gemini 3 Pro...")
        img_data = generate_image(prompt)
        if not img_data:
            log(f"  FAILED to generate image for {name}")
            failed.append(name)
            continue
        out_dir = PROJ / "src" / "assets" / "images" / "oem" / img["subdir"]
        out_path = out_dir / f"{img['name']}.webp"
        sz = save_image(img_data, out_path)
        log(f"  Saved {out_path} ({sz/1024:.0f} KB)")
        success.append(str(out_path.relative_to(PROJ)))
        time.sleep(2)
    log(f"\nDone. Success: {len(success)}, Failed: {len(failed)}")
    log(json.dumps({"success": success, "failed": failed}, indent=2))

if __name__ == "__main__":
    run()
