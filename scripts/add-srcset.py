#!/usr/bin/env python3
"""
Add srcset + sizes attributes to all <img> tags in Tablet and PC HTML files.

Usage: python3 scripts/add-srcset.py [--dry-run]

Tablet:
  - srcset: 828w, 1200w
  - sizes: calc(100vw - 48px) for all images
  - src fallback: 1200w

PC:
  - srcset: 1200w, 1920w (all), +2048w for hero-class images
  - sizes:
      Hero/Banner: (min-width: 1280px) 1024px, 80vw
      Card/Grid:   (min-width: 1280px) 25vw, 33vw
  - src fallback: 1920w

Hero detection:
  - Image paths containing '/hero' or '-hero.' or 'hero-' in filename portion
  - These get the extra 2048w srcset entry
  - These also get main-content sizes (1024px, 80vw)
"""

import os, re, sys

PROJECT = "/Users/chee/Projects/BrewYuKoLi"
DRY_RUN = "--dry-run" in sys.argv


def make_srcset_url(src, width):
    """Create a srcset URL with width suffix before .webp extension."""
    ext = '.webp'
    if not src.endswith(ext):
        return None
    base = src[:-len(ext)]
    return f"{base}-{width}w{ext}"


def is_hero_image(src):
    """Check if image is a hero-class image (gets 2048w + hero sizes)."""
    filename = src.rstrip('/').split('/')[-1]
    # Check path for hero indicators
    return ('/hero' in src) or filename.endswith('-hero.webp') or filename.startswith('hero-')


def process_file(filepath, device_type):
    """Process a single HTML file, adding srcset + sizes."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Match <img ...> tags (can span multiple lines)
    img_pattern = re.compile(r'(<img\b[^>]*?>)', re.IGNORECASE | re.DOTALL)

    def replace_img(match):
        tag = match.group(1)

        # Extract src attribute
        src_match = re.search(r'\bsrc="([^"]*)"', tag)
        if not src_match:
            return tag

        src = src_match.group(1)

        # Skip non-asset images (SVG, data URIs, external URLs)
        if not src.startswith('/assets/images/'):
            return tag

        # Skip if already has srcset
        if re.search(r'\bsrcset="', tag):
            return tag

        src_path = src.split('?')[0]
        is_hero = is_hero_image(src_path)

        if device_type == 'tablet':
            # Tablet: srcset 828w, 1200w
            srcset_828 = make_srcset_url(src_path, 828)
            srcset_1200 = make_srcset_url(src_path, 1200)

            if not srcset_828 or not srcset_1200:
                return tag

            srcset_value = f"{srcset_828} 828w, {srcset_1200} 1200w"
            sizes = 'calc(100vw - 48px)'

            # Update src to 1200w fallback
            tag = re.sub(r'\bsrc="([^"]*)"', f'src="{srcset_1200}"', tag)

        elif device_type == 'pc':
            # PC: srcset 1200w, 1920w (+2048w for hero)
            srcset_1200 = make_srcset_url(src_path, 1200)
            srcset_1920 = make_srcset_url(src_path, 1920)

            entries = []
            if srcset_1200:
                entries.append(f"{srcset_1200} 1200w")
            if srcset_1920:
                entries.append(f"{srcset_1920} 1920w")

            if is_hero:
                srcset_2048 = make_srcset_url(src_path, 2048)
                if srcset_2048:
                    entries.append(f"{srcset_2048} 2048w")

            if not entries:
                return tag

            srcset_value = ', '.join(entries)

            # sizes: hero/banner = main content; card/grid = grid
            if is_hero:
                sizes = '(min-width: 1280px) 1024px, 80vw'
            else:
                sizes = '(min-width: 1280px) 25vw, 33vw'

            # Update src to 1920w fallback
            tag = re.sub(r'\bsrc="([^"]*)"', f'src="{srcset_1920}"', tag)

        else:
            return tag

        # Insert srcset + sizes before the closing >
        tag = tag.rstrip()
        attrs = f' srcset="{srcset_value}" sizes="{sizes}"'

        if tag.endswith('/>'):
            tag = tag[:-2] + attrs + ' />'
        elif tag.endswith('>'):
            tag = tag[:-1] + attrs + '>'

        return tag

    content = img_pattern.sub(replace_img, content)

    if content == original:
        return False

    if DRY_RUN:
        print(f"[DRY-RUN] Would modify: {filepath}")
    else:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Modified: {filepath}")
    return True


def main():
    pages_dir = os.path.join(PROJECT, "src", "pages")

    files_tablet = []
    files_pc = []

    for root, dirs, files in os.walk(pages_dir):
        for f in files:
            if f.endswith('-tablet.html'):
                files_tablet.append(os.path.join(root, f))
            elif f.endswith('-pc.html'):
                files_pc.append(os.path.join(root, f))

    files_tablet.sort()
    files_pc.sort()

    print(f"Found {len(files_tablet)} tablet files, {len(files_pc)} PC files")

    tablet_modified = 0
    pc_modified = 0

    # Process Tablet
    print("\n=== Processing Tablet files ===")
    for fp in files_tablet:
        if process_file(fp, 'tablet'):
            tablet_modified += 1

    # Process PC
    print("\n=== Processing PC files ===")
    for fp in files_pc:
        if process_file(fp, 'pc'):
            pc_modified += 1

    print(f"\n{'=' * 50}")
    print(f"Summary:")
    print(f"  Tablet: {tablet_modified}/{len(files_tablet)} files modified")
    print(f"  PC:     {pc_modified}/{len(files_pc)} files modified")
    print(f"{'=' * 50}")


if __name__ == '__main__':
    main()
