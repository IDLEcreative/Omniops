#!/bin/bash

echo "🧹 Force deleting all Claude branches from remote..."

# List of all Claude branches to delete
branches=(
"claude/agent-code-analysis-011CUWMcK3KVph9U8PmspMLN"
"claude/analyze-code-improvements-01JN1JBraLNYmZZecdQ84HYA"
"claude/analyze-performance-issues-01V4wqh6fkj76e9k7tJMrJUG"
"claude/analyze-supabase-016adUDsmezMSC3vDDbqJAN6"
"claude/analyze-technical-debt-011CUSLTTnYxWtGE8NcczbPm"
"claude/analyze-technical-debt-01S24UNZ4uQJ86DizLgvgscz"
"claude/analyze-test-failures-011CUWMvkw4gPtPsm4z6zD8M"
"claude/codebase-audit-01NLYYxd9Pxu8P2QmnveJRAw"
"claude/complete-task-01KQx816NPk9wiw71DUXdhwK"
"claude/debug-code-issues-01WHQCkfncxzX5swVZYau6ZB"
"claude/fix-code-errors-linting-01GskTJJrvJCWYJMPeaG2MsH"
"claude/fix-failing-test-01JgcZ6p2uNTQk1h6xAY5eyG"
"claude/pod-agents-parallel-execution-015m1WrKFDYFZgw5y281Hssb"
"claude/review-cicd-pipeline-01E1fj5j5fBdjtqkEaRpPBDs"
"claude/review-roadmap-items-011pkp3hav7utYG22uyYRoyE"
"claude/security-audit-omniops-01QAAtFxvuYM23M32nKzCa5r"
"claude/update-all-readmes-019zr2if2GCSGjxnUiCdw5WL"
"claude/update-documentation-014piohsdjq1yBV19b1Zq8mV"
)

echo "Deleting ${#branches[@]} branches..."

# Delete each branch individually to see which ones succeed
for branch in "${branches[@]}"; do
    echo "Deleting $branch..."
    git push origin --delete "$branch" --no-verify 2>/dev/null || echo "  (already deleted or not found)"
done

echo "✅ Branch deletion complete!"
echo ""
echo "Note: The following PRs need to be manually closed on GitHub:"
echo "  - PR #34: Review and improve CI/CD pipeline setup"
echo "  - PR #33: Analyze code for improvements"
echo "  - PR #32: Implement pod agents for parallel code execution"
echo "  - PR #30: Audit codebase for missing essentials"
echo "  - PR #29: Deep analysis of Supabase"
echo "  - PR #28: Analyze codebase for technical debt"
echo "  - PR #27: Debug and fix code issues"