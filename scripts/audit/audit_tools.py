#!/usr/bin/env python3
"""BrewYuKoLi 全量审计工具集"""
import os, sys, re, json, glob
from collections import defaultdict

BASE = os.path.join(os.path.dirname(__file__), '..', '..')
PAGES_DIR = os.path.join(BASE, 'src', 'pages')
SRC_DIR = os.path.join(BASE, 'src')
LANG_DIR = os.path.join(BASE, 'src', 'assets', 'lang')

def get_all_routes():
    routes = {}
    for root, dirs, files in os.walk(PAGES_DIR):
        pc = mobile = tablet = None
        for f in files:
            if f == 'index-pc.html': pc = os.path.join(root, f)
            elif f == 'index-mobile.html': mobile = os.path.join(root, f)
            elif f == 'index-tablet.html': tablet = os.path.join(root, f)
        rel = os.path.relpath(root, PAGES_DIR)
        if rel != '.' and (pc or mobile or tablet):
            routes[rel] = {'pc': pc, 'mobile': mobile, 'tablet': tablet}
    return routes

def get_all_html_files():
    return glob.glob(os.path.join(PAGES_DIR, '**', 'index-*.html'), recursive=True)

def scan_orphans():
    routes = get_all_routes()
    html_files = get_all_html_files() + [os.path.join(BASE, 'src', 'index.html')]
    
    all_links = set()
    link_pats = [
        r'href\s*=\s*["\x27]([^"\x27]*)["\x27]',
        r"location\.href\s*=\s*['\"]([^'\"]+)['\"]",
        r'href:\s*["\x27]([^"\x27]*)["\x27]',
        r'slug:\s*["\x27]([^"\x27]*)["\x27]',
    ]
    
    for f in html_files:
        try:
            with open(f) as fh:
                content = fh.read()
            for pat in link_pats:
                for m in re.finditer(pat, content):
                    all_links.add(m.group(1).strip())
        except: pass
    
    # Also check site.config.js
    sc = os.path.join(BASE, 'src', 'site.config.js')
    if os.path.exists(sc):
        with open(sc) as f:
            cfg = f.read()
        for pat in [r'href:\s*["\x27]([^"\x27]*)["\x27]', r'slug:\s*["\x27]([^"\x27]*)["\x27]']:
            for m in re.finditer(pat, cfg):
                all_links.add(m.group(1).strip())
    
    normalized = set()
    for link in all_links:
        if link and not link.startswith('#') and not link.startswith('http') and not link.startswith('mailto') and not link.startswith('tel') and not link.startswith('javascript'):
            l = link.strip('/')
            if l: normalized.add(l)
    
    orphans = []
    linked = []
    for slug in sorted(routes):
        found = False
        for link in normalized:
            if link == slug or link.startswith(slug + '/') or link.endswith('/' + slug):
                found = True
                break
        if found:
            linked.append(slug)
        else:
            orphans.append(slug)
    return orphans, linked, routes

def find_zh_data_i18n_keys():
    results = defaultdict(list)
    pat = re.compile(r'data-i18n="([^"]*)"')
    html_files = get_all_html_files() + [os.path.join(BASE, 'src', 'index.html')]
    js_files = glob.glob(os.path.join(SRC_DIR, 'assets', 'js', '**', '*.js'), recursive=True)
    
    for fpath in html_files + js_files:
        try:
            with open(fpath) as f:
                content = f.read()
            for m in pat.finditer(content):
                key = m.group(1)
                if re.search(r'[\u4e00-\u9fff]', key):
                    rel = os.path.relpath(fpath, BASE)
                    results[key].append(rel)
        except: pass
    return dict(results)

def find_uncovered_text():
    html_files = get_all_html_files() + [os.path.join(BASE, 'src', 'index.html')]
    results = defaultdict(list)
    for fpath in html_files:
        try:
            with open(fpath) as f:
                lines = f.readlines()
        except: continue
        rel = os.path.relpath(fpath, BASE)
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped: continue
            if any(s in stripped for s in ['<script', '<style', 'application/ld+json', '<!--']):
                continue
            text = re.sub(r'<[^>]+>', '', stripped).strip()
            if not text or len(text) < 3: continue
            if re.search(r'[\u4e00-\u9fff]', text):
                data_i18n_spans = re.findall(r'<span[^>]*data-i18n[^>]*>[^<]*</span>', stripped)
                if data_i18n_spans:
                    rest = stripped
                    for sp in data_i18n_spans:
                        rest = rest.replace(sp, '', 1)
                    rest_text = re.sub(r'<[^>]+>', '', rest).strip()
                    if re.search(r'[\u4e00-\u9fff]', rest_text):
                        results[rel].append((i, text[:100]))
                else:
                    results[rel].append((i, text[:100]))
    return dict(results)

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'all'
    
    if cmd in ('orphan', 'all'):
        print("=" * 60)
        print("📋 1. 孤立页面检测")
        print("=" * 60)
        orphans, linked, routes = scan_orphans()
        print(f"总路由: {len(routes)}, 有链接: {len(linked)}, 孤立: {len(orphans)}")
        if orphans:
            print("\n⚠️ 孤立页面:")
            for s in sorted(orphans):
                print(f"  {s}/")
                r = routes[s]
                for d in ['pc','mobile','tablet']:
                    if r.get(d): print(f"    {os.path.relpath(r[d], BASE)}")
        print()
    
    if cmd in ('i18n-zh-keys', 'all'):
        print("=" * 60)
        print("📋 3. 含中文的 data-i18n key")
        print("=" * 60)
        zh = find_zh_data_i18n_keys()
        print(f"含中文 key: {len(zh)} 个")
        for k, flist in sorted(zh.items()):
            print(f"  🔑 {k}")
            for f in flist[:2]:
                print(f"      {f}")
            if len(flist) > 2: print(f"      ... +{len(flist)-2}")
        print()
    
    if cmd in ('i18n-coverage', 'all'):
        print("=" * 60)
        print("📋 2. i18n 未覆盖内容")
        print("=" * 60)
        uncovered = find_uncovered_text()
        print(f"中文内容未用 data-i18n 包裹: {sum(len(v) for v in uncovered.values())} 处")
        for rel, items in sorted(uncovered.items()):
            print(f"\n  {rel}:")
            for line, txt in items[:5]:
                print(f"    L{line}: {txt[:80]}")
            if len(items) > 5:
                print(f"    ... +{len(items)-5}")
