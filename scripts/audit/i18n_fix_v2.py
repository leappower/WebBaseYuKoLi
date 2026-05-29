#!/usr/bin/env python3
"""
驿使 v2 — 修正版 i18n 文本覆盖修复
关键规则：只包装「第一个子span之后」的文本段
保持第一个文本节点裸露（父级 data-i18n 需要它来正常工作）
"""
import os, re, json, shutil, glob
from datetime import datetime
from collections import defaultdict

BASE = '/Users/chee/Projects/BrewYuKoLi'
PAGES = os.path.join(BASE, 'src', 'pages')
LANG_DIR = os.path.join(BASE, 'src', 'assets', 'lang')
BACKUP_DIR = os.path.join(BASE, 'backup', f'i18n_fix_v2_{datetime.now().strftime("%Y%m%d_%H%M%S")}')

def ensure_backup(fpath):
    rel = os.path.relpath(fpath, BASE)
    dest = os.path.join(BACKUP_DIR, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(fpath, dest)

def scan_and_fix():
    """Scan all HTML, find compound elements, wrap only tail text segments."""
    all_modifications = []
    all_text_segments = []
    
    for root, dirs, files in os.walk(PAGES):
        for fname in sorted(files):
            if not fname.endswith('.html'):
                continue
            fpath = os.path.join(root, fname)
            rel = os.path.relpath(fpath, BASE)
            
            with open(fpath) as f:
                content = f.read()
            
            # Backup
            ensure_backup(fpath)
            new_content = content
            file_mods = []
            
            # Find data-i18n parent elements that contain child data-i18n spans
            parent_pat = re.compile(r'(<(\w+)[^>]*data-i18n="([^"]*)"[^>]*>)')
            
            for pm in parent_pat.finditer(content):
                tag_start = pm.group(1)
                tag_name = pm.group(2)
                parent_key = pm.group(3)
                start_pos = pm.start()
                inner_start = start_pos + len(tag_start)
                
                # Find matching closing tag
                depth = 1
                pos = inner_start
                inner_end = None
                in_script = False
                
                while depth > 0 and pos < len(content):
                    if content[pos:pos+9] == '</script>' and in_script:
                        in_script = False
                        pos += 9; continue
                    if content[pos:pos+8] in ('<script ', '<script>'):
                        in_script = True
                        pos += 1; continue
                    if not in_script:
                        om = re.match(r'<(\w+)[^>]*>', content[pos:])
                        if om and not om.group(1).startswith('/'):
                            depth += 1
                            pos += om.end(); continue
                        cm = re.match(r'</(\w+)>', content[pos:])
                        if cm:
                            depth -= 1
                            if depth == 0:
                                inner_end = pos
                                break
                            pos += cm.end(); continue
                    pos += 1
                
                if inner_end is None:
                    continue
                
                inner_html = new_content[inner_start:inner_end]
                
                # Find ALL child data-i18n spans
                child_spans = list(re.finditer(r'<span[^>]*data-i18n="([^"]*)"[^>]*>[^<]*</span>', inner_html))
                if not child_spans:
                    continue
                
                # Find text segments AFTER the last child span
                last_span_end = child_spans[-1].end()
                tail_html = inner_html[last_span_end:]
                
                # Find ALL text segments that are between spans (not just tail)
                text_segments = []
                search_pos = 0
                
                for cs in child_spans:
                    # Text BEFORE this span (includes text before first span and text between spans)
                    if search_pos < cs.start():
                        text_between = inner_html[search_pos:cs.start()].strip()
                        if text_between:
                            text_segments.append((search_pos, cs.start(), text_between, True))
                    # Inside span - skip
                    close = inner_html.find('</span>', cs.end())
                    if close != -1:
                        search_pos = close + 7
                    else:
                        search_pos = cs.end()
                
                # Text after last span
                if search_pos < len(inner_html):
                    tail = inner_html[search_pos:].strip()
                    if tail:
                        text_segments.append((search_pos, len(inner_html), tail, False))
                
                if not text_segments:
                    continue  # All text inside spans, OK
                
                # ═══ Determine which segments to wrap ═══
                # Segment BEFORE first span: keep as-is (covered by parent's translation)
                # Segments AFTER spans: wrap in new data-i18n spans
                
                segments_to_wrap = []
                for seg_idx, (seg_start, seg_end, text, is_between) in enumerate(text_segments):
                    if is_between and seg_idx == 0:
                        # Text before first span — keep uncovered (parent handles it)
                        continue
                    segments_to_wrap.append((seg_start, seg_end, text))
                
                if not segments_to_wrap:
                    continue  # Only the first segment, which is already covered
                
                # Wrap each uncovered segment
                for wrap_idx, (seg_start, seg_end, text) in enumerate(segments_to_wrap):
                    new_key = f"{parent_key}_seg{wrap_idx + 1}"
                    
                    # Apply modification to new_content (using absolute position)
                    abs_start = inner_start + seg_start
                    abs_end = inner_start + seg_end
                    
                    old_text = new_content[abs_start:abs_end]
                    new_wrapped = f'<span data-i18n="{new_key}">{old_text}</span>'
                    new_content = new_content[:abs_start] + new_wrapped + new_content[abs_end:]
                    
                    file_mods.append((new_key, text))
                    all_text_segments.append((new_key, text))
            
            if file_mods:
                with open(fpath, 'w') as f:
                    f.write(new_content)
                all_modifications.append((rel, file_mods))
    
    return all_modifications, all_text_segments

def update_json(all_text_segments):
    """Add new keys to all translation files."""
    new_keys = list(set(all_text_segments))
    
    for fname in sorted(os.listdir(LANG_DIR)):
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(LANG_DIR, fname)
        
        ensure_backup(fpath)
        with open(fpath) as f:
            data = json.load(f)
        
        needs_update = False
        for key, text in new_keys:
            if key not in data:
                data[key] = text
                needs_update = True
        
        if needs_update:
            with open(fpath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    
    return {k: t for k, t in new_keys}

def main():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    print("=" * 60)
    print("📋 全量扫描（仅尾段文本包裹）")
    print("=" * 60)
    
    modifications, text_segments = scan_and_fix()
    
    total_texts = len(text_segments)
    print(f"  改造文件: {len(modifications)}")
    print(f"  新增 key: {total_texts}")
    print()
    
    for rel, mods in modifications:
        print(f"  📄 {rel} ({len(mods)}个)")
        for key, text in mods:
            print(f"    🔑 {key}: \"{text[:70]}\"")
    
    print()
    print("=" * 60)
    print("🔧 更新翻译 JSON")
    print("=" * 60)
    
    new_keys = update_json(text_segments)
    print(f"  ✅ {len(new_keys)} 个新 key 已写入所有语种")
    print(f"  备份: {BACKUP_DIR}")
    
    # Verify one example
    print()
    print("=" * 60)
    print("✅ 校验: home_hero_desc 结构")
    print("=" * 60)
    with open(os.path.join(PAGES, 'home', 'index-pc.html')) as f:
        home = f.read()
    # Extract the home_hero_desc paragraph
    m = re.search(r'data-i18n="home_hero_desc"[^>]*>.*?</p>', home, re.DOTALL)
    if m:
        inner = m.group(0)
        # Count text nodes
        text_nodes = re.findall(r'>([^<]+)<', inner)
        bare_text = [t.strip() for t in text_nodes if t.strip() and not t.strip().startswith('<span')]
        print(f"  裸露文本段: {len(bare_text)}")
        for t in bare_text:
            print(f"    \"{t[:60]}\"")
        if len(bare_text) <= 1:
            print("  ✅ 头段裸露（可被父级翻译覆盖）+ 后续已包裹")
        else:
            print(f"  ⚠️ {len(bare_text)} 处裸露文本未包裹")

if __name__ == '__main__':
    main()
