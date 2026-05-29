#!/usr/bin/env python3
"""
Fix about/ pages — wrap uncovered tail text segments in data-i18n spans.
Critical: avoid position shifts by processing segments right-to-left.
"""
import re, json, os

def fix_file(fpath):
    with open(fpath) as f:
        c = f.read()
    original = c
    
    # Find all compound elements
    fixes = []  # (abs_pos_start, abs_pos_end, new_key, span_content)
    
    for m in re.finditer(r'<(\w+)([^>]*data-i18n="([^"]+)"[^>]*)>(.*?)</\1>', c, re.DOTALL):
        parent_key = m.group(3)
        inner = m.group(4)
        abs_inner_start = m.start() + len(m.group(1)) + len(m.group(2)) + 1
        
        child_spans = list(re.finditer(r'<span[^>]*data-i18n="[^"]*"[^>]*>[^<]*</span>', inner))
        if not child_spans:
            continue
        
        # Map text segments
        pos = 0
        seg_n = 0
        for i, cs in enumerate(child_spans):
            if pos < cs.start():
                text = inner[pos:cs.start()]
                if text.strip():
                    if i > 0:  # After first span → uncovered
                        fixes.append((abs_inner_start + pos, abs_inner_start + cs.start(), f"{parent_key}_seg{seg_n+1}", text))
                        seg_n += 1
            close = inner.find('</span>', cs.end())
            if close != -1:
                pos = close + 7
            else:
                pos = cs.end()
        
        # Tail after last span
        if pos < len(inner):
            text = inner[pos:]
            if text.strip():
                fixes.append((abs_inner_start + pos, abs_inner_start + len(inner), f"{parent_key}_seg{seg_n+1}", text))
                seg_n += 1
    
    if not fixes:
        return []
    
    # Apply right-to-left
    fixes.sort(key=lambda x: -x[0])
    for abs_start, abs_end, new_key, content in fixes:
        old = c[abs_start:abs_end]
        c = c[:abs_start] + f'<span data-i18n="{new_key}">{old}</span>' + c[abs_end:]
    
    with open(fpath, 'w') as f:
        f.write(c)
    
    return [(k, c[max(0,abs_start-20):abs_end+20]) for abs_start, abs_end, k, _ in fixes]


BASE = '/Users/chee/Projects/BrewYuKoLi'
all_new_keys = []

for name in ['index-mobile.html', 'index-pc.html', 'index-tablet.html']:
    fpath = f'{BASE}/src/pages/about/{name}'
    result = fix_file(fpath)
    keys_added = list(set(k for k, _ in result))
    if keys_added:
        print(f'  ✅ {name}: {len(keys_added)} new keys: {keys_added}')
        all_new_keys.extend(result)

# Add new keys to all lang files
if all_new_keys:
    # Extract unique key-value pairs
    key_values = {}
    for k, context in all_new_keys:
        if k not in key_values:
            # Extract the text from the span
            m = re.search(r'<span data-i18n="' + re.escape(k) + r'">(.*?)</span>', context)
            if m:
                key_values[k] = m.group(1)
            else:
                key_values[k] = k  # fallback
    
    lang_dir = f'{BASE}/src/assets/lang'
    for fname in sorted(os.listdir(lang_dir)):
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(lang_dir, fname)
        with open(fpath) as f:
            data = json.load(f)
        
        added = 0
        for k, v in key_values.items():
            if k not in data:
                data[k] = v
                added += 1
        
        if added:
            with open(fpath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f'  📝 {fname}: +{added} keys')
    
    print(f'\n  ✅ Total: {len(key_values)} new keys across all langs')

# Verify no broken tags
print('\n=== 验证 ===')
for name in ['index-mobile.html', 'index-pc.html', 'index-tablet.html']:
    fpath = f'{BASE}/src/pages/about/{name}'
    with open(fpath) as f:
        c = f.read()
    if '</span<span' in c:
        print(f'  ❌ {name}: BROKEN TAG!')
    else:
        print(f'  ✅ {name}: clean')
