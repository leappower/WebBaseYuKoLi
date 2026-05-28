#!/bin/bash
set -e

echo "=== Fixing BrewYuKoLi HTML ==="

BASE="/Users/chee/Projects/BrewYuKoLi"

# ============ TASK 2: RD PAGE ============
echo "--- RD Page ---"

for DEVICE in pc mobile tablet; do
  FILE="$BASE/src/pages/solutions/rd/index-${DEVICE}.html"
  echo "  Processing $FILE"

  # Hero: Change image src and alt
  sed -i '' \
    's|src="/assets/images/oem/products/coffee.webp"|src="/assets/images/oem/solutions/rd-hero.webp"|g' \
    "$FILE"
  sed -i '' \
    's|alt="Coffee Brewing"|alt="R\&D Laboratory and Flavor Testing"|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="alt_coffee_brewing"|data-i18n="solutions_rd_alt_hero"|g' \
    "$FILE"

  # Hero: Change badge
  sed -i '' \
    's|<span>OEM / ODM</span>|<span data-i18n="solutions_rd_badge">R\&D / Flavor Lab</span>|g' \
    "$FILE"

  # Hero subtitle fallbacks
  sed -i '' \
    's|data-i18n="solutions_rd_hero_subtitle">Rich aroma, instant enjoyment|data-i18n="solutions_rd_hero_subtitle">Innovating Flavor, Developing Formulas|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_rd_hero_subtitle_en">Rich Aroma, Instant Enjoyment|data-i18n="solutions_rd_hero_subtitle_en">Innovating Flavor, Developing Formulas|g' \
    "$FILE"

  # Hero title fallback
  sed -i '' \
    's|data-i18n="solutions_rd_hero_title">Coffee Brewing|data-i18n="solutions_rd_hero_title">R\&D \&amp; Flavor Laboratory|g' \
    "$FILE"

  # Overview section: change i18n keys and fallbacks
  sed -i '' \
    's|data-i18n="product_coffee_overview_title">Coffee Mix — OEM/ODM Manufacturing|data-i18n="solutions_rd_overview_title">R\&D \&amp; Flavor Laboratory|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="product_coffee_overview_desc">Instant coffee, latte, cappuccino, and more. Custom flavors available.|data-i18n="solutions_rd_overview">From concept to finished formulation — our in-house R\&D team brings 20+ years of functional food and beverage expertise. We develop custom recipes, optimize sensory profiles, and maintain a proprietary library of 200+ proven formulas.|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_rd_overview_en">Customization of various flavors including instant coffee, latte, cappuccino|data-i18n="solutions_rd_overview_en">From concept to finished formulation — in-house R\&D with 200+ recipe library|g' \
    "$FILE"

  # Capabilities section title
  sed -i '' \
    's|data-i18n="product_coffee_capabilities_title">Our Capabilities|data-i18n="solutions_rd_cap_title">Our R\&D Capabilities|g' \
    "$FILE"

  # Card 2: Ingredient Sourcing (was Flexible Production)
  sed -i '' \
    's|data-i18n="solutions_rd_cap_flex_title">Flexible Production|data-i18n="solutions_rd_cap_flex_title">Ingredient Sourcing|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_rd_cap_flex_desc">MOQ from 500. Multiple specs and flavors with quick switch and fast delivery.|data-i18n="solutions_rd_cap_flex_desc">Global ingredient supply chain with strict quality screening. Sourcing functional actives, natural extracts, vitamins, minerals, and specialty raw materials.|g' \
    "$FILE"

  # Card 3: Flavor & Sensory Testing (was Custom Packaging)
  sed -i '' \
    's|data-i18n="solutions_rd_cap_pack_title">Custom Packaging|data-i18n="solutions_rd_cap_pack_title">Flavor \&amp; Sensory Testing|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_rd_cap_pack_desc">Cans, pouches, boxes, stick packs. Multiple formats with brand-customized design.|data-i18n="solutions_rd_cap_pack_desc">Professional sensory evaluation panel with trained tasters. Flavor profiling, stability testing, and accelerated shelf-life studies for all product categories.|g' \
    "$FILE"

  # CTA fallbacks
  sed -i '' \
    's|data-i18n="solutions_rd_cta_title">Need Coffee Brewing OEM/ODM Services?|data-i18n="solutions_rd_cta_title">Need Custom Formula Development?|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_rd_cta_sample">Get Free Samples|data-i18n="solutions_rd_cta_sample">Request R\&D Consultation|g' \
    "$FILE"
done

# ============ TASK 2: PACKAGING PAGE ============
echo "--- Packaging Page ---"

for DEVICE in pc mobile tablet; do
  FILE="$BASE/src/pages/solutions/packaging/index-${DEVICE}.html"
  echo "  Processing $FILE"

  # Hero: Change image src and alt
  sed -i '' \
    's|src="/assets/images/oem/products/coffee.webp"|src="/assets/images/oem/solutions/packaging-hero.webp"|g' \
    "$FILE"
  sed -i '' \
    's|alt="Coffee Brewing"|alt="Packaging and Label Compliance"|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="alt_coffee_brewing"|data-i18n="solutions_packaging_alt_hero"|g' \
    "$FILE"

  # Hero: Change badge
  sed -i '' \
    's|<span>OEM / ODM</span>|<span data-i18n="solutions_packaging_badge">Packaging / Labeling</span>|g' \
    "$FILE"

  # Hero subtitle fallbacks
  sed -i '' \
    's|data-i18n="solutions_packaging_hero_title">Coffee Brewing|data-i18n="solutions_packaging_hero_title">Packaging \&amp; Label Compliance|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_hero_subtitle">Rich aroma, instant enjoyment|data-i18n="solutions_packaging_hero_subtitle">Global-Ready Packaging, Compliant Labels|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_hero_subtitle_en">Rich Aroma, Instant Enjoyment|data-i18n="solutions_packaging_hero_subtitle_en">Global-Ready Packaging, Compliant Labels|g' \
    "$FILE"

  # Overview section: change i18n keys and fallbacks
  sed -i '' \
    's|data-i18n="product_coffee_overview_title">Coffee Mix — OEM/ODM Manufacturing|data-i18n="solutions_packaging_overview_title">Packaging \&amp; Label Compliance Services|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="product_coffee_overview_desc">Instant coffee, latte, cappuccino, and more. Custom flavors available.|data-i18n="solutions_packaging_overview">Navigate complex global labeling regulations with confidence. We provide end-to-end packaging design and regulatory-compliant labeling services covering 30+ countries, ensuring your products meet every market'\''s requirements.|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_overview_en">Customization of various flavors including instant coffee, latte, cappuccino|data-i18n="solutions_packaging_overview_en">Navigate complex global labeling regulations with confidence — 30+ country compliance|g' \
    "$FILE"

  # Capabilities section title
  sed -i '' \
    's|data-i18n="product_coffee_capabilities_title">Our Capabilities|data-i18n="solutions_packaging_cap_title">Our Packaging Capabilities|g' \
    "$FILE"

  # Card 1: Packaging Design (was Formula R&D)
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_rd_title">Formula R\&D|data-i18n="solutions_packaging_cap_rd_title">Packaging Design|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_rd_desc">Professional R\&D team with 200+ recipe library. Full custom development from concept to finished product.|data-i18n="solutions_packaging_cap_rd_desc">Professional packaging design including structural design, material selection, and visual branding. Pouches, cans, boxes, stick packs, and custom formats.|g' \
    "$FILE"

  # Card 2: Label Compliance (was Flexible Production)
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_flex_title">Flexible Production|data-i18n="solutions_packaging_cap_flex_title">Label Compliance|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_flex_desc">MOQ from 500. Multiple specs and flavors with quick switch and fast delivery.|data-i18n="solutions_packaging_cap_flex_desc">Regulatory-compliant label development for US FDA, EU, ASEAN, China, Middle East and more. Nutrition facts, ingredient declarations, allergen warnings, and claims substantiation.|g' \
    "$FILE"

  # Card 3: Multi-Language Packaging (was Custom Packaging)
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_pack_title">Custom Packaging|data-i18n="solutions_packaging_cap_pack_title">Multi-Language Packaging|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_pack_desc">Cans, pouches, boxes, stick packs. Multiple formats with brand-customized design.|data-i18n="solutions_packaging_cap_pack_desc">Multi-language label production with native translation validation. Supporting 15+ languages for global market access with consistent brand presentation.|g' \
    "$FILE"

  # Card 4: Sustainable Materials (was Quality Assurance)
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_quality_title">Quality Assurance|data-i18n="solutions_packaging_cap_quality_title">Sustainable Materials|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_cap_quality_desc">HACCP/FDA/ISO triple certified. Full inspection per batch to ensure product safety and compliance.|data-i18n="solutions_packaging_cap_quality_desc">Eco-friendly packaging options including recyclable, biodegradable, and post-consumer recycled materials. FSC-certified paper and food-grade RPET options available.|g' \
    "$FILE"

  # CTA fallbacks
  sed -i '' \
    's|data-i18n="solutions_packaging_cta_title">Need Coffee Brewing OEM/ODM Services?|data-i18n="solutions_packaging_cta_title">Need Packaging \&amp; Label Compliance?|g' \
    "$FILE"
  sed -i '' \
    's|data-i18n="solutions_packaging_cta_sample">Get Free Samples|data-i18n="solutions_packaging_cta_sample">Get Label Review|g' \
    "$FILE"
done

# ============ TASK 3: SOLUTIONS INDEX CARDS ============
echo "--- Solutions Index Cards ---"

# PC version - replace 6 gradient cards with img cards
PC_FILE="$BASE/src/pages/solutions/index-pc.html"
echo "  Processing PC cards"

# Card 1: OEM
sed -i '' 's|<div class="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">\
              <span class="material-symbols-outlined text-6xl text-white/90">precision_manufacturing</span>\
            </div>|<div class="h-48 relative overflow-hidden">\
              <img src="/assets/images/oem/solutions/card-oem.webp" alt="OEM Custom Manufacturing" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
            </div>|g' "$PC_FILE"

# Card 2: ODM
sed -i '' 's|<div class="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">\
              <span class="material-symbols-outlined text-6xl text-white/90">design_services</span>\
            </div>|<div class="h-48 relative overflow-hidden">\
              <img src="/assets/images/oem/solutions/card-odm.webp" alt="ODM Private Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
            </div>|g' "$PC_FILE"

# Card 3: OBM
sed -i '' 's|<div class="h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">\
              <span class="material-symbols-outlined text-6xl text-white/90">verified</span>\
            </div>|<div class="h-48 relative overflow-hidden">\
              <img src="/assets/images/oem/solutions/card-obm.webp" alt="OBM Own Brand" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
            </div>|g' "$PC_FILE"

# Card 4: R&D
sed -i '' 's|<div class="h-48 bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">\
              <span class="material-symbols-outlined text-6xl text-white/90">science</span>\
            </div>|<div class="h-48 relative overflow-hidden">\
              <img src="/assets/images/oem/solutions/card-rd.webp" alt="R\&D and Flavor Lab" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
            </div>|g' "$PC_FILE"

# Card 5: Packaging
sed -i '' 's|<div class="h-48 bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">\
              <span class="material-symbols-outlined text-6xl text-white/90">inventory</span>\
            </div>|<div class="h-48 relative overflow-hidden">\
              <img src="/assets/images/oem/solutions/card-packaging.webp" alt="Packaging and Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
            </div>|g' "$PC_FILE"

# Card 6: Contact (special - dashed border)
# Contact card stays as before (it's already different from the others)
# Just removing the gradient header since contact card uses a different structure

echo "  PC cards done - Contact card kept as-is (different structure)"

# Tablet version
TB_FILE="$BASE/src/pages/solutions/index-tablet.html"
echo "  Processing Tablet cards"

# In tablet, the cards have h-36 instead of h-48 and text-5xl instead of text-6xl
# Pattern: using the specific card name to differentiate

# Card 1: OEM - blue
sed -i '' 's|<div class="h-36 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">\
                <span class="material-symbols-outlined text-5xl text-white/90">precision_manufacturing</span>\
              </div>|<div class="h-36 relative overflow-hidden">\
                <img src="/assets/images/oem/solutions/card-oem.webp" alt="OEM Custom Manufacturing" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
              </div>|g' "$TB_FILE"

# Card 2: ODM - green
sed -i '' 's|<div class="h-36 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">\
                <span class="material-symbols-outlined text-5xl text-white/90">design_services</span>\
              </div>|<div class="h-36 relative overflow-hidden">\
                <img src="/assets/images/oem/solutions/card-odm.webp" alt="ODM Private Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
              </div>|g' "$TB_FILE"

# Card 3: OBM - purple
sed -i '' 's|<div class="h-36 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">\
                <span class="material-symbols-outlined text-5xl text-white/90">verified</span>\
              </div>|<div class="h-36 relative overflow-hidden">\
                <img src="/assets/images/oem/solutions/card-obm.webp" alt="OBM Own Brand" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
              </div>|g' "$TB_FILE"

# Card 4: R&D - amber
sed -i '' 's|<div class="h-36 bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">\
                <span class="material-symbols-outlined text-5xl text-white/90">science</span>\
              </div>|<div class="h-36 relative overflow-hidden">\
                <img src="/assets/images/oem/solutions/card-rd.webp" alt="R\&D and Flavor Lab" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
              </div>|g' "$TB_FILE"

# Card 5: Packaging - rose
sed -i '' 's|<div class="h-36 bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">\
                <span class="material-symbols-outlined text-5xl text-white/90">inventory</span>\
              </div>|<div class="h-36 relative overflow-hidden">\
                <img src="/assets/images/oem/solutions/card-packaging.webp" alt="Packaging and Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />\
              </div>|g' "$TB_FILE"

echo "  Tablet cards done"

# Mobile version - uses different layout (list-style, not grid)
# The mobile version uses small icon boxes, not h-48/h-36 cards
# So no changes needed for mobile - the gradient icons there are small (w-14 h-14)

echo "  Mobile cards - List style layout, no gradient image blocks to replace (keeping small icons)"

# ============ TASK 4: OEM/ODM/OBM HERO IMAGES ============
echo "--- OEM/ODM/OBM Hero Images ---"

# OEM: factory-1.webp → /assets/images/oem/solutions/oem-hero.webp
for DEVICE in pc mobile tablet; do
  FILE="$BASE/src/pages/solutions/oem/index-${DEVICE}.html"
  echo "  OEM $DEVICE"
  sed -i '' \
    's|src="/assets/images/oem/factory/factory-1.webp"|src="/assets/images/oem/solutions/oem-hero.webp"|g' \
    "$FILE"
done

# ODM: factory-1.webp → /assets/images/oem/solutions/odm-hero.webp
for DEVICE in pc mobile tablet; do
  FILE="$BASE/src/pages/solutions/odm/index-${DEVICE}.html"
  echo "  ODM $DEVICE"
  sed -i '' \
    's|src="/assets/images/oem/factory/factory-1.webp"|src="/assets/images/oem/solutions/odm-hero.webp"|g' \
    "$FILE"
done

# OBM: factory-1.webp → /assets/images/oem/solutions/obm-hero.webp
for DEVICE in pc mobile tablet; do
  FILE="$BASE/src/pages/solutions/obm/index-${DEVICE}.html"
  echo "  OBM $DEVICE"
  sed -i '' \
    's|src="/assets/images/oem/factory/factory-1.webp"|src="/assets/images/oem/solutions/obm-hero.webp"|g' \
    "$FILE"
done

echo ""
echo "=== ALL CHANGES COMPLETE ==="
