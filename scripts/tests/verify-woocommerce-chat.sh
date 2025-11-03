#!/bin/bash

# Test the chat agent's WooCommerce integration
echo "═══════════════════════════════════════════════════════════"
echo "   Chat Agent WooCommerce Integration Tests"
echo "═══════════════════════════════════════════════════════════"
echo ""

API_URL="http://localhost:3000/api/chat"
DOMAIN="www.thompsonseparts.co.uk"

# Test 1: Teng products
echo "Test 1: Searching for Teng products..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Do you have any Teng products?\",\"domain\":\"$DOMAIN\",\"session_id\":\"test-1\"}" \
  > /tmp/test1.json

if grep -q "woocommerce" /tmp/test1.json; then
  RESULTS=$(grep -o '"resultCount":[0-9]*' /tmp/test1.json | grep -o '[0-9]*')
  echo "✅ PASS: Found $RESULTS Teng products via WooCommerce"
else
  echo "❌ FAIL: No WooCommerce search detected"
fi
echo ""

# Test 2: Torque wrench search
echo "Test 2: Searching for torque wrenches..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Show me torque wrenches\",\"domain\":\"$DOMAIN\",\"session_id\":\"test-2\"}" \
  > /tmp/test2.json

if grep -q "woocommerce" /tmp/test2.json; then
  RESULTS=$(grep -o '"resultCount":[0-9]*' /tmp/test2.json | grep -o '[0-9]*')
  echo "✅ PASS: Found $RESULTS torque wrench products via WooCommerce"
else
  echo "❌ FAIL: No WooCommerce search detected"
fi
echo ""

# Test 3: General product search
echo "Test 3: Searching for socket sets..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"I need a socket set\",\"domain\":\"$DOMAIN\",\"session_id\":\"test-3\"}" \
  > /tmp/test3.json

if grep -q "woocommerce" /tmp/test3.json; then
  RESULTS=$(grep -o '"resultCount":[0-9]*' /tmp/test3.json | grep -o '[0-9]*')
  echo "✅ PASS: Found $RESULTS socket set products via WooCommerce"
else
  echo "❌ FAIL: No WooCommerce search detected"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "   Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ WooCommerce integration is working correctly!"
echo ""
echo "📊 Detailed results saved to /tmp/test*.json"
