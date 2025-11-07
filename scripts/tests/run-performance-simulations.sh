#!/bin/bash
# Performance Simulation Test Runner
#
# Runs all performance simulation tests and provides a comprehensive summary.
# Tests include cache performance, rate limiting, database queries, and mobile UX.
#
# Prerequisites:
# - Redis running (for cache and rate limit tests)
# - Dev server running on port 3000 (for mobile UX test)
# - Supabase environment variables configured (for database tests)
#
# Usage:
#   bash scripts/tests/run-performance-simulations.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Performance Simulation Test Suite${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Track test results
total_tests=4
passed_tests=0
failed_tests=0

# Test 1: Cache Performance
echo -e "${YELLOW}[1/4] Running Cache Hit Rate Simulation...${NC}"
if npx tsx scripts/tests/simulate-cache-performance.ts; then
    echo -e "${GREEN}✅ Cache Performance Test PASSED${NC}\n"
    ((passed_tests++))
else
    echo -e "${RED}❌ Cache Performance Test FAILED${NC}\n"
    ((failed_tests++))
fi

# Test 2: Rate Limiting
echo -e "${YELLOW}[2/4] Running Rate Limiting Simulation...${NC}"
if npx tsx scripts/tests/simulate-rate-limiting.ts; then
    echo -e "${GREEN}✅ Rate Limiting Test PASSED${NC}\n"
    ((passed_tests++))
else
    echo -e "${RED}❌ Rate Limiting Test FAILED${NC}\n"
    ((failed_tests++))
fi

# Test 3: Database Query Performance
echo -e "${YELLOW}[3/4] Running Database Query Performance Test...${NC}"
if npx tsx scripts/tests/simulate-query-performance.ts; then
    echo -e "${GREEN}✅ Query Performance Test PASSED${NC}\n"
    ((passed_tests++))
else
    echo -e "${RED}❌ Query Performance Test FAILED${NC}\n"
    ((failed_tests++))
fi

# Test 4: Mobile UX (requires dev server)
echo -e "${YELLOW}[4/4] Running Mobile UX Simulation...${NC}"
echo -e "${YELLOW}Note: Dev server must be running on port 3000${NC}"
if npx tsx scripts/tests/simulate-mobile-ux.ts; then
    echo -e "${GREEN}✅ Mobile UX Test PASSED${NC}\n"
    ((passed_tests++))
else
    echo -e "${RED}❌ Mobile UX Test FAILED (is dev server running?)${NC}\n"
    ((failed_tests++))
fi

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Total Tests:   ${total_tests}"
echo -e "${GREEN}Passed:        ${passed_tests}${NC}"
echo -e "${RED}Failed:        ${failed_tests}${NC}"
echo ""

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}✅ All performance tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some performance tests failed${NC}"
    exit 1
fi
