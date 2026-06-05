#!/bin/bash
set -e
echo "=== 构建验证 ==="
npm run build
echo "=== 测试验证 ==="
npm run test
echo "=== 关键文件检查 ==="
test -f dist/index.html
test -f dist/assets/js/swup-init.js
test -f dist/assets/js/lib/runtime-guard.js
test -f dist/assets/js/lib/i18n-core.js
echo "=== 通过 ==="
