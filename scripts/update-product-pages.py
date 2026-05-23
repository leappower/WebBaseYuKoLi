#!/usr/bin/env python3
"""
批量更新产品线 HTML 页面 — 增加 Gallery 产品展示区
保留每线差异化的 Hero 标题/描述/颜色/OG meta

用法: python3 scripts/update-product-pages.py

每个产品线页面的变化:
- Hero 区域: 保留不变（每线不同文案/颜色）
- Overview 区域: 保留（扩展 show case 引导）
- Capabilities 区域: 简化（保留 2 个核心卡片）
- [新增] Gallery 产品网格: <div id="product-grid" data-gallery="true" data-category="xxx">
- CTA 区域: 保留（位置调到底部）
"""

import re, os, shutil

PRODUCTS_DIR = '/Users/chee/Projects/BrewYuKoLi/src/pages/products'
DEVICES = ['pc', 'tablet', 'mobile']

# 每条线的差异化配置
CONFIG = {
    'coffee': {
        'hero_title': '咖啡冲调',
        'hero_sub_cn': '醇香体验， instant 享受',
        'hero_sub_en': 'Rich Aroma, Instant Enjoyment',
        'hero_color': '#6F4E37',
        'hero_img': '/assets/images/oem/products/coffee.webp',
        'overview_title_key': 'product_coffee_overview_title',
        'overview_title': '咖啡冲调 — 专业 OEM/ODM 制造',
        'overview_desc_key': 'product_coffee_overview_desc',
        'overview_desc': '速溶咖啡、拿铁、卡布奇诺等多种风味定制',
        'og_title': '咖啡冲调 OEM/ODM - YuKoLi Technology',
        'og_desc': '速溶咖啡、拿铁、卡布奇诺等多种风味定制',
        'og_img': '/assets/images/oem/products/coffee.webp',
        'seo_desc': 'YuKoLi Technology 咖啡冲调 OEM/ODM制造 — 速溶咖啡、拿铁、卡布奇诺等多种风味定制',
        'page_title': '咖啡冲调 OEM/ODM - YuKoLi Technology',
        'canonical': 'products/coffee/',
        'has_gallery': True,
        'showcase_types': ['Classic 3-in-1', 'Low Sugar / Sugar-Free', 'Functional Coffee', 'Premium Single-Origin'],
        'capabilities': ['配方研发', '品质保障'],
    },
    'tea': {
        'hero_title': '茶饮奶茶',
        'hero_sub_cn': '经典茶饮，品味生活',
        'hero_sub_en': 'Classic Tea, Fine Living',
        'hero_color': '#4CAF50',
        'hero_img': '/assets/images/oem/products/tea.webp',
        'overview_title_key': 'product_tea_overview_title',
        'overview_title': '茶饮奶茶 — 专业 OEM/ODM 制造',
        'overview_desc_key': 'product_tea_overview_desc',
        'overview_desc': '珍珠奶茶粉、果茶、花草茶、纯茶等多种选择',
        'og_title': '茶饮奶茶 OEM/ODM - YuKoLi Technology',
        'og_desc': '珍珠奶茶粉、果茶、花草茶等多种选择',
        'og_img': '/assets/images/oem/products/tea.webp',
        'seo_desc': 'YuKoLi Technology 茶饮奶茶 OEM/ODM制造 — 珍珠奶茶粉、果茶、花草茶、纯茶',
        'page_title': '茶饮奶茶 OEM/ODM - YuKoLi Technology',
        'canonical': 'products/tea/',
        'has_gallery': True,
        'showcase_types': ['Bubble Tea Powders', 'Fruit Tea', 'Herbal & Detox'],
        'capabilities': ['配方研发', '品质保障'],
    },
    'meal': {
        'hero_title': '代餐蛋白',
        'hero_sub_cn': '营养代餐，健康之选',
        'hero_sub_en': 'Meal Replacement, Healthy Choice',
        'hero_color': '#FF8F00',
        'hero_img': '/assets/images/oem/products/meal.webp',
        'overview_title_key': 'product_meal_overview_title',
        'overview_title': '代餐蛋白 — 专业 OEM/ODM 制造',
        'overview_desc_key': 'product_meal_overview_desc',
        'overview_desc': '代餐奶昔、蛋白粉、蛋白棒等多种选择',
        'og_title': '代餐蛋白 OEM/ODM - YuKoLi Technology',
        'og_desc': '代餐奶昔、蛋白粉、蛋白棒等多种选择',
        'og_img': '/assets/images/oem/products/meal.webp',
        'seo_desc': 'YuKoLi Technology 代餐蛋白 OEM/ODM制造 — 代餐奶昔、蛋白粉、蛋白棒',
        'page_title': '代餐蛋白 OEM/ODM - YuKoLi Technology',
        'canonical': 'products/meal/',
        'has_gallery': False,  # 画册无实拍SKU
        'showcase_types': ['Meal Shakes', 'Plant Protein', 'Oats & Grains'],
        'capabilities': ['配方研发', '品质保障'],
    },
    'beauty': {
        'hero_title': '美容胶原',
        'hero_sub_cn': '胶原美肌，青春之源',
        'hero_sub_en': 'Collagen Beauty, Youthful Glow',
        'hero_color': '#E91E63',
        'hero_img': '/assets/images/oem/products/beauty.webp',
        'overview_title_key': 'product_beauty_overview_title',
        'overview_title': '美容胶原 — 专业 OEM/ODM 制造',
        'overview_desc_key': 'product_beauty_overview_desc',
        'overview_desc': '胶原蛋白肽、燕窝胶原粉等多种美容精华',
        'og_title': '美容胶原 OEM/ODM - YuKoLi Technology',
        'og_desc': '胶原蛋白肽饮品、燕窝胶原蛋白粉',
        'og_img': '/assets/images/oem/products/beauty.webp',
        'seo_desc': 'YuKoLi Technology 美容胶原 OEM/ODM制造 — 胶原蛋白肽、燕窝胶原粉',
        'page_title': '美容胶原 OEM/ODM - YuKoLi Technology',
        'canonical': 'products/beauty/',
        'has_gallery': True,
        'showcase_types': ['Collagen Peptides', 'Beauty Drinks', "Bird's Nest"],
        'capabilities': ['配方研发', '品质保障'],
    },
    'weight': {
        'hero_title': '体重管理',
        'hero_sub_cn': '科学控卡，轻松享瘦',
        'hero_sub_en': 'Smart Calories, Easy Weight Control',
        'hero_color': '#00ACC1',
        'hero_img': '/assets/images/oem/products/weight.webp',
        'overview_title_key': 'product_weight_overview_title',
        'overview_title': '体重管理 — 专业 OEM/ODM 制造',
        'overview_desc_key': 'product_weight_overview_desc',
        'overview_desc': '燃脂咖啡、膳食纤维、代餐粉等科学减重方案',
        'og_title': '体重管理 OEM/ODM - YuKoLi Technology',
        'og_desc': '燃脂咖啡、膳食纤维、代餐粉',
        'og_img': '/assets/images/oem/products/weight.webp',
        'seo_desc': 'YuKoLi Technology 体重管理 OEM/ODM制造 — 燃脂咖啡、膳食纤维、代餐粉',
        'page_title': '体重管理 OEM/ODM - YuKoLi Technology',
        'canonical': 'products/weight/',
        'has_gallery': True,
        'showcase_types': ['Lotus Root Powder', 'Meal Replacement', 'Slim Formulas'],
        'capabilities': ['配方研发', '品质保障'],
    },
    'gut': {
        'hero_title': '肠道健康',
        'hero_sub_cn': '肠道平衡，由内而外',
        'hero_sub_en': 'Gut Balance, Inside Out',
        'hero_color': '#8BC34A',
        'hero_img': '/assets/images/oem/products/gut.webp',
        'overview_title_key': 'product_gut_overview_title',
        'overview_title': '肠道健康 — 专业 OEM/ODM 制造',
        'overview_desc_key': 'product_gut_overview_desc',
        'overview_desc': '益生菌、益生元、膳食纤维等肠道调理方案',
        'og_title': '肠道健康 OEM/ODM - YuKoLi Technology',
        'og_desc': '益生菌、益生元、膳食纤维',
        'og_img': '/assets/images/oem/products/gut.webp',
        'seo_desc': 'YuKoLi Technology 肠道健康 OEM/ODM制造 — 益生菌、益生元、膳食纤维',
        'page_title': '肠道健康 OEM/ODM - YuKoLi Technology',
        'canonical': 'products/gut/',
        'has_gallery': True,
        'showcase_types': ['Collagen Peptides', 'Plant Proteins', 'Functional Milk'],
        'capabilities': ['配方研发', '品质保障'],
    },
    'lifestyle': {
        'hero_title': '功能冲饮',
        'hero_sub_cn': '精准营养，悦享生活',
        'hero_sub_en': 'Precision Nutrition, Enjoy Life',
        'hero_color': '#7C4DFF',
        'hero_img': '/assets/images/oem/products/lifestyle.webp',
        'overview_title_key': 'product_lifestyle_overview_title',
        'overview_title': '功能冲饮 — 专业 OEM/ODM 制造',
        'overview_desc_key': 'product_lifestyle_overview_desc',
        'overview_desc': '助眠、免疫、能量补充等定制功能饮品',
        'og_title': '功能冲饮 OEM/ODM - YuKoLi Technology',
        'og_desc': '助眠、免疫、能量补充等定制功能饮品',
        'og_img': '/assets/images/oem/products/lifestyle.webp',
        'seo_desc': 'YuKoLi Technology 功能冲饮 OEM/ODM制造 — 助眠、免疫、能量补充',
        'page_title': '功能冲饮 OEM/ODM - YuKoLi Technology',
        'canonical': 'products/lifestyle/',
        'has_gallery': False,  # 画册无实拍SKU
        'showcase_types': ['Sleep Support', 'Immunity', 'Energy Boost'],
        'capabilities': ['配方研发', '品质保障'],
    },
    'legacy': {
        'hero_title': '经典冲饮',
        'hero_sub_cn': '传承经典，匠心品质',
        'hero_sub_en': 'Classic Heritage, Craft Quality',
        'hero_color': '#00897B',
        'hero_img': '/assets/images/oem/products/legacy.webp',
        'overview_title_key': 'product_legacy_overview_title',
        'overview_title': '经典冲饮 — 品质传承',
        'overview_desc_key': 'product_legacy_overview_desc',
        'overview_desc': '精选经典冲饮配方，传承匠心品质',
        'og_title': '经典冲饮 - YuKoLi Technology',
        'og_desc': '精选经典冲饮配方，传承匠心品质',
        'og_img': '/assets/images/oem/products/legacy.webp',
        'seo_desc': 'YuKoLi Technology 经典冲饮 OEM/ODM制造 — 精选经典冲饮配方',
        'page_title': '经典冲饮 - YuKoLi Technology',
        'canonical': 'products/legacy/',
        'has_gallery': False,  # 无独立实拍SKU
        'showcase_types': ['Bean Drinks', 'Grain Beverages', 'Traditional Herbs'],
        'capabilities': ['配方研发', '品质保障'],
    },
}

def generate_page(slug, device, cfg):
    is_pc = device == 'pc'
    grid_cols = {
        'pc': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        'tablet': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        'mobile': 'grid-cols-1 md:grid-cols-2',
    }
    showcase_size = {
        'pc': 'text-5xl lg:text-6xl',
        'tablet': 'text-4xl lg:text-5xl',
        'mobile': 'text-3xl lg:text-4xl',
    }
    
    # Figure out variant/active for navigator
    nav_args = f'data-variant="{device}"' if device == 'mobile' else 'data-variant="pc"'
    
    # Base template (common structure, diff by device)
    gallery_section = ''
    if cfg['has_gallery']:
        gallery_section = f'''
      <!-- Product Gallery (Catalog V4 Grid) -->
      <section class="fullwidth-bg py-16">
        <div class="section-content">
          <h2 class="text-3xl font-black text-center mb-4" data-i18n="product_{slug}_gallery_title">产品展示</h2>
          <p class="text-center text-slate-500 mb-12">Real products from SE Asia market — YuKoLi OEM/ODM capabilities</p>
          <div id="product-grid"
               data-gallery="true"
               data-category="{slug}"
               class="grid {grid_cols[device]} gap-6">
            <!-- Gallery grid populated by product-grid.js -->
          </div>
        </div>
      </section>'''

    # Showcase types
    types_html = ''
    for t in cfg['showcase_types']:
        types_html += f'''
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h4 class="text-lg font-bold mb-2">{t}</h4>
              <p class="text-sm text-slate-500">OEM/ODM available</p>
            </div>'''

    # Capabilities (simplified to 2)
    caps_html = ''
    cap_icons = {'配方研发': 'science', '品质保障': 'verified'}
    for c in cfg['capabilities']:
        icon = cap_icons.get(c, 'check_circle')
        caps_html += f'''
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
              <span class="material-symbols-outlined text-4xl mb-4" style="color:{cfg['hero_color']}">{icon}</span>
              <h3 class="text-xl font-bold mb-2">{c}</h3>
              <p class="text-slate-600 dark:text-slate-400">{'专业团队保障' if c == '配方研发' else '全链路质量控制'}</p>
            </div>'''

    return f'''<!doctype html>
<html class="light" lang="zh-CN">
  <head>
  <script src="/site.config.js"></script>
  <script src="/assets/js/utils/dom-utils.js"></script>
    <link rel="canonical" href="%DOMAIN%/{cfg['canonical']}" />
    <link rel="alternate" hreflang="zh-CN" href="%DOMAIN%/{cfg['canonical']}" />
    <link rel="alternate" hreflang="en" href="%DOMAIN%/{cfg['canonical']}" />
    <link rel="alternate" media="only screen and (max-width: 767px)" href="/{cfg['canonical']}index-mobile.html" />
    <link rel="alternate" media="only screen and (min-width: 768px) and (max-width: 1279px)" href="/{cfg['canonical']}index-tablet.html" />
    <link rel="alternate" media="only screen and (min-width: 1280px)" href="/{cfg['canonical']}index-pc.html" />
    <script>
      (function () {{
        if (window.__redirectChecked) return;
        window.__redirectChecked = true;
        var urlParams = new URLSearchParams(location.search);
        var cleanUrl = urlParams.get("clean-url");
        if (cleanUrl) {{ history.replaceState({{}}, "", cleanUrl); return; }}
        if (window.__spaNavigating) return;
        var currentFile = location.pathname.split("/").pop();
        if (window.DeviceUtils && window.DeviceUtils.isDirectoryURL()) return;
        if (window.DeviceUtils && window.DeviceUtils.shouldRedirect(currentFile)) {{
          var deviceType = window.DeviceUtils.getDeviceType();
          var targetFile;
          if (deviceType === window.DeviceUtils.DeviceType.MOBILE) targetFile = "index-mobile.html";
          else if (deviceType === window.DeviceUtils.DeviceType.TABLET) targetFile = "index-tablet.html";
          else targetFile = "index-pc.html";
          location.href = targetFile;
          return;
        }}
      }})();
    </script>
    <meta charset="utf-8" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{cfg['og_title']}" />
    <meta property="og:description" content="{cfg['og_desc']}" />
    <meta property="og:url" content="%DOMAIN%/{cfg['canonical']}" />
    <meta property="og:image" content="%DOMAIN%{cfg['og_img']}" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <meta name="description" content="{cfg['seo_desc']}" />
    <title>{cfg['page_title']}</title>
    <link rel="preload" href="/assets/fonts/local-fonts.css" as="style" />
    <link rel="preload" href="/assets/css/styles.css" as="style" />
    <link rel="preload" href="/assets/css/tailwind.css" as="style" />
    <link href="/assets/fonts/local-fonts.css" rel="stylesheet" />
    <link rel="stylesheet" href="/assets/css/styles.css" />
    <link rel="stylesheet" href="/assets/css/tailwind.css" />
    <link rel="stylesheet" href="/assets/css/z-index-system.css" />
    <link rel="stylesheet" href="/assets/css/performance-optimizations.css" />
    <link rel="stylesheet" href="/assets/css/skeleton.css" />
    <link rel="icon" href="/assets/images/logo_header.webp" type="image/webp" />
    <script>
      if (localStorage.getItem("darkMode") === "true") document.documentElement.classList.add("dark");
    </script>
  </head>
  <body class="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-clip">
    <navigator data-component="navigator" data-swup-persist="nav" {nav_args} data-active="products" data-search="true" data-cta-text-key="nav_contact_us" data-cta-href="/contact/"></navigator>
    <main id="spa-content">
      <!-- Hero -->
      <section class="fullwidth-bg hero-banner w-full relative">
        <div class="w-full h-[{'500' if is_pc else '400' if device == 'tablet' else '350'}px] relative overflow-hidden">
          <img alt="{cfg['hero_title']}" class="w-full h-full object-cover" src="{cfg['hero_img']}" loading="eager" />
          <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
          <div class="absolute inset-0 flex items-center">
            <div class="section-content w-full">
              <div class="max-w-2xl">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style="background:{cfg['hero_color']}20;color:{cfg['hero_color']}">
                  <span>OEM / ODM</span>
                </div>
                <h1 class="{showcase_size[device]} font-black leading-tight text-white mb-4">{cfg['hero_title']}</h1>
                <p class="text-lg text-white/80 mb-2">{cfg['hero_sub_cn']}</p>
                <p class="text-white/60">{cfg['hero_sub_en']}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Showcase / Overview -->
      <section class="fullwidth-bg py-16">
        <div class="section-content">
          <div class="max-w-4xl mx-auto text-center mb-12">
            <h2 class="text-3xl font-black mb-6" data-i18n="{cfg['overview_title_key']}">{cfg['overview_title']}</h2>
            <p class="text-lg text-slate-600 dark:text-slate-400 leading-relaxed" data-i18n="{cfg['overview_desc_key']}">{cfg['overview_desc']}</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{'4' if len(cfg['showcase_types']) >= 4 else str(len(cfg['showcase_types']))} gap-6 max-w-5xl mx-auto">
            {types_html}
          </div>
        </div>
      </section>

      <!-- Simplified Capabilities -->
      <section class="fullwidth-bg bg-slate-50 dark:bg-slate-900 py-12">
        <div class="section-content">
          <h2 class="text-2xl font-black text-center mb-8" data-i18n="product_{slug}_capabilities_title">核心能力</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {caps_html}
          </div>
        </div>
      </section>

      {gallery_section}

      <!-- CTA -->
      <section class="fullwidth-bg bg-primary py-16">
        <div class="section-content">
          <div class="w-full text-center text-white">
            <h2 class="text-3xl lg:text-4xl font-black mb-6">需要 {cfg['hero_title']} OEM/ODM 服务？</h2>
            <p class="text-white/80 text-lg mb-8 max-w-2xl mx-auto">免费获取样品，体验 YuKoLi Technology 的品质差异。24小时内专业回复。</p>
            <div class="flex flex-wrap justify-center gap-4">
              <a href="/contact/" class="bg-white text-primary px-10 py-4 rounded-xl font-black hover:bg-slate-100 transition-colors shadow-xl">免费获取样品</a>
              <button onclick="window.YuKoLiFAB && window.YuKoLiFAB.openWhatsApp('page-cta','wa_msg_default')" class="bg-green-500 text-white px-10 py-4 rounded-xl font-black hover:bg-green-600 transition-colors shadow-xl flex items-center gap-2">
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
    <script src="/assets/js/ui/dropdown-styles.js"></script>
    <script src="/assets/js/ui/dropdown-base.js"></script>
    <script defer src="/assets/js/ui/products-dropdown.js"></script>
    <script defer src="/assets/js/ui/nav-dropdown.js"></script>
    <script defer src="/assets/js/ui/navigator.js"></script>
    <script defer src="/assets/js/ui/slide-menu.js"></script>
    <script defer src="/assets/js/ui/search-engine.js"></script>
    <script defer src="/assets/js/ui/footer.js"></script>
    <script defer src="/assets/js/lang-registry.js"></script>
    <script defer src="/assets/js/translations.js"></script>
    <script defer src="/assets/js/contacts.js"></script>
    <script defer src="/assets/js/vendor/swup.umd.js"></script>
    <script defer src="/assets/js/vendor/swup-head-plugin.umd.js"></script>
    <script defer src="/assets/js/vendor/swup-scroll-plugin.umd.js"></script>
    <script defer src="/assets/js/vendor/swup-scripts-plugin.umd.js"></script>
    <script defer src="/assets/js/vendor/swup-debug-plugin.umd.js"></script>
    <script defer src="/assets/js/swup-init.js"></script>
    <script defer src="/assets/js/page-init.js"></script>
    <script defer src="/assets/js/ui/helpers.js"></script>
    <script defer src="/assets/js/ui/page-effects.js"></script>
    <script defer src="/assets/js/ui/form-interactions.js"></script>
    <script src="/assets/js/utils/device-utils.js"></script>
    <script defer src="/assets/js/ui/floating-actions.js"></script>
    <script defer src="/assets/js/ui/trust-bar.js?v=202605231654"></script>
  <script defer src="/assets/js/ui/bottom-tab.js?v=202605231654"></script>
</body>
</html>'''


# === Main ===
count = 0
for slug, cfg in CONFIG.items():
    for device in DEVICES:
        out = generate_page(slug, device, cfg)
        filepath = os.path.join(PRODUCTS_DIR, slug, f'index-{device}.html')
        with open(filepath, 'w') as f:
            f.write(out)
        count += 1

print(f'✅ 已更新 {count} 个产品页面 (8 线 × 3 设备 = 24 文件)')

# 快速统计
from collections import Counter
lines_with_gallery = [s for s, c in CONFIG.items() if c['has_gallery']]
print(f'   带 Gallery 的产品线: {len(lines_with_gallery)} 个 ({", ".join(lines_with_gallery)})')
print(f'   无 Gallery 的产品线: {len(CONFIG) - len(lines_with_gallery)} 个 (meal, lifestyle, legacy)')
