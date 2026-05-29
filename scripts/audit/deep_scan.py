#!/usr/bin/env python3
"""增强版全量扫描 — 更深入地找孤立页面和中文key"""
import os, sys, re, json, glob
from collections import defaultdict

BASE = '/Users/chee/Projects/BrewYuKoLi'
PAGES = os.path.join(BASE, 'src', 'pages')
SRC = os.path.join(BASE, 'src')
LANG = os.path.join(BASE, 'src', 'assets', 'lang')

def all_files(ext):
    """Recursively find files"""
    for root, dirs, files in os.walk(SRC):
        for f in files:
            if f.endswith(ext):
                yield os.path.join(root, f)

# ─── 1. 完整路由清单 ──────────────────────────────────────────
all_routes = {}
for root, dirs, files in os.walk(PAGES):
    rel = os.path.relpath(root, PAGES)
    if rel == '.':
        continue
    htmls = [f for f in files if f.endswith('.html')]
    if htmls:
        all_routes[rel] = {
            'files': [os.path.join(root, f) for f in htmls],
            'devices': sorted(set(f.split('.')[0].replace('index-','') or 'all' for f in htmls))
        }

# ─── 2. 全量链接收集 ──────────────────────────────────────────
all_links = set()
all_slugs = set()

# 收集所有文件（HTML + JS）
scan_files = list(all_files('.html')) + list(all_files('.js'))

for fpath in scan_files:
    try:
        with open(fpath) as f:
            content = f.read()
    except:
        continue
    
    # href 属性
    for m in re.finditer(r'''href\s*=\s*["']([^"']*)["']''', content):
        all_links.add(m.group(1))
    
    # location.href 或 window.location =
    for m in re.finditer(r"""location\.href\s*=\s*['"]([^'"]+)['"]""", content):
        all_links.add(m.group(1))
    
    # slug/href in JS config objects
    for pat in [r'''slug:\s*["']([^"']*)["']''', r'''href:\s*["']([^"']*)["']''',
                r'''path:\s*["']([^"']*)["']''', r'''to:\s*["']([^"']*)["']''',
                r"""redirectTo\s*[:=]\s*['"]([^'"]*)['"]"""]:
        for m in re.finditer(pat, content):
            all_slugs.add(m.group(1))

# 也收集所有 JS 文件中的 link-like 字符串
for fpath in all_files('.js'):
    try:
        with open(fpath) as f:
            content = f.read()
    except:
        continue
    for m in re.finditer(r"""['"](/[a-z0-9_/-]+/)['"]""", content):
        all_links.add(m.group(1))

# ─── 3. 标准化链接 ────────────────────────────────────────────
def normalize(url):
    """Extract route slug from a URL"""
    url = url.strip()
    if not url or url.startswith('#') or url.startswith('http') or url.startswith('mailto') or url.startswith('tel') or url.startswith('javascript') or url == '/' or url == '':
        return None
    url = url.strip('/')
    if url.startswith('index') or url.startswith('?'):
        return None
    # Handle anchor links like /manufacturing/#bases → manufacturing
    url = url.split('#')[0]
    # Handle query params
    url = url.split('?')[0]
    if not url:
        return None
    return url

normalized_links = set()
for link in all_links:
    n = normalize(link)
    if n:
        normalized_links.add(n)
for slug in all_slugs:
    n = normalize(slug)
    if n:
        normalized_links.add(n)

# ─── 4. 判断孤立页面 ──────────────────────────────────────────
orphans = []
linked = []
for route in sorted(all_routes):
    is_linked = False
    for link in normalized_links:
        # Check exact match or prefix match
        if link == route or link.startswith(route + '/') or route.startswith(link + '/') or route.startswith(link):
            is_linked = True
            break
    if is_linked:
        linked.append(route)
    else:
        orphans.append(route)

print("=" * 70)
print(f"📋 总路由: {len(all_routes)}")
print(f"📎 总链接(去重后): {len(normalized_links)}")
print(f"✅ 有引用: {len(linked)}")
print(f"⚠️ 孤立页面: {len(orphans)}")
print()

if orphans:
    print("=" * 70)
    print("⚠️  孤立页面清单:")
    print("=" * 70)
    for r in sorted(orphans):
        print(f"\n  📁 {r}/")
        for f in all_routes[r]['files']:
            print(f"      {os.path.relpath(f, BASE)}")

print()
print("=" * 70)
print("✅ 有引用的页面:")
print("=" * 70)
for r in sorted(linked):
    print(f"  ✓ {r}/")

# ─── 5. 中文 data-i18n key 扫描（增强版）───────────────────────
print()
print("=" * 70)
print("📋 含中文的 data-i18n key（增强扫描）")
print("=" * 70)

zh_keys = defaultdict(list)
pat = re.compile(r'data-i18n="([^"]*)"')

# 扫描所有 HTML 和 JS 文件
all_scan = list(all_files('.html')) + list(all_files('.js'))
for fpath in all_scan:
    try:
        with open(fpath) as f:
            content = f.read()
        for m in pat.finditer(content):
            key = m.group(1)
            if re.search(r'[\u4e00-\u9fff]', key):
                rel = os.path.relpath(fpath, BASE)
                if rel not in [k[0] for k in zh_keys.get(key, [])]:
                    zh_keys[key].append(rel)
    except:
        pass

print(f"\n含中文 key 总数: {len(zh_keys)} 个")
for k in sorted(zh_keys):
    files = zh_keys[k]
    print(f"\n  🔑 {k} ({len(files)}个文件)")
    for f in files[:3]:
        print(f"      {f}")
    if len(files) > 3:
        print(f"      ... 还有 {len(files)-3} 个")

# ─── 6. 直接在 HTML/JS 中找中文的 href/link 路径 ─────────────
print()
print("=" * 70)
print("📋 HTML 中可能指向旧厨具页面的路径")
print("=" * 70)
old_kitchen_keywords = ['kitchen', 'cooker', 'robot', 'chef', 'kitchenyukoli', 
                        'restaurant', 'esl-', '-induction', 'fryer', 'steamer',
                        'oven', 'grill', 'commercial-kitchen', 'food-factory',
                        'applications/', '/cases/', '/contact/partner',
                        'support-install', 'support-engineer', 'spare-parts',
                        'warranty', 'training', 'overview', 'faq',
                        'contact-partner']

for fpath in all_files('.html'):
    try:
        with open(fpath) as f:
            content = f.read()
    except:
        continue
    for m in re.finditer(r'''href\s*=\s*["']([^"']*)["']''', content):
        url = m.group(1)
        for kw in old_kitchen_keywords:
            if kw in url.lower():
                rel = os.path.relpath(fpath, BASE)
                print(f"  {rel}: href=\"{url}\" ← 可能厨具路径")
                break
