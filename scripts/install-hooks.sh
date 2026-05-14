#!/bin/bash
# install-hooks.sh — Install Git Hooks via lefthook
# Fallback: if lefthook not available, copy from scripts/githooks/ (deprecated)
#
# Usage: bash scripts/install-hooks.sh

set -euo pipefail

GIT_DIR="$(git rev-parse --git-dir)"

echo "🔧 Installing Git hooks..."

# Try lefthook first (preferred)
if command -v npx &>/dev/null && [ -f "lefthook.yml" ]; then
  echo "  Using lefthook (lefthook.yml)"
  # Clean stale .old backups that block lefthook install
  rm -f "$GIT_DIR/hooks/pre-commit.old" "$GIT_DIR/hooks/pre-push.old"
  npx lefthook install 2>/dev/null && {
    echo ""
    echo "✅ Git hooks installed via lefthook!"
    echo "   pre-commit:  commit-msg format, syntax, ESLint, debug check, project lint"
    echo "   pre-push:    branch protection, full lint, build smoke"
    exit 0
  }
  echo "  ⚠ lefthook install failed, falling back to manual install..."
fi

# Fallback: manual install from scripts/githooks/ (DEPRECATED)
HOOKS_DIR="$(cd "$(dirname "$0")" && pwd)/githooks"
echo "  ⚠ Using legacy hooks from $HOOKS_DIR"

cp "$HOOKS_DIR/pre-commit" "$GIT_DIR/hooks/pre-commit"
chmod +x "$GIT_DIR/hooks/pre-commit"

cp "$HOOKS_DIR/pre-push" "$GIT_DIR/hooks/pre-push"
chmod +x "$GIT_DIR/hooks/pre-push"

echo "✅ Legacy hooks installed."
