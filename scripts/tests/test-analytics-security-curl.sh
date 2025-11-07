#!/bin/bash

# Quick curl-based security tests for analytics endpoints
# Run: bash scripts/tests/test-analytics-security-curl.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "=== Analytics Security Tests (Curl) ==="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Unauthenticated access (should return 401)
echo "Test 1: Unauthenticated access to dashboard analytics"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/dashboard/analytics")
status=$(echo "$response" | tail -n1)
if [ "$status" -eq 401 ]; then
  echo "✓ PASS - Returned 401 Unauthorized"
else
  echo "✗ FAIL - Expected 401, got $status"
fi
echo ""

# Test 2: Unauthenticated access to BI (should return 401)
echo "Test 2: Unauthenticated access to BI endpoint"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/analytics/intelligence?metric=all")
status=$(echo "$response" | tail -n1)
if [ "$status" -eq 401 ]; then
  echo "✓ PASS - Returned 401 Unauthorized"
else
  echo "✗ FAIL - Expected 401, got $status"
fi
echo ""

# Test 3: Security headers present
echo "Test 3: Security headers present"
headers=$(curl -s -I "$BASE_URL/api/dashboard/analytics")

if echo "$headers" | grep -iq "X-Frame-Options"; then
  echo "✓ X-Frame-Options header present"
else
  echo "✗ X-Frame-Options header missing"
fi

if echo "$headers" | grep -iq "X-Content-Type-Options"; then
  echo "✓ X-Content-Type-Options header present"
else
  echo "✗ X-Content-Type-Options header missing"
fi

if echo "$headers" | grep -iq "X-XSS-Protection"; then
  echo "✓ X-XSS-Protection header present"
else
  echo "✗ X-XSS-Protection header missing"
fi
echo ""

# Test 4: Cache invalidation without auth (should return 401)
echo "Test 4: Cache invalidation without auth"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/analytics/cache/invalidate")
status=$(echo "$response" | tail -n1)
if [ "$status" -eq 401 ]; then
  echo "✓ PASS - Returned 401 Unauthorized"
else
  echo "✗ FAIL - Expected 401, got $status"
fi
echo ""

echo "=== Basic Security Tests Complete ==="
echo ""
echo "For authenticated tests, use: npx tsx scripts/tests/test-analytics-security.ts"
echo "Make sure to set TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD"
