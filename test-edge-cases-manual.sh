#!/bin/bash

# Manual edge case testing for chat improvements
# Tests the specific edge cases identified by forensic analysis

API_URL="http://localhost:3000/api/chat-intelligent"
SESSION_ID="manual-test-$(date +%s)"
CONVERSATION_ID=""

echo "========================================="
echo "🧪 MANUAL EDGE CASE TESTING"
echo "========================================="
echo ""

# Function to send message and capture response
send_message() {
    local message="$1"
    local conv_id="$2"
    
    echo "📤 Sending: $message"
    
    local json_body="{\"message\":\"$message\",\"session_id\":\"$SESSION_ID\",\"domain\":\"thompsonseparts.co.uk\""
    
    if [ -n "$conv_id" ]; then
        json_body="${json_body%\}},\"conversation_id\":\"$conv_id\"}"
    else
        json_body="$json_body}"
    fi
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$json_body")
    
    # Extract conversation ID if not set
    if [ -z "$CONVERSATION_ID" ]; then
        CONVERSATION_ID=$(echo "$response" | grep -o '"conversation_id":"[^"]*' | cut -d'"' -f4)
    fi
    
    # Extract and display message
    message_content=$(echo "$response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('message', 'ERROR: No message in response'))" 2>/dev/null || echo "ERROR: Failed to parse response")
    
    echo "📥 Response:"
    echo "$message_content" | head -20
    echo ""
    echo "-----------------------------------------"
    
    # Small delay between requests
    sleep 2
}

# Test 1: Initial product search
echo "TEST 1: Initial Product Search"
echo "================================"
send_message "show me your teng torque wrenches" ""
echo ""

# Test 2: Various number reference formats
echo "TEST 2: Number Reference Edge Cases"
echo "===================================="
echo "Testing different ways to reference item 3..."
echo ""

send_message "tell me about the third one" "$CONVERSATION_ID"
send_message "what about item number three" "$CONVERSATION_ID"
send_message "I want number 3" "$CONVERSATION_ID"
send_message "the 3rd product please" "$CONVERSATION_ID"
echo ""

# Test 3: Out of bounds references
echo "TEST 3: Out of Bounds References"
echo "================================="
send_message "tell me about item 99" "$CONVERSATION_ID"
send_message "what about number 0" "$CONVERSATION_ID"
send_message "show me the negative first one" "$CONVERSATION_ID"
echo ""

# Test 4: Stock checking variations
echo "TEST 4: Stock Checking Variations"
echo "=================================="
send_message "is the third one in stock" "$CONVERSATION_ID"
send_message "can I buy item 2 today" "$CONVERSATION_ID"
send_message "do you have any of the first one available" "$CONVERSATION_ID"
send_message "check stock for all of them" "$CONVERSATION_ID"
echo ""

# Test 5: Service boundary tests
echo "TEST 5: Service Boundary Tests"
echo "==============================="
send_message "can you deliver to SW1A 1AA" "$CONVERSATION_ID"
send_message "what's the delivery time to London" "$CONVERSATION_ID"
send_message "can I collect it from your store" "$CONVERSATION_ID"
send_message "do you offer click and collect" "$CONVERSATION_ID"
echo ""

# Test 6: Context switching
echo "TEST 6: Context Switching"
echo "========================="
send_message "show me hydraulic pumps instead" "$CONVERSATION_ID"
send_message "now tell me about item 2" "$CONVERSATION_ID"  # Should refer to pumps, not wrenches
echo ""

# Test 7: Special characters in queries
echo "TEST 7: Special Characters"
echo "==========================="
send_message "do you have items with \"quotes\" in the name" "$CONVERSATION_ID"
send_message "what about products under £50" "$CONVERSATION_ID"
send_message "items with & symbols or / slashes" "$CONVERSATION_ID"
echo ""

echo "========================================="
echo "✅ MANUAL TESTING COMPLETE"
echo "========================================="
echo ""
echo "Conversation ID used: $CONVERSATION_ID"
echo "Session ID used: $SESSION_ID"