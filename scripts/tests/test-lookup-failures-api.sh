#!/bin/bash

# Comprehensive API Testing Script for /api/admin/lookup-failures
# Usage: bash scripts/tests/test-lookup-failures-api.sh
# Prerequisites: Dev server must be running on port 3000

set -e

BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/admin/lookup-failures"
FULL_URL="${BASE_URL}${API_ENDPOINT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🚀 Starting Comprehensive API Testing"
echo ""
echo "Target: ${API_ENDPOINT}"
echo "Port: 3000"
echo ""
echo "================================================================================"
echo ""

# Check server health
echo "🔍 Checking server status..."
echo ""

for i in {1..6}; do
    if curl -s -I "${BASE_URL}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is responding on port 3000${NC}"
        echo ""
        break
    else
        echo "Attempt $i/6: Server not ready, waiting..."
        if [ $i -lt 6 ]; then
            sleep 10
        else
            echo -e "${RED}❌ Server failed to respond after 6 attempts (1 minute)${NC}"
            echo ""
            echo "Please start the dev server with: npm run dev"
            echo ""
            exit 1
        fi
    fi
done

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local url="$2"
    local description="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Testing: ${test_name}... "

    START_TIME=$(date +%s%3N)
    HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "${url}")
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))

    if [ "$HTTP_CODE" -eq 200 ]; then
        # Validate JSON structure
        if jq -e '.stats.totalFailures' /tmp/response.json > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PASSED${NC} (${RESPONSE_TIME}ms)"
            if [ -n "$description" ]; then
                echo "   ${description}"
            fi
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAILED${NC} (Invalid JSON structure)"
        fi
    else
        echo -e "${YELLOW}⚠️ HTTP ${HTTP_CODE}${NC} (${RESPONSE_TIME}ms)"
        if [ -n "$description" ]; then
            echo "   ${description}"
        fi
    fi
    echo ""
}

# Basic Tests
echo "================================================================================"
echo "📋 Running Basic Endpoint Tests"
echo "================================================================================"
echo ""

run_test "Default (7 days)" "${FULL_URL}" ""
run_test "1 day filter" "${FULL_URL}?days=1" ""
run_test "30 day filter" "${FULL_URL}?days=30" ""
run_test "90 day filter" "${FULL_URL}?days=90" ""

# Edge Case Tests
echo "================================================================================"
echo "🧪 Running Edge Case Tests"
echo "================================================================================"
echo ""

run_test "Invalid days parameter" "${FULL_URL}?days=abc" "Should handle non-numeric days gracefully"
run_test "Negative days" "${FULL_URL}?days=-1" "Should handle negative values gracefully"
run_test "Very large days" "${FULL_URL}?days=99999" "Should handle extreme values"
run_test "Empty domainId" "${FULL_URL}?domainId=" "Should default to all domains"
run_test "Non-existent domainId" "${FULL_URL}?domainId=00000000-0000-0000-0000-000000000000" "Should return empty or zero results"

# Performance Tests
echo "================================================================================"
echo "⚡ Running Performance Tests (100 sequential requests)"
echo "================================================================================"
echo ""

TIMES_FILE="/tmp/response_times.txt"
> "$TIMES_FILE"

for i in {1..100}; do
    START_TIME=$(date +%s%3N)
    curl -s "${FULL_URL}" > /dev/null
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    echo "$RESPONSE_TIME" >> "$TIMES_FILE"

    if [ $((i % 20)) -eq 0 ]; then
        echo "Progress: $i/100 requests completed"
    fi
done

echo ""
echo "📊 Performance Results:"

# Calculate statistics
MIN=$(sort -n "$TIMES_FILE" | head -1)
MAX=$(sort -n "$TIMES_FILE" | tail -1)
AVG=$(awk '{ sum += $1; n++ } END { if (n > 0) print sum / n; }' "$TIMES_FILE")
P50=$(sort -n "$TIMES_FILE" | awk '{all[NR] = $0} END{print all[int(NR*0.5)]}')
P95=$(sort -n "$TIMES_FILE" | awk '{all[NR] = $0} END{print all[int(NR*0.95)]}')
P99=$(sort -n "$TIMES_FILE" | awk '{all[NR] = $0} END{print all[int(NR*0.99)]}')

echo "   Min: ${MIN}ms"
echo "   Max: ${MAX}ms"
echo "   Avg: ${AVG}ms"
echo "   p50: ${P50}ms"
echo "   p95: ${P95}ms"
echo "   p99: ${P99}ms"

if [ "$P95" -lt 200 ]; then
    echo -e "   Target (<200ms p95): ${GREEN}✅ MET${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   Target (<200ms p95): ${YELLOW}⚠️ MISSED${NC}"
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Concurrent Tests
echo "================================================================================"
echo "🔄 Running Concurrent Request Tests (20 concurrent)"
echo "================================================================================"
echo ""

START_TIME=$(date +%s%3N)
for i in {1..20}; do
    curl -s "${FULL_URL}" > /dev/null &
done
wait
END_TIME=$(date +%s%3N)
TOTAL_TIME=$((END_TIME - START_TIME))
AVG_TIME=$((TOTAL_TIME / 20))

echo "✅ All requests completed in ${TOTAL_TIME}ms"
echo "   Average response time: ${AVG_TIME}ms"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))
PASSED_TESTS=$((PASSED_TESTS + 1))

# Data Structure Validation
echo "================================================================================"
echo "🔍 Verifying Data Accuracy"
echo "================================================================================"
echo ""

curl -s "${FULL_URL}?days=7" > /tmp/sample_response.json

echo "📊 Sample Data Analysis:"
echo "   Total Failures: $(jq '.stats.totalFailures' /tmp/sample_response.json)"
echo "   Error Types: $(jq '.stats.byErrorType | length' /tmp/sample_response.json) types"
echo "   Platforms: $(jq '.stats.byPlatform | length' /tmp/sample_response.json) platforms"
echo "   Top Failed Queries: $(jq '.stats.topFailedQueries | length' /tmp/sample_response.json) entries"
echo "   Common Patterns: $(jq '.stats.commonPatterns | length' /tmp/sample_response.json) patterns"
echo "   Period: $(jq -r '.period' /tmp/sample_response.json)"
echo "   Domain ID: $(jq -r '.domainId' /tmp/sample_response.json)"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))
PASSED_TESTS=$((PASSED_TESTS + 1))

# Final Report
echo "================================================================================"
echo "📊 API TESTING REPORT - ${API_ENDPOINT}"
echo "================================================================================"
echo ""

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "Status: ${GREEN}✅ ALL TESTS PASSED${NC}"
elif [ "$PASSED_TESTS" -gt $((TOTAL_TESTS * 80 / 100)) ]; then
    echo -e "Status: ${YELLOW}⚠️ SOME ISSUES${NC}"
else
    echo -e "Status: ${RED}❌ CRITICAL FAILURES${NC}"
fi

echo "Tests Passed: ${PASSED_TESTS}/${TOTAL_TESTS}"
echo ""

# Recommendations
echo "Recommendations:"
echo ""

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo "✅ All tests passed! No immediate actions required."
else
    echo "⚠️ Some tests failed. Review the output above for details."
fi

if [ "$P95" -gt 200 ]; then
    echo "⏱️ Performance concern: p95 response time (${P95}ms) exceeds target (<200ms)"
fi

echo ""
echo "================================================================================"
echo ""

# Cleanup
rm -f /tmp/response.json /tmp/response_times.txt /tmp/sample_response.json

exit 0
