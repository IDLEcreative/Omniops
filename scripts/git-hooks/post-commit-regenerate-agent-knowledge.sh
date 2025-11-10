#!/bin/bash

# Post-commit hook to regenerate agent knowledge base when E2E tests change
#
# This hook automatically runs after each commit to keep agent knowledge current.
# It only regenerates if E2E test files were modified in the commit.
#
# Installation:
#   ln -s ../../scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh .git/hooks/post-commit
#   chmod +x scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh

# Check if E2E test files were changed in this commit
E2E_FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD | grep -E '__tests__/playwright/.*\.spec\.ts$|__tests__/utils/playwright/.*\.ts$')

if [ -z "$E2E_FILES_CHANGED" ]; then
  # No E2E test files changed, skip regeneration
  exit 0
fi

echo ""
echo "🤖 E2E test files changed - regenerating agent knowledge base..."
echo ""

# Extract workflows
echo "📄 Extracting workflows from E2E tests..."
npx tsx scripts/extract-workflows-from-e2e.ts

if [ $? -ne 0 ]; then
  echo "❌ Workflow extraction failed"
  exit 1
fi

# Generate agent training data
echo "🧠 Generating agent training data..."
npx tsx scripts/generate-agent-training-data.ts

if [ $? -ne 0 ]; then
  echo "❌ Agent training data generation failed"
  exit 1
fi

# Check if documentation changed
if git diff --quiet docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json; then
  echo ""
  echo "ℹ️  Agent knowledge base is already up to date"
else
  echo ""
  echo "✅ Agent knowledge base regenerated successfully!"
  echo ""
  echo "📝 Updated files (not yet committed):"
  echo "   - docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md"
  echo "   - docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md"
  echo "   - docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json"
  echo ""
  echo "💡 To commit these changes:"
  echo "   git add docs/10-ANALYSIS/"
  echo '   git commit -m "docs: regenerate agent knowledge base"'
  echo ""
fi

exit 0
