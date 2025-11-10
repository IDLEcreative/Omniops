#!/bin/bash

# Setup Git Hooks for Agent Knowledge Base Automation
#
# This script installs git hooks that automatically regenerate the agent
# knowledge base when E2E test files are modified.
#
# Usage:
#   bash scripts/setup-git-hooks.sh

set -e

echo "🔧 Setting up git hooks for agent knowledge base automation..."
echo ""

# Ensure .git/hooks directory exists
mkdir -p .git/hooks

# Install post-commit hook
if [ -f ".git/hooks/post-commit" ]; then
  echo "⚠️  post-commit hook already exists"
  echo "   Backing up to .git/hooks/post-commit.backup"
  mv .git/hooks/post-commit .git/hooks/post-commit.backup
fi

echo "📝 Creating post-commit hook symlink..."
ln -sf ../../scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh .git/hooks/post-commit

# Make executable
chmod +x .git/hooks/post-commit
chmod +x scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh

echo ""
echo "✅ Git hooks installed successfully!"
echo ""
echo "📚 What happens now:"
echo "   • When you commit E2E test changes, agent knowledge base regenerates automatically"
echo "   • Regenerated docs appear as uncommitted changes"
echo "   • Commit the docs with: git add docs/10-ANALYSIS/ && git commit -m 'docs: regenerate agent knowledge'"
echo ""
echo "🔄 Manual regeneration:"
echo "   npx tsx scripts/extract-workflows-from-e2e.ts"
echo "   npx tsx scripts/generate-agent-training-data.ts"
echo ""
echo "🌐 CI/CD automation:"
echo "   GitHub Actions workflow will auto-commit regenerated docs on push"
echo ""
