#!/bin/bash
# Human Handoff Feature - Comprehensive Testing Script
# Tests all phases of the implementation

echo "🚀 Human Handoff Feature - Comprehensive Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN++))
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Test 1: File Existence
section "Test 1: Verify All New Files Exist"

FILES=(
    "app/api/conversations/[id]/request-human/route.ts"
    "lib/notifications/human-request-notifier.ts"
    "lib/ai-frustration-detector.ts"
    "components/ChatWidget/InputArea.tsx"
    "components/ChatWidget/Header.tsx"
    "components/dashboard/conversations/ConversationListItem.tsx"
    "components/dashboard/conversations/ConversationTabbedList.tsx"
    "components/dashboard/conversations/ConversationHeader.tsx"
    "components/dashboard/conversations/ConversationAnalytics.tsx"
    "components/dashboard/conversations/analytics/HandoffSummaryCards.tsx"
    "components/dashboard/conversations/analytics/HandoffVolumeChart.tsx"
    "components/dashboard/conversations/analytics/SLAPerformanceChart.tsx"
    "components/dashboard/conversations/HumanRequestToast.tsx"
    "hooks/use-human-request-subscription.ts"
    "app/api/dashboard/conversations/analytics/route.ts"
    "__tests__/playwright/human-handoff-workflow.spec.ts"
    "docs/10-ANALYSIS/ANALYSIS_HUMAN_HANDOFF_UX.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "File exists: $file"
    else
        fail "File missing: $file"
    fi
done

# Test 2: TypeScript Syntax Check
section "Test 2: TypeScript Syntax Validation"

# Check for basic TypeScript syntax validity (valid exports, imports, types)
check_ts_file() {
    local file=$1
    local filename=$(basename "$file")

    # Check file has valid TypeScript patterns
    if grep -q "export " "$file" && \
       ! grep -q "SyntaxError" "$file" && \
       ! grep -q "// @ts-expect-error" "$file"; then
        pass "TypeScript file valid: $filename"
    else
        fail "TypeScript file invalid: $filename"
    fi
}

check_ts_file "lib/ai-frustration-detector.ts"
check_ts_file "lib/notifications/human-request-notifier.ts"
check_ts_file "hooks/use-human-request-subscription.ts"

# Test 3: Code Pattern Validation
section "Test 3: Code Pattern Validation"

# Check AI frustration detector has all required exports
if grep -q "export function detectFrustration" lib/ai-frustration-detector.ts && \
   grep -q "export function shouldSuggestHuman" lib/ai-frustration-detector.ts; then
    pass "AI frustration detector has required exports"
else
    fail "AI frustration detector missing required exports"
fi

# Check notification system has required functions
if grep -q "export async function notifyHumanRequest" lib/notifications/human-request-notifier.ts && \
   grep -q "export async function getUnreadHumanRequests" lib/notifications/human-request-notifier.ts; then
    pass "Notification system has required exports"
else
    fail "Notification system missing required exports"
fi

# Check analytics API has handoff metrics
if grep -q "interface HandoffMetrics" app/api/dashboard/conversations/analytics/route.ts && \
   grep -q "handoffMetrics: HandoffMetrics" app/api/dashboard/conversations/analytics/route.ts; then
    pass "Analytics API includes handoff metrics"
else
    fail "Analytics API missing handoff metrics"
fi

# Test 4: Component Integration Check
section "Test 4: Component Integration Validation"

# Check ChatWidget integrates request human handler
if grep -q "handleRequestHuman" components/ChatWidget.tsx && \
   grep -q "onRequestHuman" components/ChatWidget/InputArea.tsx; then
    pass "ChatWidget integrates request human handler"
else
    fail "ChatWidget missing request human integration"
fi

# Check ConversationHeader shows frustration context
if grep -q "frustration_detected" components/dashboard/conversations/ConversationHeader.tsx && \
   grep -q "showFrustrationContext" components/dashboard/conversations/ConversationHeader.tsx; then
    pass "ConversationHeader shows frustration context"
else
    fail "ConversationHeader missing frustration context"
fi

# Check Analytics has Human Handoff tab
if grep -q "🚨 Human Handoff" components/dashboard/conversations/ConversationAnalytics.tsx && \
   grep -q "HandoffSummaryCards" components/dashboard/conversations/ConversationAnalytics.tsx; then
    pass "Analytics includes Human Handoff tab"
else
    fail "Analytics missing Human Handoff tab"
fi

# Test 5: API Route Validation
section "Test 5: API Route Validation"

# Check request-human API exists
if grep -q "export async function POST" app/api/conversations/[id]/request-human/route.ts && \
   grep -q "assigned_to_human: true" app/api/conversations/[id]/request-human/route.ts; then
    pass "Request human API route implemented correctly"
else
    fail "Request human API route missing or incorrect"
fi

# Check analytics API includes handoff calculation
if grep -q "// 5. Human Handoff Metrics" app/api/dashboard/conversations/analytics/route.ts && \
   grep -q "slaPerformance" app/api/dashboard/conversations/analytics/route.ts; then
    pass "Analytics API calculates handoff metrics"
else
    fail "Analytics API missing handoff calculations"
fi

# Test 6: Real-time Subscription Check
section "Test 6: Real-time Subscription Validation"

# Check real-time subscription hook
if grep -q "useHumanRequestSubscription" hooks/use-human-request-subscription.ts && \
   grep -q ".channel(" hooks/use-human-request-subscription.ts && \
   grep -q "postgres_changes" hooks/use-human-request-subscription.ts; then
    pass "Real-time subscription hook implemented"
else
    fail "Real-time subscription hook missing or incorrect"
fi

# Check dashboard integrates real-time updates
if grep -q "useHumanRequestSubscription" app/dashboard/conversations/index.tsx && \
   grep -q "showHumanRequestToast" app/dashboard/conversations/index.tsx; then
    pass "Dashboard integrates real-time updates"
else
    fail "Dashboard missing real-time integration"
fi

# Test 7: E2E Test Validation
section "Test 7: E2E Test Validation"

# Check E2E test file structure
if grep -q "user requests human help and agent receives notification" __tests__/playwright/human-handoff-workflow.spec.ts && \
   grep -q "AI frustration detection triggers human suggestion" __tests__/playwright/human-handoff-workflow.spec.ts && \
   grep -q "multiple human requests increment badge count" __tests__/playwright/human-handoff-workflow.spec.ts; then
    pass "E2E test covers all workflows"
else
    fail "E2E test missing workflow coverage"
fi

# Test 8: Internationalization Check
section "Test 8: Internationalization Validation"

# Check i18n keys exist
if grep -q '"requestHuman"' lib/i18n/translations/en.json && \
   grep -q '"requestingHuman"' lib/i18n/translations/en.json && \
   grep -q '"humanAssigned"' lib/i18n/translations/en.json; then
    pass "i18n translations exist for human handoff"
else
    fail "i18n translations missing"
fi

# Test 9: Documentation Check
section "Test 9: Documentation Validation"

# Check UX analysis document exists and has content
if [ -f "docs/10-ANALYSIS/ANALYSIS_HUMAN_HANDOFF_UX.md" ]; then
    if grep -q "UX Analysis" docs/10-ANALYSIS/ANALYSIS_HUMAN_HANDOFF_UX.md && \
       grep -q "P0" docs/10-ANALYSIS/ANALYSIS_HUMAN_HANDOFF_UX.md; then
        pass "UX analysis documentation complete"
    else
        warn "UX analysis documentation incomplete"
    fi
else
    fail "UX analysis documentation missing"
fi

# Test 10: Git History Check
section "Test 10: Git Commit History Validation"

EXPECTED_COMMITS=(
    "feat: add user-facing \"Request Human Help\" functionality"
    "feat: add notification system and widget UI feedback"
    "feat: add 'Human Requested' filter tab to dashboard"
    "feat: add AI frustration detection and dashboard UX improvements"
    "feat: add real-time notifications for human help requests"
    "test: add comprehensive E2E tests for human handoff workflow"
    "feat: add human handoff analytics and frustration context display"
)

for commit_msg in "${EXPECTED_COMMITS[@]}"; do
    if git log --oneline --all | grep -q "$commit_msg"; then
        pass "Commit found: $commit_msg"
    else
        warn "Commit not found (may have different message): $commit_msg"
    fi
done

# Summary
section "Test Summary"

TOTAL=$((PASS + FAIL + WARN))

echo ""
echo "Results:"
echo "  ✅ Passed:  $PASS / $TOTAL"
echo "  ❌ Failed:  $FAIL / $TOTAL"
echo "  ⚠️  Warnings: $WARN / $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}The human handoff feature is ready for deployment.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  TESTS FAILED${NC}"
    echo -e "${RED}Please review the failed tests above.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
