#!/bin/bash
# install-hooks.sh — 安装 Git Hooks
# Usage: bash scripts/install-hooks.sh

set -euo pipefail

HOOKS_DIR="$(cd "$(dirname "$0")" && pwd)/githooks"
GIT_DIR="$(git rev-parse --git-dir)"

echo "🔧 Installing Git hooks..."

# Pre-commit
cp "$HOOKS_DIR/pre-commit" "$GIT_DIR/hooks/pre-commit"
chmod +x "$GIT_DIR/hooks/pre-commit"
echo "  ✓ pre-commit installed"

# Pre-push (replace existing)
cp "$HOOKS_DIR/pre-push" "$GIT_DIR/hooks/pre-push"
chmod +x "$GIT_DIR/hooks/pre-push"
echo "  ✓ pre-push installed (replaced)"

# Commit-msg (keep existing prepare-commit-msg)
if [ -f "$HOOKS_DIR/commit-msg" ]; then
  cp "$HOOKS_DIR/commit-msg" "$GIT_DIR/hooks/commit-msg"
  chmod +x "$GIT_DIR/hooks/commit-msg"
  echo "  ✓ commit-msg installed"
fi

echo ""
echo "✅ Git hooks installed! Commits and pushes are now protected."
echo ""
echo "   pre-commit:  8 checks (message format, syntax, secrets, encoding...)"
echo "   pre-push:    5 checks (branch protection, lint, build verification...)"
