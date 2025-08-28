#!/bin/bash

# WooCommerce Abandoned Cart Tracking - Test Script
# Make sure your Next.js dev server is running on port 3000

echo "🛒 WooCommerce Abandoned Cart Tracking Tests"
echo "============================================"
echo ""

# Base URL
BASE_URL="http://localhost:3000/api/woocommerce/abandoned-carts"

# Test 1: List abandoned carts
echo "📋 Test 1: Fetching abandoned carts list..."
echo "Command: curl -s \"$BASE_URL?action=list&limit=5&hoursOld=0\""
echo "---"
curl -s "$BASE_URL?action=list&limit=5&hoursOld=0" | python3 -m json.tool | head -30
echo ""
echo "---"

# Test 2: Get statistics
echo "📊 Test 2: Getting cart recovery statistics..."
echo "Command: curl -s \"$BASE_URL?action=stats&days=7\""
echo "---"
curl -s "$BASE_URL?action=stats&days=7" | python3 -m json.tool
echo ""
echo "---"

# Test 3: High-value carts
echo "💰 Test 3: Fetching high-value abandoned carts (>£100)..."
echo "Command: curl -s \"$BASE_URL?action=list&minValue=100&limit=3\""
echo "---"
curl -s "$BASE_URL?action=list&minValue=100&limit=3" | python3 -m json.tool | head -30
echo ""
echo "---"

# Test 4: Recent carts (last 24 hours)
echo "⏰ Test 4: Fetching recent abandoned carts (last 24 hours)..."
echo "Command: curl -s \"$BASE_URL?action=list&hoursOld=24&limit=3\""
echo "---"
curl -s "$BASE_URL?action=list&hoursOld=24&limit=3" | python3 -m json.tool | head -30
echo ""
echo "---"

# Test 5: API documentation
echo "📚 Test 5: Getting API documentation..."
echo "Command: curl -s -X OPTIONS \"$BASE_URL\""
echo "---"
curl -s -X OPTIONS "$BASE_URL" | python3 -m json.tool
echo ""

echo "✅ All tests completed!"
echo ""
echo "Additional test commands you can try:"
echo "  - Get single cart: curl \"$BASE_URL?action=single&orderId=119151\""
echo "  - Send recovery: curl \"$BASE_URL?action=recover&orderId=119151\""
echo "  - 30-day stats: curl \"$BASE_URL?action=stats&days=30\""