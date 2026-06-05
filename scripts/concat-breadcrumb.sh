#!/bin/bash
# concat-breadcrumb.sh — 自动按依赖顺序合并面包屑三模块
#
# 依赖顺序: breadcrumb-data.js → breadcrumb-render.js → breadcrumb.js
#
# 用途: 生成临时 bundle，供 ui-bundle.js 替换使用
# 用法: ./scripts/concat-breadcrumb.sh [output-path]
#   默认输出到 stdout
#   指定 output-path 则写入文件

set -euo pipefail

SRC="src/assets/js"
FILES=(
  "$SRC/breadcrumb-data.js"
  "$SRC/breadcrumb-render.js"
  "$SRC/breadcrumb.js"
)

OUTPUT="${1:-}"

if [ -n "$OUTPUT" ]; then
  > "$OUTPUT"
  for f in "${FILES[@]}"; do
    if [ ! -f "$f" ]; then
      echo "ERROR: $f not found" >&2
      exit 1
    fi
    echo "// --- $(basename $f) ---" >> "$OUTPUT"
    cat "$f" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
  done
  echo "✅ Breadcrumb bundle written to $OUTPUT ($(wc -c < "$OUTPUT") bytes)"
else
  for f in "${FILES[@]}"; do
    echo "// --- $(basename $f) ---"
    cat "$f"
    echo ""
  done
fi
