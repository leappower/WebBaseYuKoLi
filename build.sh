#!/bin/bash
# build.sh — SSG 构建 (BrewYuKoLi)
# Usage: ./build.sh [dev|production]
#   (no arg) = production build (default)
#   dev      = development build (no version bump)
#
# 文件替换规范（统一使用 python3）:
#   - 所有字符串/正则替换使用 python3，避免 sed 跨平台不兼容
#   - 禁止: sed -i, sed -i.bak (macOS 和 Linux 行为不一致)
#   - 使用: python3 -c "import re; ..." (跨平台一致，项目标准)

set -euo pipefail

BUILD_MODE="${1:-production}"
[ "$BUILD_MODE" = "dev" ] && WEBPACK_MODE="development" || WEBPACK_MODE="production"

echo "🏗️  Building ($BUILD_MODE)..."

export SRC="src"
export DIST="dist"

# ─── 版本号 (毫秒时间戳) ────────────────────────────────────
VERSION=$(python3 -c "import time; print(int(time.time()*1000))")
VERSION_TAG="v=$VERSION"
BUILD_TS=$(date -u "+%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "   Build: $BUILD_TS"
echo "   Version: $VERSION_TAG"

# ─── Pre-flight checks ───────────────────────────────────────────
INDEX_SIZE=$(wc -c < "$SRC/index.html" | tr -d ' ')
if [ "$INDEX_SIZE" -lt 1000 ]; then
  echo "❌ ERROR: src/index.html is suspiciously small (${INDEX_SIZE} bytes)."
  echo "   Expected ~8000+ bytes. File may be corrupted."
  exit 1
fi

# ─── 0. 图片使用审计 (仅首次或 force) ─────────────────────────
# 当 IMAGE_AUDIT_FORCE=1 时强制运行；否则仅当审计报告不存在时运行
if [ "${IMAGE_AUDIT_FORCE:-0}" = "1" ] || [ ! -f "docs/analysis/image-usage-audit.md" ]; then
  echo "📸 Running image usage audit..."
  node scripts/audit-image-usage.js || echo "  ⚠️  Audit had warnings (continuing)"
fi

# ─── 1. Clean dist ─────────────────────────────────────────────
rm -rf "$DIST"
mkdir -p "$DIST"

# ─── 2. Tailwind CSS + Webpack ──────────────────────────────────
# ─── 1.5. Breadcrumb bundle ────────────────────────────────
echo "🥖 Concatenating breadcrumb modules..."
bash scripts/concat-breadcrumb.sh /tmp/breadcrumb-bundle.js

echo "📦 Building CSS + JS..."
npm run build:css 2>&1 | tail -1
if [ "$BUILD_MODE" = "dev" ]; then
  npx webpack --env devBuild 2>&1 | tail -3 || echo "  ⚠️  Webpack had non-fatal errors"
else
  npx webpack --mode=production 2>&1 | tail -3 || echo "  ⚠️  Webpack had non-fatal errors"
fi

# ─── 2.5. Sharp 多尺寸图片 Pipeline ─────────────────────────────
# SKIP_RESIZE=1 可跳过（用于快速开发构建）
if [ "${SKIP_RESIZE:-0}" != "1" ]; then
  echo "🖼️  Running sharp image resize pipeline..."
  node scripts/resize-images.js
  if [ $? -ne 0 ]; then
    echo "  ⚠️  Image resize had errors (check .cache/resize-errors.log)"
  fi
else
  echo "⏭️  SKIP_RESIZE=1 — skipping image resize"
fi

# ─── 3. i18n cache version ──────────────────────────────────────
I18N_CACHE_TS=$(python3 -c "import time; print(int(time.time()))")
python3 -c "
import re, os
fp = os.path.expandvars('$SRC/assets/js/translations.js')
with open(fp) as f: c = f.read()
c = re.sub(r'var I18N_CACHE_V = \d+;', 'var I18N_CACHE_V = $I18N_CACHE_TS;', c)
with open(fp, 'w') as f: f.write(c)
" 2>/dev/null || echo "  ⚠️  i18n cache bump failed"
echo "🔄 i18n cache version → $I18N_CACHE_TS"

# ─── 4. Assets ──────────────────────────────────────────────────
echo "📦 Syncing assets..."
sync_assets() {
  local src_dir="$1"
  local ext_glob="$2"
  local full_src="$SRC/assets/$src_dir"
  [ -d "$full_src" ] || return 0
  find "$full_src" -type f -name "$ext_glob" -print0 | while IFS= read -r -d '' f; do
    rel="${f#$SRC/}"
    mkdir -p "$DIST/$(dirname "$rel")"
    cp "$f" "$DIST/$rel"
  done
}

sync_assets "js"       "*.js"
sync_assets "css"      "*.css"
sync_assets "fonts"    "*"
sync_assets "lang"     "*.json"
sync_assets "data"     "*.json"
sync_assets "images"   "*"
sync_assets "video"    "*"
sync_assets "pdf"      "*.pdf"
sync_assets "files"    "*.pdf"

# ─── 4.5. 验证图片引用 ──────────────────────────────────────────
echo "🔍 Verifying image references..."
node scripts/verify-image-refs.js
if [ $? -ne 0 ]; then
  echo "  ⚠️  Image reference verification had issues (continuing)"
fi

# ─── 5. site.config.js → dist/ ─────────────────────────────────
# Must be at /site.config.js for SPA shell (after webpack so not cleaned)
cp "$SRC/site.config.js" "$DIST/site.config.js"

# ─── 6. HTML pages (平铺到 dist/，去掉 /pages/ 前缀) ──────────
echo "📦 Syncing HTML pages..."
find "$SRC/pages" -name '*.html' -print0 | while IFS= read -r -d '' f; do
  # src/pages/home/index-pc.html → dist/home/index-pc.html (去掉 /pages/)
  rel="${f#$SRC/pages/}"
  mkdir -p "$DIST/$(dirname "$rel")"
  cp "$f" "$DIST/$rel"
done
cp "$SRC/index.html" "$DIST/index.html"

# ─── 6.5. Replace %DOMAIN% placeholder ──────────────────────────
python3 -c "
import os
DOMAIN = 'https://brew.yukoli.com'
for root in [os.environ['DIST'], os.environ['SRC']]:
    for r, d, fs in os.walk(root):
        for f in fs:
            if not f.endswith('.html'): continue
            fp = os.path.join(r, f)
            with open(fp) as fh: c = fh.read()
            if '%DOMAIN%' not in c: continue
            nc = c.replace('%DOMAIN%', DOMAIN)
            with open(fp, 'w') as fh: fh.write(nc)
            print('  ', fp)
" 2>/dev/null || echo "  ⚠️  DOMAIN replacement skipped"
echo "🔧 Replaced %DOMAIN% placeholders"

# CNAME must be a file (not directory) for GitHub Pages custom domain
rm -rf "$DIST/CNAME"

# ─── 7. Root files ──────────────────────────────────────────────
cp "CNAME"                       "$DIST/CNAME"             2>/dev/null || true
cp "$SRC/404.html"               "$DIST/404.html"          2>/dev/null || true
cp "$SRC/robots.txt"             "$DIST/robots.txt"        2>/dev/null || true
cp "$SRC/manifest.json"          "$DIST/manifest.json"     2>/dev/null || true
touch "$DIST/.nojekyll"

# ─── 8. sw.js 版本号注入 ──────────────────────────────────────
SW_SRC=""
[ -f "sw.js" ]      && SW_SRC="sw.js"
[ -z "$SW_SRC" ] && [ -f "$SRC/sw.js" ] && SW_SRC="$SRC/sw.js"
if [ -n "$SW_SRC" ]; then
  cp "$SW_SRC" "$DIST/sw.js"
  if [ "$BUILD_MODE" != "dev" ]; then
    python3 -c "
import re
with open('$DIST/sw.js') as f: c = f.read()
c = re.sub(r'(var SW_VERSION = \")[^\"]*(\";)', r'\1v$VERSION\2', c)
with open('$DIST/sw.js', 'w') as f: f.write(c)
" 2>/dev/null || echo "  ⚠️  sw.js version injection failed"
    echo "  📦 sw.js → v$VERSION"
  fi
fi

# ─── 9. SSG: 生成路由 index.html ──────────────────────────────
echo "🔄 Running SSG..."
node scripts/build-ssg.js 2>&1 | grep -E 'Step|✓|✅|WARN|ERROR' || echo "  (SSG completed)"

# ─── 10. Sitemap ─────────────────────────────────────────────────
node scripts/generate-sitemap.js 2>/dev/null || echo "  ⚠️  sitemap generation skipped"

# ─── 10.5. Critical CSS 内联 (production only) ─────────────────
if [ "$BUILD_MODE" != "dev" ] && [ -f "$SRC/assets/css/critical.css" ]; then
  echo "🎨 Inlining critical CSS..."
  CRITICAL=$(python3 -c "
with open('$SRC/assets/css/critical.css') as f:
    print(f.read().replace('\n', '\\n'))
")
  python3 -c "
import os, re
dist = os.environ['DIST']
critical_path = os.path.join(os.environ['SRC'], 'assets/css/critical.css')
with open(critical_path) as f:
    critical_css = f.read()
# Remove existing external critical.css link if present
for root, dirs, files in os.walk(dist):
    for f in files:
        if not f.endswith('.html'): continue
        fp = os.path.join(root, f)
        with open(fp) as fh: c = fh.read()
        if '<link rel=\"stylesheet\" href=\"/assets/css/critical.css\"' in c:
            c = c.replace('<link rel=\"stylesheet\" href=\"/assets/css/critical.css\">', '')
        # Inject critical CSS before </head>
        if '</head>' in c and '<style id=\"critical-css\">' not in c:
            c = c.replace('</head>', '<style id=\"critical-css\">' + critical_css + '</style></head>')
            with open(fp, 'w') as fh: fh.write(c)
        # Update existing critical style block if it exists
        elif '<style id=\"critical-css\">' in c:
            c = re.sub(
                r'<style id=\"critical-css\">.*?</style>',
                '<style id=\"critical-css\">' + critical_css + '</style>',
                c,
                flags=re.DOTALL
            )
            with open(fp, 'w') as fh: fh.write(c)
  "
  echo "  ✅ Critical CSS inlined"
fi

# ─── 11. 版本号注入 (dev + production) ──────────────────────────
if true; then
  echo "🔄 Bumping version to $VERSION_TAG..."
  python3 -c "
import os, re
root = os.environ.get('DIST', 'dist')
version = '$VERSION'
for r, d, fs in os.walk(root):
    for f in fs:
        fp = os.path.join(r, f)
        if not (f.endswith('.html') or f.endswith('.css')):
            continue
        with open(fp) as fh:
            c = fh.read()
        nc = re.sub(r'\?v=[a-zA-Z0-9._-]*', '?v=' + version, c)
        if nc != c:
            with open(fp, 'w') as fh:
                fh.write(nc)
"
  echo "  ✅ Version bump complete"
fi

# ─── 10.7. Blur-up LQIP 占位 (production only) ───────────────────
if [ "$BUILD_MODE" != "dev" ] && ls "$SRC/assets/images/"*blur.webp 2>/dev/null | head -1 >/dev/null 2>&1; then
  echo "🖼️  Injecting blur-up placeholders for hero images..."
  node scripts/inject-blur-placeholders.js "$SRC" "$DIST" 2>&1 || echo "  ⚠️  Blur-up injection had non-fatal errors"
  echo "  ✅ Hero blur-up placeholders injected"
fi

# ─── Fix permissions ──────────────────────────────────────────
chmod -R a+rX "$DIST" 2>/dev/null || true

# ─── Build identifier ──────────────────────────────────────────
echo "$VERSION"  > "$DIST/VERSION.txt"
echo "$BUILD_TS" >> "$DIST/VERSION.txt"

# ─── Summary ────────────────────────────────────────────────────
FILES=$(find "$DIST" -type f | wc -l | tr -d ' ')
echo ""
echo "✅ Build complete: $FILES files in dist/"
echo "   Version: $VERSION_TAG"
echo "   Build at: $BUILD_TS"
echo "   i18n cache: $I18N_CACHE_TS"
