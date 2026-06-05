#!/usr/bin/env python3
"""JJC-020 T0.2: Replace window.SpaRouter references with window.location.href"""

import re

files_replacements = {
    "src/assets/js/page-interactions.js": [
        # Replace the 3 quote button blocks (same pattern repeated)
        (
            r'if \(window\.SpaRouter\) \{\s*window\.SpaRouter\.navigate\("/contact/"\);\s*\} else \{\s*window\.location\.href = "/contact";\s*\}',
            'window.location.href = "/contact"'
        ),
        # Replace the home/public icon block
        (
            r'if \(window\.SpaRouter\) \{\s*window\.SpaRouter\.navigate\("/home/"\);\s*\} else \{\s*window\.location\.href = "/";\s*\}',
            'window.location.href = "/"'
        ),
    ],
    "src/assets/js/page-init.js": [
        # The navigate function wrapper
        (
            r'function navigate\(url\) \{\s*if \(window\.SpaRouter && typeof window\.SpaRouter\.navigate === "function"\) \{\s*window\.SpaRouter\.navigate\(url\);\s*\} else \{\s*window\.location\.href = url;\s*\}\s*\}',
            'function navigate(url) {\n      window.location.href = url;\n    }'
        ),
    ],
    "src/assets/js/breadcrumb.js": [
        (
            r'if \(window\.SpaRouter && typeof window\.SpaRouter\.navigate === "function"\) \{\s*window\.SpaRouter\.navigate\(referrer\);\s*\} else \{\s*window\.location\.href = referrer;\s*\}',
            'window.location.href = referrer'
        ),
    ],
    "src/assets/js/compare.js": [
        (
            r'if \(window\.SpaRouter && window\.SpaRouter\.navigate\) \{\s*window\.SpaRouter\.navigate\("/products/"\);\s*\} else \{\s*window\.location\.href = "/products/";\s*\}',
            'window.location.href = "/products/"'
        ),
    ],
    "src/assets/js/ui/search-engine.js": [
        (
            r'if \(window\.SpaRouter && window\.SpaRouter\.navigate\) \{\s*window\.SpaRouter\.navigate\("/products/"\);\s*\} else \{\s*window\.location\.href = "/products/";\s*\}',
            'window.location.href = "/products/"'
        ),
    ],
    "src/assets/js/ui/slide-menu.js": [
        (
            r'if \(window\.SpaRouter\) \{\s*try \{\s*window\.SpaRouter\.navigate\(targetItem\.href\);\s*\} catch \(e\) \{\s*location\.href = targetItem\.href;\s*\}\s*\} else \{\s*location\.href = targetItem\.href;\s*\}',
            'location.href = targetItem.href'
        ),
    ],
    "src/assets/js/ui/about-dropdown.js": [
        # getCurrentPath replacement
        (
            r'var currentPath = window\.SpaRouter \? window\.SpaRouter\.getCurrentPath\(\) : window\.location\.pathname;',
            'var currentPath = window.location.pathname;'
        ),
        # _pendingScroll + navigate with hash
        (
            r'\} else if \(window\.SpaRouter\) \{\s*window\.SpaRouter\._pendingScroll = anchorId;\s*window\.SpaRouter\.navigate\(targetPath\);\s*\} else \{\s*window\.location\.href = href;\s*\}',
            '} else {\n            // Store anchor for scroll after navigation\n            window.__spaScrollAnchor = anchorId;\n            window.location.href = href;\n          }'
        ),
        # Simple navigate with href fallback
        (
            r'\} else \{\s*if \(window\.SpaRouter\) \{\s*window\.SpaRouter\.navigate\(href\);\s*\} else \{\s*window\.location\.href = href;\s*\}\s*\}',
            '} else {\n            window.location.href = href;\n          }'
        ),
    ],
    "src/assets/js/ui-bundle.js": [
        # Line 650-652: search-engine equivalent
        (
            r'if \(window\.SpaRouter && window\.SpaRouter\.navigate\) \{\s*window\.SpaRouter\.navigate\("/products/"\);\s*\} else \{\s*window\.location\.href = "/products/";\s*\}',
            'window.location.href = "/products/"'
        ),
        # Line 2745-2747: breadcrumb equivalent
        (
            r'if \(window\.SpaRouter && typeof window\.SpaRouter\.navigate === "function"\) \{\s*window\.SpaRouter\.navigate\(referrer\);\s*\} else \{\s*window\.location\.href = referrer;\s*\}',
            'window.location.href = referrer'
        ),
    ],
    "src/assets/js/nav-bundle.js": [
        # Line 4410-4412: slide-menu equivalent
        (
            r'if \(window\.SpaRouter\) \{\s*try \{\s*window\.SpaRouter\.navigate\(targetItem\.href\);\s*\} catch \(e\) \{\s*location\.href = targetItem\.href;\s*\}\s*\} else \{\s*location\.href = targetItem\.href;\s*\}',
            'location.href = targetItem.href'
        ),
    ],
    "src/assets/js/dropdown-bundle.js": [
        # getCurrentPath replacement
        (
            r'var currentPath = window\.SpaRouter \? window\.SpaRouter\.getCurrentPath\(\) : window\.location\.pathname;',
            'var currentPath = window.location.pathname;'
        ),
        # _pendingScroll + navigate with hash
        (
            r'\} else if \(window\.SpaRouter\) \{\s*window\.SpaRouter\._pendingScroll = anchorId;\s*window\.SpaRouter\.navigate\(targetPath\);\s*\} else \{\s*window\.location\.href = href;\s*\}',
            '} else {\n            // Store anchor for scroll after navigation\n            window.__spaScrollAnchor = anchorId;\n            window.location.href = href;\n          }'
        ),
        # Simple navigate with href fallback
        (
            r'\} else \{\s*if \(window\.SpaRouter\) \{\s*window\.SpaRouter\.navigate\(href\);\s*\} else \{\s*window\.location\.href = href;\s*\}\s*\}',
            '} else {\n            window.location.href = href;\n          }'
        ),
    ],
}

# Process each file
for filepath, replacements in files_replacements.items():
    fullpath = f"/Users/chee/Projects/BrewYuKoLi/{filepath}"
    with open(fullpath, 'r') as f:
        content = f.read()
    
    original = content
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content, count=0, flags=re.DOTALL)
    
    if content != original:
        with open(fullpath, 'w') as f:
            f.write(content)
        print(f"✅ {filepath}: replaced")
    else:
        print(f"⚠️  {filepath}: no changes made (patterns may not match)")
