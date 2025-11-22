#!/bin/bash

echo "🔄 Closing merged PRs on GitHub..."

# PR #35 - Test coverage
git push origin --delete claude/testing-mi57dlto3kohq6js-013eDQjk3bfpXzxFyf23SxET 2>/dev/null

# PR #34 - Multi-seat login  
git push origin --delete claude/implement-multi-seat-login-011CUK8afw54g5GVbUCGbQWk 2>/dev/null

# PR #30 - MAKER framework
git push origin --delete claude/optimize-haiku-usage-01DPpP9EconEgFK7NtdVDNpz 2>/dev/null

# PR #33 - Security audit
git push origin --delete claude/security-audit-016yLSSyppxYHL6vSJZUfLKG 2>/dev/null

echo "✅ Remote branches deleted. PRs should auto-close."
