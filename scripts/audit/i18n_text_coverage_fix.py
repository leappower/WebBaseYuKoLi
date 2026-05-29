#!/usr/bin/env python3
"""
驿使 — i18n 文本覆盖修复
三阶段：扫描报告 → HTML 改造 → JSON 更新
"""
import os, re, json, shutil, glob
from datetime import datetime
from collections import defaultdict

BASE = '/Users/chee/Projects/BrewYuKoLi'
PAGES = os.path.join(BASE, 'src', 'pages')
LANG_DIR = os.path.join(BASE, 'src', 'assets', 'lang')
BACKUP_DIR = os.path.join(BASE, 'backup', f'i18n_fix_{datetime.now().strftime("%Y%m%d_%H%M%S")}')

def ensure_backup(fpath):
    """Copy file to backup before modification."""
    rel = os.path.relpath(fpath, BASE)
    dest = os.path.join(BACKUP_DIR, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(fpath, dest)

def get_text_nodes(parent_start, html_content):
    """
    Find text nodes that are direct children of <tag data-i18n="...">.
    Returns list of (index, text, start_pos, end_pos) for uncovered text nodes.
    """
    # Find the parent opening tag position
    tag_match = re.match(r'<(\w+)\s', parent_start)
    if not tag_match:
        return []
    tag = tag_match.group(1)
    
    # Extract content between opening and closing tag
    # Find the opening tag boundary
    open_end = parent_start + '>'
    open_end_pos = html_content.find(open_end) + len(open_end) if open_end in html_content else len(parent_start)
    
    # Find the matching closing tag
    content_after = html_content[open_end_pos:]
    
    # Track depth and find closing tag
    depth = 1
    pos = 0
    inside_script = False
    while depth > 0 and pos < len(content_after):
        if content_after[pos:pos+9] == '</script>' and inside_script:
            inside_script = False
            pos += 9
            continue
        if content_after[pos:pos+8] == '<script ' or content_after[pos:pos+8] == '<script>':
            inside_script = True
            pos += 1
            continue
        if not inside_script:
            m = re.match(r'<(\w+)[^>]*>', content_after[pos:])
            if m and not m.group(1).startswith('/'):
                depth += 1
                pos += m.end()
                continue
            m = re.match(r'</(\w+)>', content_after[pos:])
            if m:
                depth -= 1
                if depth == 0:
                    closing_pos = pos + m.end()
                    # extract content between open and close
                    inner = content_after[:pos]
                    return analyze_inner_text_nodes(inner, html_content, open_end_pos)
                pos += m.end()
                continue
        pos += 1
    
    return []

def analyze_inner_text_nodes(inner_html, full_html, offset):
    """
    Find text nodes not inside data-i18n spans.
    Returns list of (index, text, abs_start, abs_end).
    """
    text_nodes = []
    pos = 0
    index = 0
    child_spans = []
    
    # First find all data-i18n child spans
    for m in re.finditer(r'<span[^>]*data-i18n="([^"]*)"[^>]*>', inner_html):
        child_spans.append((m.start(), m.end(), m.group(1)))
    
    # Scan for text outside spans
    search_pos = 0
    for span_start, span_end, span_key in child_spans:
        # Text before this span
        if search_pos < span_start:
            text = inner_html[search_pos:span_start].strip()
            if text:
                text_nodes.append((index, text, search_pos + offset, span_start + offset, None))
        
        # Skip to end of span
        # Find span closing tag
        span_close = inner_html.find('</span>', span_end)
        if span_close != -1:
            search_pos = span_close + 7
        else:
            search_pos = span_end + 1
        index += 1
    
    # Text after last span
    if search_pos < len(inner_html):
        text = inner_html[search_pos:].strip()
        if text:
            text_nodes.append((index, text, search_pos + offset, len(inner_html) + offset, None))
    
    return text_nodes

def scan_html_files():
    """Scan all HTML files for compound elements with uncovered text."""
    findings = defaultdict(list)
    
    for root, dirs, files in os.walk(PAGES):
        for fname in files:
            if not fname.endswith('.html'):
                continue
            fpath = os.path.join(root, fname)
            rel = os.path.relpath(fpath, BASE)
            
            with open(fpath) as f:
                content = f.read()
            
            # Find elements with data-i18n that contain child data-i18n spans
            # Pattern: <tag data-i18n="..."> ... <span data-i18n="..."> ... </span> ... text ...
            compound_pat = re.compile(r'(<(\w+)[^>]*data-i18n="([^"]*)"[^>]*>)')
            
            for m in compound_pat.finditer(content):
                tag_start = m.group(1)
                tag_name = m.group(2)
                parent_key = m.group(3)
                start_pos = m.start()
                
                # Extract inner content
                inner_start = start_pos + len(tag_start)
                
                # Find matching closing tag
                depth = 1
                pos = inner_start
                search_end = None
                in_script = False
                
                while depth > 0 and pos < len(content):
                    if content[pos:pos+9] == '</script>' and in_script:
                        in_script = False
                        pos += 9
                        continue
                    if content[pos:pos+8] in ('<script ', '<script>') and not in_script:
                        in_script = True
                        pos += 1
                        continue
                    if not in_script:
                        om = re.match(r'<(\w+)[^>]*>', content[pos:])
                        if om and not om.group(1).startswith('/'):
                            depth += 1
                            pos += om.end()
                            continue
                        cm = re.match(r'</(\w+)>', content[pos:])
                        if cm:
                            depth -= 1
                            if depth == 0:
                                search_end = pos + cm.end()
                                break
                            pos += cm.end()
                            continue
                    pos += 1
                
                if search_end is None:
                    continue
                
                inner_html = content[inner_start:search_end - len(f'</{tag_name}>')]
                
                # Check if inner contains both data-i18n spans AND text outside them
                inner_spans = list(re.finditer(r'<span[^>]*data-i18n="([^"]*)"[^>]*>', inner_html))
                if not inner_spans:
                    continue  # No child data-i18n spans, skip
                
                span_keys = [m.group(1) for m in inner_spans]
                
                # Find text nodes NOT inside spans
                text_parts = []
                search_pos = 0
                
                for sm in inner_spans:
                    if search_pos < sm.start():
                        text_before = inner_html[search_pos:sm.start()].strip()
                        if text_before:
                            text_parts.append(text_before)
                    # Skip to end of this span
                    close = inner_html.find('</span>', sm.end())
                    if close != -1:
                        search_pos = close + 7
                    else:
                        search_pos = sm.end()
                
                # After last span
                if search_pos < len(inner_html):
                    text_after = inner_html[search_pos:].strip()
                    if text_after:
                        text_parts.append(text_after)
                
                if not text_parts:
                    continue  # All text is inside spans, OK
                
                findings[rel].append({
                    'line': content[:m.start()].count('\n') + 1,
                    'tag': tag_name,
                    'parent_key': parent_key,
                    'child_keys': span_keys,
                    'uncovered_texts': text_parts,
                })
    
    return findings

def generate_key(parent_key, index):
    """Generate a unique key for an uncovered text segment."""
    # If parent key is compound (has multiple parts), append segment index
    return f"{parent_key}_seg{index + 1}"

def fix_html_files(findings):
    """Fix HTML files by wrapping uncovered text in data-i18n spans."""
    mod_files = []
    
    for rel, issues in findings.items():
        fpath = os.path.join(BASE, rel)
        if not os.path.exists(fpath):
            continue
        
        ensure_backup(fpath)
        with open(fpath) as f:
            content = f.read()
        
        new_content = content
        modifications = []
        
        for issue in issues:
            parent_key = issue['parent_key']
            
            # Re-find this element in the current content
            for idx, uncovered_text in enumerate(issue['uncovered_texts']):
                # Find this exact text in context
                # Look for it after the parent key
                search_after = new_content.find(f'data-i18n="{parent_key}"')
                if search_after == -1:
                    continue
                
                # Find text occurrence after this point
                text_pos = new_content.find(uncovered_text, search_after)
                if text_pos == -1:
                    continue
                
                new_key = generate_key(parent_key, idx)
                
                # Replace: just the text → <span data-i18n="new_key">text</span>
                old = new_content[text_pos:text_pos + len(uncovered_text)]
                new_text = f'<span data-i18n="{new_key}">{old}</span>'
                new_content = new_content[:text_pos] + new_text + new_content[text_pos + len(uncovered_text):]
                
                modifications.append((new_key, uncovered_text))
        
        if modifications:
            with open(fpath, 'w') as f:
                f.write(new_content)
            mod_files.append((rel, modifications))
    
    return mod_files

def update_json_files(modifications):
    """Add new keys to all translation JSON files."""
    all_keys = set()
    for rel, mods in modifications:
        for key, text in mods:
            all_keys.add((key, text))
    
    # Load en-ui.json for the English text
    en_path = os.path.join(LANG_DIR, 'en-ui.json')
    with open(en_path) as f:
        en_data = json.load(f)
    
    # Load zh-CN for Chinese text  
    zh_path = os.path.join(LANG_DIR, 'zh-CN-ui.json')
    with open(zh_path) as f:
        zh_data = json.load(f)
    
    new_entries = {}
    for key, text in sorted(all_keys):
        if key not in en_data:
            en_data[key] = text
        if key not in zh_data:
            # Determine if text is Chinese or English
            if re.search(r'[\u4e00-\u9fff]', text):
                zh_data[key] = text
            else:
                zh_data[key] = text  # Will need manual review
        new_entries[key] = text
    
    # Write back en-ui.json
    ensure_backup(en_path)
    with open(en_path, 'w') as f:
        json.dump(en_data, f, ensure_ascii=False, indent=2)
    
    # Write back zh-CN.json  
    ensure_backup(zh_path)
    with open(zh_path, 'w') as f:
        json.dump(zh_data, f, ensure_ascii=False, indent=2)
    
    # For other languages: add keys with English fallback
    for fname in sorted(os.listdir(LANG_DIR)):
        if not fname.endswith('.json'):
            continue
        if fname in ('en-ui.json', 'zh-CN-ui.json'):
            continue
        
        fpath = os.path.join(LANG_DIR, fname)
        with open(fpath) as f:
            data = json.load(f)
        
        needs_update = False
        for key, text in sorted(all_keys):
            if key not in data:
                data[key] = text
                needs_update = True
        
        if needs_update:
            ensure_backup(fpath)
            with open(fpath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    
    return new_entries

# ═══ MAIN ═══════════════════════════════════════════════════
def main():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    print("=" * 60)
    print("📋 筹微：全站扫描复合 i18n 元素")
    print("=" * 60)
    
    findings = scan_html_files()
    
    total_issues = sum(len(issues) for issues in findings.values())
    total_uncovered = sum(sum(len(i['uncovered_texts']) for i in issues) for issues in findings.values())
    
    print(f"  文件数: {len(findings)}")
    print(f"  复合元素: {total_issues}")
    print(f"  未包裹文本段: {total_uncovered}")
    print()
    
    # Write report
    report_path = os.path.join(BACKUP_DIR, 'scan_report.txt')
    with open(report_path, 'w') as f:
        f.write(f"i18n 覆盖扫描报告 - {datetime.now()}\n")
        f.write(f"文件数: {len(findings)}, 复合元素: {total_issues}, 未包裹文本段: {total_uncovered}\n\n")
        
        for rel in sorted(findings):
            f.write(f"\n{'='*60}\n")
            f.write(f"📄 {rel}\n")
            f.write(f"{'='*60}\n")
            
            for issue in findings[rel]:
                f.write(f"\n  L{issue['line']} <{issue['tag']} data-i18n=\"{issue['parent_key']}\">\n")
                f.write(f"  子 span keys: {issue['child_keys']}\n")
                f.write(f"  未包裹文本 ({len(issue['uncovered_texts'])}段):\n")
                for i, text in enumerate(issue['uncovered_texts']):
                    f.write(f"    [{i+1}] \"{text[:100]}\"\n")
    
    print(f"  报告已保存: {report_path}")
    
    # ═══ Phase 2: HTML 改造 ════════════════════════════════════
    print()
    print("=" * 60)
    print("🔧 驿使：HTML 改造 + JSON 更新")
    print("=" * 60)
    
    modifications = fix_html_files(findings)
    
    if not modifications:
        print("  ⚠️ 没有需要修改的文件")
        return
    
    print(f"  改造 {len(modifications)} 个文件:")
    for rel, mods in modifications:
        print(f"    {rel} ({len(mods)}个新key)")
        for key, text in mods:
            print(f"      🔑 {key}: \"{text[:60]}\"")
    
    # ═══ Phase 3: JSON 更新 ════════════════════════════════════
    new_keys = update_json_files(modifications)
    print(f"\n  ✅ 已添加 {len(new_keys)} 个新 key 到所有语种翻译文件")
    print(f"\n  备份目录: {BACKUP_DIR}")
    
    # Write key manifest
    manifest_path = os.path.join(BACKUP_DIR, 'new_keys_manifest.txt')
    with open(manifest_path, 'w') as f:
        f.write(f"新增 i18n key 清单 - {datetime.now()}\n\n")
        for key in sorted(new_keys):
            f.write(f"{key}\n")
    
    print(f"  key 清单: {manifest_path}")

if __name__ == '__main__':
    main()
