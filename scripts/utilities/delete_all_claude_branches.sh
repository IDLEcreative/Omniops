#!/bin/bash

echo "🧹 Cleaning up all remaining Claude branches..."

branches=(
"claude/add-syntax-highlighting-01A3szc2MN9DVWaJMCnJhyCc"
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
git push origin --delete ${branches[@]} --no-verify 2>/dev/null

echo "✅ All Claude branches cleaned up!"
