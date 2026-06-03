#!/usr/bin/env python3
"""
Add srcset + sizes attributes to all <img> tags in BrewYuKoLi mobile HTML files.

Usage: python3 scripts/add-srcset-mobile.py

Strategy:
- Use full-file regex replacement on <img...> tags (handles single and multi-line)
- Preserve all existing attributes, add srcset + sizes
- 2-col factory grid images on home page → 2-col sizes
- Hero images (loading="eager") → never add loading="lazy"
"""

import os
import re

PROJECT_ROOT = "/Users/chee/Projects/BrewYuKoLi"

MOBILE_FILES = [
    "src/pages/about/index-mobile.html",
    "src/pages/cases/detail/index-mobile.html",
    "src/pages/cases/index-mobile.html",
    "src/pages/compliance/index-mobile.html",
    "src/pages/contact/index-mobile.html",
    "src/pages/home/index-mobile.html",
    "src/pages/manufacturing/index-mobile.html",
    "src/pages/pdp/index-mobile.html",
    "src/pages/privacy/index-mobile.html",
    "src/pages/products/all/index-mobile.html",
    "src/pages/products/beauty/index-mobile.html",
    "src/pages/products/coffee/index-mobile.html",
    "src/pages/products/gut/index-mobile.html",
    "src/pages/products/index-mobile.html",
    "src/pages/products/legacy/index-mobile.html",
    "src/pages/products/lifestyle/index-mobile.html",
    "src/pages/products/meal/index-mobile.html",
    "src/pages/products/tea/index-mobile.html",
    "src/pages/products/weight/index-mobile.html",
    "src/pages/resources/catalog/index-mobile.html",
    "src/pages/resources/videos/index-mobile.html",
    "src/pages/resources/whitepapers/index-mobile.html",
    "src/pages/solutions/index-mobile.html",
    "src/pages/solutions/obm/index-mobile.html",
    "src/pages/solutions/odm/index-mobile.html",
    "src/pages/solutions/oem/index-mobile.html",
    "src/pages/solutions/packaging/index-mobile.html",
    "src/pages/solutions/rd/index-mobile.html",
    "src/pages/terms/index-mobile.html",
    "src/pages/thank-you/index-mobile.html",
]


def get_src_base(src):
    """Extract the base path from src attribute (without extension)."""
    s = src.strip().strip('"').strip("'")
    if s.endswith(".webp"):
        return s[:-5]
    if "." in s:
        return s[: s.rindex(".")]
    return s


HOOK_MARKER_2COL = "<!-- @@HOOK_2COL_SIZES@@ -->"

# Patterns to match img tags with our approach
# We'll use a simple callback-based regex replacement

SIZES_1COL = 'calc(100vw - 32px)'
SIZES_2COL = 'calc((100vw - 32px - 12px) / 2)'


def transform_img(match, is_two_col=False):
    """
    Transform <img ...> tag.
    match: the full <img...> regex match.
    Returns: replacement string.
    """
    tag = match.group(0)

    # Extract src
    src_m = re.search(r'\bsrc\s*=\s*"([^"]*)"', tag)
    if not src_m:
        return tag

    src_val = src_m.group(1)

    # Only process /assets/images/
    if not src_val.startswith("/assets/images/"):
        return tag

    # Skip if already has srcset
    if 'srcset=' in tag:
        return tag

    base = get_src_base(src_val)

    # Parse all existing attribute pairs
    # We need to preserve order but also handle loading
    attr_pairs = re.findall(r'(\b[\w-]+)\s*=\s*"([^"]*)"', tag)

    # Build all new attribute strings in order, except we'll insert srcset/sizes at the right position
    new_attrs = []
    has_loading = False
    is_hero = False

    for attr_name, attr_val in attr_pairs:
        if attr_name == "src":
            new_attrs.append(f'{attr_name}="{base}-828w.webp"')
        elif attr_name in ("srcset", "sizes"):
            pass  # skip (handled below)
        elif attr_name == "loading":
            has_loading = True
            is_hero = (attr_val == "eager")
            new_attrs.append(f'{attr_name}="{attr_val}"')
        else:
            new_attrs.append(f'{attr_name}="{attr_val}"')

    # Determine sizes
    sizes_val = SIZES_2COL if is_two_col else SIZES_1COL

    # Insert srcset and sizes right before loading attribute, or at end
    insert_before_idx = len(new_attrs)
    for i, a in enumerate(new_attrs):
        if a.startswith("loading="):
            insert_before_idx = i
            break

    insertions = [
        f'srcset="{base}-375w.webp 375w, {base}-828w.webp 828w"',
        f'sizes="{sizes_val}"',
    ]
    if not has_loading and not is_hero:
        insertions.append('loading="lazy"')

    for item in reversed(insertions):
        new_attrs.insert(insert_before_idx, item)

    # Check tag formatting
    is_multiline = "\n" in tag.strip()
    is_self_close = tag.rstrip().endswith("/>")

    if is_multiline:
        # Detect original indentation from existing attr lines
        lines = tag.split("\n")
        indent = None
        for l in lines[1:]:
            stripped = l.strip()
            if stripped and not stripped.startswith("<"):
                indent = l[: len(l) - len(l.lstrip())]
                break
        if indent is None:
            indent = "              "

        attr_lines = [f"{indent}{a}" for a in new_attrs]

        if is_self_close:
            attr_lines.append(indent.rstrip(" ") + "/>")
        else:
            attr_lines.append(indent.rstrip(" ") + ">")

        # The first line "<img" might have trailing whitespace
        first = lines[0].rstrip()
        return first + "\n" + "\n".join(attr_lines)
    else:
        # Single line
        space = " "
        if is_self_close:
            return f"<img{space}{' '.join(new_attrs)} />"
        else:
            return f"<img{space}{' '.join(new_attrs)} >"


def process_file_with_regex(file_path, marker=None):
    """
    Process a file. If marker is provided, replace the marker with nothing first
    and use is_two_col context accordingly.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # If marker, use it to mark 2-col zones (replace marker with nothing,
    # and the marker's position tells us where 2-col imgs are)
    if marker:
        pass  # We'll use a simpler approach below

    # Regex for <img...> tag (non-greedy across lines)
    img_pattern = re.compile(r'<img\b[^>]*>', re.DOTALL)

    # We need to handle 2-col context. For files that have grid-cols-2 with images,
    # we'll use a different approach: find grid-cols-2 blocks, extract all img tags within them
    rel_path = os.path.relpath(file_path, PROJECT_ROOT)

    if rel_path == "src/pages/home/index-mobile.html":
        # Home page has 2-col factory grid - process in two passes
        # First pass: all images get 1-col sizes
        # We'll use a two-token approach: replace grid imgs with a special marker

        # Actually simpler: do all images as 1-col first, then fix factory ones
        def replace_func(m):
            return transform_img(m, is_two_col=False)

        content = img_pattern.sub(replace_func, content)

        # Now fix the 4 factory images to 2-col
        # They have src containing "factory-" and are inside grid-cols-2
        # We can find them by the adjacent content pattern
        factory_pattern = re.compile(
            r'(<img\b[^>]*src="/assets/images/oem/factory/factory-\d[^>]*>)',
            re.DOTALL
        )

        def fix_factory(m):
            # Check if the factory img already has the 2-col sizes
            tag = m.group(1)
            if f'sizes="{SIZES_2COL}"' in tag:
                return tag
            # Replace sizes
            tag = re.sub(r'sizes="[^"]*"', f'sizes="{SIZES_2COL}"', tag)
            return tag

        content = factory_pattern.sub(fix_factory, content)

    else:
        # All other files: 1-column only
        def replace_func(m):
            return transform_img(m, is_two_col=False)

        content = img_pattern.sub(replace_func, content)

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def main():
    changed = 0
    total_imgs = 0
    for rel_path in MOBILE_FILES:
        file_path = os.path.join(PROJECT_ROOT, rel_path)
        if not os.path.exists(file_path):
            print(f"  SKIP (not found): {rel_path}")
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Count img tags
        imgs = re.findall(r'<img\b', content)
        img_count = len(imgs)
        total_imgs += img_count

        if img_count == 0:
            print(f"  SKIP (0 imgs): {rel_path}")
            continue

        if process_file_with_regex(file_path):
            print(f"  MODIFIED: {rel_path} ({img_count} imgs)")
            changed += 1
        else:
            print(f"  UNCHANGED: {rel_path} ({img_count} imgs)")

    print(f"\nModified: {changed}/{len(MOBILE_FILES)} files, {total_imgs} total imgs")


if __name__ == "__main__":
    main()
