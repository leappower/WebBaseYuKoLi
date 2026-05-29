#!/bin/bash
# build.sh — SSG 构建 (BrewYuKoLi)
# Usage: ./build.sh [dev|production]
#   (no arg) = production build (default)
#   dev      = development build (no version bump)

set -euo pipefail

BUILD_MODE="${1:-production}"
[ "$BUILD_MODE" = "dev" ] && WEBPACK_MODE="development" || WEBPACK_MODE="production"

echo "🏗️  Building ($BUILD_MODE)..."

SRC="src"
DIST="dist"

# ─── 版本号 (毫秒时间戳, 兼容 Linux + macOS) ─────────────────
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

# ─── 0. Clean dist ─────────────────────────────────────────────
rm -rf "$DIST"
mkdir -p "$DIST"

# ─── 1. site.config.js → dist/ ──────────────────────────────────
# Must be available at /site.config.js for SPA shell
cp "$SRC/site.config.js" "$DIST/site.config.js"

# ─── 2. Tailwind CSS + Webpack ──────────────────────────────────
echo "📦 Building CSS + JS..."
npm run build:css 2>&1 | tail -1
if [ "$BUILD_MODE" = "dev" ]; then
  npx webpack --env devBuild 2>&1 | tail -3 || echo "  ⚠️  Webpack had non-fatal errors"
else
  npx webpack --mode=production 2>&1 | tail -3 || echo "  ⚠️  Webpack had non-fatal errors"
fi

# ─── 3. i18n cache version ──────────────────────────────────────
I18N_CACHE_TS=$(python3 -c "import time; print(int(time.time()))")
python3 -c "
import re, os
fp = os.path.expandvars('$SRC/assets/js/translations.js')
with open(fp) as f: c = f.read()
c = re.sub(r'var I18N_CACHE_V = \d+;', 'var I18N_CACHE_V = $I18N_CACHE_TS;', c)
with open(fp, 'w') as f: f.write(c)
" 2>/dev/null || echo "  ⚠️  i18n cache bump failed (translations.js may use different format)"
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

# ─── 5. HTML pages ─────────────────────────────────────────────
echo "📦 Syncing HTML pages..."
find "$SRC/pages" -name '*.html' -print0 | while IFS= read -r -d '' f; do
  rel="${f#$SRC/}"
  mkdir -p "$DIST/$(dirname "$rel")"
  cp "$f" "$DIST/$rel"
done
cp "$SRC/index.html" "$DIST/index.html"

# ─── 5.5. Replace %DOMAIN% placeholder ──────────────────────────
find "$DIST" -name '*.html' -exec sed -i.bak 's|%DOMAIN%|https://brew.yukoli.com|g' {} + && find "$DIST" -name '*.bak' -delete 2>/dev/null || true
find "$SRC" -name '*.html' -exec sed -i.bak 's|%DOMAIN%|https://brew.yukoli.com|g' {} + && find "$SRC" -name '*.bak' -delete 2>/dev/null || true
echo "🔧 Replaced %DOMAIN% placeholders"

# ─── 6. Root files ──────────────────────────────────────────────
cp "CNAME"                       "$DIST/CNAME"             2>/dev/null || true
cp "$SRC/404.html"               "$DIST/404.html"          2>/dev/null || true
cp "$SRC/robots.txt"             "$DIST/robots.txt"        2>/dev/null || true
cp "$SRC/manifest.json"          "$DIST/manifest.json"     2>/dev/null || true
touch "$DIST/.nojekyll"

# ─── 7. sw.js 版本号注入 ──────────────────────────────────────
# 优先根目录 sw.js，其次 src/sw.js
SW_SRC=""
[ -f "sw.js" ]      && SW_SRC="sw.js"
[ -z "$SW_SRC" ] && [ -f "$SRC/sw.js" ] && SW_SRC="$SRC/sw.js"
if [ -n "$SW_SRC" ]; then
  cp "$SW_SRC" "$DIST/sw.js"
  if [ "$BUILD_MODE" != "dev" ]; then
    # sed 跨平台兼容: -i.bak + rm .bak (兼容 macOS 和 Linux GHA)
    sed -i.bak "s/var SW_VERSION = \"[^\"]*\";/var SW_VERSION = \"v$VERSION\";/" "$DIST/sw.js" && rm -f "$DIST/sw.js.bak"
    echo "  📦 sw.js → v$VERSION"
  fi
fi

# ─── 8. SSG: 生成路由 index.html ──────────────────────────────
echo "🔄 Running SSG..."
node scripts/build-ssg.js 2>&1 | grep -E 'Step|✓|✅|WARN|ERROR' || echo "  (SSG completed)"

# ─── 9. Sitemap ─────────────────────────────────────────────────
node scripts/generate-sitemap.js 2>/dev/null || echo "  ⚠️  sitemap generation skipped"

# ─── 10. 版本号注入 (production only) ──────────────────────────
if [ "$BUILD_MODE" != "dev" ]; then
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

# ─── Fix permissions ──────────────────────────────────────────
chmod -R a+rX "$DIST" 2>/dev/null || true

# ─── Summary ────────────────────────────────────────────────────
FILES=$(find "$DIST" -type f | wc -l | tr -d ' ')
echo ""
echo "$VERSION"  > "$DIST/VERSION.txt"
echo "$BUILD_TS" >> "$DIST/VERSION.txt"
echo ""
echo "✅ Build complete: $FILES files in dist/"
echo "   Version: $VERSION_TAG"
echo "   Build at: $BUILD_TS"
echo "   i18n cache: $I18N_CACHE_TS"
