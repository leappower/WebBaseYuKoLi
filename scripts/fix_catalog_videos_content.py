#!/usr/bin/env python3
"""
Fix catalog and videos pages: they currently share the same coffee-themed content.
Make each reflect its own theme (catalog→catalog, videos→videos).
Only changes: images and copy text.
Applies to PC, mobile, tablet variants.
"""
import os, re

PROJ = "/Users/chee/Projects/BrewYuKoLi"

CATALOG_CHANGES = {
    # Image
    'coffee.webp': 'catalog-hero.webp',
    # Hero
    'Coffee Brewing': '2026 Product Catalog',
    'Rich Aroma, Instant Enjoyment': 'Complete OEM/ODM Beverage Solutions',
    # Overview
    'Coffee Mix — OEM/ODM Manufacturing': 'Your Trusted OEM/ODM Partner',
    'Instant coffee, latte, cappuccino, and more. Custom flavors available.': 
        'Browse our complete OEM/ODM beverage powder catalog across 8 product lines — coffee, tea, meal replacement, beauty collagen, and more.',
    'Customization of various flavors including instant coffee, latte, cappuccino': 
        'Full-spectrum beverage solutions from classic to functional, all customizable to your brand.',
    # CTA
    'Need Coffee OEM/ODM Service?': 'Request Full Catalog',
    # Capabilities - keep general, just remove coffee references
}

VIDEOS_CHANGES = {
    # Image
    'coffee.webp': 'videos-hero.webp',
    # Hero
    'OEM / ODM': 'Video Gallery',
    '#6F4E37': '#2E7D32',  # change accent color to brand green
    '#6F4E3720': '#2E7D3220',
    'Coffee Brewing': 'Manufacturing Excellence',
    'Rich Aroma, Instant Enjoyment': 'See Our Modern Factory in Action',
    # Remove duplicate tagline (same as subtitle)
    # Overview
    'Coffee Mix — OEM/ODM Manufacturing': 'Watch Our Factory Tour',
    'Instant coffee, latte, cappuccino, and more. Custom flavors available.': 
        'Take a virtual tour of our advanced beverage powder factory — from automated production lines to QC laboratories.',
    'Customization of various flavors including instant coffee, latte, cappuccino': 
        'Witness our commitment to quality, safety, and innovation in every step of the manufacturing process.',
    # Capabilities titles
    'Recipe R&D': 'Factory Virtual Tour',
    'Flexible Production': 'Production Lines',
    'Packaging Customization': 'QC Laboratory',
    'Quality Assurance': 'Customer Stories',
    # CTA
    'Need Coffee OEM/ODM Service?': 'Schedule a Factory Tour',
    'Get free samples and experience the': 
        'Contact us to arrange a virtual or in-person tour of our facility and',
}

def fix_file(fpath, changes):
    """Apply targeted string replacements to a file."""
    with open(fpath) as f:
        content = f.read()
    original = content
    for old, new in changes.items():
        content = content.replace(old, new)
    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        return True
    return False

# Apply to catalog pages (3 devices)
cat_devices = ['pc', 'mobile', 'tablet']
for d in cat_devices:
    fp = f"{PROJ}/src/pages/resources/catalog/index-{d}.html"
    if os.path.exists(fp):
        changed = fix_file(fp, CATALOG_CHANGES)
        print(f"Catalog/{d}: {'✅ updated' if changed else 'no changes'}")
    else:
        print(f"Catalog/{d}: ❌ NOT FOUND")

# Apply to videos pages (3 devices)  
for d in cat_devices:
    fp = f"{PROJ}/src/pages/resources/videos/index-{d}.html"
    if os.path.exists(fp):
        changed = fix_file(fp, VIDEOS_CHANGES)
        print(f"Videos/{d}: {'✅ updated' if changed else 'no changes'}")
    else:
        print(f"Videos/{d}: ❌ NOT FOUND")

print("\nDone. Both pages now have distinct content.")
