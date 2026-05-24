#!/usr/bin/env python3
"""Move loadMore button from CTA section into product-grid section for all category pages."""
import re, os, sys

BASE = '/Users/chee/Projects/BrewYuKoLi/src/pages/products'

cats = ['coffee','tea','meal','beauty','weight','gut','lifestyle','legacy']
variants = ['index-pc.html','index-tablet.html','index-mobile.html']

for cat in cats:
    for v in variants:
        path = os.path.join(BASE, cat, v)
        if not os.path.exists(path):
            continue
        
        with open(path, 'r') as f:
            content = f.read()
        
        # Find loadMore button block
        pattern = r'<div class="flex justify-center mt-12">\s*<button class="load-more-btn[^>]*data-i18n="products_load_more"[^>]*>.*?</button>\s*</div>'
        match = re.search(pattern, content, re.DOTALL)
        if not match:
            print(f'  ⚠️  {cat}/{v}: no loadMore found')
            continue
        
        loadmore_html = match.group()
        
        # Find CTA section start
        cta_marker = content.find('<!-- CTA -->')
        if cta_marker == -1:
            cta_marker = content.find('class="fullwidth-bg bg-primary py-16"')
            if cta_marker != -1:
                cta_marker = content.rfind('<section', 0, cta_marker)
        
        if cta_marker == -1:
            print(f'  ⚠️  {cat}/{v}: no CTA found')
            continue
        
        # Check if loadMore is inside CTA
        if match.start() < cta_marker:
            print(f'  ✅ {cat}/{v}: loadMore already before CTA (skipping)')
            continue
        
        # Find product-grid section close
        grid_id = content.find('id="product-grid"')
        if grid_id == -1:
            print(f'  ⚠️  {cat}/{v}: no product-grid')
            continue
        
        # Find the closing </section> of the product grid section
        # The grid section looks like:
        #   <section class="fullwidth-bg py-16">
        #     <div class="section-content">
        #       ...
        #       <div id="product-grid">...</div>
        #     </div>
        #   </section>
        # We need the </section> right after the grid </div>
        
        grid_close_div = content.find('</div>', grid_id)
        # Find the next </div> (that closes section-content)
        section_content_close = content.find('</div>', grid_close_div + 6)
        # Find the </section> that closes the grid section
        grid_section_close = content.find('</section>', section_content_close + 6)
        
        if grid_section_close == -1:
            print(f'  ⚠️  {cat}/{v}: cannot find grid section close')
            continue
        
        # Remove loadMore from CTA
        cta_loadmore_start = match.start()
        cta_loadmore_end = match.end()
        content = content[:cta_loadmore_start] + content[cta_loadmore_end:]
        
        # Adjust grid_section_close if it was after the removed block
        if grid_section_close > cta_loadmore_start:
            grid_section_close -= len(loadmore_html)
        
        # Insert loadMore before the grid section </section>
        indent = '        '
        # Normalize whitespace: loadMore was inline with no newlines between attrs
        loadmore_clean = re.sub(r'>\s+<', '>\n' + indent + '<', loadmore_html)
        loadmore_clean = f'\n{indent}' + loadmore_clean + '\n'
        
        content = content[:grid_section_close] + loadmore_clean + content[grid_section_close:]
        
        with open(path, 'w') as f:
            f.write(content)
        
        print(f'  ✅ {cat}/{v}')

print('Done')
